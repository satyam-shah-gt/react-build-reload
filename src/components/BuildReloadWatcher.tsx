import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { BuildReloadWatcherProps } from "../types";
import { installChunkErrorReload } from "../utils/chunkErrors";
import { useBuildReload } from "../hooks/useBuildReload";

const bannerBaseStyle: CSSProperties = {
  position: "fixed",
  left: "16px",
  right: "16px",
  zIndex: 2147483647,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "8px",
  background: "#111827",
  color: "#ffffff",
  boxShadow: "0 12px 28px rgba(17, 24, 39, 0.24)",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: "14px",
  lineHeight: 1.4
};

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: "6px",
  padding: "7px 10px",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 600
};

const refreshButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#111827"
};

const dismissButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#d1d5db"
};

export function BuildReloadWatcher({
  promptMessage = "A new version is available. Refresh to update.",
  refreshButtonLabel = "Refresh",
  dismissButtonLabel = "Dismiss",
  promptPosition = "bottom",
  showDismissButton = true,
  reloadOnChunkError = true,
  ...options
}: BuildReloadWatcherProps) {
  const {
    isNewBuildAvailable,
    reloadApp,
    dismissPrompt
  } = useBuildReload(options);

  useEffect(() => {
    if (!reloadOnChunkError) {
      return;
    }

    return installChunkErrorReload(reloadApp, options.onError);
  }, [reloadApp, reloadOnChunkError, options.onError]);

  if (options.reloadMode === "manual" || !isNewBuildAvailable) {
    return null;
  }

  const positionStyle: CSSProperties =
    promptPosition === "top" ? { top: "16px" } : { bottom: "16px" };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ ...bannerBaseStyle, ...positionStyle }}
    >
      <span>{promptMessage}</span>
      <div style={actionsStyle}>
        {showDismissButton ? (
          <button
            type="button"
            style={dismissButtonStyle}
            onClick={dismissPrompt}
          >
            {dismissButtonLabel}
          </button>
        ) : null}
        <button type="button" style={refreshButtonStyle} onClick={reloadApp}>
          {refreshButtonLabel}
        </button>
      </div>
    </div>
  );
}
