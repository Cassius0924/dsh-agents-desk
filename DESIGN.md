---
name: Agents Desk
description: Host-native instruction-file settings using the supplied OpenDesign vocabulary.
colors:
  primary: "#1677ff"
  background: "var(--dsw-alias-bg-base,#ffffff)"
  surface: "var(--dsw-alias-bg-layer-2,#f7f8fa)"
  foreground: "var(--dsw-alias-label-primary,#111111)"
  muted: "var(--dsw-alias-label-secondary,#6b7280)"
  border: "var(--dsw-alias-border-l3,#d9dee7)"
typography:
  headline:
    fontFamily: '"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif'
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-.01em"
  title:
    fontFamily: '"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: '"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif'
    fontSize: "14px"
    lineHeight: 1.6
  metadata:
    fontFamily: '"Inter",system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  editor:
    fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
rounded:
  sm: "8px"
  md: "8px"
  lg: "8px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  input-search:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  scope-badge:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  editor-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    padding: "8px 0"
---

# Design System: Agents Desk

## Overview

**Creative North Star: "Host-native instruction desk"**

The supplied OpenDesign export establishes a restrained, flat settings interface: neutral surfaces, blue active details, outlined icons and a clear reading hierarchy. The shipped implementation adapts that vocabulary to the DSH options column rather than presenting a separate page or floating application card. The outer surface, header and tabs are transparent so the host settings background remains continuous; internal controls and the editor retain their neutral surface layers.

The workspace/file picker leads to Editor, Effective Chain and Save History tabs. Preserve this compact operational character and the selected reference's introductory eyebrow; it is a specific pinned part of this surface, not a mandate to add eyebrows elsewhere.

**Key Characteristics:**

- Host-owned width and outer gutters.
- Theme-aware neutrals with a single blue accent.
- Flat bordered components with softly rounded corners.
- Sans-serif controls and monospace instruction content.
- Outlined inline SVG icons and explicit textual states.

## Colors

The palette is neutral-first, with blue reserved for action, selection and focus.

### Primary

- **Action Blue** (`primary`): primary buttons, active tab underline, picker checkmarks, progress fill, focus outlines and generation icons.

### Neutral

- **Host Canvas** (`background`): toolbar, dialogs, picker and button-label contrast color; not an outer page fill.
- **Host Layer** (`surface`): workspace selector, editor, subtle badges and hover/selected surfaces.
- **Host Ink** (`foreground`): headings, content and explicit error/status messages.
- **Host Secondary** (`muted`): paths, descriptions, metadata and inactive controls.
- **Host Divider** (`border`): component outlines, rules and separators.

**The Host Theme Rule.** Resolve neutrals through DSH theme variables in both light and dark modes; the frontmatter fallbacks are not a separate dark palette. Success, warnings and failures remain neutral and are distinguished with text, icons and border/weight changes rather than additional status hues.

## Typography

**Heading and Body Font:** Inter when installed, followed by the documented system sans-serif stack. No external font download is required.

**Code Font:** The documented UI monospace stack for instruction text, filenames, paths, version details and diffs.

### Hierarchy

- **Headline:** The main heading uses `headline`; there is no marketing display tier.
- **Title:** Section headings use `title`. File headings use the same size in bold monospace and reduce to body size in narrow layouts.
- **Body:** Descriptions, inputs and secondary buttons use `body`.
- **Label:** Tabs, contextual controls and explanatory notes use `label`; selected tabs are bold.
- **Metadata:** Counts, paths and compact state text use `metadata`, with monospace for technical values.
- **Editor:** Editable instruction text uses `editor` and retains whitespace with scrolling.

The primary action is deliberately larger and bold (20px, 700, line-height 1.5). The reference's introductory eyebrow is small regular-weight text (12px, tracking .08em). Preserve this established hierarchy without introducing a new display face.

## Layout

**The Single Gutter Rule.** The host options column owns width and outer padding (`0 24px 24px`). The plugin root fills its available content width (`width:100%; max-width:none; margin:0; padding:0; border:0; background:transparent`). Brand bar, introduction, context, tabs, view and footer align to that content edge; components retain their own internal padding. Do not impose a fixed card width or duplicate horizontal gutters.

