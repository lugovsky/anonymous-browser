# Third-party software

This package's source is MIT licensed. Dependencies retain their own licenses:

- GoLogin Node SDK 2.2.8: GPL-3.0.
- Patchright 1.62.3, derived from Playwright: Apache-2.0.
- HumanJS Playwright 0.11.0 and HumanJS Core: MIT.
- `ffmpeg-static`, installed by HumanJS: GPL-3.0-or-later; downloaded FFmpeg binaries have their own build-specific licensing. See that dependency's documentation before redistributing binaries.
- Orbita is downloaded from GoLogin separately at runtime and remains subject to GoLogin's terms. It is not included in the release tarball.

The postinstall script makes a small, version-guarded change to Patchright's page initialization. Dependency notices and licenses remain in their installed packages. This project is not affiliated with GoLogin, Patchright or HumanJS.
