import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidRoot = path.join(repoRoot, "android");
const keystoreRelativePath = process.env.ANDROID_KEYSTORE_FILE || "keystores/bangbang-release.jks";
const keystorePath = path.join(androidRoot, keystoreRelativePath);
const propertiesPath = path.join(androidRoot, "keystore.properties");
const keyAlias = process.env.ANDROID_KEY_ALIAS || "bangbang-release";
const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD || createPassword();
const keyPassword = process.env.ANDROID_KEY_PASSWORD || storePassword;

if (existsSync(keystorePath) && existsSync(propertiesPath)) {
  console.log("Android signing files already exist; leaving them unchanged.");
  console.log(`Keystore: ${path.relative(repoRoot, keystorePath)}`);
  console.log(`Properties: ${path.relative(repoRoot, propertiesPath)}`);
  process.exit(0);
}
if (existsSync(keystorePath) || existsSync(propertiesPath)) {
  throw new Error(
    `Partial Android signing files exist. Check ${path.relative(repoRoot, keystorePath)} and ${path.relative(repoRoot, propertiesPath)} before regenerating.`,
  );
}

await mkdir(path.dirname(keystorePath), { recursive: true });

const keytoolResult = spawnSync(
  "keytool",
  [
    "-genkeypair",
    "-v",
    "-keystore",
    keystorePath,
    "-storetype",
    "PKCS12",
    "-alias",
    keyAlias,
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-storepass",
    storePassword,
    "-keypass",
    keyPassword,
    "-dname",
    "CN=Profession Ball Arena, OU=Mobile, O=JNYoung, L=Shanghai, ST=Shanghai, C=CN",
  ],
  { encoding: "utf8" },
);

if (keytoolResult.status !== 0) {
  throw new Error(`keytool failed: ${keytoolResult.stderr || keytoolResult.stdout}`);
}

await writeFile(
  propertiesPath,
  [
    `storeFile=${keystoreRelativePath}`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    "",
  ].join("\n"),
  { mode: 0o600 },
);
await chmod(propertiesPath, 0o600);

console.log(`Android release keystore generated at ${path.relative(repoRoot, keystorePath)}`);
console.log(`Signing properties saved at ${path.relative(repoRoot, propertiesPath)}; keep this file private.`);

function createPassword() {
  return randomBytes(24).toString("base64url");
}
