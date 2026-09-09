import type { ChildProcess } from "node:child_process";
import { chromium, type Browser, type BrowserContext, type Page } from "patchright";
import { stopBrowserProcess } from "./browser-process.js";
import { bounded, collectError, errorFrom } from "./cleanup.js";
import { prepareOrbita } from "./orbita.js";
import type { CleanupResult, Logger, SessionOptions } from "./types.js";
import { applyWindowPlacement, captureWindowPlacement, restoreWindowPlacement, type WindowPlacementSnapshot } from "./window-placement.js";

interface GoLoginProfile {
  processSpawned: ChildProcess | null;
  restoreLastSession: boolean;
  profilePath(): string;
  start(): Promise<{ wsUrl: string }>;
  stop(): Promise<void>;
  stopAndCommit(options: { posting: boolean }): Promise<void>;
}

type GoLoginConstructor = new (options: {
  token: string;
  profile_id: string;
  executablePath: string;
  browserMajorVersion: number;
  extra_params: string[];
}) => GoLoginProfile;

export class BrowserLaunchError extends Error {
  constructor(error: unknown) {
    super(errorFrom(error).message, { cause: error });
    this.name = "BrowserLaunchError";
  }
}

export class ProfileNotFoundError extends BrowserLaunchError {
  constructor(error: unknown) {
    super(error);
    this.name = "ProfileNotFoundError";
  }
}

export class ProfileLifecycle {
  browser: Browser | null = null;
  private placement: WindowPlacementSnapshot | null = null;

  constructor(private readonly profile: GoLoginProfile) {}

  async connect(headless: boolean): Promise<BrowserContext> {
    const { wsUrl } = await this.profile.start();
    this.placement = await captureWindowPlacement(this.profile);
    this.browser = await chromium.connectOverCDP(wsUrl, {
      noDefaults: true, isLocal: true, timeout: 30_000,
    });
    const context = this.browser.contexts()[0];
    if (!context) throw new Error("GoLogin's existing default browser context is missing");
    context.setDefaultTimeout(30_000);
    context.setDefaultNavigationTimeout(30_000);
    if (!headless) await bounded(applyWindowPlacement(this.browser, this.placement), "Window placement");
    return context;
  }

  async close(pages: Iterable<Page>, save = true): Promise<CleanupResult> {
    const result: CleanupResult = { ok: true, errors: [] };
    try {
      for (const page of pages) {
        if (!page.isClosed()) await collectError(result, () => bounded(page.close(), "Page close"));
      }
      const forced = await stopBrowserProcess(this.profile.processSpawned, this.browser);
      if (forced && save) {
        result.ok = false;
        result.errors.push(new Error("Orbita required forced termination before saving"));
      }
      // stopBrowserProcess must succeed before touching or uploading profile files.
      await collectError(result, () => restoreWindowPlacement(this.placement));
      await collectError(result, () => save
        ? this.profile.stop()
        : this.profile.stopAndCommit({ posting: false }));
    } catch (error) {
      result.ok = false;
      result.errors.push(errorFrom(error));
    } finally {
      await collectError(result, async () => {
        if (this.browser) await bounded(this.browser.close(), "Driver disconnect");
      });
    }
    return result;
  }
}

export async function launchProfile(
  apiToken: string, options: SessionOptions, log: Logger,
): Promise<{ lifecycle: ProfileLifecycle; context: BrowserContext }> {
  const { default: GoLogin } = await import("gologin") as { default: GoLoginConstructor };
  const orbita = options.orbita ?? await prepareOrbita();
  const headless = options.headless ?? true;
  const extraArgs = [
    ...(headless ? ["--headless=new"] : []),
    "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
    ...options.extraArgs ?? [],
  ];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const profile = new GoLogin({
      token: apiToken, profile_id: options.profileId,
      executablePath: orbita.executablePath, browserMajorVersion: orbita.majorVersion,
      extra_params: [...extraArgs],
    });
    // GoLogin 2.2.8 replaces a constructor option of false with true.
    profile.restoreLastSession = options.restoreLastSession ?? !headless;
    const lifecycle = new ProfileLifecycle(profile);
    try {
      const context = await lifecycle.connect(headless);
      return { lifecycle, context };
    } catch (error) {
      const cleanup = await lifecycle.close([], false);
      const message = errorFrom(error).message;
      const retryable = /connect ECONNREFUSED 127\.0\.0\.1:\d+/.test(message)
        || /connectOverCDP/.test(message);
      const retry = attempt < 2 && retryable && cleanup.ok;
      log("Browser launch failed", { attempt, retry, cleanupOk: cleanup.ok });
      if (retry) continue;
      if (/\b404\b/.test(message) && /profile deleted or not found/i.test(message)) {
        throw new ProfileNotFoundError(error);
      }
      throw new BrowserLaunchError(error);
    }
  }
  throw new BrowserLaunchError("GoLogin launch attempts exhausted");
}
