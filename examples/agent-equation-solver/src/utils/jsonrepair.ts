import { jsonrepair } from 'jsonrepair';

/**
 * Attempts to extract a JSON object from a given text string.
 * @param text - The text to be parsed
 * @description This function attempts to extract a JSON object from a given text string.
 * @returns json - The extracted JSON object or the original text if no JSON object is found.
 */
export const jsonFromText = (text: string): any => {
    const start = text.indexOf('{');
    if (start === -1) { // No JSON object found
        return { data: text };
    }
    const r = jsonrepair(text.substring(start));
    return JSON.parse(r);
}
