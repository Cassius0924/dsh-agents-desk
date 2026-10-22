# dsh-agents-desk

Edit every `AGENTS.md` file DeepSeek Harness actually loads — from the web settings panel — and see why a rule did or did not reach the model.

Built for DSH **0.2.1-rc.2**.

## What it does

- **All scopes, not just one file**: `$DSH_HOME/AGENTS.md`, `$DSH_AGENTS_HOME/AGENTS.md`, project-root `AGENTS.md` / `CLAUDE.md` / `.local` overlays, and nested `AGENTS.md` files.
- **Effective chain**: loads, dedupe result, 1 MiB per-file ignore, 64 KiB render budget, token estimate. Static and deterministic — it recomputes the same rules the harness uses.
- **History**: every save writes `<file>.bak-<timestamp>`; view a diff against any backup, roll back in one click. Rolling back is itself a save, so it can be undone.
- **Draft with the model**: scan the repository's real facts (`package.json` scripts, lockfiles, `go.mod`, `Makefile`, …) and one model call drafts a project `AGENTS.md`. If the file exists, the draft arrives as a per-hunk proposal instead of an overwrite.
- **zh / en** UI, follows the host language.

## Install

```sh
dsh plugin --profile web add dsh-agents-desk
# host half loads at boot
systemctl restart dsh   # or restart dsh web however you run it
```

Then open **Settings → Harness 设置 → 指令文件** (DS Bot shell). A plain DSH install shows it as **Settings → 指令文件**.

## Safety

- Writes only target instruction-file paths, re-derived server-side on every request (never trusted from the browser).
- Every overwrite carries the fs version token; a file changed on disk returns 409 instead of being clobbered.
- The write route lives inside the host's authenticated `/api` fence and refuses cross-origin JSON.
- The plugin elevates to `danger-full-access` for its own write (the settings page must work regardless of the current session's sandbox mode). Keep the DSH port on loopback or behind a trusted reverse proxy.

## Not in scope

- No second injection layer: the plugin edits the files the harness loads; it never injects extra system-prompt sections.
- No multi-file rule packs, no snippet compiler, no session/config migration.
- The chain view is static (deterministic recompute). Reading the current session's injected digests is planned for v1.1.

## Development

```sh
node --test test/*.test.mjs
```

MIT.
