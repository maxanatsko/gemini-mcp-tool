#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const packageLockPath = path.join(repoRoot, "package-lock.json");
const srcIndexPath = path.join(repoRoot, "src", "index.ts");

const target = process.argv[2];

if (!target) {
  console.error("Usage: npm run bump-version -- <version|major|minor|patch|premajor|preminor|prepatch|prerelease>");
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

run("npm", ["version", "--allow-same-version", "--no-git-tag-version", target]);

const packageJson = readJson(packageJsonPath);
const srcIndex = fs.readFileSync(srcIndexPath, "utf8");
const currentVersionPattern = /version:\s*"[^"]+"/;

if (!currentVersionPattern.test(srcIndex)) {
  console.error(`Could not find server version in ${srcIndexPath}`);
  process.exit(1);
}

fs.writeFileSync(
  srcIndexPath,
  srcIndex.replace(currentVersionPattern, `version: "${packageJson.version}"`),
);

run("npm", ["install", "--package-lock-only"]);

const packageLock = readJson(packageLockPath);
const rootPackage = packageLock.packages?.[""];

if (packageLock.name !== packageJson.name || rootPackage?.name !== packageJson.name) {
  console.error("package-lock.json root package name does not match package.json");
  process.exit(1);
}

if (packageLock.version !== packageJson.version || rootPackage?.version !== packageJson.version) {
  console.error("package-lock.json root package version does not match package.json");
  process.exit(1);
}

const expectedBins = packageJson.bin ?? {};
const actualBins = rootPackage?.bin ?? {};
const expectedBinKeys = Object.keys(expectedBins).sort();
const actualBinKeys = Object.keys(actualBins).sort();

if (expectedBinKeys.length !== actualBinKeys.length || expectedBinKeys.some((key, index) => key !== actualBinKeys[index] || expectedBins[key] !== actualBins[key])) {
  console.error("package-lock.json root bin entries do not match package.json");
  process.exit(1);
}

run("npm", ["run", "build"]);

console.log(`Version bumped to ${packageJson.version}`);
