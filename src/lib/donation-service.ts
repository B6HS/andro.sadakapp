/**
 * Enregistrement des dons (sadaq.app/android) — Supabase en ligne, file IndexedDB hors-ligne.
 */
import { supabase } from "@/integrations/supabase/client";
import { queueDonation } from "./offline-storage";
import { getActiveBorneId } from "./borne-runtime";

interface DonationRecord {
  amount: number;
  cause: string;
  reference: string;
  type?: string;
  status?: string;
  auth_code?: string;
  terminal_id?: string;
}

export async function recordDonation(donation: DonationRecord): Promise<{ queued: boolean }> {
  const borneId = getActiveBorneId();
  const record = {
    id: donation.reference + "-" + Date.now(),
    amount: donation.amount,
    cause: donation.cause,
    reference: donation.reference,
    type: donation.type || "Don.Ponctuel",
    status: donation.status || "approved",
    auth_code: donation.auth_code,
    terminal_id: donation.terminal_id,
    borne_id: borneId ?? undefined,
    created_at: new Date().toISOString(),
  };

  if (navigator.onLine) {
    try {
      const { error } = await supabase.from("donations").insert({
        amount: record.amount,
        cause: record.cause,
        reference: record.reference,
        type: record.type,
        status: record.status,
        auth_code: record.auth_code || null,
        terminal_id: record.terminal_id || null,
        borne_id: borneId ?? null,
      });

      if (error) {
        console.warn("[DonationService] Supabase insert failed, queuing offline:", error);
        await queueDonation(record);
        return { queued: true };
      }
      return { queued: false };
    } catch (e) {
      console.warn("[DonationService] Network error, queuing offline:", e);
      await queueDonation(record);
      return { queued: true };
    }
  } else {
    console.log("[DonationService] Offline — queuing donation:", record.reference);
    await queueDonation(record);
    return { queued: true };
  }
}
