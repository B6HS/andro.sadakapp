/**
 * Causes par borne — RPC get_causes_for_borne (multi-tenant)
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheCauses, getCachedCauses } from "./offline-storage";
import { useTenantOptional } from "@/contexts/TenantContext";

const FALLBACK_CAUSES = [
  { id: "1", name: "Charges courantes", icon: "", raised: 0, goal: 8000, active: true },
  { id: "2", name: "Don régulier", icon: "", raised: 0, goal: 5000, active: true },
];

export function useCauses() {
  const tenant = useTenantOptional();
  const borneId = tenant?.effectiveBorneId ?? null;

  const [causes, setCauses] = useState(FALLBACK_CAUSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!borneId) {
        if (mounted) setLoading(false);
        return;
      }

      if (navigator.onLine) {
        try {
          const { data, error } = await supabase.rpc("get_causes_for_borne", {
            _borne_id: borneId,
          });

          if (!error && data && data.length > 0 && mounted) {
            const mapped = data.map((c: Record<string, unknown>) => ({
              id: String(c.id),
              name: String(c.name),
              icon: String(c.icon ?? ""),
              raised: Number(c.raised ?? 0),
              goal: Number(c.goal ?? 0),
              active: Boolean(c.active),
            }));
            setCauses(mapped);
            await cacheCauses(mapped);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("[useCauses] RPC failed:", e);
        }
      }

      try {
        const cached = await getCachedCauses();
        if (cached && cached.length > 0 && mounted) {
          setCauses(cached);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("[useCauses] cache failed:", e);
      }

      if (mounted) {
        setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [borneId]);

  return { causes, loading };
}
