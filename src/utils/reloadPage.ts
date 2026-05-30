export function reloadPage(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.location.reload();
}
