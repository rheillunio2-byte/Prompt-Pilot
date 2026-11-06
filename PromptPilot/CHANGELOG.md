# Changelog

## 4.0.0

**Interface**
- New design system and component library (buttons, inputs, selects, dialogs, tooltips, tabs, badges, tables, empty states, skeletons, toasts, menus, context menus).
- Flight Deck rebuilt as a two-tier horizontal system: command bar plus grouped deck with a sliding active indicator; scrolls horizontally on small screens.
- Workspace switcher (rename workspace, backup actions), provider status popover driven by the server, profile menu, shortcuts dialog.
- Command palette now searches prompts and templates and supports keyboard navigation. Single-key shortcuts: `n`, `g` then `o/l/v/t/p/c/a`, `?`.

**Pages**
- Overview: real counts, recent activity built from actual edits and runs, recently edited and favorite prompts.
- Library: table and compact list views, search, category/tag/favorites filters, sorting, preview pane, row context menus, duplicate, confirmation before delete.
- Editor: full page (was a modal) with variable highlighting, word and character counts, tags, save status, `Ctrl/Cmd+S`, unsaved-changes guard.
- Playground: generation parameters, token usage, execution time, stop button, cancel-safe history, save experiment, draft persistence, run history.
- Compare Lab: independent A/B execution, per-side model and parameters, load instructions from any library prompt or version, one side can fail without losing the other, comparison summary and history.
- Versions: numbered versions per prompt, change summary (+/− lines), preview, in-place restore.
- Templates: 14 templates in 7 categories with preview.
- Analytics: only real data; timeline appears once activity spans two days.

**Server**
- `GET /api/status`, generation parameters, token usage in generate responses.

**Data changes and fixes**
- Prompts now store real timestamps (3.0 stored text like "Just now"); existing data is migrated automatically on first load. The category "Development" is renamed "Programming".
- Backup import re-links imported versions and runs to the imported prompts (3.0 left them orphaned). Backups are written as version 4 and 3.0 backups still import.
- Versions are only created when the title, text or category actually changes.
- Variables are validated before running; Playground no longer sends `[name]` placeholders.
- Experiment history keeps the latest 100 runs (was 50) plus any runs you save.
- The 3.0 seed prompts contained a literal `\n`; this is corrected.
