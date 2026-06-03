import type { ReactNode } from "react";

export type ReloadMode = "prompt" | "auto" | "manual";

export type PromptPosition = "top" | "bottom";

export interface BuildInfo {
  buildId: string;
  version?: string;
  builtAt?: string;
  environment?: string;
  [key: string]: unknown;
}

export interface NewBuildPayload {
  currentBuildId: string;
  latestBuildId: string;
  latestBuildInfo: BuildInfo;
}

export interface BuildReloadConfig {
  versionUrl?: string;
  currentBuildId?: string;
  checkInterval?: number;
  reloadMode?: ReloadMode;
  reloadDelay?: number;
  enabled?: boolean;
  reloadOnChunkError?: boolean;
  checkOnWindowFocus?: boolean;
  onNewBuild?: (payload: NewBuildPayload) => void;
  onError?: (error: Error) => void;
}

export interface UseBuildReloadOptions extends BuildReloadConfig {}

export interface UseBuildReloadResult {
  isNewBuildAvailable: boolean;
  currentBuildId: string | null;
  latestBuildId: string | null;
  latestBuildInfo: BuildInfo | null;
  error: Error | null;
  reloadApp: () => void;
  checkNow: () => Promise<void>;
  dismissPrompt: () => void;
}

export interface BuildReloadWatcherProps extends BuildReloadConfig {
  promptMessage?: ReactNode;
  refreshButtonLabel?: string;
  dismissButtonLabel?: string;
  promptPosition?: PromptPosition;
  showDismissButton?: boolean;
}

export class BuildReloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuildReloadError";
  }
}
