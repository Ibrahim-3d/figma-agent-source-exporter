# Agent instructions

When a task uses a source pack produced by **Figma Agent Source Exporter**, load and follow:

`skills/figma-source-implementation/SKILL.md`

before editing application code.

Minimum operating rules:

1. Read `manifest.json` and the bundled `agent/README.md` first.
2. Map the requested target frame to its reference PNG, structured page JSON, assets, tokens, and components.
3. Use `agent/source-map.template.yaml` to record that mapping for non-trivial implementation work.
4. Inspect the target codebase before creating new components or tokens.
5. Use exported static assets exactly; do not redraw, approximate, or replace them without evidence.
6. Treat `frames/**` as visual ground truth, never as a production implementation asset.
7. Do not translate the Figma node tree literally into application architecture.
8. Run the implementation and compare it at the exact source frame dimensions before declaring visual fidelity.
9. Review relevant `manifest.json.errors` and report unresolved evidence gaps instead of inventing values.

For ordinary maintenance of this exporter repository, preserve the plugin's no-network, read-only-document behavior unless the task explicitly changes those constraints.
