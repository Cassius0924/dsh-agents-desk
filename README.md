# dsh-agents-desk

Edit the `AGENTS.md` instruction files DeepSeek Harness loads for your workspace — from the web settings panel — and see why a rule did or did not reach the model.

Built for DSH **0.2.1-rc.2**.

## What it does

- **All scopes, not just one file**: `$DSH_HOME/AGENTS.md`, `$DSH_AGENTS_HOME/AGENTS.md`, project-root `AGENTS.md` / `CLAUDE.md` / `.local` overlays, and nested `AGENTS.md` candidates.
- **Host-faithful effective chain**: rebuilds the baseline exactly as the loader renders it — section headers, intro sentence, `<system-reminder>` frame, trimmed SHA-1 dedupe, 1 MiB per-file ignore, and the 64 KiB budget that drops broad files before specific ones and truncates only the most specific file. The panel also reads `assumptions` so you can see which budget and candidate names were assumed.
- **History**: every save that replaces an existing file writes `<file>.bak-<timestamp>` when the prior text is readable; diff against a backup and roll back in one click. Rolling back is itself a version-guarded save, so it can be undone without silently overwriting external edits; the list shows whether a backup came from a save or a rollback, isolated per file.
- **Scope-aware model drafts**: project files use the repository's real facts (`package.json` scripts, lockfiles, `go.mod`, `Makefile`, …). Global files (`$DSH_HOME/AGENTS.md` and `$DSH_AGENTS_HOME/AGENTS.md`) use only their existing cross-project rules, without scanning the selected workspace or importing its commands. Empty global files get an unfilled TODO template. The server determines scope from the target path. Existing files receive a per-hunk proposal instead of an overwrite, using the configured default model's reasoning effort.
- **Editor comforts**: unsaved-change marker and guard, Ctrl/Cmd+S, Markdown preview, stale-response protection when switching workspaces quickly, and cancellable history diffs. Small edits in large files stay localized in proposals, and accepting large proposals avoids JavaScript argument-limit errors.
- **zh / en** UI, follows the host language.

## Install

```sh
dsh plugin --profile web add dsh-agents-desk
# host half loads at boot
systemctl restart dsh   # or restart dsh web however you run it
```

Then open **Settings → Harness 设置 → 指令文件** (DS Bot shell). A plain DSH install shows it as **Settings → 指令文件**.

## Reading the effective chain

The chain view is a deterministic recompute, not a report of a live session:

- It assumes the stock loader configuration: `maxBytes: 65536`, `maxSourceBytes: 1 MiB`, `projectRootMarkers: ['.git']`, and the default four candidate names. The host has no API that exposes a preset's resolved values, so `assumptions.source` is `defaults` and the UI says so. If a preset overrides them, the view may differ from what that session injects.
- Budget numbers count the whole rendered prompt text (frame + intro + section headers + budget marker), not the sum of file sizes. When the budget is exceeded, the broadest files are dropped first; only the most specific file is ever truncated, on a UTF-8 code-point boundary.
- Subdirectory files are **candidates**, not predictions: the host injects a nested instruction file only after a tool touches its directory. The plugin enumerates depth-3 subdirectories (skipping dependency/build directories) so those files are visible and editable.
- Discovery includes source directories such as `lib/`. The scan depth bounds automatic discovery, not editing permissions: instructions on the project-root-to-`cwd` chain remain editable even in deeply nested workspaces.

## Safety

- Writes only target instruction-file paths, re-derived server-side on every request (never trusted from the browser).
- Read routes that expose backups or diffs apply the same whitelist and require a registered `cwd`; a backup must be a same-directory sibling named `<file>.bak-*`.
- Symbolic links are rejected before writing, and the resolved host path is re-checked against the whitelist, so a repository-owned link cannot redirect a save outside it.
- Every overwrite carries the fs version token; a file changed on disk returns 409 instead of being clobbered.
- The route lives inside the host's authenticated `/api` fence (owner peer, Host/Origin/DNS-rebinding protection). The plugin performs its own path checks but does not add a second Origin/content-type gate; keep the DSH port on loopback or behind a trusted reverse proxy.
- A backup is written from the pre-write text after the guarded write succeeds. If the backup cannot be written, the save still succeeds and the response carries `backupError`.
- The plugin elevates to `danger-full-access` for its own write (the settings page must work regardless of the current session's sandbox mode). A read-only session can therefore still edit global instructions from this page.

## Not in scope

- No second injection layer: the plugin edits the files the harness loads; it never injects extra system-prompt sections.
- No multi-file rule packs, no snippet compiler, no session/config migration.
- The chain view is static. Comparing it with the digests a live session actually received is planned for v1.1.
- Backups and the history index are local files beside the target (the plugin assumes a local fs backend for those side effects).

## Development

```sh
node --test test/*.test.mjs
```

The test suite covers host-faithful rendering (including budget boundary/omission/truncation), discovery batching, dedupe, route validation and error codes, symlink rejection, backups/rollback, and generation selection/effort handling.

Optional real-browser smoke test, using a DSH checkout's React 18 and Playwright dependencies (Chromium must be installed):

```sh
DSH_ROOT=/path/to/deepseek-harness node test/browser.mjs
```

This mounts the actual client bundle against fixture workspace/model responses, not a live DSH session. It checks versioned rollback, closing an in-flight diff, applying and saving a 150,000-line proposal, mobile overflow, and global draft labeling/application. Set `BROWSER_SCREENSHOT_DIR` to save desktop/mobile screenshots. It does not contact a model or edit real instruction files.

MIT.
