# PromptPilot API

Express + TypeScript API. Gemini requests are made server-side through `@google/genai`.

Configure `server/.env` using `server/.env.example`. Run from the repository root with `npm run dev`. Health check: `GET http://localhost:3001/api/health`.

Before public deployment, implement authentication, per-user authorization, rate limiting, quotas, request timeouts, and production secret management.
