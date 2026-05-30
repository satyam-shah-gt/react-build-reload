const CHUNK_ERROR_PATTERNS = [
  /loading chunk \d* failed/i,
  /chunkloaderror/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /unable to preload css/i
];

const CHUNK_RELOAD_KEY = "react-build-reload:chunk-error-reloaded";

function getErrorText(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as { message?: unknown; reason?: unknown; type?: unknown };
    return [maybeError.message, maybeError.reason, maybeError.type]
      .filter(Boolean)
      .map(String)
      .join(" ");
  }

  return "";
}

export function isChunkLoadError(error: unknown): boolean {
  const text = getErrorText(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

export function clearChunkReloadMarker(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
}

export function installChunkErrorReload(
  reloadApp: () => void,
  onError?: (error: Error) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const reloadOnce = (error: unknown) => {
    if (!isChunkLoadError(error)) {
      return;
    }

    const normalizedError =
      error instanceof Error
        ? error
        : new Error(getErrorText(error) || "Chunk loading failed.");

    onError?.(normalizedError);

    // Chunk failures often repeat during route retries; sessionStorage prevents a reload loop.
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "true") {
      return;
    }

    sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
    reloadApp();
  };

  const handleError = (event: ErrorEvent) => {
    reloadOnce(event.error ?? event.message);
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    reloadOnce(event.reason);
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
