---
name: release
description: Build, package and release anonymous-browser, or update its deployment documentation.
---

# Package and release

1. Use Node 22, run `npm ci` and `npm run build`.
2. Run `npm pack` and inspect its file list. Install the tarball into a temporary consumer. Check CommonJS and ESM imports, HumanJS's pinned Patchright resolution and `ffmpeg-static` installation.
3. Build the Dockerfile on Linux amd64. Use temporary local diagnostic pages for browser validation; do not add tests unless requested. Do not use real posting, voting or private accounts as public fixtures.
4. Keep README, examples and this skill aligned when lifecycle, releases or deployment behavior changes. Keep credentials and raw profile diagnostics outside this public repository.
5. Bump package.json and package-lock.json together. Commit the reviewed change, then push a matching `vX.Y.Z` tag. The CI workflow builds and checks the installable tarball and Docker image before creating the GitHub release with SHA-256 checksums. No npm token is needed.
6. Wait for CI and release completion. Check an unauthenticated download of the public release asset. Never replace an existing tag or release asset; publish a new version for fixes.

Consumers pin the release tarball URL and commit their npm lockfile. Use runtime secrets for GoLogin credentials. Compartment owns the consuming application; this package does not deploy itself or provide a remote browser server. Consumer rollouts follow the consuming repository's deployment procedure.

The GoLogin/Patchright/HumanJS versions are deliberately pinned. Review the postinstall patch before upgrades. Never run an automatic major dependency upgrade to suppress audit findings. Keep compatibility limitations and validation evidence current in README.
