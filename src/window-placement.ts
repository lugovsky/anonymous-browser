import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Browser } from "patchright";

type ProfilePathProvider = {
  profilePath?: () => string;
};

type WindowPlacement = {
  bottom?: number;
  left?: number;
  maximized?: boolean;
  right?: number;
  top?: number;
};

type BrowserPreferences = {
  browser?: {
    window_placement?: WindowPlacement;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type WindowPlacementSnapshot = {
  placement: WindowPlacement;
  preferencesPath: string;
};

function getPreferencesPath(profile: ProfilePathProvider): string | null {
  const profilePath = profile.profilePath?.();
  return profilePath ? join(profilePath, "Default", "Preferences") : null;
}

async function readBrowserPreferences(
  preferencesPath: string,
): Promise<BrowserPreferences | null> {
  try {
    return JSON.parse(await readFile(preferencesPath, "utf8")) as BrowserPreferences;
  } catch {
    return null;
  }
}

function getRestoredBounds(placement: WindowPlacement): Record<string, number | string> | null {
  if (placement.maximized) {
    return { windowState: "maximized" };
  }

  const { bottom, left, right, top } = placement;
  if (
    typeof bottom !== "number" ||
    typeof left !== "number" ||
    typeof right !== "number" ||
    typeof top !== "number"
  ) {
    return null;
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

export async function captureWindowPlacement(
  profile: ProfilePathProvider,
): Promise<WindowPlacementSnapshot | null> {
  const preferencesPath = getPreferencesPath(profile);
  if (!preferencesPath) {
    return null;
  }

  const preferences = await readBrowserPreferences(preferencesPath);
  const placement = preferences?.browser?.window_placement;
  return placement ? { placement, preferencesPath } : null;
}

export async function applyWindowPlacement(
  browser: Browser,
  snapshot: WindowPlacementSnapshot | null,
): Promise<void> {
  if (!snapshot) {
    return;
  }

  const bounds = getRestoredBounds(snapshot.placement);
  if (!bounds) {
    return;
  }

  const page = browser.contexts()[0]?.pages()[0];
  if (!page) {
    return;
  }

  const client = await page.context().newCDPSession(page);
  try {
    const { windowId } = await client.send("Browser.getWindowForTarget");
    await client.send("Browser.setWindowBounds", { windowId, bounds });
  } finally {
    await client.detach();
  }
}

export async function restoreWindowPlacement(
  snapshot: WindowPlacementSnapshot | null,
): Promise<void> {
  if (!snapshot) {
    return;
  }

  const preferences = await readBrowserPreferences(snapshot.preferencesPath);
  if (!preferences) {
    return;
  }

  preferences.browser = {
    ...preferences.browser,
    window_placement: snapshot.placement,
  };

  await writeFile(snapshot.preferencesPath, JSON.stringify(preferences));
}
