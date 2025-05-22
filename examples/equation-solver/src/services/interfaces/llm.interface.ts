/**
 * @interface LLM
 * @description Defines the structure for interacting with Large Language Models
 * such as Ollama interface
 */
export interface LLM {
  /**
   * @property id
   * @description A unique identifier for the LLM.
   */
  id: string;

  /**
   * @method generate
   * @description Generates a text response based on the given input.
   * @param {string} model - The model to use for generation.
   * @param {string} prompt - The input text to generate a response from.
   * @param {Record<string, any>} [options] - Optional additional options for the generation.
   * @param {string[]} [images] - Optional array of image URLs to include in the input.
   * @returns {Promise<{ response: string, metadata: any }>} A promise that resolves to an object containing the generated response and metadata.
   */
  generate: (input: {
    model: string;
    prompt: string;
    options?: Record<string, any>;
    images?: string[];
  }) => Promise<{ response: string; metadata: any }>;

  /**
   * @method generateStream
   * @description Generates a stream of text responses based on the given input.
   * @param {string} model - The model to use for generation.
   * @param {string} prompt - The input text to generate a response from.
   * @param {Record<string, any>} [options] - Optional additional options for the generation.
   * @param {string[]} [images] - Optional array of image URLs to include in the input.
   * @returns {AsyncGenerator<{ response: string, metadata: any }>} An async generator that yields objects containing the generated response and metadata.
   */
  generateStream: (input: {
    model: string;
    prompt: string;
    options?: Record<string, any>;
    images?: string[];
  }) => AsyncGenerator<{ response: string; metadata: any }>;

  /**
   * @method chat
   * @description Generates a chat response based on the given messages.
   * @param {string} model - The model to use for chat generation.
   * @param {any[]} messages - An array of messages in the chat.
   * @param {Record<string, any>} [options] - Optional additional options for the chat generation.
   * @returns {Promise<{ response: string, metadata: any }>} A promise that resolves to an object containing the chat response and metadata.
   */
  chat: (input: {
    model: string;
    messages: any[];
    options?: Record<string, any>;
  }) => Promise<{ response: string; metadata: any }>;

  /**
   * @method chatStream
   * @description Generates a stream of chat responses based on the given messages.
   * @param {string} model - The model to use for chat generation.
   * @param {any[]} messages - An array of messages in the chat.
   * @param {Record<string, any>} [options] - Optional additional options for the chat generation.
   * @returns {AsyncGenerator<{ response: string, metadata: any }>} An async generator that yields objects containing the chat response and metadata.
   */
  chatStream: (input: {
    model: string;
    messages: any[];
    options?: Record<string, any>;
  }) => AsyncGenerator<{ response: string; metadata: any }>;
}
