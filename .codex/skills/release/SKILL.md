---
name: release
description: Build, package and release anonymous-browser, or update its deployment documentation.
---

# Package and release

1. Use Node 22, run `npm ci` and `npm run build`.
2. Run `npm pack` and inspect its file list. Install the tarball into a temporary consumer. Check CommonJS and ESM imports, compile temporary consumers with strict NodeNext settings, and verify HumanJS's pinned Patchright resolution and `ffmpeg-static` installation.
3. Build the Dockerfile on Linux amd64. Use temporary local diagnostic pages for browser validation; do not add tests unless requested. Do not use real posting, voting or private accounts as public fixtures.
4. Keep README, examples and this skill aligned when lifecycle, releases or deployment behavior changes. Keep credentials and raw profile diagnostics outside this public repository.
5. Bump package.json and package-lock.json together. Commit the reviewed change, then push a matching `vX.Y.Z` tag. The CI workflow builds and checks the installable tarball and Docker image before creating the GitHub release with SHA-256 checksums. No npm token is needed.
6. Wait for CI and release completion. Check an unauthenticated download of the public release asset. Never replace an existing tag or release asset; publish a new version for fixes.

Consumers pin the release tarball URL and commit their npm lockfile. Use runtime secrets for GoLogin credentials. Compartment owns the consuming application; this package does not deploy itself or provide a remote browser server. Consumer rollouts follow the consuming repository's deployment procedure.

The GoLogin/Patchright/HumanJS versions are deliberately pinned. Review the postinstall patch before upgrades. Never run an automatic major dependency upgrade to suppress audit findings. Keep compatibility limitations and validation evidence current in README.

For headed diagnostics under Xvfb on Linux without a GPU, install `xvfb` and `xauth` in the consuming/diagnostic image and match the virtual screen to the profile. Use Docker's `--init` option: the launcher smoke check stalled with `xvfb-run` as PID 1 and passed under init. The verified v0.2.0 / Orbita 151 configuration passes `--use-gl=angle` and `--use-angle=swiftshader` through `extraArgs`, retaining the package's default flags. Removing only `--disable-gpu` did not restore WebGL. Keep software rendering explicit because it uses CPU resources and has Chromium's documented security tradeoffs; do not make it a global headed default or add `--enable-unsafe-swiftshader` without separate justification. Recheck the site's main-world results and actual WebGL 1/2 drawing/readback after graphics or browser changes; see `docs/validation.md`.

For GoLogin 3.0.4 / Patchright 1.63.0, retain the restored-session assignment, request-interception promise patch, safe Orbita downloader and owned-process shutdown. The SDK still ignores `restoreLastSession: false` in constructor options and does not wait for process exit when saving. Keep GoLogin types out of public declarations: its published declarations currently contain invalid imports. Recheck these facts before removing workarounds during a future upgrade.
