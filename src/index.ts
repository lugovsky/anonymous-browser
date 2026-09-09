import { launchProfile } from "./lifecycle.js";
import { BrowserSession } from "./session.js";
import type { BrowserOptions, Logger, SessionOptions } from "./types.js";

export { BrowserSession } from "./session.js";
export { BrowserLaunchError, ProfileNotFoundError } from "./lifecycle.js";
export { prepareOrbita, type PreparedOrbita } from "./orbita.js";
export type { BrowserOptions, SessionOptions, BrowserPage, CleanupResult, Logger } from "./types.js";
export type { Page, Locator, BrowserContext } from "patchright";
export type { Human } from "@humanjs/playwright";

export class AnonymousBrowser {
  private readonly apiToken: string;
  private readonly log: Logger;

  constructor(options: BrowserOptions = {}) {
    this.apiToken = options.apiToken ?? process.env.GOLOGIN_API_TOKEN ?? "";
    if (!this.apiToken) throw new Error("Set GOLOGIN_API_TOKEN or supply apiToken");
    const logger = options.logger ?? ((message, details) => console.warn(message, details ?? ""));
    this.log = (message, details) => {
      try { logger(message, details); } catch { /* Logging must not change an operation result. */ }
    };
  }

  async startSession(options: SessionOptions): Promise<BrowserSession> {
    if (!options.profileId.trim()) throw new Error("profileId is required");
    const { lifecycle, context } = await launchProfile(this.apiToken, options, this.log);
    return new BrowserSession(lifecycle, context, this.log);
  }

  async withSession<T>(options: SessionOptions, operation: (session: BrowserSession) => Promise<T>): Promise<T> {
    const session = await this.startSession(options);
    try {
      return await operation(session);
    } finally {
      await session.close();
    }
  }
}

export function createBrowser(options?: BrowserOptions): AnonymousBrowser {
  return new AnonymousBrowser(options);
}
