import { GeminiProvider } from "./GeminiProvider.js";
import type { AIProvider } from "./types.js";

export const gemini = new GeminiProvider();
export const providers: AIProvider[] = [gemini];
