import {
  createWorkflow,
  workflowEvent,
  createStatefulMiddleware,
} from "@llamaindex/workflow";
import { llm } from "../services/index.js";
import { Config } from "../config/index.js";
import { jsonFromText } from "../utils/index.js";
import { AgentEvents } from "@nestbox-ai/functions";

const MAX_ITERATIONS = 30;
const MAX_CRTIQUE = 3;

type Tool = {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (...args: any[]) => Promise<any>;
};

/**
 * Workflow to execute a recipe using available tools.
 */
type WorkflowInput = {
  pemdas_rules: string;
  equation: string;
  tools: Tool[];
  critiqueReason?: string;
};

type WorkflowInputExtended = WorkflowInput & {
  recipe: string;
};

type WorkflowOutput = WorkflowInputExtended & {
  finalResult: number;
};

/**
 * State of the workflow.
 */
type WorkflowState = {
  stepResults: Record<string, string>;
  stepNumber: number;
  critiqueAttempts: number;
};

/**
 * Workflow events
 */
const startEvent = workflowEvent<WorkflowInput>({ debugLabel: "start" });
const critiqueRecipeEvent = workflowEvent<WorkflowInputExtended>({
  debugLabel: "critique-recipe",
});
const processStepEvent = workflowEvent<WorkflowInputExtended>({
  debugLabel: "process-step",
});
const resultEvent = workflowEvent<WorkflowOutput>({ debugLabel: "stop" });

function extractRecipeText(input: string): string {
  const match = input.match(/<recipe>([\s\S]*?)<\/recipe>/i);
  return match ? match[1].trim() : input;
}

/**
 * Setting up the workflow and step handlers.
 */
const { withState, getContext } = createStatefulMiddleware(
  (): WorkflowState => ({
    stepResults: {},
    stepNumber: 1,
    critiqueAttempts: 1,
  }) // ensures fresh state per run
);
const workflow = withState(createWorkflow());

function textualTools(tools: Tool[]) {
  return tools
    .map(
      (tool: Tool) =>
        `* ${tool.name}: ${tool.description}\n` +
        `  Parameters: ${Object.entries(tool.parameters)
          .map(([key, desc]) => `${key} (${desc})`)
          .join(", ")}`
    )
    .join("\n");
}

workflow.handle([startEvent], async (eventData) => {
  const context = getContext();
  const workflowInput = eventData.data;
  const { equation, tools, pemdas_rules, critiqueReason } = workflowInput;
  console.log(`Equation: ${equation}`);

  const toolsList = textualTools(tools);

  const critiqueMessage = critiqueReason
    ? `The previous instructions failed validation due to: ${critiqueReason}\nRegenerate the instructions carefully.`
    : "";

  const system = `
  You are a math assistant that helps break down expressions into step-by-step instructions.

  You must follow these rules:
  ${pemdas_rules}
  
  The available tools are:
  ${toolsList}
  
  Write the instructions step by step, according to the rules and tools.
  Put each step in one line like this step1: <instruction>.
  In each step perform only one operation.
  Reference results from earlier steps using result_of_step_X.
  In each steps only write the instruction do not evaluate any numbers.
  Conclude with the final result such as result_of_step_X.
  put all steps in a <recipe> ... </recipe> tag`;

  const user = `
  ${critiqueMessage}
  Using the pemda rules, Break down this equation: ${equation}`;

  const llmResponse = await llm.chat({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    model: Config.Agent.BASE_MODEL,
  });

  console.log(`*** Prompt: `, system, user, llmResponse.response);

  const recipe = extractRecipeText(llmResponse.response);

  context.sendEvent(critiqueRecipeEvent.with({ ...eventData.data, recipe }));
});

