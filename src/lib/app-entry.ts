/**
 * Entrées sadaq.app/android (sous-chemin sur sadaq.app) :
 * - **Web complet** : connexion, admin, auto-install, tutoriels → racine et chemins habituels.
 * - **Borne / APK / PWA kiosque** → {@link BORNE_ENTRY_PATH}.
 */
export const BORNE_ENTRY_PATH = "/borne";

export function borneEntryWithSearch(search: string): string {
  const q = search.startsWith("?") ? search : search ? `?${search}` : "";
  return `${BORNE_ENTRY_PATH}${q}`;
}
