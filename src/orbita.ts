import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

export type PreparedOrbita = { executablePath: string; majorVersion: number };
const execFileAsync = promisify(execFile);
let prepared: Promise<PreparedOrbita> | undefined;

function platform(): { os: string; cdn: string; executable: string } {
  if (process.platform === "darwin") {
    const arm = process.arch === "arm64";
    return {
      os: arm ? "macM1" : "mac",
      cdn: arm ? "mac-arm" : "mac",
      executable: "Orbita-Browser.app/Contents/MacOS/Orbita",
    };
  }
  if (process.platform === "linux") {
    const arm = process.arch === "arm64";
    return { os: arm ? "linArm" : "lin", cdn: arm ? "linux-arm" : "linux", executable: "chrome" };
  }
  throw new Error("Automatic Orbita preparation supports Linux and macOS only");
}

async function downloadOrbita(): Promise<PreparedOrbita> {
  const target = platform();
  const metadata = await fetch(
    `https://api.gologin.com/gologin-global-settings/latest-browser-info?os=${target.os}`,
    { signal: AbortSignal.timeout(30_000) },
  );
  if (!metadata.ok) throw new Error(`Orbita metadata request failed: ${metadata.status}`);
  const { latestVersion } = await metadata.json() as { latestVersion: string };
  const majorVersion = Number(latestVersion.split(".")[0]);
  if (!Number.isInteger(majorVersion) || majorVersion < 1) throw new Error("Invalid Orbita version");
  const home = join(homedir(), ".gologin", "browser");
  const destination = join(home, `orbita-browser-${majorVersion}`);
  const executablePath = join(destination, target.executable);
  if (await access(executablePath).then(() => true, () => false)) {
    return { executablePath, majorVersion };
  }
  await mkdir(home, { recursive: true });
  const temporary = await mkdtemp(join(home, ".download-"));
  try {
    const response = await fetch(
      `https://orbita-browser-${target.cdn}.gologin.com/orbita-browser-latest-${majorVersion}.tar.gz`,
      { signal: AbortSignal.timeout(600_000) },
    );
    if (!response.ok || !response.body) throw new Error(`Orbita download failed: ${response.status}`);
    const archive = join(temporary, "orbita.tar.gz");
    await pipeline(Readable.fromWeb(response.body as never), createWriteStream(archive));
    await execFileAsync("tar", ["xzf", archive, "-C", temporary, "--no-same-owner", "--no-same-permissions"]);
    try {
      await rename(join(temporary, "orbita-browser"), destination);
    } catch (error) {
      // Another process may have finished downloading the same version.
      if (!await access(executablePath).then(() => true, () => false)) throw error;
    }
    await access(executablePath);
    return { executablePath, majorVersion };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

/** Downloads GoLogin's Orbita into ~/.gologin/browser, reusing an existing version. */
export function prepareOrbita(): Promise<PreparedOrbita> {
  prepared ??= downloadOrbita().catch((error) => {
    prepared = undefined;
    throw error;
  });
  return prepared;
}
