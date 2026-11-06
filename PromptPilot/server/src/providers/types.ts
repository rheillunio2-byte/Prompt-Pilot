export type ModelInfo = { id: string; label: string };
export type GenerationParams = { temperature?: number; topP?: number; maxOutputTokens?: number };
export type TokenUsage = { promptTokens?: number; outputTokens?: number; totalTokens?: number };
export type GenerationRequest = { prompt: string; model?: string; params?: GenerationParams };
export type GenerationResponse = { text: string; model: string; usage?: TokenUsage };
export interface AIProvider {
  id: string;
  name: string;
  models: ModelInfo[];
  isConfigured(): boolean;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
}
