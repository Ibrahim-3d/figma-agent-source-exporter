# Figma Agent Source Exporter

A standalone Figma development plugin that exports the **actual open Figma document** into one offline ZIP for coding agents such as Codex, Claude Code, Astra, or other local/remote engineering workflows.

The goal is durable source handoff: export once from Figma, then let an agent inspect the design without requiring continued Figma REST or MCP access.

## What it exports

- entire-file, current-page, or current-selection scope;
- exact 1× frame renders by default, with optional 2× references;
- original image-fill bytes with PNG/JPEG/GIF/WebP format detection where possible;
- likely icon/logo SVG exports;
- local variables and modes;
- local paint, text, effect, and grid styles;
- components, component sets, variants, property definitions, and instance references;
- font-usage inventory;
- serialized node structure including Auto Layout, constraints, dimensions, fills, effects, and text data;
- a root `manifest.json` containing page/frame/asset paths and extraction warnings;
- an `agent/README.md` inside each export containing the canonical Figma implementation skill;
- an `agent/source-map.template.yaml` for traceable frame → source → code mapping.

The plugin requests **no network access** and is read-only with respect to the Figma document.

## Export structure

A complete export looks roughly like this:

```text
my-design-source.zip
├── manifest.json
├── agent/
│   ├── README.md
│   └── source-map.template.yaml
├── document/
│   └── pages/
│       ├── design-system__0_1.json
│       ├── desktop-light__0_2.json
│       └── ...
├── tokens/
│   ├── variables.json
│   └── styles.json
├── components/
│   └── index.json
├── typography/
│   └── fonts.json
├── frames/
│   ├── desktop-light/
│   │   └── home__123_456@1x.png
│   └── ...
└── assets/
    ├── asset-map.json
    ├── images/
    │   └── <figma-image-hash>.<ext>
    └── svg/
        └── <page>/<name>__<node-id>.svg
```

## Build

Requirements:

- Node.js 22 recommended
- npm
- Figma desktop app for sideloading

```bash
npm install
npm run typecheck
npm run build
```

The build creates:

```text
dist/code.js
dist/ui.html
```

## Sideload in Figma

1. Clone or download this repository.
2. Run `npm install && npm run build`.
3. Open the Figma desktop app.
4. Go to **Plugins → Development → Import plugin from manifest…**.
5. Select the repository's `manifest.json`.
6. Run **Agent Source Exporter**.
7. Use **Entire file** for a durable project handoff, or Selection/Current page for smaller exports.
8. Start with **1× exact** references unless you specifically need 2× detail.

GitHub Actions also builds a reusable sideload ZIP on pushes to `main` and pull requests.

## Recommended coding-agent workflow

1. Export the Figma source pack.
2. Unzip it into a non-production source-reference location such as `design-source/`.
3. Read `manifest.json` and `agent/README.md` first.
4. Fill `agent/source-map.template.yaml` for the target frame when the implementation is non-trivial.
5. Use `tokens/`, `components/`, and `document/pages/` for exact structural/design-system evidence.
6. Prefer files under `assets/` as production asset sources when appropriate.
7. Use `frames/` as visual ground truth, never as production UI imagery.
8. Render the implementation at the source frame dimensions and compare visually before approving regression baselines.

Do **not** translate the Figma node tree literally into application code. The structured tree is evidence for values and relationships; application architecture should remain semantic and maintainable.


## Agent integration

The repository includes a canonical implementation protocol at:

`skills/figma-source-implementation/SKILL.md`

and a repository-level router at `AGENTS.md`.

The plugin bundles the current skill body into every exported `agent/README.md`, so a source pack remains self-describing even when it is handed to an agent outside this repository.

The skill defines evidence precedence, source mapping, target-codebase inspection, exact asset handling, semantic implementation rules, and an exact-viewport visual QA loop.

## Development

```bash
npm run watch
```

The plugin consists of:

```text
src/code.ts   # Figma plugin runtime and source extraction
src/ui.html   # export UI, ZIP creation, and download
build.mjs     # esbuild pipeline
manifest.json # Figma plugin manifest
```

## Current v0.2 limitations

- Large entire-file exports can consume significant Figma/UI memory because the final ZIP is assembled locally in the plugin UI.
- SVG identification is heuristic and favors vector primitives plus nodes whose names resemble icons/logos.
- Theme and viewport labels in the frame manifest are heuristic hints based on names and frame width, not authoritative design semantics.
- Fonts are inventoried by family/style usage; font binaries are not extracted.
- External library definitions can only be represented to the extent exposed by instances/main-component access in the open file.

Extraction problems are recorded in the exported `manifest.json` rather than silently guessed around.

## Privacy and document safety

- No network domains are allowed by the plugin manifest.
- The plugin does not create, move, edit, or delete Figma design nodes.
- Exported source packs may contain confidential design assets and text. Treat the ZIP with the same access controls as the source Figma file.

## Origin and license

This exporter was originally developed as a standalone extension inside `Ibrahim-3d/Figma-local-MCP`, which was forked from `MiHarsh/Figma-local-MCP`. It has now been separated into its own repository so the exporter can evolve independently.

The existing MIT license and upstream copyright notice are retained. See [LICENSE](LICENSE).
