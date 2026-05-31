import { afterEach, describe, expect, it, vi } from "vitest";
import { createCacheSafeUrl, fetchBuildInfo } from "../utils/fetchBuildInfo";

function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init
  });
}

describe("createCacheSafeUrl", () => {
  it("adds a cache-busting timestamp to relative URLs", () => {
    expect(createCacheSafeUrl("/build-version.json", 123)).toBe(
      "/build-version.json?t=123"
    );
  });

  it("preserves existing query params", () => {
    expect(createCacheSafeUrl("/api/version?env=prod", 456)).toBe(
      "/api/version?env=prod&t=456"
    );
  });
});

describe("fetchBuildInfo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns build info", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ buildId: "abc123", version: "1.0.0" }));

    await expect(fetchBuildInfo("/build-version.json")).resolves.toEqual({
      buildId: "abc123",
      version: "1.0.0"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/build-version\.json\?t=\d+$/),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("throws for non-2xx responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ message: "missing" }, { status: 404, statusText: "Not Found" })
    );

    await expect(fetchBuildInfo("/missing.json")).rejects.toThrow(
      "Failed to fetch build information"
    );
  });

  it("throws for invalid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("not-json", { status: 200 })
    );

    await expect(fetchBuildInfo("/bad.json")).rejects.toThrow(
      "not valid JSON"
    );
  });

  it("throws when buildId is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ version: "1.0.0" }));

    await expect(fetchBuildInfo("/bad.json")).rejects.toThrow(
      "must include a non-empty buildId"
    );
  });
});
