import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DEFAULT_TENANT_SLUG } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboardLight from "@/components/AdminDashboardLight";
import { getPendingOfflineCount, onSyncUpdate, syncPendingDonations } from "@/lib/sync-service";

interface Cause {
  id: string;
  name: string;
  icon: string;
  raised: number;
  goal: number;
  active?: boolean;
  created_at?: string;
}

interface Donation {
  id: string;
  type: string;
  amount: number;
  cause: string;
  date: string;
  status: string;
  _created_at?: string;
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
}

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

export default function AdminPage() {
  const { user, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug: tenantSlugParam } = useParams<{ tenantSlug?: string }>();
  const tenantSlug = tenantSlugParam ?? DEFAULT_TENANT_SLUG;
  const [searchParams] = useSearchParams();
  const overrideBorneId = isSuperAdmin ? searchParams.get("borne_id") : null;
  const [tab, setTab] = useState("transactions");
  const [causes, setCauses] = useState<Cause[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [userBorneId, setUserBorneId] = useState<string | null>(null);
  const [pendingOffline, setPendingOffline] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate(tenantSlug ? `/${tenantSlug}/login` : "/login");
    }
  }, [user, isAdmin, loading, navigate, tenantSlug]);

  useEffect(() => {
    if (user && isAdmin) {
      loadUserBorne();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    void getPendingOfflineCount().then(setPendingOffline);
    return onSyncUpdate(setPendingOffline);
  }, []);

  const handleSyncOffline = async () => {
    setSyncingOffline(true);
    try {
      await syncPendingDonations();
      await loadData(userBorneId);
    } finally {
      setSyncingOffline(false);
    }
  };

  const loadUserBorne = async () => {
    // Get user's assigned borne
    const { data: borneAssignments } = await supabase
      .from("borne_users")
      .select("borne_id")
      .eq("user_id", user!.id);
    
    const borneId = overrideBorneId || borneAssignments?.[0]?.borne_id || null;
    setUserBorneId(borneId);
    
    // Now load data scoped to this borne (or all if super_admin)
    loadData(borneId);
    loadUsers();
  };

  const mapDonations = (data: any[]) =>
    data.map((d: any) => ({
      id: d.reference,
      type: d.type,
      amount: d.amount,
      cause: d.cause,
      date: new Date(d.created_at).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      status: d.status,
      _created_at: d.created_at,
    }));

  const loadData = async (borneId: string | null) => {
    let causesQuery = supabase.from("causes").select("*").order("created_at");
    let donationsQuery = supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(500);

    // RLS handles scoping, but for non-super-admins with a borne, we filter explicitly
    if (borneId && !isSuperAdmin) {
      causesQuery = causesQuery.eq("borne_id", borneId);
      donationsQuery = donationsQuery.eq("borne_id", borneId);
    }

    const [causesRes, donationsRes] = await Promise.all([causesQuery, donationsQuery]);
    if (causesRes.data) setCauses(causesRes.data as any);
    if (donationsRes.data) {
      const mapped = mapDonations(donationsRes.data);
      setAllDonations(mapped);
      setDonations(mapped);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    const result = await callAdminAPI("list");
    if (result.users) setUsers(result.users);
    setLoadingUsers(false);
  };

  const handleCreateUser = async (data: { email: string; password: string; display_name: string; role: string }) => {
    await callAdminAPI("create", { ...data, borne_id: userBorneId });
    await loadUsers();
  };

  const handleBanUser = async (user_id: string, ban: boolean) => {
    await callAdminAPI("ban", { user_id, ban });
    await loadUsers();
  };

  const handleDeleteUser = async (user_id: string) => {
    await callAdminAPI("delete", { user_id });
    await loadUsers();
  };

  const handleUpdateRole = async (user_id: string, role: string) => {
    await callAdminAPI("update_role", { user_id, role });
    await loadUsers();
  };

  const handleCreateCause = async (data: { name: string; icon: string; goal: number }) => {
    await supabase.from("causes").insert({ 
      name: data.name, 
      icon: data.icon, 
      goal: data.goal,
      borne_id: userBorneId,
    });
    await loadData(userBorneId);
  };

  const handleUpdateCause = async (id: string, data: { name: string; icon: string; goal: number }) => {
    await supabase.from("causes").update({ name: data.name, icon: data.icon, goal: data.goal }).eq("id", id);
    await loadData(userBorneId);
  };

  const handleArchiveCause = async (id: string) => {
    await supabase.from("causes").update({ active: false }).eq("id", id);
    await loadData(userBorneId);
  };

  const handleFilterDonations = ({ start, end, cause }: { start: string; end: string; cause: string }) => {
    let filtered = [...allDonations];
    if (start) {
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(d => new Date((d as any)._created_at) >= startDate);
    }
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date((d as any)._created_at) <= endDate);
    }
    if (cause) {
      filtered = filtered.filter(d => d.cause === cause);
    }
    setDonations(filtered);
  };

  const handleResetFilters = () => setDonations(allDonations);

  const handleSignOut = async () => {
    await signOut();
    navigate(tenantSlug ? `/${tenantSlug}/login` : "/login");
  };

  if (loading) {
    return (
      <div style={{
        width: "100%", height: "100vh", background: "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3b82f6", fontFamily: "Inter, sans-serif", fontSize: 16,
      }}>
        Chargement…
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div>
      {overrideBorneId && (
        <div style={{ background: "#1e1b4b", color: "#a5b4fc", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
          <span>🔐 Vue super_admin — Dashboard client</span>
          <button onClick={() => navigate("/admin-portal")} style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontSize: 13 }}>
            ← Retour au portail
          </button>
        </div>
      )}
      <AdminDashboardLight
        causes={causes}
        donations={donations}
        allDonations={allDonations}
        setDonations={setDonations}
        tab={tab}
        setTab={setTab}
        users={users}
        loadingUsers={loadingUsers}
        onCreateUser={handleCreateUser}
        onBanUser={handleBanUser}
        onDeleteUser={handleDeleteUser}
        onUpdateRole={handleUpdateRole}
        onCreateCause={handleCreateCause}
        onUpdateCause={handleUpdateCause}
        onArchiveCause={handleArchiveCause}
        onFilterDonations={handleFilterDonations}
        onResetFilters={handleResetFilters}
        onSignOut={handleSignOut}
        settings={settings}
        onSaveSettings={() => {}}
        savingSettings={savingSettings}
        pendingOfflineCount={pendingOffline}
        onSyncOffline={handleSyncOffline}
        syncingOffline={syncingOffline}
      />
    </div>
  );
}
