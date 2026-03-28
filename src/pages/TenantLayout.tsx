import { useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TenantProvider, type TenantRow } from "@/contexts/TenantContext";
import { setActiveBorneId } from "@/lib/borne-runtime";

/**
 * Charge l’association par slug URL (ex. iqraa, centresocial) et résout la borne par défaut.
 */
export default function TenantLayout() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const [tenant, setTenant] = useState<TenantRow | null>(null);
  const [effectiveBorneId, setEffectiveBorneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data: t, error: e1 } = await supabase
        .from("tenants")
        .select("id, slug, name, status, default_borne_id")
        .eq("slug", tenantSlug)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      if (e1 || !t) {
        setTenant(null);
        setEffectiveBorneId(null);
        setError("Association introuvable ou inactive");
        setLoading(false);
        return;
      }

      setTenant(t as TenantRow);

      let borneId = t.default_borne_id as string | null;
      if (!borneId) {
        const { data: b } = await supabase
          .from("bornes")
          .select("id")
          .eq("tenant_id", t.id)
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        borneId = b?.id ?? null;
      }

      if (cancelled) return;
      setEffectiveBorneId(borneId);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  useEffect(() => {
    setActiveBorneId(effectiveBorneId);
    return () => setActiveBorneId(null);
  }, [effectiveBorneId]);

  const value = useMemo(
    (): import("@/contexts/TenantContext").TenantContextValue => ({
      tenant,
      tenantSlug,
      effectiveBorneId,
      loading,
      error,
    }),
    [tenant, tenantSlug, effectiveBorneId, loading, error]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#94a3b8",
          fontFamily: "system-ui",
        }}
      >
        Chargement…
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#f87171",
          fontFamily: "system-ui",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ fontSize: 18, marginBottom: 8 }}>{error}</p>
          <p style={{ fontSize: 14, color: "#64748b" }}>Vérifiez l’URL (ex. /android/iqraa/borne)</p>
        </div>
      </div>
    );
  }

  if (tenant && !effectiveBorneId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fbbf24",
          fontFamily: "system-ui",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ fontSize: 18 }}>Aucune borne active pour « {tenant.name} »</p>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>
            Créez une borne rattachée à cette association dans le portail super-admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantProvider value={value}>
      <Outlet />
    </TenantProvider>
  );
}
