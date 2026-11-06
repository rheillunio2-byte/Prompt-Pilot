import { useRef } from "react";

import { useWorkspace } from "./workspace";
import { useToast } from "../components/ui";

/** Hidden file input + trigger, shared by the Flight Deck, Library and empty states. */
export function useImporter() {
  const { importBackup } = useWorkspace();
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const input = <input ref={ref} type="file" accept="application/json,.json" hidden aria-label="Import backup file" onChange={async e => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try { toast(await importBackup(file)); } catch (err) { toast(err instanceof Error ? err.message : "Could not import backup.", "error"); }
  }} />;
  return { pick: () => ref.current?.click(), input };
}
