# PromptPilot 4.0 architecture

## Client (`client/src`)

| Path | Purpose |
| --- | --- |
| `App.tsx` | App shell: hash routing, unsaved-changes guard, global shortcuts, provider status polling, handoffs between pages |
| `pages/` | Overview, Library, Editor, Playground, CompareLab, Versions, Templates, Analytics |
| `components/ui.tsx` | Shared component system: Button, IconButton, Tooltip, Input, Select, Field, Badge, Tabs, Panel, EmptyState, Skeleton, Dialog, ConfirmProvider, ToastProvider, Popover, Menu, context menu |
| `components/FlightDeck.tsx` | Command bar (logo, workspace switcher, search, provider status, profile menu) and the horizontal deck |
| `components/CommandPalette.tsx` | `Ctrl/Cmd+K` palette: pages, actions, prompts, templates |
| `components/PromptField.tsx` | Textarea with `{{variable}}` highlighting (transparent textarea stacked over a mirror) plus variable inputs |
| `components/RunParts.tsx` | Parameters popover, usage summary, output view, library picker shared by Playground and Compare Lab |
| `lib/workspace.tsx` | State and persistence for prompts, versions and runs; backup import/export; version numbering helpers |
| `lib/storage.ts` | localStorage keys, schema normalizers (3.0 data is migrated on read), run history cap |
| `lib/useRun.ts` | Cancellable generation with live elapsed timer; persistent draft state hook |
| `lib/app.tsx` | Route parsing and the app context |
| `lib/templates.ts` | Built-in starter templates (static content) |
| `styles.css` | Design tokens and all component styles |

Routing uses `location.hash` (`#/library`, `#/editor/<id>`, `#/versions/<promptId>`). No router dependency was added.

## Server (`server/src`)

- `GET /api/health` – unchanged.
- `GET /api/status` – providers, models, and whether a key is configured (never the key).
- `POST /api/generate/gemini` – body `{ prompt, model?, params? }`; `params` may contain `temperature` (0–2), `topP` (0–1), `maxOutputTokens` (1–65536). Response `{ text, model, usage? }` where `usage` is `{ promptTokens, outputTokens, totalTokens }` as reported by Gemini.

## Storage keys

`pp-prompts`, `pp-snapshots`, `pp-runs` (unchanged names), plus `pp-workspace-name`, `pp-draft-play`, `pp-draft-compare`, `pp-library-prefs`.

## Design tokens

Neutral grey surfaces, charcoal text, one indigo accent for interaction, violet reserved for `{{variables}}`, teal used only to mark Approach B. Radii: 5px small, 7px controls, 11px panels. Type: Inter if installed, otherwise the system UI font; JetBrains Mono / system monospace for prompt text.
