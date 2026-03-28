/**
 * Marque / URL publique — surtout https://andro.sadak.app (base `/`) ou legacy sadaq.app/android.
 * Surcharges : `VITE_PRODUCT_ORIGIN`, `VITE_PRODUCT_LABEL`, `VITE_PRODUCT_HOST`.
 */
export const PRODUCT_HOST = import.meta.env.VITE_PRODUCT_HOST ?? "andro.sadak.app";

const pathFromBase = import.meta.env.BASE_URL.replace(/\/$/, "");
/** Chemin Vite + React Router (ex. `/android` ou vide si base `/`) */
export const DEPLOY_PATH = pathFromBase || "/";

/** URL canonique du bundle (Web, PWA, liens admin) */
export const PRODUCT_ORIGIN =
  import.meta.env.VITE_PRODUCT_ORIGIN ??
  (typeof window !== "undefined"
    ? `${window.location.origin}${pathFromBase}`
    : `https://${PRODUCT_HOST}${pathFromBase}`);

/** Libellé affiché (UI, meta) */
export const PRODUCT_LABEL = import.meta.env.VITE_PRODUCT_LABEL ?? "andro.sadak.app";
/** Préfixe stockage local (identifiants sans / ni .) */
export const STORAGE_PREFIX = "sadaq_app_android";

/** Association par défaut à la racine du bundle (redirection `/`) */
export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG || "iqraa";
