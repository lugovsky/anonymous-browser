# Initial release validation

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
