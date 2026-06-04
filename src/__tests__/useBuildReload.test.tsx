import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BuildReloadWatcher } from "../components/BuildReloadWatcher";
import { useBuildReload } from "../hooks/useBuildReload";
import { reloadPage } from "../utils/reloadPage";
import type { UseBuildReloadOptions, UseBuildReloadResult } from "../types";

vi.mock("../utils/reloadPage", () => ({
  reloadPage: vi.fn()
}));

function jsonResponse(buildId: string): Response {
  return new Response(JSON.stringify({ buildId }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

function HookHarness({
  options,
  onState
}: {
  options?: UseBuildReloadOptions;
  onState: (state: UseBuildReloadResult) => void;
}) {
  const state = useBuildReload(options);

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return null;
}

describe("useBuildReload", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("captures the first fetched build ID when currentBuildId is not provided", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const onState = vi.fn();

    render(<HookHarness onState={onState} options={{ checkInterval: 5_000 }} />);

    await waitFor(() => {
      expect(onState).toHaveBeenLastCalledWith(
        expect.objectContaining({ currentBuildId: "abc123" })
      );
    });
  });

  it("does not notify when the build ID is unchanged", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));
    const onNewBuild = vi.fn();

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", onNewBuild, checkInterval: 5_000 }}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(onNewBuild).not.toHaveBeenCalled();
  });

  it("detects a new build once", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse("abc123"))
      .mockResolvedValue(jsonResponse("xyz789"));
    const onNewBuild = vi.fn();
    const onState = vi.fn();
    let latestState: UseBuildReloadResult | null = null;

    render(
      <HookHarness
        onState={(state) => {
          latestState = state;
          onState(state);
        }}
        options={{ onNewBuild, checkInterval: 5_000 }}
      />
    );

    await waitFor(() => {
        expect(onState).toHaveBeenLastCalledWith(
          expect.objectContaining({ currentBuildId: "abc123" })
        );
      });

    await act(async () => {
      await latestState?.checkNow();
      await latestState?.checkNow();
    });

    expect(onNewBuild).toHaveBeenCalledTimes(1);
    expect(onNewBuild).toHaveBeenCalledWith(
      expect.objectContaining({
        currentBuildId: "abc123",
        latestBuildId: "xyz789"
      })
    );
  });

  it("reloads automatically after the configured delay", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("xyz789"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          reloadMode: "auto",
          reloadDelay: 2_000
        }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(reloadPage).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it("calls manual mode callbacks without rendering the default prompt", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("xyz789"));
    const onNewBuild = vi.fn();

    render(
      <BuildReloadWatcher
        currentBuildId="abc123"
        reloadMode="manual"
        onNewBuild={onNewBuild}
      />
    );

    await waitFor(() => {
      expect(onNewBuild).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText(/new version/i)).not.toBeInTheDocument();
  });
});

describe("BuildReloadWatcher", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows and dismisses the prompt in prompt mode", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("xyz789"));

    render(<BuildReloadWatcher currentBuildId="abc123" reloadMode="prompt" />);

    expect(
      await screen.findByText("A new version is available. Refresh to update.")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText(/new version/i)).not.toBeInTheDocument();
  });

  it("removes chunk error listeners on unmount", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const removeListener = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<BuildReloadWatcher reloadOnChunkError />);
    unmount();

    expect(removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function)
    );
  });
});

describe("useBuildReload checkOnWindowFocus", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("re-checks when the document becomes visible by default", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible"
      });
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("re-checks when the window regains focus", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not re-check when the document becomes hidden", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden"
      });
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips installing focus and visibility listeners when checkOnWindowFocus is false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const documentAddSpy = vi.spyOn(document, "addEventListener");
    const windowAddSpy = vi.spyOn(window, "addEventListener");

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          checkInterval: 60_000,
          checkOnWindowFocus: false
        }}
      />
    );

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    const visibilityCalls = documentAddSpy.mock.calls.filter(
      ([type]) => type === "visibilitychange"
    );
    const focusCalls = windowAddSpy.mock.calls.filter(
      ([type]) => type === "focus"
    );

    expect(visibilityCalls).toHaveLength(0);
    expect(focusCalls).toHaveLength(0);
  });

  it("skips installing focus and visibility listeners when enabled is false", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));
    const documentAddSpy = vi.spyOn(document, "addEventListener");
    const windowAddSpy = vi.spyOn(window, "addEventListener");

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          checkInterval: 60_000,
          enabled: false
        }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(documentAddSpy).not.toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    expect(windowAddSpy).not.toHaveBeenCalledWith(
      "focus",
      expect.any(Function)
    );
  });

  it("removes focus and visibility listeners on unmount", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const documentRemoveSpy = vi.spyOn(document, "removeEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    unmount();

    expect(documentRemoveSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    expect(windowRemoveSpy).toHaveBeenCalledWith(
      "focus",
      expect.any(Function)
    );
  });
});

describe("useBuildReload pauseWhenOffline", () => {
  const setNavigatorOnline = (value: boolean) => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => value
    });
  };

  beforeEach(() => {
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(true);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("skips version checks when the browser reports offline by default", async () => {
    setNavigatorOnline(false);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not skip version checks when pauseWhenOffline is false", async () => {
    setNavigatorOnline(false);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          checkInterval: 60_000,
          pauseWhenOffline: false
        }}
      />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("re-checks when the browser reports it is back online", async () => {
    setNavigatorOnline(false);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));

    render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();

    setNavigatorOnline(true);
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips installing the online listener when pauseWhenOffline is false", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const windowAddSpy = vi.spyOn(window, "addEventListener");

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          checkInterval: 60_000,
          pauseWhenOffline: false
        }}
      />
    );

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    const onlineCalls = windowAddSpy.mock.calls.filter(
      ([type]) => type === "online"
    );

    expect(onlineCalls).toHaveLength(0);
  });

  it("skips installing the online listener when enabled is false", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse("abc123"));
    const windowAddSpy = vi.spyOn(window, "addEventListener");

    render(
      <HookHarness
        onState={vi.fn()}
        options={{
          currentBuildId: "abc123",
          checkInterval: 60_000,
          enabled: false
        }}
      />
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(windowAddSpy).not.toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
  });

  it("removes the online listener on unmount", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse("abc123"));
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <HookHarness
        onState={vi.fn()}
        options={{ currentBuildId: "abc123", checkInterval: 60_000 }}
      />
    );

    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
    });

    unmount();

    expect(windowRemoveSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function)
    );
  });
});
