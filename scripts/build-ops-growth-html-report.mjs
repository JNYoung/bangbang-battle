#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultBundledPython = "/Users/zhengjinyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const defaultPythonDeps = "/tmp/codex-seaborn-deps";
const options = parseArgs(process.argv.slice(2));

main();

function main() {
  const inputPath = options.input || latestFile(path.join(rootDir, "reports", "ops-growth-loop"), /^ops-growth-loop-\d{4}-\d{2}-\d{2}\.json$/);
  if (!inputPath) {
    throw new Error("No ops growth loop JSON report found. Run npm run ops:growth-loop first.");
  }

  const python = options.python || process.env.OPS_HTML_PYTHON || (fs.existsSync(defaultBundledPython) ? defaultBundledPython : "python3");
  const depsPath = options.deps || process.env.OPS_HTML_PYTHONPATH || (fs.existsSync(defaultPythonDeps) ? defaultPythonDeps : "");
  const args = [
    path.join(rootDir, "scripts", "render-ops-growth-html-report.py"),
    "--input",
    inputPath,
  ];
  if (options.outputDir) {
    args.push("--output-dir", options.outputDir);
  }

  const env = {
    ...process.env,
    MPLCONFIGDIR: process.env.MPLCONFIGDIR || "/tmp/matplotlib",
  };
  if (depsPath) {
    env.PYTHONPATH = [depsPath, env.PYTHONPATH].filter(Boolean).join(path.delimiter);
  }

  const result = spawnSync(python, args, {
    cwd: rootDir,
    encoding: "utf8",
    env,
    stdio: "pipe",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`HTML report generation failed.\n${output}`);
  }

  process.stdout.write(result.stdout);
}

function parseArgs(args) {
  return {
    input: readArgValue(args, "--input"),
    outputDir: readArgValue(args, "--output-dir"),
    python: readArgValue(args, "--python"),
    deps: readArgValue(args, "--deps"),
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

function latestFile(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return "";
  }
  const candidates = fs.readdirSync(dir)
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file))
    .sort((a, b) => b.localeCompare(a));
  return candidates[0] || "";
}
