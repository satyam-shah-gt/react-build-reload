import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_VERSION_URL,
  fetchBuildInfo
} from "../utils/fetchBuildInfo";
import { hasBuildChanged } from "../utils/compareBuildId";
import { reloadPage } from "../utils/reloadPage";
import type {
  BuildInfo,
  NewBuildPayload,
  ReloadMode,
  UseBuildReloadOptions,
  UseBuildReloadResult
} from "../types";

const DEFAULT_CHECK_INTERVAL = 60_000;
const DEFAULT_RELOAD_MODE: ReloadMode = "prompt";
const DEFAULT_RELOAD_DELAY = 0;
const DEFAULT_CHECK_ON_WINDOW_FOCUS = true;
const DEFAULT_PAUSE_WHEN_OFFLINE = true;

export function useBuildReload(
  options: UseBuildReloadOptions = {}
): UseBuildReloadResult {
  const {
    versionUrl = DEFAULT_VERSION_URL,
    currentBuildId,
    checkInterval = DEFAULT_CHECK_INTERVAL,
    reloadMode = DEFAULT_RELOAD_MODE,
    reloadDelay = DEFAULT_RELOAD_DELAY,
    enabled = true,
    checkOnWindowFocus = DEFAULT_CHECK_ON_WINDOW_FOCUS,
    pauseWhenOffline = DEFAULT_PAUSE_WHEN_OFFLINE,
    onNewBuild,
    onError
  } = options;

  const [resolvedCurrentBuildId, setResolvedCurrentBuildId] = useState<string | null>(
    currentBuildId ?? null
  );
  const [latestBuildInfo, setLatestBuildInfo] = useState<BuildInfo | null>(null);
  const [isNewBuildAvailable, setIsNewBuildAvailable] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const currentBuildIdRef = useRef<string | null>(currentBuildId ?? null);
  const notifiedLatestBuildIdRef = useRef<string | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onNewBuildRef = useRef(onNewBuild);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onNewBuildRef.current = onNewBuild;
  }, [onNewBuild]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (currentBuildId === undefined) {
      return;
    }

    currentBuildIdRef.current = currentBuildId;
    setResolvedCurrentBuildId(currentBuildId);
  }, [currentBuildId]);

  const reloadApp = useCallback(() => {
    reloadPage();
  }, []);

  const handleNewBuild = useCallback(
    (payload: NewBuildPayload) => {
      if (notifiedLatestBuildIdRef.current === payload.latestBuildId) {
        return;
      }

      // Remember the latest notified build so polling cannot trigger duplicate reloads.
      notifiedLatestBuildIdRef.current = payload.latestBuildId;
      setIsNewBuildAvailable(true);
      onNewBuildRef.current?.(payload);

      if (reloadMode === "auto") {
        reloadTimerRef.current = setTimeout(reloadApp, Math.max(0, reloadDelay));
      }
    },
    [reloadApp, reloadDelay, reloadMode]
  );

  const checkNow = useCallback(async () => {
    if (!enabled) {
      return;
    }

    // Skip the request entirely while the browser reports offline so polling
    // does not log noise or burn through fetch attempts during outages.
    if (
      pauseWhenOffline &&
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      return;
    }

    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const buildInfo = await fetchBuildInfo(versionUrl, abortController.signal);
      setLatestBuildInfo(buildInfo);
      setError(null);

      const activeCurrentBuildId = currentBuildIdRef.current;

      if (!activeCurrentBuildId) {
        currentBuildIdRef.current = buildInfo.buildId;
        setResolvedCurrentBuildId(buildInfo.buildId);
        return;
      }

      if (hasBuildChanged(activeCurrentBuildId, buildInfo.buildId)) {
        handleNewBuild({
          currentBuildId: activeCurrentBuildId,
          latestBuildId: buildInfo.buildId,
          latestBuildInfo: buildInfo
        });
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
        return;
      }

      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error("Build reload check failed.");

      setError(normalizedError);
      onErrorRef.current?.(normalizedError);
    }
  }, [enabled, handleNewBuild, pauseWhenOffline, versionUrl]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void checkNow();

    const intervalId = window.setInterval(() => {
      void checkNow();
    }, Math.max(1_000, checkInterval));

    return () => {
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();

      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, [checkInterval, checkNow, enabled]);

  useEffect(() => {
    if (!enabled || !checkOnWindowFocus) {
      return;
    }

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Re-check as soon as the user returns to the tab so long-running sessions
    // detect a new deployment without waiting for the next interval tick.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkNow();
      }
    };

    const handleFocus = () => {
      void checkNow();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkNow, checkOnWindowFocus, enabled]);

  useEffect(() => {
    if (!enabled || !pauseWhenOffline) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    // As soon as the browser regains connectivity, run a one-shot check so a
    // build deployed while the user was offline is picked up without waiting
    // for the next interval tick. The interval itself keeps running; the
    // offline guard inside `checkNow` handles the rest.
    const handleOnline = () => {
      void checkNow();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [checkNow, enabled, pauseWhenOffline]);

  const dismissPrompt = useCallback(() => {
    setIsNewBuildAvailable(false);
  }, []);

  return {
    isNewBuildAvailable,
    currentBuildId: resolvedCurrentBuildId,
    latestBuildId: latestBuildInfo?.buildId ?? null,
    latestBuildInfo,
    error,
    reloadApp,
    checkNow,
    dismissPrompt
  };
}
