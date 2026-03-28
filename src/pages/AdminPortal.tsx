import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_ORIGIN } from "@/lib/brand";

interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface Borne {
  id: string;
  name: string;
  client_name: string;
  location: string;
  plan: string;
  status: string;
  apps_installed: string[];
  terminal_id: string | null;
  notes: string;
  created_at: string;
  tenant_id?: string;
}

interface BorneUser {
  id: string;
  user_id: string;
  borne_id: string;
  email?: string;
  display_name?: string;
}

/** `sadaka` conservé pour les lignes déjà en base ; privilégier `sadaq-android` pour le nouveau produit */
const AVAILABLE_APPS = ["sadaq-android", "sadaka", "iqraa", "zakat", "quran"];

const callAdminAPI = async (action: string, body: Record<string, any> = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, ...body }),
    }
  );
  return res.json();
};

export default function AdminPortalPage() {
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"bornes" | "stats" | "config">("bornes");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bornes, setBornes] = useState<Borne[]>([]);
  const [loadingBornes, setLoadingBornes] = useState(false);
  const [impersonating, setImpersonating] = useState<Borne | null>(null);
  const [borneStats, setBorneStats] = useState<{ total: number; count: number; lastActivity: string | null }>({ total: 0, count: 0, lastActivity: null });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [borneAdmins, setBorneAdmins] = useState<BorneUser[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Global stats
  const [globalStats, setGlobalStats] = useState({ totalDonations: 0, totalAmount: 0, activeBornes: 0, totalBornes: 0 });

  // Config API state
  const [apiKeys, setApiKeys] = useState({ stripe: "", anthropic: "", google: "" });
  const [savingKeys, setSavingKeys] = useState(false);

  // New borne form
  const [showAddBorne, setShowAddBorne] = useState(false);
  const [newBorne, setNewBorne] = useState({
    name: "",
    client_name: "",
    location: "",
    plan: "trial",
    terminal_id: "",
    tenant_id: "",
  });
  const [newTenant, setNewTenant] = useState({ slug: "", name: "" });

  // Assign admin modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) navigate("/login");
  }, [user, isSuperAdmin, loading]);

  useEffect(() => {
    if (user && isSuperAdmin) {
      loadTenants();
      loadBornes();
      loadApiKeys();
      loadGlobalStats();
      loadAllUsers();
    }
  }, [user, isSuperAdmin]);

  const loadTenants = async () => {
    const { data } = await supabase.from("tenants").select("id, slug, name").order("name");
    if (data) {
      setTenants(data as Tenant[]);
      setNewBorne((n) => ({ ...n, tenant_id: n.tenant_id || (data as Tenant[])[0]?.id || "" }));
    }
  };

  const loadBornes = async () => {
    setLoadingBornes(true);
    const { data } = await supabase.from("bornes").select("*").order("created_at", { ascending: false });
    if (data) setBornes(data as any);
    setLoadingBornes(false);
  };

  const tenantSlugById = (tid: string | undefined) => tenants.find((t) => t.id === tid)?.slug ?? "—";

  const handleAddTenant = async () => {
    const slug = newTenant.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const name = newTenant.name.trim();
    if (!slug || !name) {
      alert("Slug et nom requis (slug : lettres minuscules, chiffres, tirets)");
      return;
    }
    const { error } = await supabase.from("tenants").insert({ slug, name });
    if (error) {
      alert(error.message);
      return;
    }
    setNewTenant({ slug: "", name: "" });
    await loadTenants();
  };

  const loadGlobalStats = async () => {
    const { data: donations } = await supabase.from("donations").select("amount, status");
    const { data: bornesData } = await supabase.from("bornes").select("status");
    
    const approved = (donations || []).filter((d: any) => d.status === "approved");
    const totalAmount = approved.reduce((s: number, d: any) => s + Number(d.amount), 0);
    
    setGlobalStats({
      totalDonations: approved.length,
      totalAmount,
      activeBornes: (bornesData || []).filter((b: any) => b.status === "active").length,
      totalBornes: (bornesData || []).length,
    });
  };

  const loadAllUsers = async () => {
    const result = await callAdminAPI("list");
    if (result.users) setAllUsers(result.users);
  };

  const loadApiKeys = async () => {
    const { data } = await supabase.from("settings").select("*").in("key", ["api_stripe", "api_anthropic", "api_google"]);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.key] = s.value || ""; });
      setApiKeys({
        stripe: map["api_stripe"] || "",
        anthropic: map["api_anthropic"] || "",
        google: map["api_google"] || "",
      });
    }
  };

  const handleAddBorne = async () => {
    if (!newBorne.tenant_id) {
      alert("Choisissez une association (tenant)");
      return;
    }
    const { data: inserted, error } = await supabase
      .from("bornes")
      .insert({
        name: newBorne.name,
        client_name: newBorne.client_name,
        location: newBorne.location,
        plan: newBorne.plan,
        terminal_id: newBorne.terminal_id || null,
        tenant_id: newBorne.tenant_id,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      alert(error.message);
      return;
    }
    if (inserted?.id) {
      const { data: t } = await supabase.from("tenants").select("default_borne_id").eq("id", newBorne.tenant_id).maybeSingle();
      if (!t?.default_borne_id) {
        await supabase.from("tenants").update({ default_borne_id: inserted.id }).eq("id", newBorne.tenant_id);
      }
    }
    setNewBorne({
      name: "",
      client_name: "",
      location: "",
      plan: "trial",
      terminal_id: "",
      tenant_id: tenants[0]?.id || "",
    });
    setShowAddBorne(false);
    await loadTenants();
    await loadBornes();
    await loadGlobalStats();
  };

  const handleUpdatePlan = async (id: string, plan: string) => {
    await supabase.from("bornes").update({ plan }).eq("id", id);
    await loadBornes();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await supabase.from("bornes").update({ status: newStatus }).eq("id", id);
    await loadBornes();
    await loadGlobalStats();
  };

  const handleUpdateApps = async (borneId: string, apps: string[]) => {
    await supabase.from("bornes").update({ apps_installed: apps }).eq("id", borneId);
    await loadBornes();
    if (impersonating?.id === borneId) {
      setImpersonating({ ...impersonating, apps_installed: apps });
    }
  };

  const handleSaveApiKeys = async () => {
    setSavingKeys(true);
    const upserts = [
      { key: "api_stripe", value: apiKeys.stripe },
      { key: "api_anthropic", value: apiKeys.anthropic },
      { key: "api_google", value: apiKeys.google },
    ];
    for (const u of upserts) {
      const { data } = await supabase.from("settings").select("id").eq("key", u.key).maybeSingle();
      if (data) {
        await supabase.from("settings").update({ value: u.value }).eq("key", u.key);
      } else {
        await supabase.from("settings").insert({ key: u.key, value: u.value });
      }
    }
    setSavingKeys(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const loadBorneAdmins = async (borneId: string) => {
    const { data } = await supabase.from("borne_users").select("*").eq("borne_id", borneId);
    if (data && data.length > 0) {
      // Enrich with user info from allUsers
      const enriched = data.map((bu: any) => {
        const u = allUsers.find((u: any) => u.id === bu.user_id);
        return { ...bu, email: u?.email || "—", display_name: u?.display_name || "" };
      });
      setBorneAdmins(enriched);
    } else {
      setBorneAdmins([]);
    }
  };

  const handleAssignAdmin = async (borneId: string) => {
    // Find user by email
    const targetUser = allUsers.find((u: any) => u.email === assignEmail);
    if (!targetUser) { alert("Utilisateur non trouvé"); return; }
    
    await supabase.from("borne_users").insert({ user_id: targetUser.id, borne_id: borneId });
    setAssignEmail("");
    setShowAssignModal(false);
    await loadBorneAdmins(borneId);
  };

  const handleRemoveAdmin = async (borneUserId: string, borneId: string) => {
    await supabase.from("borne_users").delete().eq("id", borneUserId);
    await loadBorneAdmins(borneId);
  };

  if (loading) {
    return <div style={styles.loadingScreen}>Chargement…</div>;
  }

  const exportCSV = (donations: any[], clientName: string) => {
    const header = "Référence;Montant;Cause;Type;Date;Statut";
    const rows = donations.map((d: any) =>
      `${d.reference};${Number(d.amount).toFixed(2)};${d.cause};${d.type};${new Date(d.created_at).toLocaleString("fr-FR")};${d.status}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${clientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !isSuperAdmin) return null;

  const enterImpersonate = async (borne: Borne) => {
    setImpersonating(borne);
    const { data: donations } = await supabase
      .from("donations")
      .select("amount, created_at, cause, type, status, reference")
      .eq("borne_id", borne.id)
      .order("created_at", { ascending: false });
    
    if (donations && donations.length > 0) {
      const total = donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      setBorneStats({ total, count: donations.length, lastActivity: donations[0].created_at });
      setRecentDonations(donations.slice(0, 10));
    } else {
      setBorneStats({ total: 0, count: 0, lastActivity: null });
      setRecentDonations([]);
    }
    await loadBorneAdmins(borne.id);
  };

  // Impersonate mode
  if (impersonating) {
    return (
      <div style={styles.container}>
        <div style={styles.impersonateBanner}>
          <span>🔐 Session Admin — Gestion de <strong>{impersonating.client_name}</strong> ({impersonating.name})</span>
          <button style={styles.btnSmall} onClick={() => setImpersonating(null)}>← Retour au portail</button>
        </div>
        <div style={styles.impersonateBody}>
          <h2 style={styles.h2}>Dashboard client : {impersonating.client_name}</h2>
          
          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, borderColor: "rgba(16,185,129,0.3)" }}>
              <div style={styles.statLabel}>💰 Total des dons</div>
              <div style={{ ...styles.statValue, color: "#10b981", fontSize: 28 }}>
                {borneStats.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📊 Transactions</div>
              <div style={{ ...styles.statValue, fontSize: 28 }}>{borneStats.count}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>🕐 Dernière activité</div>
              <div style={{ ...styles.statValue, fontSize: 14 }}>
                {borneStats.lastActivity ? new Date(borneStats.lastActivity).toLocaleString("fr-FR") : "Aucune"}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>💳 Don moyen</div>
              <div style={{ ...styles.statValue, fontSize: 22 }}>
                {borneStats.count > 0 ? (borneStats.total / borneStats.count).toFixed(2) + " €" : "—"}
              </div>
            </div>
          </div>

          {/* Info borne */}
          <div style={{ ...styles.statsGrid, gridTemplateColumns: "repeat(4, 1fr)", marginTop: 16 }}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Borne</div>
              <div style={styles.statValue}>{impersonating.name}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Plan</div>
              <div style={styles.statValue}>{impersonating.plan.toUpperCase()}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Statut</div>
              <div style={{ ...styles.statValue, color: impersonating.status === "active" ? "#10b981" : "#f59e0b" }}>
                {impersonating.status === "active" ? "Actif" : "Suspendu"}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Terminal ID</div>
              <div style={styles.statValue}>{impersonating.terminal_id || "—"}</div>
            </div>
          </div>

          {/* Admins rattachés */}
          <h3 style={styles.h3}>👤 Administrateurs rattachés</h3>
          <div style={{ marginBottom: 16 }}>
            {borneAdmins.length > 0 ? (
              borneAdmins.map(ba => (
                <div key={ba.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d140d", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 10, padding: "10px 16px", marginBottom: 8 }}>
                  <div>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{ba.display_name}</span>
                    <span style={{ color: "#6b9e8a", fontSize: 12, marginLeft: 12 }}>{ba.email}</span>
                  </div>
                  <button onClick={() => handleRemoveAdmin(ba.id, impersonating.id)} style={{ ...styles.btnSmall, color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}>Retirer</button>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b9e8a", fontSize: 13 }}>Aucun administrateur rattaché</p>
            )}
            <button onClick={() => setShowAssignModal(true)} style={{ ...styles.btnSmallPrimary, marginTop: 8 }}>+ Rattacher un admin</button>
          </div>

          {/* Applications */}
          <h3 style={styles.h3}>📱 Applications installées</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {AVAILABLE_APPS.map(app => {
              const isInstalled = (impersonating.apps_installed || []).includes(app);
              return (
                <button
                  key={app}
                  onClick={() => {
                    const current = impersonating.apps_installed || [];
                    const updated = isInstalled ? current.filter((a: string) => a !== app) : [...current, app];
                    handleUpdateApps(impersonating.id, updated);
                  }}
                  style={{
                    ...styles.appBadge,
                    background: isInstalled ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.1)",
                    color: isInstalled ? "#10b981" : "#64748b",
                    border: `1px solid ${isInstalled ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`,
                    cursor: "pointer",
                  }}
                >
                  {isInstalled ? "✓ " : ""}{app}
                </button>
              );
            })}
          </div>

          {/* Dernières transactions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={styles.h3}>📋 Dernières transactions</h3>
            {recentDonations.length > 0 && (
              <button
                onClick={() => exportCSV(recentDonations, impersonating.client_name)}
                style={{ ...styles.btnSmallPrimary, fontSize: 12 }}
              >
                📥 Export CSV
              </button>
            )}
          </div>
          {recentDonations.length > 0 ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(16,185,129,0.15)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(16,185,129,0.08)" }}>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Montant</th>
                    <th style={styles.th}>Cause</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((d: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(16,185,129,0.08)" }}>
                      <td style={styles.td}>{d.reference}</td>
                      <td style={{ ...styles.td, color: "#10b981", fontWeight: 700 }}>{Number(d.amount).toFixed(2)} €</td>
                      <td style={styles.td}>{d.cause}</td>
                      <td style={styles.td}>{d.type}</td>
                      <td style={styles.td}>{new Date(d.created_at).toLocaleString("fr-FR")}</td>
                      <td style={styles.td}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: d.status === "approved" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: d.status === "approved" ? "#10b981" : "#f87171",
                        }}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#6b9e8a", textAlign: "center", padding: 24 }}>Aucune transaction pour cette borne</p>
          )}

          <h3 style={styles.h3}>📍 Localisation</h3>
          <p style={{ color: "#94a3b8" }}>{impersonating.location || "Non renseigné"}</p>
        </div>

        {/* Assign admin modal */}
        {showAssignModal && (
          <div style={styles.overlay}>
            <div style={styles.modalCard}>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Rattacher un administrateur</h3>
              <label style={styles.label}>Email de l'utilisateur</label>
              <select
                style={styles.input}
                value={assignEmail}
                onChange={e => setAssignEmail(e.target.value)}
              >
                <option value="">Sélectionner…</option>
                {allUsers
                  .filter(u => !borneAdmins.some(ba => ba.user_id === u.id))
                  .map(u => (
                    <option key={u.id} value={u.email}>{u.display_name || u.email} ({u.email})</option>
                  ))
                }
              </select>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => { setShowAssignModal(false); setAssignEmail(""); }} style={styles.btnDanger}>Annuler</button>
                <button onClick={() => handleAssignAdmin(impersonating.id)} style={styles.btnPrimary}>Rattacher</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>🛰️ Tour de Contrôle</h1>
          <p style={styles.subtitle}>Portail Revendeur — Super Admin</p>
        </div>
        <button style={styles.btnDanger} onClick={handleSignOut}>Déconnexion</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={tab === "bornes" ? styles.tabActive : styles.tab} onClick={() => setTab("bornes")}>
          📡 Bornes
        </button>
        <button style={tab === "stats" ? styles.tabActive : styles.tab} onClick={() => setTab("stats")}>
          📊 Stats globales
        </button>
        <button style={tab === "config" ? styles.tabActive : styles.tab} onClick={() => setTab("config")}>
          🔑 Config API
        </button>
        <button style={styles.btnSmall} onClick={() => navigate("/installation")}>
          📋 Guide
        </button>
      </div>

      {/* Stats Tab */}
      {tab === "stats" && (
        <div>
          <div style={{ ...styles.statsGrid, gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div style={{ ...styles.statCard, borderColor: "rgba(16,185,129,0.3)" }}>
              <div style={styles.statLabel}>💰 Total revenus</div>
              <div style={{ ...styles.statValue, color: "#10b981", fontSize: 28 }}>
                {globalStats.totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📊 Transactions</div>
              <div style={{ ...styles.statValue, fontSize: 28 }}>{globalStats.totalDonations}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📡 Bornes actives</div>
              <div style={{ ...styles.statValue, fontSize: 28, color: "#10b981" }}>{globalStats.activeBornes}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>📡 Total bornes</div>
              <div style={{ ...styles.statValue, fontSize: 28 }}>{globalStats.totalBornes}</div>
            </div>
          </div>

          {/* Per-borne breakdown */}
          <h3 style={styles.h3}>📊 Revenus par borne</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bornes.map(b => (
              <div key={b.id} style={{ background: "#0d140d", border: "1px solid rgba(16,185,129,0.1)", borderRadius: 12, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{b.client_name}</span>
                  <span style={{ color: "#6b9e8a", fontSize: 12, marginLeft: 12 }}>{b.name}</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: b.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                    color: b.status === "active" ? "#10b981" : "#f59e0b",
                  }}>
                    {b.status === "active" ? "● Actif" : "● Suspendu"}
                  </span>
                  <button style={styles.btnSmallPrimary} onClick={() => enterImpersonate(b)}>Voir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bornes Tab */}
      {tab === "bornes" && (
        <div>
          <div style={styles.toolBar}>
            <span style={styles.count}>{bornes.length} borne(s) · {tenants.length} association(s)</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                style={{ ...styles.input, width: 120 }}
                placeholder="slug (ex. iqraa)"
                value={newTenant.slug}
                onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
              />
              <input
                style={{ ...styles.input, width: 160 }}
                placeholder="Nom association"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
              />
              <button type="button" style={styles.btnSmall} onClick={handleAddTenant}>
                + Association
              </button>
              <button style={styles.btnPrimary} onClick={() => setShowAddBorne(!showAddBorne)}>
                {showAddBorne ? "Annuler" : "+ Ajouter une borne"}
              </button>
            </div>
          </div>

          {showAddBorne && (
            <div style={styles.formCard}>
              <div style={styles.formGrid}>
                <select
                  style={styles.input}
                  value={newBorne.tenant_id}
                  onChange={(e) => setNewBorne({ ...newBorne, tenant_id: e.target.value })}
                >
                  <option value="">— Association (tenant) —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
                <input style={styles.input} placeholder="Nom de la borne" value={newBorne.name}
                  onChange={e => setNewBorne({ ...newBorne, name: e.target.value })} />
                <input style={styles.input} placeholder="Nom du client" value={newBorne.client_name}
                  onChange={e => setNewBorne({ ...newBorne, client_name: e.target.value })} />
                <input style={styles.input} placeholder="Localisation" value={newBorne.location}
                  onChange={e => setNewBorne({ ...newBorne, location: e.target.value })} />
                <select style={styles.input} value={newBorne.plan}
                  onChange={e => setNewBorne({ ...newBorne, plan: e.target.value })}>
                  <option value="trial">Trial</option>
                  <option value="essential">Essential</option>
                  <option value="premium">Premium</option>
                </select>
                <input style={styles.input} placeholder="Terminal ID (optionnel)" value={newBorne.terminal_id}
                  onChange={e => setNewBorne({ ...newBorne, terminal_id: e.target.value })} />
              </div>
              <button style={styles.btnPrimary} onClick={handleAddBorne}>Créer la borne</button>
            </div>
          )}

          {loadingBornes ? (
            <p style={{ color: "#6b9e8a", textAlign: "center", padding: 40 }}>Chargement…</p>
          ) : (
            <div style={styles.bornesList}>
              {bornes.map(b => (
                <div key={b.id} style={styles.borneCard}>
                  <div style={styles.borneHeader}>
                    <div>
                      <span style={styles.borneName}>{b.name}</span>
                      <span style={styles.borneClient}>{b.client_name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        ...styles.badge,
                        background: b.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        color: b.status === "active" ? "#10b981" : "#f59e0b",
                      }}>
                        {b.status === "active" ? "● Actif" : "● Suspendu"}
                      </span>
                      <span style={{ ...styles.badge, background: "rgba(99,102,241,0.15)", color: "#818cf8" }}>
                        {b.plan.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={styles.borneDetails}>
                    <span>📍 {b.location || "—"}</span>
                    <span>🔌 {b.terminal_id || "—"}</span>
                    <span>📱 {(b.apps_installed || []).join(", ")}</span>
                    <span style={{ gridColumn: "1 / -1", fontSize: 11, color: "#6b9e8a", wordBreak: "break-all" }}>
                      URL borne : {PRODUCT_ORIGIN}/{tenantSlugById(b.tenant_id)}/borne
                    </span>
                  </div>
                  <div style={styles.borneActions}>
                    <button style={styles.btnSmallPrimary} onClick={() => enterImpersonate(b)}>
                      🎛️ Gérer
                    </button>
                    <button style={{ ...styles.btnSmallPrimary, background: "rgba(99,102,241,0.15)", color: "#818cf8", borderColor: "rgba(99,102,241,0.3)" }} onClick={() => navigate(`/${tenantSlugById(b.tenant_id)}/admin?borne_id=${b.id}`)}>
                      📊 Dashboard client
                    </button>
                    <select style={styles.selectSmall} value={b.plan}
                      onChange={e => handleUpdatePlan(b.id, e.target.value)}>
                      <option value="trial">Trial</option>
                      <option value="essential">Essential</option>
                      <option value="premium">Premium</option>
                    </select>
                    <button
                      style={b.status === "active" ? styles.btnSmallWarn : styles.btnSmallSuccess}
                      onClick={() => handleToggleStatus(b.id, b.status)}
                    >
                      {b.status === "active" ? "Suspendre" : "Réactiver"}
                    </button>
                  </div>
                </div>
              ))}
              {bornes.length === 0 && (
                <p style={{ color: "#6b9e8a", textAlign: "center", padding: 40 }}>Aucune borne enregistrée</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Config API Tab */}
      {tab === "config" && (
        <div style={styles.formCard}>
          <h2 style={styles.h2}>🔑 Clés API Globales</h2>
          <p style={{ color: "#6b9e8a", fontSize: 13, marginBottom: 20 }}>
            Ces clés sont utilisées par toutes les bornes connectées.
          </p>
          <label style={styles.label}>Stripe API Key</label>
          <input style={styles.input} type="password" placeholder="sk_live_..." value={apiKeys.stripe}
            onChange={e => setApiKeys({ ...apiKeys, stripe: e.target.value })} />
          <label style={styles.label}>Anthropic API Key</label>
          <input style={styles.input} type="password" placeholder="sk-ant-..." value={apiKeys.anthropic}
            onChange={e => setApiKeys({ ...apiKeys, anthropic: e.target.value })} />
          <label style={styles.label}>Google API Key</label>
          <input style={styles.input} type="password" placeholder="AIza..." value={apiKeys.google}
            onChange={e => setApiKeys({ ...apiKeys, google: e.target.value })} />
          <button style={styles.btnPrimary} onClick={handleSaveApiKeys} disabled={savingKeys}>
            {savingKeys ? "Enregistrement…" : "Enregistrer les clés"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%", minHeight: "100vh", background: "#000",
    fontFamily: "'Inter', sans-serif", color: "#e2e8f0", padding: "24px 32px",
  },
  loadingScreen: {
    width: "100%", height: "100vh", background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#10b981", fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24,
  },
  h1: { fontSize: 28, fontWeight: 800, color: "#fff", margin: 0 },
  h2: { fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 16px" },
  h3: { fontSize: 16, fontWeight: 600, color: "#fff", margin: "20px 0 8px" },
  subtitle: { fontSize: 13, color: "#6b9e8a", margin: "4px 0 0" },
  tabs: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const },
  tab: {
    padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(16,185,129,0.15)",
    background: "transparent", color: "#6b9e8a", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  tabActive: {
    padding: "10px 20px", borderRadius: 10, border: "1px solid #10b981",
    background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontSize: 13, fontWeight: 600,
  },
  toolBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  count: { fontSize: 13, color: "#6b9e8a" },
  formCard: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16,
    padding: 24, marginBottom: 20,
  },
  formGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
  },
  input: {
    width: "100%", background: "#080c08", border: "1px solid rgba(16,185,129,0.15)",
    borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none",
    fontFamily: "Inter, sans-serif", boxSizing: "border-box" as const,
  },
  label: {
    display: "block", fontSize: 11, color: "#6b9e8a", letterSpacing: 1.2,
    textTransform: "uppercase" as const, marginBottom: 6, marginTop: 12,
  },
  btnPrimary: {
    background: "#10b981", color: "#000", border: "none", borderRadius: 50,
    padding: "12px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer",
    boxShadow: "0 0 20px rgba(16,185,129,0.3)",
  },
  btnDanger: {
    background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 50, padding: "10px 20px", fontWeight: 600, fontSize: 12, cursor: "pointer",
  },
  btnSmall: {
    background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
  },
  btnSmallPrimary: {
    background: "#10b981", color: "#000", border: "none",
    borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer",
  },
  btnSmallWarn: {
    background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
  },
  btnSmallSuccess: {
    background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
  },
  selectSmall: {
    background: "#080c08", color: "#fff", border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 8, padding: "6px 10px", fontSize: 12, outline: "none",
  },
  bornesList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  borneCard: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16,
    padding: 20, transition: "border-color 0.2s",
  },
  borneHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  borneName: { fontSize: 16, fontWeight: 700, color: "#fff", marginRight: 12 },
  borneClient: { fontSize: 13, color: "#6b9e8a" },
  borneDetails: {
    display: "flex", gap: 20, fontSize: 12, color: "#64748b", marginBottom: 12,
  },
  borneActions: { display: "flex", gap: 8, alignItems: "center" },
  badge: {
    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
  },
  impersonateBanner: {
    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: 12, padding: "12px 20px", marginBottom: 24,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 14, color: "#f59e0b",
  },
  impersonateBody: { padding: "0 8px" },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24,
  },
  statCard: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.15)",
    borderRadius: 14, padding: 20, textAlign: "center" as const,
  },
  statLabel: { fontSize: 11, color: "#6b9e8a", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: 700, color: "#fff" },
  appBadge: {
    background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
  },
  th: {
    padding: "10px 14px", textAlign: "left" as const, color: "#6b9e8a",
    fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 1,
  },
  td: {
    padding: "10px 14px", color: "#e2e8f0",
  },
  overlay: {
    position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modalCard: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 20, padding: "32px 28px", width: 400, maxWidth: "90vw",
  },
};
