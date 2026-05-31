import { describe, expect, it } from "vitest";
import { hasBuildChanged } from "../utils/compareBuildId";

describe("hasBuildChanged", () => {
  it("returns false when either build ID is missing", () => {
    expect(hasBuildChanged(null, "next")).toBe(false);
    expect(hasBuildChanged("current", undefined)).toBe(false);
  });

  it("returns false for the same build ID", () => {
    expect(hasBuildChanged("abc123", "abc123")).toBe(false);
  });

  it("returns true for different build IDs", () => {
    expect(hasBuildChanged("abc123", "xyz789")).toBe(true);
  });
});
