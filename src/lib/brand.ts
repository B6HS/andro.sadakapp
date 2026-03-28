/**
 * Déploiement public : https://sadaq.app/android (chemin sur le domaine sadaq.app)
 */
export const PRODUCT_HOST = "sadaq.app";
/** Chemin Vite + React Router (sans slash final) */
export const DEPLOY_PATH = "/android";
/** URL canonique du bundle (Web, PWA, liens docs) */
export const PRODUCT_ORIGIN = `https://${PRODUCT_HOST}${DEPLOY_PATH}`;
/** Libellé affiché (UI, meta, APK) */
export const PRODUCT_LABEL = "sadaq.app/android";
/** Préfixe stockage local (identifiants sans / ni .) */
export const STORAGE_PREFIX = "sadaq_app_android";

/** Association par défaut si l’URL est /android/ (redirection racine) */
export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG || "iqraa";
