# Third-party notices

This file records the components that determine the licensing and
corresponding-source obligations of the official ZhihuHelp desktop build. It
is not legal advice and does not replace the license files shipped by other
dependencies.

## pandoc-wasm 1.1.0

- Package: `pandoc-wasm@1.1.0`
- npm license expression: `GPL-2.0-or-later`
- Upstream repository: <https://github.com/pandoc/pandoc-wasm>
- Upstream tag: `v1.1.0`
- Upstream commit: `8955473ea57f4b9c3f5a6b3c3c9d2564e411deed`
- Official source archive:
  <https://codeload.github.com/pandoc/pandoc-wasm/tar.gz/8955473ea57f4b9c3f5a6b3c3c9d2564e411deed>
- Source archive SHA-256:
  `74cd6e69d2a2dbe5856bab359462670dcae159e75da557ad101644eb8e9738e7`
- npm integrity:
  `sha512-IoWBsC/cbSZe71rcRtxXUxG+Auf8aGDHKYOQZA6OdwmUL2xdpQaqrSGhPa+6zfLdSar7cnyAmTWt6KU9n5kBjQ==`

The upstream JavaScript wrapper is offered under the MIT License. The npm
package contains the Pandoc WASM binary and therefore declares the complete
package as GPL-2.0-or-later. The upstream license notice is retained in the
installed package and in its source archive.

## Pandoc 3.10

- Component: Pandoc WASM 3.10
- License: `GPL-2.0-or-later`
- Copyright: Pandoc contributors; see the upstream `COPYRIGHT` file
- Upstream repository: <https://github.com/jgm/pandoc>
- Upstream tag: `3.10`
- Upstream commit: `9376458c26d25d222e5a898ede254ebb2f47ffbe`
- Official source archive:
  <https://codeload.github.com/jgm/pandoc/tar.gz/9376458c26d25d222e5a898ede254ebb2f47ffbe>
- Source archive SHA-256:
  `92b493041c34cdf856ebf3570d7314114a43d103aaf53b526ffa664f1ec975ed`
- Official WASM release asset:
  <https://github.com/jgm/pandoc/releases/download/3.10/pandoc-3.10.wasm.zip>
- Official WASM release ZIP SHA-256:
  `e0865674db6fa2698d29811ca2fcb91ab00a2f8b7d0220eae4ea28405d9cab2b`
- Distributed `pandoc.wasm` SHA-256:
  `b47c9de52b5b45f103c2dac6fea52591aeafe3dd6cafed13331b67575233a2ff`

Pandoc's complete copyright and compatible-license inventory is in the
upstream `COPYRIGHT` file included in the pinned source archive.

## browser_wasi_shim 0.4.2

- Package: `@bjorn3/browser_wasi_shim@0.4.2`
- License: `MIT OR Apache-2.0`
- Upstream repository: <https://github.com/bjorn3/browser_wasi_shim>

This is a runtime dependency of `pandoc-wasm`. Its MIT and Apache-2.0 license
texts are retained in the installed package distributed with the application.

## Other dependencies

ZhihuHelp includes additional npm dependencies under their own licenses.
Their package manifests, copyright notices, and license files remain part of
the packaged `node_modules` tree. Nothing in ZhihuHelp's dual-license notice
changes those terms.

See `CORRESPONDING_SOURCE.md` for the source artifact attached beside each
official desktop binary.
