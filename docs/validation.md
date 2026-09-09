# Release validation

## v0.2.0 — dependency upgrade

Validated on 2026-09-09 with Node 22.23.2, Linux amd64, Orbita 151, GoLogin 3.0.4, Patchright 1.63.0 and HumanJS Playwright 0.11.0. These were the latest npm releases of the three libraries at validation time.

- Compilation, packed-package CommonJS/ESM imports and HumanJS's Patchright driver identity passed. Fresh TypeScript consumers compiled with strict NodeNext settings without `skipLibCheck`.
- The Docker build, Linux runtime imports and FFmpeg executable passed.
- The local browser diagnostic retained the existing default context, null viewport override and sampled fingerprint values from v0.1.0. Offscreen shadow-DOM clearing, accented multiline typing, emoji paste and PNG capture passed.
- Owned-process shutdown completed before SDK cleanup; operation results were preserved and repeated closure remained idempotent.
- A forced CDP initialization timeout retried once and failed with `BrowserLaunchError`, with zero unhandled rejections and clean process exit. The same diagnostic using unpatched Patchright 1.63.0 produced two unhandled request-interception rejections. The startup patch remains necessary.
- A disposable GoLogin profile completed a real save/restart cycle. A locally intercepted page wrote a persistent cookie and local storage; both were present after profile upload and a fresh launch. Both shutdowns completed before SDK saving, and the disposable profile was deleted. No live website actions were performed.
- GoLogin's `restoreLastSession: false` constructor option still evaluated to `true`. Its built-in archive extractor failed against a temporary cache path containing spaces. Retain the instance assignment and safe downloader.

Removed the ambient GoLogin declaration shim and duplicate constructor definition. Constructor options now use the SDK declarations. A small internal lifecycle interface remains because the SDK omits process-ownership fields and its published declarations contain invalid imports; those declarations do not leak into this package's consumer types.

The dependency tree decreased by 37 installed packages, including removal of `request` and `requestretry`. npm audit findings fell from 34 to 28 (2 low, 16 moderate, 8 high, 2 critical). The remaining advisories require separate dependency remediation. Headed mode, ARM execution and application-specific workflows are outside this upgrade's diagnostics.

## v0.1.0 validation

Validated on 2026-09-09 with Node 22.23.2, Linux amd64, Orbita 151, GoLogin 2.2.8, Patchright 1.62.3 and HumanJS Playwright 0.11.0.

- TypeScript compilation passed.
- Installed the packed tarball in a fresh consumer. CommonJS and ESM imports worked, including GoLogin's ESM module. HumanJS resolved the same pinned Patchright Chromium instance.
- Built the Dockerfile and verified runtime imports and the platform-specific FFmpeg executable.
- Launched Orbita as the container's non-root user with a downloaded local copy of an existing profile and a cached Orbita executable.
- Attached to the existing default context. The task page retained a null viewport override; sampled values were `webdriver: false`, no `Headless` user-agent marker, five plugins and two languages. These samples are not a complete fingerprint audit.
- Confirmed that headless launch omitted the restored-session flag.
- On an offscreen shadow-DOM textarea, HumanJS scrolled, cleared an existing draft, typed accented multiline text and pasted emoji. Read-back matched the supplied text. PNG screenshot capture passed.
- Session closure returned success, the owned process exited, and the operation result was preserved. Repeated closure reused the same result. No unhandled promise rejections were observed.

The browser diagnostic disabled remote profile uploads and account-activity updates, and checked that the SDK cleanup method was invoked only after process exit. It did not validate a new remote profile save/restart cycle. No website posting or voting was performed. Other consuming applications, headed mode and ARM browser execution still need integration-specific validation.

The pinned GoLogin dependency tree includes npm audit advisories. The initial local install reported 34 findings, including four critical findings; this is a compatibility baseline, not a completed dependency-security remediation. Upgrades should be evaluated separately from extraction.
