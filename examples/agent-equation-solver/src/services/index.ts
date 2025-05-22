import { LLM } from "./interfaces/llm.interface.js";
import { OllamaLLM } from "./llm/ollama-llm.js";

const llm: LLM = new OllamaLLM();

export { llm } 
