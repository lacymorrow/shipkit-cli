# create-shipkit

Scaffold and manage [ShipKit](https://shipkit.io) sites from the command line.

## Quick start

```bash
npx create-shipkit my-new-site
```

Or install globally:

```bash
npm install -g create-shipkit
shipkit create my-new-site
```

## Commands

| Command | What it does |
|---------|--------------|
| `shipkit create [name]` | Create a new ShipKit project from a template. Creates a GitHub repo (via `gh`), clones it, sets the upstream remote, and grafts upstream history so future syncs merge cleanly. |
| `shipkit sync` | Pull upstream template changes into your project. Opens a PR branch by default; use `--direct` to merge into the current branch. |
| `shipkit deploy` | Deploy your ShipKit site to Vercel. |

All commands support `-y` / `--yes` for non-interactive use (CI, agents):

```bash
npx create-shipkit create my-new-site --yes
shipkit sync --yes --direct
```

### `create` options

- `-t, --template <owner/repo>`: template repo to scaffold from (defaults to ShipKit Premium, falls back to [shipkit-io/bones](https://github.com/shipkit-io/bones))
- `-d, --directory <dir>`: target directory
- `--no-install`: skip dependency installation

## Requirements

- Node.js 18+
- `git` (required)
- [`gh` CLI](https://cli.github.com) (optional, enables GitHub repo creation)

## Development

```bash
bun install
bun run build      # tsup -> dist/index.js
bun run typecheck
node dist/index.js create --help
```

This CLI previously lived in the [lacymorrow/shipkit](https://github.com/lacymorrow/shipkit) repo under `cli/`. It was extracted so the ShipKit template ships lighter.

## License

MIT
