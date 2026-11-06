import "dotenv/config";
import express from "express";
import cors from "cors";
import generateRouter from "./routes/generate.js";
import statusRouter from "./routes/status.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "PromptPilot API" });
});
app.use("/api/status", statusRouter);
app.use("/api/generate", generateRouter);

app.listen(port, () => {
  console.log(`PromptPilot API listening on http://localhost:${port}`);
});
