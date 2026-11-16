import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "bun:test";
import { mergeUpstream, REGISTRY_UNIT_PATHS } from "../src/registry-unit.js";

const dirs: string[] = [];
const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });
const write = (cwd: string, path: string, body: string) => {
  mkdirSync(join(cwd, path, ".."), { recursive: true });
  writeFileSync(join(cwd, path), body);
};
const commit = (cwd: string, msg: string) => {
  git(cwd, "add", "-A");
  git(cwd, "commit", "-qm", msg);
};
const unitFile = (p: string) => (p === "public/r" ? "public/r/a.json" : p);

const setup = () => {
  const root = mkdtempSync(join(tmpdir(), "regunit-cli-"));
  dirs.push(root);
  const up = join(root, "up");
  mkdirSync(up);
  git(up, "init", "-q", "-b", "main");
  const ident = (cwd: string) => {
    // Use the machine's own identity; only a bare CI runner gets a stand-in.
    let email = "";
    try {
      email = git(cwd, "config", "user.email").trim();
    } catch {}
    if (email) return;
    git(cwd, "config", "user.email", "test@example.com");
    git(cwd, "config", "user.name", "test");
  };
  ident(up);
  for (const p of REGISTRY_UNIT_PATHS) write(up, unitFile(p), "v1");
  write(up, "src/app.ts", "v1");
  commit(up, "base");
  const fork = join(root, "fork");
  git(root, "clone", "-q", up, fork);
  ident(fork);
  git(fork, "remote", "add", "upstream", up);
  for (const p of REGISTRY_UNIT_PATHS) write(up, unitFile(p), "v2");
  write(up, "src/app.ts", "v2");
  commit(up, "upstream change");
  git(fork, "fetch", "-q", "upstream");
  return { fork };
};

afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("mergeUpstream", () => {
  it("keeps a deleted unit deleted across a sync", async () => {
    const { fork } = setup();
    git(fork, "rm", "-rq", "--", ...REGISTRY_UNIT_PATHS);
    git(fork, "commit", "-qm", "drop registry");
    expect(await mergeUpstream(fork, "upstream/main")).toBe(true);
    for (const p of REGISTRY_UNIT_PATHS) expect(existsSync(join(fork, p))).toBe(false);
    expect(git(fork, "show", "HEAD:src/app.ts")).toBe("v2");
  });

  it("returns false when the merge never started (dirty tree)", async () => {
    const { fork } = setup();
    git(fork, "rm", "-rq", "--", ...REGISTRY_UNIT_PATHS);
    git(fork, "commit", "-qm", "drop registry");
    write(fork, "src/app.ts", "uncommitted");
    expect(await mergeUpstream(fork, "upstream/main")).toBe(false);
  });

  it("returns false for a ref that does not exist", async () => {
    const { fork } = setup();
    git(fork, "rm", "-rq", "--", ...REGISTRY_UNIT_PATHS);
    git(fork, "commit", "-qm", "drop registry");
    expect(await mergeUpstream(fork, "upstream/nope")).toBe(false);
  });

  it("returns true when already up to date", async () => {
    const { fork } = setup();
    git(fork, "rm", "-rq", "--", ...REGISTRY_UNIT_PATHS);
    git(fork, "commit", "-qm", "drop registry");
    await mergeUpstream(fork, "upstream/main");
    expect(await mergeUpstream(fork, "upstream/main")).toBe(true);
  });
});
