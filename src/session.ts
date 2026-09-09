import { createHuman } from "@humanjs/playwright";
import type { BrowserContext, Page } from "patchright";
import type { ProfileLifecycle } from "./lifecycle.js";
import type { BrowserPage, CleanupResult, Logger } from "./types.js";

export class BrowserSession {
  private readonly pages = new Set<Page>();
  private closing?: Promise<CleanupResult>;

  constructor(
    private readonly lifecycle: ProfileLifecycle,
    readonly context: BrowserContext,
    private readonly log: Logger,
  ) {}

  async newPage(): Promise<BrowserPage> {
    if (this.closing) throw new Error("Browser session is closing");
    const page = await this.context.newPage();
    this.track(page);
    const human = await createHuman(page, {
      speed: "human", cursor: false,
      personality: {
        extends: "careful",
        mouse: { misclickProbability: 0, overshootProbability: 0 },
        typing: { typoProbability: 0 },
      },
    });
    return { page, human };
  }

  private track(page: Page): void {
    this.pages.add(page);
    page.on("popup", (popup) => this.track(popup));
  }

  /** Idempotent. Reports cleanup failure without throwing away an operation result. */
  close(): Promise<CleanupResult> {
    this.closing ??= this.lifecycle.close(this.pages).then((result) => {
      if (!result.ok) this.log("Browser cleanup failed", {
        errors: result.errors.map((error) => error.message),
      });
      return result;
    });
    return this.closing;
  }
}
