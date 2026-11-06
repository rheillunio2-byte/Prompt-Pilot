import { createContext, useContext } from "react";
import type { ApiStatus, ModelInfo } from "../types";

export type RouteName = "overview" | "library" | "editor" | "playground" | "compare" | "versions" | "templates" | "analytics";
export type Route = { name: RouteName; id?: string };
export type PromptSeed = { title: string; body: string; category: string; tags: string[] };

const NAMES: RouteName[] = ["overview", "library", "editor", "playground", "compare", "versions", "templates", "analytics"];
export function parseHash(hash: string): Route {
  const [, name = "", id] = hash.replace(/^#/, "").split("/");
  return NAMES.includes(name as RouteName) ? { name: name as RouteName, id: id ? decodeURIComponent(id) : undefined } : { name: "overview" };
}
export const routeHref = (r: Route) => `#/${r.name}${r.id ? `/${encodeURIComponent(r.id)}` : ""}`;

export type AppApi = {
  route: Route;
  navigate: (r: Route, opts?: { replace?: boolean }) => void;
  setDirty: (dirty: boolean) => void;
  openPalette: () => void;
  openShortcuts: () => void;
  status: ApiStatus;
  refreshStatus: () => void;
  models: ModelInfo[];
  newPrompt: (seed?: PromptSeed) => void;
  takeSeed: () => PromptSeed | null;
  runInPlayground: (h: { text: string; promptId?: string; values?: Record<string, string> }) => void;
  openCompare: (h?: { base?: string }) => void;
};
export const AppCtx = createContext<AppApi | null>(null);
export function useApp(): AppApi {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside the app shell");
  return v;
}

/** Drafts for Playground and Compare Lab live in localStorage so work survives navigation and reloads. */
export type PlayDraft = { text: string; model: string; params: import("../types").GenParams; values: Record<string, string>; promptId?: string; lastRunId?: string };
export type CompareDraft = { base: string; a: string; b: string; modelA: string; modelB: string; paramsA: import("../types").GenParams; paramsB: import("../types").GenParams; values: Record<string, string> };
