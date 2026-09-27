# Security Policy

## Supported versions

Security fixes are applied to the latest released version of Figma → Agent.

## Reporting a vulnerability

Please do **not** open a public issue for a vulnerability involving code execution, local file exposure, exported confidential design data, or a bypass of the plugin's local/no-network assumptions.

Until a private security-reporting channel is configured in GitHub, contact the maintainer privately through the contact method listed on the maintainer's GitHub profile and include:

- affected version;
- impact;
- reproduction steps;
- whether a malicious Figma document or exported source pack is required;
- any suggested mitigation.

Please avoid attaching confidential client source packs. Create a minimal reproduction whenever possible.

## Security invariants

The project intentionally aims to preserve these properties:

- no required backend;
- no mandatory Figma REST/MCP connection;
- plugin network access set to `none`;
- read-only behavior with respect to Figma design nodes;
- extraction failures surfaced instead of silently ignored.

Changes that weaken one of these guarantees should be explicit, reviewed, and documented.
