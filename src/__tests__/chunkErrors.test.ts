import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearChunkReloadMarker,
  installChunkErrorReload,
  isChunkLoadError
} from "../utils/chunkErrors";

describe("chunk error utilities", () => {
  afterEach(() => {
    clearChunkReloadMarker();
    vi.restoreAllMocks();
  });

  it("detects common chunk loading errors", () => {
    expect(isChunkLoadError(new Error("Loading chunk 12 failed."))).toBe(true);
    expect(
      isChunkLoadError(new Error("Failed to fetch dynamically imported module"))
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isChunkLoadError(new Error("Validation failed"))).toBe(false);
  });

  it("reloads once for chunk errors", () => {
    const reloadApp = vi.fn();
    const cleanup = installChunkErrorReload(reloadApp);

    window.dispatchEvent(
      new ErrorEvent("error", {
        error: new Error("Loading chunk 4 failed.")
      })
    );
    window.dispatchEvent(
      new ErrorEvent("error", {
        error: new Error("Loading chunk 4 failed.")
      })
    );

    expect(reloadApp).toHaveBeenCalledTimes(1);
    cleanup();
  });
});
