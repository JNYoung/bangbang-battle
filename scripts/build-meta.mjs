import archiver from "archiver";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const tempDir = path.join(rootDir, ".tmp", "meta-instant");
const releaseDir = path.join(rootDir, "release", "meta-instant");
const zipPath = path.join(releaseDir, "profession-ball-arena-meta.zip");
const sdkScript = '<script src="https://connect.facebook.net/en_US/fbinstant.latest.js"></script>';

await fs.rm(tempDir, { recursive: true, force: true });
await fs.mkdir(tempDir, { recursive: true });
await fs.cp(distDir, tempDir, { recursive: true });

await ensureMetaSdkScript();
await ensureBundleConfig();
await writeZip();

console.log(`Meta Instant Games bundle created: ${path.relative(rootDir, zipPath)}`);

async function ensureMetaSdkScript() {
  const indexPath = path.join(tempDir, "index.html");
  const html = await fs.readFile(indexPath, "utf8");

  if (html.includes("fbinstant")) {
    return;
  }

  await fs.writeFile(indexPath, html.replace("</head>", `    ${sdkScript}\n  </head>`));
}

async function ensureBundleConfig() {
  const configPath = path.join(tempDir, "fbapp-config.json");

  try {
    await fs.access(configPath);
  } catch {
    await fs.copyFile(path.join(rootDir, "public", "fbapp-config.json"), configPath);
  }
}

async function writeZip() {
  await fs.mkdir(releaseDir, { recursive: true });
  await fs.rm(zipPath, { force: true });

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();
  });
}
