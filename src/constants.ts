/**
 * Templates in order of preference. Bones is the public root template and the
 * default. ShipKit is the everything-included build downstream of Bones; use
 * `--template lacymorrow/shipkit` to start from it.
 */
export const TEMPLATE_REPOS = [
  { owner: "shipkit-io", name: "bones", label: "Bones (public, default)" },
  { owner: "lacymorrow", name: "shipkit", label: "ShipKit (everything included)" },
] as const;

/** Fallback upstream when a project has no `upstream` remote and no known template. */
export const DEFAULT_UPSTREAM_URL = "https://github.com/shipkit-io/bones.git";

export const DEFAULT_BRANCH = "main";
export const UPSTREAM_REMOTE = "upstream";
