import { Router } from "express";
import { gemini } from "../providers/index.js";
import type { GenerationParams } from "../providers/types.js";

const router = Router();
const allowedModels = new Set(gemini.models.map(m => m.id));

function parseParams(raw: unknown): { params?: GenerationParams; error?: string } {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object") return { error: "Generation parameters must be an object." };
  const { temperature, topP, maxOutputTokens } = raw as Record<string, unknown>;
  const params: GenerationParams = {};
  if (temperature !== undefined) {
    if (typeof temperature !== "number" || !(temperature >= 0 && temperature <= 2)) return { error: "Temperature must be a number between 0 and 2." };
    params.temperature = temperature;
  }
  if (topP !== undefined) {
    if (typeof topP !== "number" || !(topP >= 0 && topP <= 1)) return { error: "Top-p must be a number between 0 and 1." };
    params.topP = topP;
  }
  if (maxOutputTokens !== undefined) {
    if (typeof maxOutputTokens !== "number" || !Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 65536) {
      return { error: "Max output tokens must be a whole number between 1 and 65,536." };
    }
    params.maxOutputTokens = maxOutputTokens;
  }
  return { params };
}

router.post("/gemini", async (req, res) => {
  const { prompt, model, params: rawParams } = req.body ?? {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty prompt is required." });
  }
  if (prompt.length > 30000) {
    return res.status(413).json({ error: "Prompt exceeds the 30,000-character limit." });
  }
  if (model !== undefined && (typeof model !== "string" || !allowedModels.has(model))) {
    return res.status(400).json({ error: "The selected model is not available in this starter." });
  }
  const parsed = parseParams(rawParams);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const result = await gemini.generate({ prompt, model, params: parsed.params });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error.";
    console.error("Gemini request failed:", message);
    return res.status(502).json({
      error: message.includes("not configured")
        ? message
        : "Gemini request failed. Check your API key, model access, and provider quota."
    });
  }
});

export default router;
