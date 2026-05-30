export function hasBuildChanged(
  currentBuildId: string | null | undefined,
  latestBuildId: string | null | undefined
): boolean {
  if (!currentBuildId || !latestBuildId) {
    return false;
  }

  return currentBuildId !== latestBuildId;
}
