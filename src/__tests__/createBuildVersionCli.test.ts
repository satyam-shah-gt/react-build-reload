import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const cliPath = join(process.cwd(), "bin", "react-build-reload.js");
const tempDirs: string[] = [];

function createTempProject() {
  const cwd = mkdtempSync(join(tmpdir(), "react-build-reload-"));
  tempDirs.push(cwd);

  writeFileSync(
    join(cwd, "package.json"),
    JSON.stringify({ name: "test-app", version: "1.2.3" }),
    "utf8"
  );

  return cwd;
}

describe("build-version generator CLI", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("generates public/build-version.json with app metadata", () => {
    const cwd = createTempProject();

    execFileSync(
      process.execPath,
      [cliPath, "generate", "--build-id", "local-123", "--environment", "test", "--no-git"],
      { cwd }
    );

    const data = JSON.parse(
      readFileSync(join(cwd, "public", "build-version.json"), "utf8")
    );

    expect(data).toEqual(
      expect.objectContaining({
        buildId: "local-123",
        name: "test-app",
        version: "1.2.3",
        environment: "test"
      })
    );
    expect(data.builtAt).toEqual(expect.any(String));
  });

  it("supports a custom output path and version override", () => {
    const cwd = createTempProject();

    execFileSync(
      process.execPath,
      [
        cliPath,
        "generate",
        "--out",
        "static/version.json",
        "--build-id",
        "custom-456",
        "--version",
        "2.0.0",
        "--no-git"
      ],
      { cwd }
    );

    const data = JSON.parse(readFileSync(join(cwd, "static", "version.json"), "utf8"));

    expect(data.buildId).toBe("custom-456");
    expect(data.version).toBe("2.0.0");
  });

  it("runs when invoked through an npm-style symlink", () => {
    const cwd = createTempProject();
    const binDir = join(cwd, "node_modules", ".bin");
    const linkPath = join(binDir, "react-build-reload");

    mkdirSync(binDir, { recursive: true });
    symlinkSync(cliPath, linkPath);

    execFileSync(
      process.execPath,
      [linkPath, "generate", "--build-id", "symlink-789", "--no-git"],
      { cwd }
    );

    const data = JSON.parse(
      readFileSync(join(cwd, "public", "build-version.json"), "utf8")
    );

    expect(data.buildId).toBe("symlink-789");
  });
});
