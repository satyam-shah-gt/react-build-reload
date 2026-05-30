import { BuildReloadError, type BuildInfo } from "../types";

export const DEFAULT_VERSION_URL = "/build-version.json";
export const CACHE_BUST_PARAM = "t";

export function createCacheSafeUrl(versionUrl: string, now = Date.now()): string {
  const isAbsoluteUrl = /^[a-z][a-z\d+\-.]*:/i.test(versionUrl);
  const baseUrl =
    typeof window === "undefined" ? "http://localhost" : window.location.href;
  const url = new URL(versionUrl, baseUrl);

  url.searchParams.set(CACHE_BUST_PARAM, String(now));

  if (!isAbsoluteUrl) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return url.toString();
}

function isBuildInfo(value: unknown): value is BuildInfo {
  return (
    typeof value === "object" &&
    value !== null &&
    "buildId" in value &&
    typeof (value as { buildId?: unknown }).buildId === "string" &&
    (value as { buildId: string }).buildId.trim().length > 0
  );
}

export async function fetchBuildInfo(
  versionUrl = DEFAULT_VERSION_URL,
  signal?: AbortSignal
): Promise<BuildInfo> {
  let response: Response;

  try {
    response = await fetch(createCacheSafeUrl(versionUrl), {
      cache: "no-store",
      signal
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new BuildReloadError("Failed to fetch build information.");
  }

  if (!response.ok) {
    throw new BuildReloadError(
      `Failed to fetch build information: ${response.status} ${response.statusText}`.trim()
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new BuildReloadError("Build information response is not valid JSON.");
  }

  if (!isBuildInfo(data)) {
    throw new BuildReloadError("Build information must include a non-empty buildId.");
  }

  return data;
}
