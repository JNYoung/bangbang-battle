#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(rootDir, "android");
const packageName = "com.professionballarena.game";
const activityName = `${packageName}/.MainActivity`;
const oldKnownAppIds = new Set(["1:886878711329:android:db34cfd335c4e9fd08bd60"]);

const options = parseArgs(process.argv.slice(2));
const env = createAndroidEnv();
const adbPath = process.env.ADB || path.join(env.ANDROID_HOME, "platform-tools", "adb");
const googleServices = readGoogleServices();
const expectedAppId = googleServices.appId;
const expectedProjectId = googleServices.projectId;
const expectedSenderId = googleServices.projectNumber;
const artifactStamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const logFile = path.join(os.tmpdir(), `bangbang-ga-release-smoke-${artifactStamp}.log`);
const summaryFile = path.join(os.tmpdir(), `bangbang-ga-release-smoke-${artifactStamp}.json`);
const screenDir = path.join(os.tmpdir(), `bangbang-ga-release-smoke-${artifactStamp}-screens`);

main();

function main() {
  fs.mkdirSync(screenDir, { recursive: true });
  assertAdbDevice();

  if (!options.skipBuild) {
    run("npm", ["run", "build"], { cwd: rootDir, inherit: true });
    run("npx", ["cap", "sync", "android"], { cwd: rootDir, inherit: true });
    run("./gradlew", [":app:assembleRelease", "--console=plain"], { cwd: androidDir, inherit: true });
  }

  verifyGeneratedFirebaseValues();
  installReleaseApk();
  prepareAnalyticsDeviceState();
  runGameFlow();

  const log = adb(["logcat", "-d"]);
  fs.writeFileSync(logFile, log);
  const summary = analyzeLog(log);
  fs.writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);

  printSummary(summary);
  if (!summary.ok) {
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  return {
    serial: readArgValue(args, "--serial") || process.env.ANDROID_SERIAL || "emulator-5554",
    skipBuild: args.includes("--skip-build"),
    keepGms: args.includes("--keep-gms"),
    resetApp: args.includes("--reset-app"),
    rounds: Number(readArgValue(args, "--rounds") || 1),
  };
}

function readArgValue(args, name) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function createAndroidEnv() {
  const androidHome = process.env.ANDROID_HOME || path.join(os.homedir(), "Library", "Android", "sdk");
  const studioJbr = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  const javaHome = process.env.JAVA_HOME || (fs.existsSync(studioJbr) ? studioJbr : "");
  return {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || androidHome,
    JAVA_HOME: javaHome || process.env.JAVA_HOME,
    PATH: [
      path.join(androidHome, "platform-tools"),
      path.join(androidHome, "emulator"),
      process.env.PATH,
    ].join(path.delimiter),
  };
}

function readGoogleServices() {
  const file = path.join(rootDir, "android", "app", "google-services.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const client = data.client?.find((entry) => {
    return entry.client_info?.android_client_info?.package_name === packageName;
  });

  if (!client) {
    throw new Error(`google-services.json does not contain package ${packageName}`);
  }

  return {
    appId: client.client_info.mobilesdk_app_id,
    packageName: client.client_info.android_client_info.package_name,
    projectId: data.project_info.project_id,
    projectNumber: data.project_info.project_number,
  };
}

function assertAdbDevice() {
  const devices = run(adbPath, ["devices"], { cwd: rootDir });
  if (!devices.includes(`${options.serial}\tdevice`)) {
    throw new Error(`ADB device ${options.serial} is not ready.\n${devices}`);
  }
}

function verifyGeneratedFirebaseValues() {
  const valuesPath = path.join(
    rootDir,
    "android",
    "app",
    "build",
    "generated",
    "res",
    "processReleaseGoogleServices",
    "values",
    "values.xml",
  );

  if (!fs.existsSync(valuesPath)) {
    throw new Error(`Missing generated google-services values: ${valuesPath}`);
  }

  const values = fs.readFileSync(valuesPath, "utf8");
  assertIncludes(values, expectedAppId, valuesPath);
  assertIncludes(values, expectedProjectId, valuesPath);
  assertIncludes(values, expectedSenderId, valuesPath);
}

