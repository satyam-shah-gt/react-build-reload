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
