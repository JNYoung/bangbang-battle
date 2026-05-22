import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const metaTempDir = path.join(rootDir, ".tmp", "meta-instant");
const metaZipPath = path.join(rootDir, "release", "meta-instant", "profession-ball-arena-meta.zip");

await assertFile(path.join(distDir, "index.html"));
await assertAsset("js");
await assertAsset("css");
await assertMetaBundle();

console.log("Build artifacts verified.");

async function assertAsset(extension) {
  const assetsDir = path.join(distDir, "assets");
  const assets = await fs.readdir(assetsDir);
  const matchingAssets = assets.filter((asset) => asset.endsWith(`.${extension}`));

  if (matchingAssets.length === 0) {
    throw new Error(`Missing built .${extension} asset in ${path.relative(rootDir, assetsDir)}`);
  }
}

async function assertMetaBundle() {
  const indexHtml = await fs.readFile(path.join(metaTempDir, "index.html"), "utf8");
  if (!indexHtml.includes("fbinstant.latest.js")) {
    throw new Error("Meta bundle index.html is missing the FBInstant SDK script.");
  }

  const config = JSON.parse(await fs.readFile(path.join(metaTempDir, "fbapp-config.json"), "utf8"));
  if (!config.instant_games?.platform_version || !config.instant_games?.orientation) {
    throw new Error("Meta bundle config is missing instant_games platform fields.");
  }

  const zipHeader = await readFirstBytes(metaZipPath, 2);
  if (zipHeader.toString("utf8") !== "PK") {
    throw new Error("Meta bundle zip does not have a ZIP header.");
  }

  const zipStat = await fs.stat(metaZipPath);
  if (zipStat.size < 1024) {
    throw new Error("Meta bundle zip is unexpectedly small.");
  }
}

async function assertFile(filePath) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) {
    throw new Error(`${path.relative(rootDir, filePath)} is not a file.`);
  }
}

async function readFirstBytes(filePath, length) {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    return buffer;
  } finally {
    await handle.close();
  }
}
