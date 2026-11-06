import type { GenerateResult, GenParams, ProviderInfo } from "./types";

export const FALLBACK_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
];
const OFFLINE = "Can't reach the PromptPilot server. Start it with `npm run dev` and check that it is listening on port 3001.";

export async function fetchStatus(): Promise<ProviderInfo[]> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error("Status unavailable");
  const data = await res.json();
  return Array.isArray(data.providers) ? data.providers as ProviderInfo[] : [];
}

export async function generate(opts: { prompt: string; model?: string; params?: GenParams; signal?: AbortSignal }): Promise<GenerateResult> {
  let response: Response;
  try {
    response = await fetch("/api/generate/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: opts.prompt, model: opts.model, params: opts.params }),
      signal: opts.signal
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new Error(OFFLINE);
  }
  let data: any = null;
  try { data = await response.json(); } catch { /* non-JSON error body */ }
  if (!response.ok) throw new Error(data?.error || `Generation failed (HTTP ${response.status}).`);
  return { text: String(data?.text ?? ""), model: String(data?.model ?? opts.model ?? ""), usage: data?.usage };
}

/** Kept for backwards compatibility with 3.0 imports. */
export const generateWithGemini = (prompt: string, model?: string) => generate({ prompt, model });
