import type { ChildProcess } from "node:child_process";
import type { Browser } from "patchright";

const hasExited = (child: ChildProcess): boolean =>
  child.exitCode !== null || child.signalCode !== null;

function waitForExit(child: ChildProcess): Promise<boolean> {
  if (hasExited(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (exited: boolean) => {
      clearTimeout(timer);
      child.off("exit", onExit);
      resolve(exited);
    };
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(hasExited(child)), 5_000);
    child.once("exit", onExit);
  });
}

async function requestExit(browser: Browser): Promise<void> {
  const client = await browser.newBrowserCDPSession();
  await client.send("Browser.close");
}

/** Returns true if a signal was needed. Never targets an unowned process. */
export async function stopBrowserProcess(
  child: ChildProcess | null,
  browser: Browser | null,
): Promise<boolean> {
  if (!child?.pid) {
    if (browser) throw new Error("Missing Orbita process ownership; profile cleanup skipped");
    return false;
  }
  if (hasExited(child)) return false;
  if (browser?.isConnected()) {
    const exited = waitForExit(child);
    void requestExit(browser).catch(() => undefined);
    if (await exited) return false;
  }
  for (const signal of ["SIGTERM", "SIGKILL"] as const) {
    if (hasExited(child)) return true;
    child.kill(signal);
    if (await waitForExit(child)) return true;
  }
  throw new Error("Orbita is still running; profile save and file cleanup skipped");
}
