import { GoogleGenAI } from "@google/genai";
import type { AIProvider, GenerationRequest, GenerationResponse, ModelInfo, TokenUsage } from "./types.js";

export const GEMINI_MODELS: ModelInfo[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
];

export class GeminiProvider implements AIProvider {
  id = "gemini";
  name = "Google Gemini";
  models = GEMINI_MODELS;

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini is not configured. Add GEMINI_API_KEY to server/.env.");
    const client = new GoogleGenAI({ apiKey });
    const model = request.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const { temperature, topP, maxOutputTokens } = request.params ?? {};
    const config: Record<string, number> = {};
    if (temperature !== undefined) config.temperature = temperature;
    if (topP !== undefined) config.topP = topP;
    if (maxOutputTokens !== undefined) config.maxOutputTokens = maxOutputTokens;
    const result = await client.models.generateContent({ model, contents: request.prompt, config });
    const meta = result.usageMetadata;
    const usage: TokenUsage | undefined = meta
      ? { promptTokens: meta.promptTokenCount, outputTokens: meta.candidatesTokenCount, totalTokens: meta.totalTokenCount }
      : undefined;
    return { text: result.text ?? "", model, usage };
  }
}
