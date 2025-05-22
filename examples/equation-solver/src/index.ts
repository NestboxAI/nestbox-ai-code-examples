import { useAgent } from "@nestbox-ai/functions";
import { executeRecipeAgent } from "./agent-execute-recipe/executeRecipeAgent.js";

export const executeRecipe = useAgent(executeRecipeAgent);