Spacing follows the frontmatter's small-step rhythm. Main vertical sections and editor interiors use `space-6`; grouped controls use `space-2`/`space-3`; outlined details commonly use `space-4`. Tabs stay in normal document flow, with a `space-8` gap at wider sizes; their transparent strip does not overlay scrolled content.

At a viewport width of at most 420px, component padding and icon blocks compact. An additional named container query at the same threshold adapts the embedded section even when the overall viewport is wide: tabs use `space-5`, editor padding uses `space-4` and toolbar actions wrap. Outer gutters remain host-owned. Long paths wrap; instruction text scrolls within the bounded textarea (448px default height, 392px at the narrow container threshold, vertically resizable).

## Elevation & Depth

Ordinary content is flat: borders, neutral tonal separation and active underlines establish hierarchy. The editor has no shadow. Only the expanded picker, dialogs and feedback use the shared soft raised shadow; no hard-offset or decorative elevation is part of this system. The exact raised shadow, focus treatment and reduced-motion behavior are recorded in the sidecar.

## Shapes

Buttons, pickers, editor, badges, dialogs and icon blocks use the shared gently rounded corner scale. Borders are thin (1px); the selected tab uses a stronger underline (2px). The progress meter uses a pill silhouette; tiny state dots are circular, while the dirty indicator becomes square. These compact status marks do not change the component corner language.

## Components

### Buttons

Primary buttons combine Action Blue with Host Canvas text, bold large labels and a minimum height of 48px. Secondary buttons share that minimum height, neutral fill and a thin outline. Hover on primary buttons adds the blue focus-ring shadow; neutral buttons use the host layer and a secondary-label border. Disabled primary actions remain opaque but switch to neutral surface, border and muted text. Text/icon actions generally retain a 44px target. Keyboard focus uses a blue 2px outline, offset outward for buttons and inward for fields.

### Pickers and Badges

The workspace control is a full-width bordered host-layer row with an outlined folder block and name/path hierarchy. Its minimum height is 80px. File selection has a searchable grouped panel; options have a 56px minimum height and selected options combine a neutral surface, border and blue checkmark. Expanded option lists scroll after 360px. Scope badges are neutral bordered labels, not decorative colored pills.

### Editor and Inputs

The editor is one bordered, rounded group: neutral toolbar with Edit/Preview controls, monospace content and a separate metadata row. Selected segments use neutral tonal separation and a border, without elevation. Search fields have a 44px minimum height and use the same shape and focus grammar. Draft actions and Save remain visually distinct; status and byte/line counts sit close to the content they describe.

### Navigation

Keep the workspace/file picker above the Editor, Effective Chain and Save History tabs. Tabs are 56px tall, combine labels with optional count badges and indicate selection through bold foreground text plus the blue underline. Keyboard focus remains visible; tab selection does not discard editor content.

### Chain, History and Feedback

Chain entries are separated rows with compact numbered blocks, monospace file paths and explicit status text. Budget information uses a neutral bordered block and blue meter. History uses the same separator rhythm with outlined icon blocks and inline actions. Diff additions/removals remain monochrome, with plus/minus markers and removed-text strikethrough. Native dialogs and feedback share the normal rounded neutral surfaces and reserved raised shadow.

### Icons

Use the shipped inline SVG vocabulary: 24-unit view boxes, no fill, current-color outlines, rounded caps/joins and stroke width 1.5; the normal rendered size is 18px. Preserve the reference's folder, file, code, chain/layers, history, save and help forms. Do not substitute emoji, text glyphs, icon fonts or remote icon assets.

## Do's and Don'ts

### Do:

- **Do** fill the host content width and use the Single Gutter Rule.
- **Do** keep the outer surface, header and tabs transparent; inherit DSH neutrals for internal controls and keep the supplied blue accent.
- **Do** preserve the picker-to-tabs hierarchy, reference typography and pinned introductory eyebrow.
- **Do** scope runtime styling under `[data-agents-desk]` and retain keyboard focus and reduced-motion support.

### Don't:

- **Don't** add a standalone root card, width clamp or second horizontal section gutter.
- **Don't** replace neutral status explanations with color alone or add decorative gradients and shadows.
- **Don't** use glyph icons, remote runtime assets or selectors targeting the host's generated class names.
