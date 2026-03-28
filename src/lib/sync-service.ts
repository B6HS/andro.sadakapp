/**
 * Sync : envoi de la file des dons hors-ligne vers Supabase (sadaq.app/android)
 */
import { supabase } from "@/integrations/supabase/client";
import { getPendingDonations, markDonationSynced } from "./offline-storage";
import { PRODUCT_LABEL, STORAGE_PREFIX } from "./brand";

const EOD_STORAGE_KEY = `${STORAGE_PREFIX}_last_eod_sync_day`;

const syncListeners = new Set<(n: number) => void>();

function notifySyncListeners(): void {
  void getPendingDonations().then((p) => {
    syncListeners.forEach((cb) => cb(p.length));
  });
}

export function onSyncUpdate(cb: (pending: number) => void): () => void {
  syncListeners.add(cb);
  void getPendingDonations().then((p) => cb(p.length));
  return () => syncListeners.delete(cb);
}

export async function getPendingOfflineCount(): Promise<number> {
  const pending = await getPendingDonations();
  return pending.length;
}

export async function syncPendingDonations(): Promise<void> {
  if (!navigator.onLine) return;
  const pending = await getPendingDonations();
  if (pending.length === 0) return;

  let synced = 0;
  let failed = 0;
  console.log(`[${PRODUCT_LABEL} Sync] ${pending.length} don(s) en attente…`);

  for (const donation of pending) {
    if (!donation.borne_id) {
      console.warn(`[${PRODUCT_LABEL} Sync] Don sans borne_id, ignoré : ${donation.id}`);
      failed++;
      continue;
    }
    try {
      const { error } = await supabase.from("donations").insert({
        amount: donation.amount,
        cause: donation.cause,
        reference: donation.reference,
        type: donation.type,
        status: donation.status,
        auth_code: donation.auth_code ?? null,
        terminal_id: donation.terminal_id ?? null,
        borne_id: donation.borne_id ?? null,
        created_at: donation.created_at,
      });
      if (error) {
        console.error(`[${PRODUCT_LABEL} Sync] Échec ${donation.id}:`, error);
        failed++;
      } else {
        await markDonationSynced(donation.id);
        synced++;
        console.log(`[${PRODUCT_LABEL} Sync] OK ${donation.reference}`);
      }
    } catch (e) {
      console.error(`[${PRODUCT_LABEL} Sync] Erreur ${donation.id}:`, e);
      failed++;
    }
  }
  console.log(`[${PRODUCT_LABEL} Sync] Terminé : ${synced} ok, ${failed} échecs`);
  notifySyncListeners();
}

export function startAutoSync(): void {
  const run = () => void syncPendingDonations();

  window.addEventListener("online", () => {
    console.log(`[${PRODUCT_LABEL} Sync] Retour en ligne — synchronisation…`);
    run();
  });

  setInterval(() => {
    if (navigator.onLine) run();
  }, 60_000);

  const maybeEod = (): void => {
    const today = new Date().toDateString();
    const last = localStorage.getItem(EOD_STORAGE_KEY);
    if (last === today) return;
    if (!navigator.onLine) return;
    void syncPendingDonations().then(() => {
      localStorage.setItem(EOD_STORAGE_KEY, today);
    });
  };
  maybeEod();
  setInterval(maybeEod, 3_600_000);
}
