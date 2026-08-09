# Corresponding source for desktop releases

Official ZhihuHelp desktop binaries include `pandoc-wasm@1.1.0` and Pandoc
WASM 3.10 and are distributed under GPL-2.0-or-later. Every Windows and macOS
draft release must attach the following asset before its binary asset:

`zhihuhelp-<version>-corresponding-source.tar.gz`

The asset is generated from the exact Git commit used for the binary. It
contains:

- a `git archive` of the ZhihuHelp commit, including the lockfile and release
  scripts;
- the checksum-pinned official `pandoc-wasm` `v1.1.0` source archive;
- the checksum-pinned official Pandoc `3.10` source archive;
- the license files, third-party notices, a machine-readable manifest, and
  these build instructions.

The source builder never treats local `node_modules` or the distributed WASM
binary as corresponding source. Network downloads are accepted only from the
official pinned URLs and only when their SHA-256 values match
`THIRD_PARTY_NOTICES.md` and the release script.

## Create or verify the source bundle

From a clean, committed checkout:

```sh
node scripts/release/create-corresponding-source.cjs --output-dir release-source
```

For an offline build, first place the two exact official archives in a cache
directory using the filenames listed by `--help`, then run:

```sh
node scripts/release/create-corresponding-source.cjs \
  --offline \
  --cache-dir /path/to/source-cache \
  --output-dir release-source
```

Missing archives, dirty tracked files, a dependency/version mismatch, a
network failure, or any checksum mismatch causes a non-zero exit. The command
also writes a `.sha256` sidecar for the final source bundle.

Useful release checks:

```sh
node scripts/release/create-corresponding-source.cjs --verify-config
node scripts/release/create-corresponding-source.cjs --verify-installed
node scripts/release/create-corresponding-source.cjs --stage-license-files dist/licenses
node scripts/release/create-corresponding-source.cjs --verify-packaged release
```

`--verify-installed` checks the installed npm package, its declared Pandoc
version, and the exact `pandoc.wasm` hash. `--verify-packaged` performs the
same hash/version checks in each unpacked Electron application. Neither mode
copies anything from `node_modules` into the source bundle.

## Rebuild ZhihuHelp

Requirements are Node.js 24.x and pnpm 11.5.0. Extract the ZhihuHelp archive,
then run the same commands recorded in the release workflows:

```sh
npm install --global pnpm@11.5.0
pnpm install --frozen-lockfile
pnpm build-without-sourcemap
node scripts/release/create-corresponding-source.cjs --stage-license-files dist/licenses
pnpm buildgui
pnpm electron-builder
```

Windows and macOS use `.github/workflows/build-windows.yml` and
`.github/workflows/build-mac.yml` respectively. Native dependency rebuilding
performed by those files is part of the corresponding build procedure.

## Rebuild and verify Pandoc WASM

The pinned Pandoc source contains its WASM entry point, dependency patches,
Nix flake/lock files, and the root `pandoc.wasm` Make target. In a supported
Nix environment, extract `pandoc-3.10-source.tar.gz` and run:

```sh
nix develop --command bash -c "make pandoc.wasm"
sha256sum pandoc.wasm
```

The expected SHA-256 is:

```text
b47c9de52b5b45f103c2dac6fea52591aeafe3dd6cafed13331b67575233a2ff
```

The `pandoc-wasm` source archive contains `pandoc-version.txt` and
`scripts/download-wasm.js`, which identify and retrieve the official Pandoc
3.10 release WASM. A rebuilt file must match the hash above before replacing
the release input. Toolchain or upstream-output drift is an error and must not
be silently accepted.
