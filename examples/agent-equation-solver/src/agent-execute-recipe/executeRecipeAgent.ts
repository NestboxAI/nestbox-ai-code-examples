import { AgentContext, AgentEvents } from "@nestbox-ai/functions";
import { runWorkflow } from "./workflow.js";

const pemdas_rules = `
1. Solve parentheses first, starting with the innermost parentheses.
2. Perform multiplication and division next, strictly from left to right, even if division appears before multiplication.
3. Perform addition and subtraction last, strictly from left to right, even if subtraction appears before addition.
4. When multiple parentheses exist, solve the innermost parentheses first, then move outward step by step.
5. Multiplication and division have equal priority, so always resolve these operations in their exact order from left to right.
6. Addition and subtraction also have equal priority; therefore, always resolve these strictly from left to right.
`;

const tools = [
  {
    name: "multiply_numbers",
    description:
      "Performs multiplication of two numbers and returns the result.",
    parameters: { num1: "first number", num2: "second number" },
    execute: async (params: { num1: number; num2: number }) =>
      Promise.resolve(params.num1 * params.num2),
  },
  {
    name: "divide_numbers",
    description: "Performs division of two numbers and returns the result.",
    parameters: { num1: "first number", num2: "second number" },
    execute: async (params: { num1: number; num2: number }) =>
      Promise.resolve(params.num1 / params.num2),
  },
  {
    name: "add_numbers",
    description: "Adds two numbers and returns the sum.",
    parameters: { num1: "first number", num2: "second number" },
    execute: async (params: { num1: number; num2: number }) =>
      Promise.resolve(params.num1 + params.num2),
  },
  {
    name: "subtract_numbers",
    description:
      "Subtracts the subtrahend from the minuend (minuend - subtrahend) and returns the result",
    parameters: {
      minuend: "The number to subtract from",
      subtrahend: "The number being subtracted",
    },
    execute: async (params: { minuend: number; subtrahend: number }) =>
      Promise.resolve(params.minuend - params.subtrahend),
  },
];

export const executeRecipeAgent = async (
  context: AgentContext,
  events: AgentEvents
) => {
  await runWorkflow(
    { equation: context.params.equation, tools, pemdas_rules },
    events
  );
};
