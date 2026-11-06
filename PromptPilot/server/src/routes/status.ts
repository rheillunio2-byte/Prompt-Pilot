import { Router } from "express";
import { providers } from "../providers/index.js";

const router = Router();

// Reports which providers exist and whether a key is configured. Never returns the key itself.
router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    providers: providers.map(p => ({ id: p.id, name: p.name, configured: p.isConfigured(), models: p.models }))
  });
});

export default router;
