# Figma → Agent

**1:1 Figma → Frontend with any coding agent.**

[![CI](https://github.com/Ibrahim-3d/figma-to-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibrahim-3d/figma-to-agent/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/Ibrahim-3d/figma-to-agent)](https://github.com/Ibrahim-3d/figma-to-agent/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Stop giving AI screenshots. Give it the design.**

Agent Source Exporter turns the actual open Figma document into a portable, agent-ready source pack containing the structured design, original assets, design-system evidence, exact reference renders, and an implementation protocol for visual verification.

Use that pack with **Codex, Claude Code, Cursor, Windsurf, Gemini CLI, Astra, or any coding agent that can read files**.

**No MCP. No REST API. No Dev Mode. No Figma API token. No server. No upload. No proprietary code generator.**

It works as a local Figma plugin and is built for the **Figma Starter/free workflow as well as paid plans**.

---

## The problem

Most AI design-to-code workflows give the model one of two bad inputs:

1. **screenshots** — the agent can see the design, but must guess structure, spacing, assets, tokens, components, and relationships;
2. **live API/MCP access** — richer context, but tied to authentication, usage limits, plan access, live connectivity, and a specific integration path.

Figma → Agent takes a different approach:

```text
Figma design
    ↓
Agent Source Exporter
    ↓
portable design source pack
    ↓
your coding agent
    ↓
1:1 frontend implementation
    ↓
exact-viewport visual verification
```

Export once. Give the source to any agent. Keep the evidence with the project.

---

## 1:1 Figma → Frontend

The workflow is designed and tested for **1:1 visual implementation** when the exported source contains the required design evidence and the coding agent follows the bundled implementation protocol.

The agent does not have to reverse-engineer the interface from pixels alone. It receives:

- exact reference renders;
- original image-fill bytes;
- SVG source for likely icons and logos;
- serialized Figma node structure;
- Auto Layout and constraints;
- dimensions, fills, effects, and text data;
- variables and modes;
- local paint, text, effect, and grid styles;
- components, component sets, variants, properties, and instances;
- font-usage inventory;
- extraction diagnostics;
- source-to-code mapping guidance;
- a visual QA loop that compares the implementation at the exact source viewport.

The reference frame is the visual target. Structured source provides the values and relationships needed to reproduce it without guessing.

---

## Quick start

### 1. Download the plugin

Download the latest **sideload ZIP** from [Releases](https://github.com/Ibrahim-3d/figma-to-agent/releases/latest) and extract it.

### 2. Load it in Figma Desktop

Open:

**Plugins → Development → Import plugin from manifest…**

Select the extracted `manifest.json`, then run **Agent Source Exporter**.

### 3. Export your design

Choose:

- **Entire file** — recommended for a durable implementation handoff;
- **Current page** — smaller focused context;
- **Selection** — targeted component or screen work.

Keep **1× exact** reference renders enabled for normal implementation work.

### 4. Give the ZIP to your coding agent

Unzip the export into the target project, for example:

```text
design-source/
```

Then tell the agent:

```text
Implement the target Figma screen from design-source/.

Read design-source/manifest.json and design-source/agent/README.md first.
Use the exported assets and structured source rather than approximating them.
Render the implementation at the exact source dimensions and reconcile it
against the matching frame reference before declaring the task complete.
```

The source pack carries its own implementation instructions, so it remains useful outside this repository. See [docs/AGENT_WORKFLOWS.md](docs/AGENT_WORKFLOWS.md) for copy-paste workflows for major coding agents.

---

## Figma-Driven Development

**Figma-Driven Development** is a workflow where the actual Figma source drives AI implementation instead of screenshots, prose prompts, or manually recreated specifications.

```text
Design → Source → Agent → Implementation → Visual verification
```

The design is treated as implementation evidence:

- **visual appearance** comes from exported frame references;
- **exact values and relationships** come from structured source;
- **asset identity** comes from original exported assets;
- **implementation architecture** remains native to the target codebase;
- **completion** requires exact-viewport visual verification.

Read the full methodology: [docs/FIGMA_DRIVEN_DEVELOPMENT.md](docs/FIGMA_DRIVEN_DEVELOPMENT.md).

---

## Why not just use screenshots?

A screenshot can show:

- what the page looks like.

It does not reliably tell an agent:

- whether spacing is 23 px or 24 px;
- whether a layout is Auto Layout, grid, flex, or absolute positioning;
- which image is the original production asset;
- which values come from variables or design tokens;
- how component variants relate;
- what the original SVG contains;
- which font styles are actually used;
- what constraints should drive responsive behavior.

Figma → Agent exports both the **visual ground truth** and the **structured evidence** behind it.

---

## Why not require MCP or the REST API?

Because the design should be portable.

A source pack:

- works after the Figma session is closed;
- can be versioned with a project;
- can be handed between people and agents;
- does not depend on live MCP availability;
- does not require a Personal Access Token;
- does not require a server or bridge process;
- does not upload the design anywhere;
- can be consumed by any agent that can inspect files.

The plugin itself requests **no network access** and is read-only with respect to the Figma document.

---

## What gets exported

A full export contains:

```text
my-design-source.zip
├── manifest.json
├── agent/
│   ├── README.md
│   └── source-map.template.yaml
├── document/
│   └── pages/
│       └── *.json
├── tokens/
│   ├── variables.json
│   └── styles.json
├── components/
│   └── index.json
├── typography/
│   └── fonts.json
├── frames/
│   └── **/*@1x.png
└── assets/
    ├── asset-map.json
    ├── images/
    │   └── *
    └── svg/
        └── **/*.svg
```

The root `manifest.json` maps pages, frames, assets, export settings, counts, and extraction warnings.

---

## Agent implementation protocol

Every exported pack includes the current implementation protocol from:

`skills/figma-source-implementation/SKILL.md`

The protocol instructs an agent to:

1. read the source pack before editing code;
2. map the target frame to its structured evidence and assets;
3. inspect the existing codebase before creating components or tokens;
4. use supplied assets exactly;
5. translate design intent into maintainable application architecture;
6. render at the source viewport dimensions;
7. compare against the exported visual target;
8. iterate until the visual result matches;
9. report unsupported evidence rather than inventing values.

This is what turns an export into an implementation workflow instead of a data dump.

---

## Agent compatibility

There is no agent-specific runtime dependency.

The source pack works with tools that can inspect local/project files, including:

- OpenAI Codex;
- Claude Code;
- Cursor;
- Windsurf;
- Gemini CLI;
- Astra;
- local coding agents;
- custom autonomous development workflows.

The agent does **not** need a Figma connection after export.

---

## Build from source

Requirements:

- Node.js 22 recommended;
- npm;
- Figma Desktop for sideloading.

```bash
npm install
npm run typecheck
npm run build
```

The build produces:

```text
dist/code.js
dist/ui.html
```

For development:

```bash
npm run watch
```

---

## Privacy and document safety

The architecture is deliberately local.

- Figma manifest network access is set to `none`.
- The plugin does not create, move, edit, or delete design nodes.
- The design is not uploaded to a third-party backend.
- Exported packs may contain confidential text and assets, so treat them with the same access controls as the source Figma file.

---

## Current limitations

- Large entire-file exports can consume significant Figma/UI memory because the ZIP is assembled locally.
- SVG identification is heuristic and favors vector primitives plus nodes whose names resemble icons/logos.
- Theme and viewport labels are heuristic hints, not authoritative design semantics.
- Fonts are inventoried by family/style usage; font binaries are not extracted.
- External library definitions are represented only to the extent exposed through the open document and component access available to the plugin.
- Static design source cannot by itself define product behavior that does not exist in the design or target application.

Extraction problems are written to `manifest.json` rather than silently guessed around.

---

## Project & community

- **Current work:** [v0.4 — Proof & Validation](https://github.com/Ibrahim-3d/figma-to-agent/issues/2)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)
- **Releases:** [latest release](https://github.com/Ibrahim-3d/figma-to-agent/releases/latest)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Support:** [SUPPORT.md](SUPPORT.md)
- **Security:** [SECURITY.md](SECURITY.md)

The repository uses Issues for concrete work, bugs, and feature proposals. The v0.4 tracking issue is the public execution surface until a GitHub Project board is established.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md).

The direction is bigger than one exporter: make **Figma → Agent** a reliable, portable, open workflow for design-driven AI development.

Near-term priorities include:

- public 1:1 implementation benchmarks;
- polished agent-specific workflows;
- stronger export validation;
- easier installation and release UX;
- source-pack versioning and compatibility guarantees;
- an open portable design-source specification.

---

## Project structure

```text
src/code.ts
src/ui.html
build.mjs
manifest.json
skills/figma-source-implementation/SKILL.md
AGENTS.md
```

---

## License and contributions

Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

MIT licensed. See [LICENSE](LICENSE).

---

## The idea in one line

> **Figma → Agent → 1:1 Frontend.**
