/** Contexte borne pour les dons (fichiers JS non-React) */
let activeBorneId: string | null = null;

export function setActiveBorneId(id: string | null): void {
  activeBorneId = id;
}

export function getActiveBorneId(): string | null {
  return activeBorneId;
}
