# Copyright and third-party notices

## Retained upstream notice

This repository's original standalone-exporter commit,
`7ed8c6aff5b47244a4b8d0c3b5c64ef3df9a2308`, carried this MIT notice:

> Copyright (c) 2025 Graham Lipsman

That notice is retained in [LICENSE](LICENSE), together with the complete MIT
permission and warranty text. It must not be replaced with the maintainer's
name. The additional Ibrahim Elrouby notice covers only his original
contributions; it is not a claim of ownership over upstream material or a
copyright assignment from any other contributor.

The retained notice establishes an attribution obligation, not a complete
file-by-file provenance map. The standalone repository history does not by
itself establish the origin of every source line. Before offering exclusive
proprietary rights or removing upstream notices, document the exact upstream
revisions and reused files, and verify the necessary permissions. This hygiene
pass does not certify exclusive ownership of all code.

## Build tools

package.json currently declares @figma/plugin-typings, esbuild and TypeScript
as development dependencies. They retain their own licenses and copyrights.
Do not describe their authors' work as original exporter code. Check the actual
built artifact when adding or bundling dependencies; include every notice that
its distributed contents require.

## Exported design content

The plugin's MIT license does not grant rights to a user's Figma designs,
fonts, images, logos or other exported third-party content. Those rights remain
with their respective holders. Exporting content is not a license transfer.

## Distribution

Include LICENSE and this file in official sideload ZIPs. Keep existing release
archives unchanged; this notice accompanies new builds. Do not remove notices
from bundled or copied material during minification, packaging or a rename.
