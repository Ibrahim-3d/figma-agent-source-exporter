# Figma-Driven Development

## Definition

**Figma-Driven Development** is a development workflow where the actual Figma source is treated as implementation evidence for an AI coding agent.

The agent does not receive only a screenshot and a prompt. It receives the visual target, structured design data, original assets, design-system evidence, and explicit verification rules.

```text
Figma design
    ↓
portable source pack
    ↓
coding agent
    ↓
application code
    ↓
exact-viewport verification
```

The goal is **1:1 visual implementation without coupling the workflow to a proprietary code generator or live Figma connection**.

## Why this exists

AI coding agents are capable of producing production frontend code, but their output quality depends on the evidence they receive.

A screenshot is strong visual evidence and weak implementation evidence.

A raw node tree is strong structural evidence and incomplete visual evidence.

Figma-Driven Development combines both.

### Visual ground truth

Reference renders define what the finished implementation should look like.

### Structured source

Node geometry, Auto Layout, constraints, text, fills, effects, variables, styles, components, and relationships provide exact implementation evidence.

### Original assets

Images and SVGs are exported so the agent does not have to redraw or approximate supplied visual material.

### Target-codebase context

The Figma tree is not application architecture. The agent still inspects the target project and implements the design using its existing framework, components, tokens, accessibility patterns, routing, and state conventions.

### Verification

The implementation is rendered at the exact source dimensions and compared against the reference frame. Visual differences are treated as defects to diagnose and correct.

## Core principles

1. **Source over screenshots.** Use screenshots as visual targets, not as the only implementation input.
2. **Evidence over guessing.** Do not approximate values that exist in the source.
3. **Original assets over imitation.** Reuse the supplied image or vector rather than recreating a similar version.
4. **Design intent over layer mirroring.** Translate Figma structure into maintainable application code.
5. **Portable context over permanent connectivity.** The design handoff should remain useful after Figma is closed.
6. **Agent independence.** The workflow should work with any capable coding agent.
7. **Verification over confidence.** A task is not visually complete because the agent says it is; render and compare it.
8. **Explicit uncertainty.** Missing source evidence is reported rather than silently invented.

## Evidence hierarchy

There is no single source of truth for every question.

| Question | Preferred evidence |
| --- | --- |
| What should it look like? | Matching exported frame render |
| What are the exact values? | Structured page/node source |
| Which asset should be used? | Exported original asset |
| Which token/style/component is intended? | Variables, styles, component metadata |
| How should the app be architected? | Existing target codebase |
| What if sources conflict? | Inspect export errors, reconcile explicitly |

## The implementation loop

### 1. Establish the target

Identify the route, component, screen, Figma frame, node ID, and exact source dimensions.

### 2. Map the evidence

Connect the target frame to its structured page JSON, assets, tokens, components, fonts, and visual reference.

### 3. Inspect the application

Find existing primitives, tokens, typography, routing, responsive conventions, and equivalent assets before creating new ones.

### 4. Implement

Build semantic application code from the design evidence.

### 5. Render

Capture the implementation at the exact source viewport.

### 6. Compare

Resolve differences in this order:

1. major geometry;
2. sizing and alignment;
3. typography and wrapping;
4. spacing;
5. asset identity and crop;
6. colors, borders, shadows, blur, and effects;
7. responsive behavior;
8. state and interaction details.

### 7. Complete

Do not declare 1:1 completion while visible unexplained differences remain.

## What this is not

Figma-Driven Development does not mean:

- generating one application component per Figma layer;
- treating exported JSON as production application architecture;
- shipping reference screenshots as UI;
- blindly hardcoding every coordinate from the design;
- replacing engineering judgment with the design tree;
- inventing behavior that static design evidence does not contain.

The design drives the implementation target. The application still needs to be good software.

## Portable design source

The long-term model is that design context should behave like source code:

- exportable;
- inspectable;
- versionable;
- diffable;
- tool-independent;
- available to automation;
- tied to explicit verification.

Agent Source Exporter is the current reference producer for this workflow.

## Short version

> **Stop giving AI screenshots. Give it the design.**

> **Figma → Agent → 1:1 Frontend.**
