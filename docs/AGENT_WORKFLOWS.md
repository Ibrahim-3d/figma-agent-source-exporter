# Coding-agent workflows

Figma → Agent source packs are intentionally agent-independent. The same exported design source can be used with Codex, Claude Code, Cursor, Windsurf, Gemini CLI, Astra, or another coding agent that can inspect project files.

## Generic prompt

Use this when the source pack has been extracted to `design-source/`:

```text
Implement the requested screen from design-source/.

Before editing code:
1. Read design-source/manifest.json.
2. Read design-source/agent/README.md.
3. Map the target frame to its structured page JSON, assets, tokens, components, fonts, and exact reference render.
4. Inspect the existing application architecture and reuse existing components/tokens when they are exact matches.

Implementation rules:
- Use exported original assets instead of approximating them.
- Use structured source for exact values and relationships.
- Use the matching frame render as visual ground truth.
- Do not mirror the Figma layer tree literally into application architecture.
- Do not use the reference screenshot as production UI.

Verification:
- Run the application.
- Render/screenshot it at the exact source frame dimensions.
- Compare it against the exported frame reference.
- Fix visible deltas before declaring completion.
- Report any remaining mismatch that is caused by missing or unsupported evidence.

Target: 1:1 visual fidelity.
```

## Codex

Point Codex at the application repository and the extracted source pack. The pack contains an `agent/README.md` implementation protocol, so the important instruction is to make Codex read it before editing.

Recommended request:

```text
Use design-source/ as the authoritative Figma implementation evidence.
Follow design-source/agent/README.md.
Implement the target screen in the existing app and complete the exact-viewport visual verification loop before finishing.
```

## Claude Code

Keep the exported pack inside or adjacent to the repository so Claude Code can inspect the structured JSON and original assets directly.

Recommended request:

```text
Read design-source/manifest.json and design-source/agent/README.md before making changes.
Treat the corresponding frame render as visual ground truth and the structured source as exact implementation evidence.
Implement and visually reconcile the target until it reaches 1:1 fidelity.
```

## Cursor

Open the target project with the extracted source pack available in the workspace. Reference the pack path explicitly so the agent does not default to screenshot-only interpretation.

Recommended request:

```text
Implement this screen from the Figma → Agent pack under design-source/.
Do not approximate values or assets that exist in the pack.
Read the bundled agent instructions first, then verify the finished page at the exact source dimensions.
```

## Windsurf / Gemini CLI / local agents

Use the generic prompt. The workflow does not require a Figma-specific client or MCP integration after export.

## Multi-screen work

For larger applications:

1. export the entire Figma file;
2. keep one source pack for the implementation milestone;
3. create a source map for each non-trivial screen;
4. implement one route/screen at a time;
5. verify each screen against its corresponding frame reference;
6. do not overwrite shared application architecture merely to match the Figma tree.

## Updating a design

A source pack is a snapshot. When the Figma design changes materially, create a new export and replace or version the previous source pack before asking the agent to reconcile the application.

Future roadmap work includes explicit source-pack schema versioning and diff tooling.
