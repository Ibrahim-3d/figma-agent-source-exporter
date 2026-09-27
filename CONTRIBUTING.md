# Contributing

Contributions are welcome if they improve the **Figma → Agent → 1:1 Frontend** workflow.

## Project priorities

Changes should strengthen at least one of these:

1. **Fidelity** — preserve more design evidence or make 1:1 implementation more reliable.
2. **Portability** — keep source packs usable without a live Figma connection.
3. **Agent independence** — avoid coupling the format to one coding agent.
4. **Local-first operation** — preserve the no-network exporter architecture unless a change has a compelling, explicit reason.
5. **Document safety** — the exporter should remain read-only with respect to Figma design nodes.
6. **Traceability** — make it easier to understand where implementation values/assets came from.
7. **Verification** — improve exact-viewport comparison and measurable completion criteria.

## Development

Requirements:

- Node.js 22 recommended
- npm
- Figma Desktop for sideload testing

```bash
npm install
npm run typecheck
npm run build
```

For development:

```bash
npm run watch
```

Import the repository `manifest.json` through:

**Figma Desktop → Plugins → Development → Import plugin from manifest…**

## Before opening a pull request

Run:

```bash
npm run typecheck
npm run build
```

For exporter behavior changes, also test:

- selection export;
- current-page export;
- entire-file export when relevant;
- generated `manifest.json`;
- exported frame references;
- affected assets/tokens/components;
- bundled `agent/README.md`;
- cancellation/error behavior if the change touches long-running export work.

## Design principles

Do not:

- add a backend for functionality that can remain local;
- make MCP or REST access mandatory;
- silently discard extraction failures;
- convert the exporter into a proprietary code generator;
- optimize for one agent at the expense of the portable source-pack model;
- claim fidelity improvements without a reproducible test case.

## Good contributions

Examples:

- broader structured design evidence;
- safer/lower-memory export behavior;
- better asset extraction;
- source-pack schema work;
- validators and diagnostics;
- benchmark cases;
- agent workflow documentation;
- visual comparison tooling;
- release/install UX improvements.

## Issues and feature requests

Include:

- the Figma structure involved;
- selected export scope/options;
- expected source-pack output;
- actual output/error;
- whether the issue prevents 1:1 implementation;
- a minimal reproduction when possible.

Do not attach confidential client source packs to public issues.
