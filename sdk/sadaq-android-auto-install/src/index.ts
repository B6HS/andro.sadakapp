export type OpenAutoInstallOptions = {
  /** Origine seule (ex. https://sadaq.app). En navigateur, défaut : location.origin */
  baseUrl?: string;
  /**
   * Préfixe du déploiement Vite (React basename), ex. `/android`.
   * Défaut : `""` pour https://andro.sadak.app (base `/`) ; utiliser `/android` pour l’ancien chemin sur sadaq.app.
   */
  appBasePath?: string;
  /** Chemin du flux (défaut : /auto-install) */
  path?: string;
  /** `_self` : navigation courante (défaut). `_blank` : nouvel onglet */
  target?: "_self" | "_blank";
};

function normalizeBase(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizePath(path: string): string {
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

/**
 * Construit l’URL du flux auto-install (sans effet de bord).
 */
export function buildAutoInstallUrl(options: OpenAutoInstallOptions = {}): string {
  const path = normalizePath(options.path ?? "/auto-install");
  const raw = options.appBasePath ?? "";
  const appBase = raw === "" ? "" : normalizePath(raw);
  const base = options.baseUrl != null ? normalizeBase(options.baseUrl) : "";
  return `${base}${appBase}${path}`;
}

/**
 * Ouvre le flux **auto-install** sur l’origine du déploiement (ex. https://sadaq.app/android).
 * À utiliser depuis un site vitrine ou un outil interne pour envoyer l’équipe terrain vers la bonne page.
 */
export function openAutoInstall(options: OpenAutoInstallOptions = {}): string {
  const origin =
    options.baseUrl ??
    (typeof globalThis !== "undefined" && "location" in globalThis && globalThis.location
      ? String((globalThis as unknown as { location: { origin: string } }).location.origin)
      : "");
  const url = buildAutoInstallUrl({ ...options, baseUrl: origin });
  if (typeof globalThis === "undefined" || !("window" in globalThis)) {
    return url;
  }
  const w = globalThis as unknown as Window;
  if (options.target === "_blank") {
    w.open(url, "_blank", "noopener,noreferrer");
  } else {
    w.location.assign(url);
  }
  return url;
}
