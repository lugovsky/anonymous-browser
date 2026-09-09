# anonymous-browser

[![CI](https://github.com/lugovsky/anonymous-browser/actions/workflows/ci.yml/badge.svg)](https://github.com/lugovsky/anonymous-browser/actions/workflows/ci.yml)

A TypeScript library for GoLogin profiles controlled through Patchright, with HumanJS interactions. GoLogin owns Orbita, fingerprints, proxies and saved sessions. Applications own their workflows and scheduling.

## Install a public release

Requires Node.js 22 or later. Linux amd64 is the container target; macOS is available for local development. Automatic Orbita preparation supports Linux and macOS.

```sh
npm install --save-exact https://github.com/lugovsky/anonymous-browser/releases/download/v0.1.0/lugovsky-anonymous-browser-0.1.0.tgz
```

Commit your application's `package-lock.json`. GitHub release assets are publicly downloadable without npm or GitHub credentials. This package is distributed as an npm-compatible tarball; it is not published to the npm registry.

Installation runs a version-guarded Patchright patch and HumanJS installs `ffmpeg-static`, which downloads a platform-specific binary. Do not disable installation scripts. If your application already depends on `playwright`, set it to `npm:patchright@1.62.3` so HumanJS resolves the same driver. The installer checks this condition.

## Use

Supply `GOLOGIN_API_TOKEN` at runtime or pass `apiToken` to `createBrowser()`. Use a GoLogin profile appropriate for the runtime OS.

```ts
import { createBrowser } from "@lugovsky/anonymous-browser";

const browser = createBrowser();
const title = await browser.withSession({ profileId: "your-profile-id" }, async (session) => {
  const { page, human } = await session.newPage();
  await page.goto("https://example.com", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  return page.title();
});
```

CommonJS is also supported: `const { createBrowser } = require("@lugovsky/anonymous-browser")`.

`session.newPage()` returns `{ page, human }`. Use ordinary Patchright locators with HumanJS:

```ts
const input = page.getByRole("textbox", { name: "Message" });
await human.scroll(input, { block: "center" });
await human.clear(input);
await human.type(input, "Café\nHello");
// For supplementary Unicode characters such as emoji:
await human.paste(input, " 👋");
```

HumanJS uses full human timing, the `careful` personality, no visible cursor, and zero typo, misclick and overshoot probabilities. Applications should read back important text and confirm submission results themselves.

For manual lifecycle management, use `await browser.startSession(options)` and `await session.close()` in a `finally` block. `close()` is idempotent and returns `{ ok, errors }`. `withSession()` logs cleanup failures while preserving the callback's return value or original error. A custom `logger(message, details)` can report cleanup failures to your application.

Session options:

| Option | Default | Purpose |
| --- | --- | --- |
| `profileId` | Required | Existing GoLogin profile |
| `headless` | `true` | New headless mode; `false` opens a window |
| `restoreLastSession` | `false` headless, `true` headed | Restore tabs from the saved profile |
| `extraArgs` | `[]` | Additional Orbita launch flags |
| `orbita` | Automatically prepared | `{ executablePath, majorVersion }` for an existing Orbita installation |

`session.context` is GoLogin's existing default context. Prefer `session.newPage()` so the wrapper tracks task pages and their popups. Serialize access to each profile across all applications and processes; this library does not provide distributed profile locking.

## Browser lifecycle

- Downloads GoLogin's Orbita to `~/.gologin/browser` and reuses the cached version. `prepareOrbita()` can warm this cache. No separate Playwright browser distribution is installed.
- Attaches with `noDefaults: true`, `isLocal: true` and a 30-second CDP deadline. Uses the existing default context without setting a viewport or replacing the profile's fingerprint or proxy.
- Keeps the established container flags: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`, plus `--headless=new` when headless. Extra flags can change browser behavior; keep them consistent across consumers.
- Disables restored tabs for unattended headless sessions. GoLogin 2.2.8 ignores a constructor option of `false`, so the wrapper sets the instance property before launch.
- Closes task pages, sends browser-level CDP `Browser.close`, and waits five seconds for the owned process. If needed, signals only that child with SIGTERM and then SIGKILL, allowing five seconds each.
- Restores saved window placement and calls GoLogin's profile-saving `stop()` only after process exit. If the process remains alive, skips profile saving and file removal. Driver disconnection is attempted in final cleanup.
- Retries a connection failure once only after successful failed-launch cleanup. Never retries application operations.

Applications must await session cleanup on shutdown and give containers sufficient termination grace for the process waits plus GoLogin's network upload. An abrupt process or machine termination cannot complete profile persistence.

## Local development and containers

```sh
npm ci
npm run build
cp .env.example .env.local
# Fill in a disposable profile and token, then:
node --env-file=.env.local examples/browse.mjs
```

The example opens a local blank page and exercises text input. It saves the profile at session close. For a visible local browser, set `HEADLESS=false`.

```sh
docker build --platform linux/amd64 -t anonymous-browser .
docker run --rm --init --platform linux/amd64 \
  --env-file .env.local --stop-timeout 60 anonymous-browser
```

The Dockerfile installs Chromium's Linux system libraries and compiles the package. Orbita downloads on first use; mount a writable volume at `/home/node/.gologin` to retain its cache. The image runs as the `node` user. Do not copy host `node_modules` into Linux images because HumanJS's FFmpeg binary and GoLogin's native modules depend on the installation platform.

## Compartment

Install the public release URL in the consuming application's dependencies and retain its lockfile. `npm ci` during Compartment's build can download the package without a private-repository token.

Copy and adapt [examples/compartment.yml](examples/compartment.yml) in the consuming application. It supplies the Railpack build and runtime packages needed by this stack; the example assumes the application has build/start scripts and a `/healthz` endpoint. Pin Node 22 in the application's configuration. Store `GOLOGIN_API_TOKEN` and profile configuration as runtime variables, not build variables. No token belongs in the Dockerfile, package URL or Git history.

This is an in-process library. It does not expose a remote browser-control server, run a scheduler, or deploy an independent Compartment service.

## Compatibility and releases

The initial compatibility baseline is GoLogin `2.2.8`, Patchright `1.62.3`, HumanJS Playwright `0.11.0`, with `playwright` aliased to `npm:patchright@1.62.3`. Patchright does not officially support GoLogin; this is a maintained integration, not a guarantee of anonymity or undetectability. The pinned GoLogin dependency tree includes npm audit advisories; dependency upgrades need separate compatibility review.

The postinstall patch joins Patchright's request-interception initialization promise to page initialization. This prevents a closed CDP session from producing an unhandled rejection during startup. It does not repair an unresponsive restored tab. Version and source checks deliberately fail when an upgrade needs review.

CI compiles the package, installs its tarball in a fresh consumer, checks CommonJS/ESM imports and driver resolution, and builds the Linux Docker image. See [initial validation](docs/validation.md) for the Linux browser diagnostic and its limits. Browser/profile compatibility requires separate diagnostics with disposable profiles; CI does not contain GoLogin credentials or run live website actions.

To release, update the package and lockfile version, commit and push, then push the matching `vX.Y.Z` tag. The [workflow](.github/workflows/ci.yml) waits for package and container checks and creates a public GitHub release containing the tarball and `SHA256SUMS`. Consumers upgrade by changing their pinned URL and lockfile through their normal review/deployment flow. Roll back by restoring the previous dependency version.

See [THIRD_PARTY.md](THIRD_PARTY.md) for dependency licenses and [.codex/skills/release/SKILL.md](.codex/skills/release/SKILL.md) for release operations.
