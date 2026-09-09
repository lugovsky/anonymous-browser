const { readFileSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { createRequire } = require("node:module");

// Patchright 1.63.0 still starts interception without awaiting it in CRPage's
// constructor. A closed CDP session then rejects outside page initialization.
const PATCHRIGHT_VERSION = "1.63.0";
const driverRequire = createRequire(require.resolve("patchright/package.json"));
const packagePath = driverRequire.resolve("patchright-core/package.json");
const humanRequire = createRequire(require.resolve("@humanjs/playwright/package.json"));
const humanDriver = humanRequire("playwright/package.json");
if (humanDriver.name !== "patchright" || humanDriver.version !== PATCHRIGHT_VERSION) {
  throw new Error(`HumanJS must resolve Patchright ${PATCHRIGHT_VERSION}. Set the consumer dependency "playwright" to "npm:patchright@${PATCHRIGHT_VERSION}" and reinstall.`);
}
if (JSON.parse(readFileSync(packagePath, "utf8")).version !== PATCHRIGHT_VERSION) {
  throw new Error("Review the Patchright startup patch before changing its pinned version");
}
const bundlePath = join(dirname(packagePath), "lib/coreBundle.js");
const replacements = [
  [
    "this._networkManager.setRequestInterception(true);",
    "const initialRequestInterception = this._networkManager.setRequestInterception(true);",
  ],
  [
    "this._mainFrameSession._initialize(bits.hasUIWindow).then(",
    "Promise.all([initialRequestInterception, this._mainFrameSession._initialize(bits.hasUIWindow)]).then(",
  ],
];

let source = readFileSync(bundlePath, "utf8");
for (const [original, patched] of replacements) {
  if (source.includes(patched)) continue;
  if (source.split(original).length !== 2) {
    throw new Error("Patchright initialization changed; review the startup patch before upgrading");
  }
  source = source.replace(original, patched);
}
writeFileSync(bundlePath, source);
