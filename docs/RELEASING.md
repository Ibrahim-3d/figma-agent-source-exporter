# Releasing Figma → Agent

GitHub Releases are product communication, not commit logs.

Every version must ship with a curated release note file at:

`docs/releases/v<version>.md`

The CI release job refuses to publish a new tag when that file is missing.

## Release checklist

1. Choose the next semantic version.
2. Update `package.json`.
3. Add `docs/releases/v<version>.md`.
4. Run:
   ```bash
   npm install
   npm run typecheck
   npm run build
   ```
5. Open and review the pull request.
6. Merge to `main`.
7. CI builds the sideload ZIP and creates the GitHub Release from the curated notes.
8. Verify the attached ZIP and primary install path.
9. Update the active roadmap/milestone when applicable.
10. Publish a matching announcement when Discussions is enabled.

## Release note structure

Use this structure unless a section is genuinely not applicable:

```markdown
# Figma → Agent vX.Y.Z

## Why this release matters

One short paragraph written for users.

## What's new

- user-visible change
- user-visible change

## Improvements / fixes

- improvement
- fix

## Install / update

Clear steps or a link to the canonical install path.

## Compatibility

Breaking changes, migration notes, or an explicit statement that none are required.

## Known limitations

Only material limitations.

## What's next

Link the release to the current public roadmap/workstream.
```

## Versioning

Figma → Agent is currently in active `0.x` development.

- **Patch** releases: fixes, documentation/workflow improvements, packaging/release-system improvements, or other compatible changes.
- **Minor** releases: meaningful product capability additions or source-pack behavior changes.
- **Major** releases: reserved for a future stable contract with intentionally breaking compatibility changes.

Any source-pack schema compatibility change must be documented explicitly.
