import * as p from "@clack/prompts";
import pc from "picocolors";
import { isNonInteractive, run } from "./utils.js";

export interface AddOptions {
  yes?: boolean;
  overwrite?: boolean;
  cwd?: string;
}

/**
 * Items that replace a Bones stub file on install (see docs/agents/install.md in
 * shipkit-io/bones). shadcn needs --overwrite for those, and only those.
 */
export const STUB_OVERWRITERS = new Set(["payments", "storage", "payload"]);

/** Accept "stripe" or "@shipkit/stripe"; return the bare item name. */
export function normalizeItem(item: string): string {
  return item.trim().replace(/^@shipkit\//, "");
}

/**
 * Add ShipKit registry items to the project in cwd with `npx shadcn add`.
 * Bones registers the @shipkit registry in components.json, so bare names work.
 */
export async function add(items: string[], opts: AddOptions): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const names = items.flatMap((i) => i.split(",")).map(normalizeItem).filter(Boolean);
  if (names.length === 0) {
    p.log.error("Name at least one item, for example: shipkit add payments email");
    process.exit(1);
  }

  const overwrite = opts.overwrite ?? names.some((n) => STUB_OVERWRITERS.has(n));
  const args = ["--yes", "shadcn@latest", "add", ...names.map((n) => `@shipkit/${n}`), "-y"];
  if (overwrite) args.push("--overwrite");

  p.log.info(`npx ${args.join(" ")}`);
  if (overwrite) {
    p.log.info(
      `--overwrite is on because ${names.filter((n) => STUB_OVERWRITERS.has(n)).join(", ") || "you asked for it"} replaces a Bones stub file.`
    );
  }

  const nonInteractive = opts.yes ?? isNonInteractive();
  if (!nonInteractive) {
    const go = await p.confirm({ message: "Run it?", initialValue: true });
    if (p.isCancel(go) || !go) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
  }

  const s = p.spinner();
  s.start(`Adding ${names.join(", ")}...`);
  const out = await run("npx", args, { cwd });
  if (out === null) {
    s.stop("shadcn add failed. Run the command above yourself to see the error.");
    process.exit(1);
  }
  s.stop(`Added ${names.join(", ")}.`);

  // shadcn prints the env keys it appended and each item's docs; show that.
  const tail = out.split("\n").filter((l) => l.trim()).slice(-25).join("\n");
  if (tail) console.log(`\n${pc.dim(tail)}\n`);
  p.log.info(`Fill in the empty keys in ${pc.cyan(".env.local")}; each feature turns on when its keys exist.`);
}
