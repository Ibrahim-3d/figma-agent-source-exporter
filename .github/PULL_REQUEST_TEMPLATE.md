## What changed

<!-- Describe the change and why it belongs in the Figma → Agent workflow. -->

## Fidelity / source impact

- [ ] No source-pack schema/output change
- [ ] Source-pack output changed and is documented
- [ ] Improves 1:1 implementation fidelity
- [ ] Changes agent instructions/workflow

## Safety invariants

- [ ] Exporter remains read-only with respect to Figma design nodes
- [ ] No new network dependency was introduced, or the reason is explicitly documented
- [ ] Extraction errors are surfaced rather than silently ignored

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Relevant export scope(s) tested
- [ ] Generated source pack inspected
- [ ] Visual/behavioral impact documented where applicable

## Notes

<!-- Screenshots, exported manifest snippets, benchmark links, or remaining limitations. -->