workflow.handle([critiqueRecipeEvent], async (eventData) => {
  const context = getContext();
  const { equation, pemdas_rules, tools, recipe } = eventData.data;

  const critiqueSystemPrompt = `
You are a math critique assistant. Given an equation, PEMDAS rules, and step-by-step instructions, 
determine if the instructions strictly adhere to the PEMDAS rules.

PEMDAS Rules:
${pemdas_rules}

Instructions:
${recipe}

Respond ONLY with JSON:
{"isValid": boolean, "reason": "brief explanation if invalid"}
`;

  const critiqueUserPrompt = `Critique these instructions for the equation: ${equation}`;

  const critiqueResponse = await llm.chat({
    messages: [
      { role: "system", content: critiqueSystemPrompt },
      { role: "user", content: critiqueUserPrompt },
    ],
    model: Config.Agent.BASE_MODEL,
  });

  const critique = jsonFromText(critiqueResponse.response);
  const { isValid, reason } = critique;

  console.log("Critique Result:", critique);

  if (isValid) {
    console.log("Recipe validated successfully, proceeding.");
    context.sendEvent(processStepEvent.with(eventData.data));
    return;
  }

  console.warn("Recipe validation failed:", reason);

  context.state.critiqueAttempts = context.state.critiqueAttempts + 1;
  if (context.state.critiqueAttempts > MAX_CRTIQUE) {
    // send to the process with whatever we have
    context.sendEvent(processStepEvent.with(eventData.data));
    return;
  }

  console.log("Sending back to startEvent to regenerate...");
  context.sendEvent(
    startEvent.with({
      pemdas_rules,
      equation,
      tools,
      critiqueReason: reason,
    })
  );
});

workflow.handle([processStepEvent], async (eventData) => {
  const context = getContext();

  const workflowInput = eventData.data;
  const { recipe, tools } = workflowInput;
  // Retrieve previously stored results or initialize
  const results: Record<string, string> = context.state.stepResults || {};
  const stepNumber = context.state.stepNumber || 1;

  const toolsList = textualTools(tools);

  // Prompt the LLM to determine the next step with a specific response structure
  const prompt = `Given the instructions:
${recipe}

And these available tools:
${toolsList}

These are previous steps results:
${Object.entries(results)
  .map(([key, value]) => `${key} result: ${value}`)
  .join("\n")}

Determine the next step details to execute. Respond ONLY with JSON in this exact format:
    {"toolName": "Tool Name", "parameters": { /* parameters */ }, "step": number, "isFinalStep": boolean}`;

  console.log("Prompting LLM with:", prompt);

  const llmResponse = await llm.generate({
    prompt,
    model: Config.Agent.BASE_MODEL,
  });

  const { toolName, parameters, step, isFinalStep } = jsonFromText(
    llmResponse.response
  );

  console.log("Parsed LLM Response:", {
    toolName,
    parameters,
    step,
    isFinalStep,
  });

  const tool = tools.find((t: Tool) => t.name === toolName);

  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  const toolResult = await tool.execute(parameters);

  // Store the result
  results[`step${step}`] = toolResult;
  context.state.stepNumber = stepNumber + 1;

  console.log(
    `Tool ${toolName} executed with parameters:`,
    parameters,
    "result:",
    toolResult
  );

  // Update the state with the new results
  context.state.stepResults = results;

  if (isFinalStep || stepNumber > MAX_ITERATIONS) {
    console.log("Final step reached. Stopping workflow.");
    context.sendEvent(
      resultEvent.with({ ...eventData.data, finalResult: toolResult })
    );
  } else {
    console.log(`Step ${step} completed. Proceeding to next step.`);
    context.sendEvent(processStepEvent.with(eventData.data));
  }
});

workflow.handle([resultEvent], async (eventData) => {
  console.log("Final Results:", eventData.data);
});

export const runWorkflow = async (
  input: WorkflowInput,
  events: AgentEvents
) => {
  console.log("Running workflow with input:", input);
  try {
    const { stream, sendEvent } = workflow.createContext();
    sendEvent(startEvent.with(input));

    for await (const event of stream) {
      if (resultEvent.include(event)) {
        events.emitQueryCompleted({
          data: event.data,
        });
        break;
      }
    }

    console.log("Workflow completed successfully.");
  } catch (error: any) {
    console.error("Error in workflow:", error);
    console.error("Error details:", error.message, error.stack);
  }
};
