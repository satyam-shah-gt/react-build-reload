#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_OUT = "public/build-version.json";

function printHelp() {
  console.log(`react-build-reload

Usage:
  react-build-reload generate [options]

Options:
  --out <path>           Output file path. Default: ${DEFAULT_OUT}
  --build-id <id>        Build ID to write. Defaults to env/git/timestamp data.
  --version <version>    App version. Defaults to package.json version when found.
  --environment <name>   Environment name. Defaults to NODE_ENV or production.
  --no-git               Skip git metadata lookup.
  --help                 Show help.

Example:
  react-build-reload generate --out public/build-version.json
`);
}

function parseArgs(args) {
  const options = {
    command: "generate",
    out: DEFAULT_OUT,
    buildId: undefined,
    version: undefined,
    environment: undefined,
    includeGit: true,
    help: false
  };

  const pending = [...args];

  if (pending[0] && !pending[0].startsWith("-")) {
    options.command = pending.shift();
  }

  for (let index = 0; index < pending.length; index += 1) {
    const arg = pending[index];

    switch (arg) {
      case "--out":
        options.out = readRequiredValue(pending, ++index, "--out");
        break;
      case "--build-id":
        options.buildId = readRequiredValue(pending, ++index, "--build-id");
        break;
      case "--version":
        options.version = readRequiredValue(pending, ++index, "--version");
        break;
      case "--environment":
        options.environment = readRequiredValue(pending, ++index, "--environment");
        break;
      case "--no-git":
        options.includeGit = false;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function readRequiredValue(args, index, optionName) {
  const value = args[index];

  if (!value || value.startsWith("-")) {
    throw new Error(`${optionName} requires a value.`);
  }

  return value;
}

function readPackageJson(cwd) {
  const packagePath = resolve(cwd, "package.json");

  if (!existsSync(packagePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    throw new Error(`Could not parse ${packagePath}.`);
  }
}

function readGitValue(cwd, args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return undefined;
  }
}

function readGitInfo(cwd) {
  const commit = readGitValue(cwd, ["rev-parse", "HEAD"]);
  const shortCommit = readGitValue(cwd, ["rev-parse", "--short", "HEAD"]);
  const branch = readGitValue(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const status = readGitValue(cwd, ["status", "--porcelain"]);

  if (!commit && !shortCommit && !branch) {
    return undefined;
  }

  return {
    commit,
    shortCommit,
    branch,
    dirty: Boolean(status)
  };
}

function readEnvBuildId(env) {
  return (
    env.BUILD_ID ||
    env.VITE_BUILD_ID ||
    env.REACT_APP_BUILD_ID ||
    env.GITHUB_SHA ||
    env.VERCEL_GIT_COMMIT_SHA ||
    env.CF_PAGES_COMMIT_SHA ||
    env.COMMIT_SHA
  );
}

function createBuildId({ explicitBuildId, env, gitInfo, builtAt }) {
  if (explicitBuildId?.trim()) {
    return explicitBuildId.trim();
  }

  const envBuildId = readEnvBuildId(env);

  if (envBuildId?.trim()) {
    return envBuildId.trim();
  }

  const timestamp = builtAt.replace(/\D/g, "").slice(0, 14);

  if (gitInfo?.shortCommit) {
    return `${gitInfo.shortCommit}-${timestamp}`;
  }

  return `build-${timestamp}`;
}

function createBuildInfo(options, cwd = process.cwd(), env = process.env) {
  const packageJson = readPackageJson(cwd);
  const builtAt = new Date().toISOString();
  const git = options.includeGit ? readGitInfo(cwd) : undefined;
  const buildId = createBuildId({
    explicitBuildId: options.buildId,
    env,
    gitInfo: git,
    builtAt
  });

  if (!buildId.trim()) {
    throw new Error("Generated buildId is empty.");
  }

  const buildInfo = {
    buildId,
    version: options.version || packageJson.version || "0.0.0",
    builtAt,
    environment: options.environment || env.NODE_ENV || "production"
  };

  if (packageJson.name) {
    buildInfo.name = packageJson.name;
  }

  if (git) {
    buildInfo.git = git;
  }

  return buildInfo;
}

function writeBuildInfo(buildInfo, outPath, cwd = process.cwd()) {
  const absoluteOutPath = resolve(cwd, outPath);

  mkdirSync(dirname(absoluteOutPath), { recursive: true });
  writeFileSync(absoluteOutPath, `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");

  return absoluteOutPath;
}

function run(args = process.argv.slice(2), cwd = process.cwd(), env = process.env) {
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    return 0;
  }

  if (options.command !== "generate") {
    throw new Error(`Unknown command: ${options.command}`);
  }

  const buildInfo = createBuildInfo(options, cwd, env);
  const outPath = writeBuildInfo(buildInfo, options.out, cwd);

  console.log(`Created ${outPath}`);
  console.log(`buildId: ${buildInfo.buildId}`);

  return 0;
}

function isDirectCliInvocation(argvPath, currentFilePath) {
  if (!argvPath) {
    return false;
  }

  try {
    return realpathSync(argvPath) === currentFilePath;
  } catch {
    return resolve(argvPath) === currentFilePath;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);

if (isDirectCliInvocation(process.argv[1], currentFilePath)) {
  try {
    process.exitCode = run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

export {
  createBuildId,
  createBuildInfo,
  parseArgs,
  readGitInfo,
  run,
  writeBuildInfo,
  isDirectCliInvocation
};
