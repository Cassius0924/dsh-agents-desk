# Agents Desk settings surface

## Visual authority

The supplied OpenDesign export in `opendesign/` owns the visual vocabulary: monochrome surfaces, blue active accents, Inter/system typography, 8px corners, outlined SVG icons, workspace/file pickers, and editor/chain/history tabs.

## Host composition

This is an embedded DSH settings section, not a standalone page. The host options column owns its width and `padding: 0 24px 24px`. The plugin fills the available content width, with no nested surface border, card-width clamp, horizontal section padding, or horizontal footer margin. Components retain their own internal padding. The outer panel, header and tab strip are transparent and use the host background; the tab strip stays in normal flow so underlying content never shows through a sticky transparent bar. No styles target the host's generated class name.

## Functional integration

- The React module loader, host locale registry, HTTP routes, request cancellation, version-guarded writes, backup history, and global/project drafting remain the production integration.
- Default selection is the workspace's project AGENTS.md; the searchable picker exposes the other instruction scopes.
- Tabs change views without discarding the draft; keyboard navigation follows tab semantics.
- Native confirmation dialogs protect switching/reloading/rollback; save shortcuts do not write behind a pending dialog.
- Model proposals are real host responses, not the export's example generator. Only Save writes content to disk.
- Chain and history reflect backend responses. The static-chain limitations and backup failures remain explicit.
- The editor uses a bounded, scrollable textarea so very large documents remain manageable. The byte and line counters use the current draft.
- The original export's simulated localStorage database, fake facts/backups, and demo-only footer/help copy are not part of the runtime.
- All runtime styles are scoped under `[data-agents-desk]`. Neutral surfaces inherit DSH theme variables; the supplied blue accent and component geometry remain.

## Verification

`npm test` verifies host behavior. `DSH_ROOT=/path/to/deepseek-harness node test/browser.mjs` mounts the production client with explicit fixture responses, tests editor safeguards and interaction paths, checks the nine handoff viewport sizes, checks style isolation, and measures the host-owned gutters. Set `BROWSER_SCREENSHOT_DIR` for representative Chinese light/dark screenshots.
