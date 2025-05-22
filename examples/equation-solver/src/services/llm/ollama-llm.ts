import { Ollama } from "ollama";
import { LLM } from "../interfaces/llm.interface.js";

export class OllamaLLM implements LLM {
  private ollama: Ollama;

  constructor() {
    this.ollama = new Ollama();
  }
  id: string = "ollama-llm";

  async generate(input: {
    model: string;
    prompt: string;
    options?: Record<string, any>;
    images?: string[];
  }): Promise<{ response: string; metadata: any }> {
    const { model, prompt, options, images } = input;
    const result = await this.ollama.generate({
      ...options,
      model,
      prompt,
      images,
      context: [],
    });
    return { response: result.response, metadata: result };
  }

  async *generateStream(input: {
    model: string;
    prompt: string;
    options?: Record<string, any>;
    images?: string[];
  }): AsyncGenerator<{ response: string; metadata: any }> {
    const { model, prompt, options, images } = input;
    const result = this.ollama.generate({
      ...options,
      model,
      prompt,
      images,
      stream: true,
      context: [],
    });
    for await (const chunk of await result) {
      yield { response: chunk.response, metadata: chunk };
    }
  }

  async chat(input: {
    model: string;
    messages: any[];
    options?: Record<string, any>;
  }): Promise<{ response: string; metadata: any }> {
    const { model, messages, options } = input;
    const result = await this.ollama.chat({
      ...options,
      model,
      messages,
      stream: false,
    });
    return { response: result.message?.content, metadata: result };
  }

  async *chatStream(input: {
    model: string;
    messages: any[];
    options?: Record<string, any>;
  }): AsyncGenerator<{ response: string; metadata: any }> {
    const { model, messages, options } = input;
    const result = this.ollama.chat({
      ...options,
      model,
      messages,
      stream: true,
    });
    for await (const chunk of await result) {
      yield { response: chunk.message?.content, metadata: chunk };
    }
  }
}
