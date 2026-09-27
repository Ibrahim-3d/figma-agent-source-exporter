# Roadmap

Figma → Agent is focused on one outcome: **reliable 1:1 frontend implementation from portable Figma source using any capable coding agent.**

## Now

- [x] Entire-file, current-page, and selection export
- [x] Exact reference frame renders
- [x] Original image-fill extraction
- [x] SVG extraction for likely visual assets
- [x] Variables and modes
- [x] Local styles
- [x] Components, component sets, variants, and instance references
- [x] Font-usage inventory
- [x] Structured node export with Auto Layout and constraints
- [x] Export manifest and extraction diagnostics
- [x] Bundled coding-agent implementation protocol
- [x] Source-map template for implementation traceability
- [x] Offline, no-network plugin architecture
- [x] Automated sideload ZIP releases

## Next

### Prove 1:1 publicly

- [ ] Publish reproducible Figma → frontend benchmark projects
- [ ] Add before/after visual comparisons
- [ ] Define measurable visual acceptance criteria
- [ ] Document screenshot-only vs source-driven implementation cases

### Make onboarding trivial

- [ ] Improve release/install flow
- [ ] Add a 60-second quick-start demo
- [ ] Add copy-paste prompts for major coding agents
- [ ] Add troubleshooting for large files and incomplete source evidence

### Harden the source pack

- [ ] Version the source-pack schema explicitly
- [ ] Add compatibility/version metadata
- [ ] Add stronger validation for missing or broken assets
- [ ] Improve SVG candidate detection
- [ ] Improve large-file memory behavior
- [ ] Add export summaries suitable for automated agent preflight

### Agent workflows

- [x] Codex workflow
- [x] Claude Code workflow
- [x] Cursor workflow
- [x] Windsurf workflow
- [x] Gemini CLI workflow
- [x] Generic local-agent workflow

## Later

### Open design-source specification

Define the portable source-pack format independently from the plugin so other tools can produce or consume the same implementation evidence.

Potential work:

- [ ] published schema
- [ ] validator CLI
- [ ] source-pack diff tooling
- [ ] visual regression hooks
- [ ] source-to-code traceability tooling
- [ ] CI verification for implementation drift
- [ ] adapters for other design tools

## Non-goals

The project is not trying to become:

- a proprietary AI code generator;
- a hosted design-upload service;
- an agent-specific runtime;
- a literal Figma-layer-to-DOM compiler.

The goal is to give capable coding agents complete, portable design evidence and a verification protocol.
