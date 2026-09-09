import type { Human } from "@humanjs/playwright";
import type { Page } from "patchright";

export type BrowserPage = { page: Page; human: Human };
export type Logger = (message: string, details?: Record<string, unknown>) => void;

export interface BrowserOptions {
  /** Defaults to GOLOGIN_API_TOKEN. */
  apiToken?: string;
  logger?: Logger;
}

export interface SessionOptions {
  profileId: string;
  /** Defaults to true; uses Chromium's new headless mode. */
  headless?: boolean;
  /** Defaults to false in headless mode, true in headed mode. */
  restoreLastSession?: boolean;
  extraArgs?: string[];
  /** Optional existing Orbita executable and its Chromium major version. */
  orbita?: { executablePath: string; majorVersion: number };
}

export interface CleanupResult {
  ok: boolean;
  errors: Error[];
}
