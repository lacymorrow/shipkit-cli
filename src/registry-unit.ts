import { existsSync } from "node:fs";
import { join } from "node:path";
import { run } from "./utils.js";

/**
 * The shadcn registry "unit": paths that only make sense on a repo that publishes
 * `/r/*.json`. A new site never does, and once it deletes a template page
 * `registry.json` points at files that are gone (shipkit LAC-8213).
 *
 * Mirrors `REGISTRY_UNIT_PATHS` in lacymorrow/shipkit `scripts/utils/registry-unit.ts`.
 */
export const REGISTRY_UNIT_PATHS = [
  "registry.json",
  "public/r",
  "scripts/registry-check.sh",
  "scripts/registry-closure.ts",
  "scripts/registry-smoke.sh",
  ".github/workflows/registry.yml",
  "docs/features/registry.mdx",
] as const;

/** A repo is a registry source only while it still has `registry.json`. */
export function isRegistrySource(cwd: string): boolean {
  return existsSync(join(cwd, "registry.json"));
}

/**
 * Remove the unit from a fresh scaffold and commit. Returns false if there was
 * nothing to remove (a template without a registry, such as an older Bones).
 */
export async function stripRegistryUnit(cwd: string): Promise<boolean> {
  if (!isRegistrySource(cwd)) return false;
  await run("git", ["rm", "-rqf", "--ignore-unmatch", "--", ...REGISTRY_UNIT_PATHS], { cwd });
  const staged = await run("git", ["diff", "--cached", "--name-only"], { cwd });
  if (!staged) return false;
  const commit = await run(
    "git",
    [
      "commit",
      "-m",
      "chore: drop the shadcn registry\n\nThis site does not publish /r/*.json. Syncs keep the files out.",
    ],
    { cwd }
  );
  return commit !== null;
}

/**
 * `git merge upstream/main`, except a repo that is not a registry source never takes
 * the unit back. Returns false when the merge has conflicts left for a human.
 */
export async function mergeUpstream(cwd: string, ref: string): Promise<boolean> {
  if (isRegistrySource(cwd)) {
    return (await run("git", ["merge", ref, "--no-edit"], { cwd })) !== null;
  }
  await run("git", ["merge", "--no-commit", "--no-ff", ref], { cwd });
  const merging = await run("git", ["rev-parse", "-q", "--verify", "MERGE_HEAD"], { cwd });
  if (!merging) return true; // already up to date
  await run("git", ["rm", "-rqf", "--ignore-unmatch", "--", ...REGISTRY_UNIT_PATHS], { cwd });
  const unresolved = await run("git", ["diff", "--name-only", "--diff-filter=U"], { cwd });
  if (unresolved) return false;
  return (await run("git", ["commit", "--no-edit"], { cwd })) !== null;
}
