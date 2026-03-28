/**
 * URL publique du bundle (respecte `base` Vite, ex. /android).
 */
export function getPublicAppUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (typeof window === "undefined") return `${base}${p}`;
  return `${window.location.origin}${base}${p}`;
}

export function getAutoInstallUrl(): string {
  return getPublicAppUrl("/auto-install");
}
