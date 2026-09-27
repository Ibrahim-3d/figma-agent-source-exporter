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

Public tracking issue: [#2 — v0.4: Proof & Validation](https://github.com/Ibrahim-3d/figma-to-agent/issues/2)

GitHub-native repository setup that requires admin/UI actions is tracked separately in [#11 — Complete GitHub-native public surfaces](https://github.com/Ibrahim-3d/figma-to-agent/issues/11).

### Prove 1:1 publicly

- [ ] [#3 Publish reproducible Figma → frontend benchmark](https://github.com/Ibrahim-3d/figma-to-agent/issues/3)
- [ ] Add before/after visual comparisons
- [ ] Define measurable visual acceptance criteria
- [ ] Document screenshot-only vs source-driven implementation cases

### Make onboarding trivial

- [x] Require curated product-facing release notes
- [ ] Improve install flow
- [ ] [#4 Add a 60-second quick-start demo](https://github.com/Ibrahim-3d/figma-to-agent/issues/4)
- [ ] Add copy-paste prompts for major coding agents
- [ ] Add troubleshooting for large files and incomplete source evidence

### Harden the source pack

- [ ] [#5 Version and document source-pack schema v1](https://github.com/Ibrahim-3d/figma-to-agent/issues/5)
- [ ] Add compatibility/version metadata
- [ ] [#6 Add source-pack validator / preflight](https://github.com/Ibrahim-3d/figma-to-agent/issues/6)
- [ ] [#8 Improve SVG candidate detection and diagnostics](https://github.com/Ibrahim-3d/figma-to-agent/issues/8)
- [ ] [#7 Reduce memory pressure for large entire-file exports](https://github.com/Ibrahim-3d/figma-to-agent/issues/7)
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
- [ ] [#9 Visual regression hooks](https://github.com/Ibrahim-3d/figma-to-agent/issues/9)
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