function installReleaseApk() {
  const apkPath = path.join(rootDir, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
  if (!fs.existsSync(apkPath)) {
    throw new Error(`Missing release APK: ${apkPath}`);
  }

  run(adbPath, ["-s", options.serial, "install", "-r", "-d", apkPath], { cwd: rootDir });
}

function prepareAnalyticsDeviceState() {
  adb(["shell", "setprop", "debug.firebase.analytics.app", ".none."]);
  adb(["shell", "setprop", "log.tag.FA", "VERBOSE"]);
  adb(["shell", "setprop", "log.tag.FA-SVC", "VERBOSE"]);
  adb(["shell", "am", "force-stop", packageName]);

  if (!options.keepGms) {
    adb(["shell", "pm", "clear", "com.google.android.gms"]);
    sleep(3500);
    adb(["shell", "setprop", "debug.firebase.analytics.app", ".none."]);
    adb(["shell", "setprop", "log.tag.FA", "VERBOSE"]);
    adb(["shell", "setprop", "log.tag.FA-SVC", "VERBOSE"]);
  }

  if (options.resetApp) {
    adb(["shell", "pm", "clear", packageName]);
  }

  adb(["logcat", "-c"]);
}

function runGameFlow() {
  adb(["shell", "am", "start", "-n", activityName]);
  sleep(9000);
  captureScreen("00-after-launch.png");

  if (!waitForLog(/GameAnalytics: logEvent: game_init_success/, 12000)) {
    tap(540, 2040);
    sleep(2500);
  }

  for (let round = 1; round <= options.rounds; round += 1) {
    tap(540, 1140);
    sleep(1200);
    tap(760, 1920);
    sleep(2500);
    captureScreen(`round-${round}-started.png`);
    waitForLog(new RegExp(`GameAnalytics: logEvent: game_start`), 20000);

    if (round < options.rounds) {
      waitForLog(new RegExp(`GameAnalytics: logEvent: game_end`), 90000);
      tap(540, 1185);
      sleep(1500);
    }
  }

  waitForLog(/Successful upload\. Got network response|Network upload failed|Gms url request failed/, 90000);
  captureScreen("final.png");
}

function analyzeLog(log) {
  const gmpAppIds = [...log.matchAll(/gmp_app_id:\s*(1:[^\s,]+)/g)].map((match) => match[1]);
  const wrongGmpAppIds = [...new Set(gmpAppIds.filter((appId) => appId !== expectedAppId))];
  const failures = [];
  const uploadFailures = count(log, /Network upload failed|Gms url request failed/g);
  const successfulUploads = count(log, /Successful upload\. Got network response/g);
  const debugEvidence = count(log, /Faster debug mode event logging enabled|name: _dbg/g);
  const oldAppIdEvidence = [...oldKnownAppIds].filter((appId) => log.includes(appId));
  const events = {
    gameInitSuccess: count(log, /GameAnalytics: logEvent: game_init_success/g),
    gameStart: count(log, /GameAnalytics: logEvent: game_start/g),
    gameEnd: count(log, /GameAnalytics: logEvent: game_end/g),
    adRequest: count(log, /GameAnalytics: logEvent: ad_request/g),
    adShow: count(log, /GameAnalytics: logEvent: ad_show/g),
    adClose: count(log, /GameAnalytics: logEvent: ad_close/g),
    performanceSnapshot: count(log, /GameAnalytics: logEvent: performance_snapshot/g),
  };

  if (!log.includes(expectedAppId)) {
    failures.push(`Expected Firebase app id was not observed: ${expectedAppId}`);
  }
  if (wrongGmpAppIds.length > 0) {
    failures.push(`Unexpected gmp_app_id values observed: ${wrongGmpAppIds.join(", ")}`);
  }
  if (oldAppIdEvidence.length > 0) {
    failures.push(`Old Firebase app id evidence is still present: ${oldAppIdEvidence.join(", ")}`);
  }
  if (debugEvidence > 0) {
    failures.push("Debug-mode analytics evidence was observed; GA aggregate reports may exclude these events.");
  }
  if (uploadFailures > 0) {
    failures.push(`Firebase upload failure count: ${uploadFailures}`);
  }
  if (successfulUploads < 1) {
    failures.push("No successful Firebase upload was observed.");
  }
  if (events.gameInitSuccess < 1) {
    failures.push("game_init_success was not logged; legal consent may be missing.");
  }
  if (events.gameStart < 1) {
    failures.push("game_start was not logged; match flow did not start.");
  }

  return {
    ok: failures.length === 0,
    packageName,
    expectedAppId,
    expectedProjectId,
    expectedSenderId,
    serial: options.serial,
    resetGms: !options.keepGms,
    resetApp: options.resetApp,
    events,
    successfulUploads,
    uploadFailures,
    debugEvidence,
    wrongGmpAppIds,
    logFile,
    summaryFile,
    screenDir,
    failures,
  };
}

function printSummary(summary) {
  console.log(`GA release smoke ${summary.ok ? "passed" : "failed"}`);
  console.log(`Firebase app id: ${summary.expectedAppId}`);
  console.log(`Events: ${JSON.stringify(summary.events)}`);
  console.log(`Successful uploads: ${summary.successfulUploads}`);
  console.log(`Upload failures: ${summary.uploadFailures}`);
  console.log(`Log: ${summary.logFile}`);
  console.log(`Summary: ${summary.summaryFile}`);
  console.log(`Screens: ${summary.screenDir}`);
  for (const failure of summary.failures) {
    console.error(`- ${failure}`);
  }
}

function tap(x, y) {
  adb(["shell", "input", "tap", String(x), String(y)]);
}

function captureScreen(name) {
  const png = runBuffer(adbPath, ["-s", options.serial, "exec-out", "screencap", "-p"], { cwd: rootDir });
  fs.writeFileSync(path.join(screenDir, name), png);
}

function waitForLog(pattern, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const log = adb(["logcat", "-d"]);
    if (pattern.test(log)) {
      return true;
    }
    sleep(1000);
  }
  return false;
}

function adb(args) {
  return run(adbPath, ["-s", options.serial, ...args], { cwd: rootDir });
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd || rootDir,
    env,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${output}`);
  }

  return result.stdout || "";
}

function runBuffer(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd || rootDir,
    env,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${result.stderr?.toString("utf8") || ""}`);
  }

  return result.stdout;
}

function assertIncludes(content, expected, file) {
  if (!content.includes(expected)) {
    throw new Error(`${file} does not include ${expected}`);
  }
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
