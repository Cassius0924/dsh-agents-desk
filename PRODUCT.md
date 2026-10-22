# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

DSH users managing the instruction files that their coding agent loads.

## Product Purpose

Edit host instruction files, inspect a static effective chain, review backups, and propose scope-aware model drafts without adding an injection layer.

## Operating Context

A React settings section inside DSH 0.2.1-rc.2. Backend routes use the host filesystem and model services. The hand-written client bundle has no build step or external runtime assets.

## Capabilities and Constraints

- Global, project, and nested instruction-file scopes.
- Saves and rollbacks retain version checking and backup semantics.
- Global drafts use existing global rules or TODO templates, not project facts.
- The effective chain is a static recompute with explicit default assumptions, not a live-session report.
- All UI strings support the host Chinese/English locale; styles must remain isolated from the host.

## Brand Commitments

The user supplied the OpenDesign export in docs/design/opendesign/ as the visual authority: preserve its picker navigation, three tabs, type scale, component spacing and icon vocabulary. The host settings options column owns width and its 24px outer gutters; the plugin fills that content width without a second horizontal inset. Outer surfaces, header and tab navigation stay transparent against the host background. Replace prototype data and simulated storage with real plugin services.

## Evidence on Hand

README.md, docs/CONTEXT.md, host route tests, the actual client bundle, and the supplied design export. Browser tests use explicitly simulated host/model responses and do not validate live model output.
