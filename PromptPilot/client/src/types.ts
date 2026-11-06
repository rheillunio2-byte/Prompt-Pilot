export type Prompt = {
  id: string; title: string; body: string; category: string; tags: string[];
  favorite: boolean; createdAt: string; updatedAt: string;
};
export type Snapshot = { id: string; promptId: string; title: string; body: string; category: string; createdAt: string };
export type GenParams = { temperature?: number; topP?: number; maxOutputTokens?: number };
export type Usage = { promptTokens?: number; outputTokens?: number; totalTokens?: number };
export type RunRecord = {
  id: string; kind: "playground" | "compare"; prompt: string; model: string; output: string;
  createdAt: string; durationMs: number;
  template?: string; values?: Record<string, string>; instructions?: string;
  params?: GenParams; usage?: Usage; promptId?: string;
  compareId?: string; side?: "A" | "B"; pinned?: boolean;
};
export type ModelInfo = { id: string; label: string };
export type ProviderInfo = { id: string; name: string; configured: boolean; models: ModelInfo[] };
export type ApiStatus =
  | { state: "checking" }
  | { state: "offline" }
  | { state: "ready"; providers: ProviderInfo[] };
export type GenerateResult = { text: string; model: string; usage?: Usage };
