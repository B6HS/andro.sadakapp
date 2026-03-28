import { useState, useMemo, type CSSProperties } from "react";

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

interface Props {
  causes: Cause[];
  donations: Donation[];
  allDonations: Donation[];
  setDonations: (d: Donation[]) => void;
  tab: string;
  setTab: (t: string) => void;
  users: AdminUser[];
  loadingUsers: boolean;
  onCreateUser: (data: { email: string; password: string; display_name: string; role: string }) => Promise<void>;
  onBanUser: (id: string, ban: boolean) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onCreateCause: (data: { name: string; icon: string; goal: number }) => Promise<void>;
  onUpdateCause: (id: string, data: { name: string; icon: string; goal: number }) => Promise<void>;
  onArchiveCause: (id: string) => Promise<void>;
  onFilterDonations: (f: { start: string; end: string; cause: string }) => void;
  onResetFilters: () => void;
  onSignOut: () => void;
  settings?: Record<string, any>;
  onSaveSettings?: (s: any) => void;
  savingSettings?: boolean;
  /** File locale des dons en attente (sadaq.app/android hors-ligne) */
  pendingOfflineCount?: number;
  onSyncOffline?: () => Promise<void>;
  syncingOffline?: boolean;
}

const ICONS_MAP: Record<string, string> = {
  "🕌": "🕌", "🍴": "🍴", "📢": "📢", "❤️": "❤️", "📦": "📦", "🏗️": "🏗️",
  "mosque": "🕌", "food": "🍴", "charity": "❤️",
};

const TABS = [
  { id: "transactions", label: "Transactions", icon: "📋" },
  { id: "causes", label: "Causes", icon: "📢" },
  { id: "users", label: "Utilisateurs", icon: "👥" },
  { id: "logout", label: "Déconnexion", icon: "⏻" },
];

export default function AdminDashboardLight({
  causes, donations, allDonations, setDonations, tab, setTab,
  users, loadingUsers, onCreateUser, onBanUser, onDeleteUser, onUpdateRole,
  onCreateCause, onUpdateCause, onArchiveCause,
  onFilterDonations, onResetFilters, onSignOut,
  pendingOfflineCount = 0,
  onSyncOffline,
  syncingOffline = false,
}: Props) {
  // Filters
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterCause, setFilterCause] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // Create cause modal
  const [showCauseModal, setShowCauseModal] = useState(false);
  const [newCauseName, setNewCauseName] = useState("");
  const [newCauseIcon, setNewCauseIcon] = useState("");
  const [newCauseGoal, setNewCauseGoal] = useState("");

  // Create user modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [creating, setCreating] = useState(false);

  const approved = donations.filter(d => d.status === "approved");
  const total = approved.reduce((s, d) => s + d.amount, 0);

  const handleTab = (id: string) => {
    if (id === "logout") { onSignOut(); return; }
    setTab(id);
  };

  const applyFilters = () => {
    onFilterDonations({ start: filterStart, end: filterEnd, cause: filterCause });
  };

  const collecteToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilterStart(today);
    setFilterEnd(today);
    onFilterDonations({ start: today, end: today, cause: filterCause });
  };

  const resetFilters = () => {
    setFilterStart("");
    setFilterEnd("");
    setFilterCause("");
    onResetFilters();
  };

  const handleCreateCause = async () => {
    if (!newCauseName) return;
    await onCreateCause({ name: newCauseName, icon: newCauseIcon, goal: Number(newCauseGoal) || 0 });
    setShowCauseModal(false);
    setNewCauseName(""); setNewCauseIcon(""); setNewCauseGoal("");
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    await onCreateUser({ email: newEmail, password: newPassword, display_name: newName || newEmail.split("@")[0], role: newRole });
    setCreating(false);
    setShowUserModal(false);
    setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("user");
  };

  const visibleDonations = donations.slice(0, visibleCount);

  const activeCauses = causes.filter(c => c.active !== false);

  return (
    <div style={s.wrap}>
      {/* Content area */}
      <div style={s.content}>

        {/* TRANSACTIONS TAB */}
        {tab === "transactions" && (
          <div>
            {/* Stats summary */}
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statValue}>{total.toLocaleString("fr-FR")} €</div>
                <div style={s.statLabel}>Total collecté</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statValue}>{approved.length}</div>
                <div style={s.statLabel}>Transactions</div>
              </div>
            </div>

            {onSyncOffline && (
              <div style={s.card}>
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ ...s.cardTitle, fontSize: 16 }}>Synchronisation sadaq.app/android</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Dons en file hors-ligne : <strong>{pendingOfflineCount}</strong>
                      {pendingOfflineCount > 0 ? " — à envoyer vers le cloud" : " — à jour"}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      Sync automatique en fin de journée (23h55+) + toutes les 30 s si connecté.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSyncOffline()}
                    disabled={syncingOffline}
                    style={{
                      ...s.btnSync,
                      opacity: syncingOffline ? 0.6 : 1,
                      cursor: syncingOffline ? "wait" : "pointer",
                    }}
                  >
                    {syncingOffline ? "Synchronisation…" : "↻ Synchroniser"}
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={s.card}>
              <div style={s.filterHeader} onClick={() => setFiltersOpen(!filtersOpen)}>
                <span style={s.cardTitle}>Filtres</span>
                <span style={{ fontSize: 18, color: "#94a3b8", transform: filtersOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌃</span>
              </div>
              {filtersOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  <label style={s.fieldLabel}>Date de début:</label>
                  <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={s.input} />

                  <label style={s.fieldLabel}>Date de fin:</label>
                  <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={s.input} />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                    <button onClick={collecteToday} style={s.btnDark}>Collecte du jour</button>
                  </div>

                  <label style={s.fieldLabel}>Cause :</label>
                  <select value={filterCause} onChange={e => setFilterCause(e.target.value)} style={s.select}>
                    <option value="">Toutes</option>
                    {causes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>

                  <button onClick={applyFilters} style={s.btnPrimary}>Appliquer</button>
                  <button onClick={() => {}} style={s.btnSecondary}>Exporter</button>
                  <button onClick={resetFilters} style={s.btnDanger}>Supprimer les filtres</button>
                </div>
              )}
            </div>

            {/* Transaction list */}
            <div style={s.card}>
              <div style={{ padding: 20 }}>
                <div style={s.cardTitle}>Transactions ({donations.length})</div>
              </div>
              <div>
                {visibleDonations.map((d, i) => (
                  <div key={d.id + i} style={s.txRow}>
                    <div style={{
                      ...s.txBorder,
                      background: d.status === "approved" ? "#10b981" : "#ef4444",
                    }} />
                    <div style={{ flex: 1, padding: "14px 16px" }}>
                      <div style={s.txCause}>{d.cause || d.type}</div>
                      <div style={s.txDate}>{d.date}</div>
                    </div>
                    <div style={s.txAmount}>+ {d.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</div>
                  </div>
                ))}
              </div>
              {visibleCount < donations.length && (
                <div style={{ padding: 20, textAlign: "center" }}>
                  <button onClick={() => setVisibleCount(v => v + 20)} style={s.btnLoad}>
                    ↻ Charger plus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAUSES TAB */}
        {tab === "causes" && (
          <div>
            <div style={s.card}>
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={s.cardTitle}>Causes ({activeCauses.length}/{causes.length})</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.iconBtnBlue}>🗂</button>
                  <button onClick={() => setShowCauseModal(true)} style={s.iconBtnGreen}>＋</button>
                </div>
              </div>
              <div>
                {activeCauses.map(c => (
                  <div key={c.id} style={s.causeRow}>
                    <div style={s.causeBorder} />
                    <div style={s.causeIcon}>
                      {ICONS_MAP[c.icon] || c.icon || "📋"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.causeName}>{c.name}</div>
                      {c.created_at && (
                        <div style={s.causeDate}>
                          Créée le {new Date(c.created_at).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                    <div style={s.causePreset}>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Montant prédéfini</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                        {(c.goal || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <div style={s.card}>
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={s.cardTitle}>Utilisateurs ({users.length})</span>
                <button onClick={() => setShowUserModal(true)} style={s.iconBtnGreen}>＋</button>
              </div>

              {loadingUsers ? (
                <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Chargement…</div>
              ) : (
                <div>
                  {users.map(u => (
                    <div key={u.id} style={s.userRow}>
                      <div style={s.userBorder} />
                      <div style={{ flex: 1, padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{u.display_name || u.email}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>
                          Rôle: {u.role === "admin" ? "Administrateur" : u.role === "moderator" ? "Gestionnaire" : "Lecteur"}
                          {u.banned && <span style={{ color: "#ef4444", marginLeft: 8 }}>● Suspendu</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, padding: "0 12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button onClick={() => onBanUser(u.id, !u.banned)} style={s.smallBtn}>
                          {u.banned ? "Activer" : "Suspendre"}
                        </button>
                        <button onClick={() => { if (confirm("Supprimer cet utilisateur ?")) onDeleteUser(u.id); }} style={{ ...s.smallBtn, color: "#ef4444", borderColor: "#fecaca" }}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.footerLine} />
          <div style={s.footerLink}>Mentions légales</div>
          <div style={s.footerLink}>CGU</div>
          <div style={s.footerLink}>CGV</div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={s.bottomBar}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => handleTab(t.id)}
            style={{
              ...s.tabBtn,
              color: tab === t.id ? "#3b82f6" : "#64748b",
            }}
          >
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: tab === t.id ? 700 : 500,
            }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Create Cause Modal */}
      {showCauseModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Nouvelle cause</div>
            <label style={s.fieldLabel}>Nom *</label>
            <input value={newCauseName} onChange={e => setNewCauseName(e.target.value)} placeholder="Ex: Construction mosquée" style={s.modalInput} />
            <label style={s.fieldLabel}>Icône (emoji)</label>
            <input value={newCauseIcon} onChange={e => setNewCauseIcon(e.target.value)} placeholder="🕌" style={s.modalInput} />
            <label style={s.fieldLabel}>Montant prédéfini (€)</label>
            <input value={newCauseGoal} onChange={e => setNewCauseGoal(e.target.value)} placeholder="0.00" type="number" style={s.modalInput} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowCauseModal(false)} style={s.modalCancel}>Annuler</button>
              <button onClick={handleCreateCause} style={s.modalConfirm}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalTitle}>Nouvel utilisateur</div>
            <label style={s.fieldLabel}>Nom</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom complet" style={s.modalInput} />
            <label style={s.fieldLabel}>Email *</label>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" type="email" style={s.modalInput} />
            <label style={s.fieldLabel}>Mot de passe *</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 caractères" type="password" style={s.modalInput} />
            <label style={s.fieldLabel}>Rôle</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={s.modalInput}>
              <option value="user">Lecteur</option>
              <option value="moderator">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowUserModal(false)} style={s.modalCancel}>Annuler</button>
              <button onClick={handleCreateUser} disabled={creating} style={{ ...s.modalConfirm, opacity: creating ? 0.5 : 1 }}>
                {creating ? "Création…" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, CSSProperties> = {
  wrap: {
    width: "100%", minHeight: "100vh", background: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, sans-serif",
    display: "flex", flexDirection: "column",
    paddingBottom: 80, // space for bottom bar
  },
  content: {
    flex: 1, padding: "16px 12px", maxWidth: 600, width: "100%", margin: "0 auto",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14,
  },
  statCard: {
    background: "#fff", borderRadius: 14, padding: "18px 16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  statValue: {
    fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 4,
  },
  statLabel: {
    fontSize: 12, color: "#94a3b8", fontWeight: 500,
  },
  card: {
    background: "#fff", borderRadius: 16, marginBottom: 14,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden",
  },
  cardTitle: {
    fontSize: 20, fontWeight: 800, color: "#1e293b",
  },
  filterHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: 20, cursor: "pointer",
  },
  fieldLabel: {
    display: "block", fontSize: 13, fontWeight: 600, color: "#1e293b",
    marginBottom: 6, marginTop: 12,
  },
  input: {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: "1px solid #e2e8f0", background: "#f1f5f9", fontSize: 14,
    color: "#1e293b", boxSizing: "border-box" as const, outline: "none",
  },
  select: {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    border: "1px solid #e2e8f0", background: "#fff", fontSize: 14,
    color: "#1e293b", boxSizing: "border-box" as const, outline: "none",
    appearance: "auto" as const,
  },
  btnSync: {
    background: "#0d9488", color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 18px", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" as const,
  },
  btnDark: {
    background: "#334155", color: "#fff", border: "none", borderRadius: 8,
    padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  btnPrimary: {
    width: "100%", background: "#3b82f6", color: "#fff", border: "none",
    borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 14,
  },
  btnSecondary: {
    width: "100%", background: "#6b7280", color: "#fff", border: "none",
    borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 8,
  },
  btnDanger: {
    width: "100%", background: "#ef4444", color: "#fff", border: "none",
    borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 8,
  },
  btnLoad: {
    background: "#818cf8", color: "#fff", border: "none", borderRadius: 50,
    padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    boxShadow: "0 2px 8px rgba(129,140,248,0.3)",
  },
  txRow: {
    display: "flex", alignItems: "center",
    borderBottom: "1px solid #f1f5f9", background: "#f8fafc",
    margin: "0 12px 8px", borderRadius: 10, overflow: "hidden",
  },
  txBorder: {
    width: 4, alignSelf: "stretch", flexShrink: 0,
    borderRadius: "4px 0 0 4px",
  },
  txCause: {
    fontWeight: 700, fontSize: 14, color: "#1e293b",
  },
  txDate: {
    fontSize: 12, color: "#94a3b8", marginTop: 2,
  },
  txAmount: {
    fontWeight: 700, fontSize: 15, color: "#1e293b", paddingRight: 16,
    whiteSpace: "nowrap" as const,
  },
  causeRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 12px", marginBottom: 8,
    background: "#f8fafc", borderRadius: 10, margin: "0 12px 8px",
    overflow: "hidden",
  },
  causeBorder: {
    width: 4, alignSelf: "stretch", background: "#3b82f6", flexShrink: 0,
    borderRadius: "4px 0 0 4px",
  },
  causeIcon: {
    fontSize: 28, width: 48, height: 48, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  causeName: {
    fontWeight: 700, fontSize: 14, color: "#1e293b",
  },
  causeDate: {
    fontSize: 11, color: "#94a3b8", lineHeight: 1.4, marginTop: 2,
  },
  causePreset: {
    textAlign: "right" as const, padding: "12px 14px 12px 0", flexShrink: 0,
  },
  userRow: {
    display: "flex", alignItems: "center", flexWrap: "wrap" as const,
    background: "#f8fafc", borderRadius: 10, margin: "0 12px 8px",
    overflow: "hidden",
  },
  userBorder: {
    width: 4, alignSelf: "stretch", background: "#10b981", flexShrink: 0,
  },
  smallBtn: {
    background: "transparent", border: "1px solid #e2e8f0", borderRadius: 6,
    padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#64748b",
    cursor: "pointer",
  },
  iconBtnBlue: {
    width: 40, height: 40, borderRadius: 10, border: "none",
    background: "#3b82f6", color: "#fff", fontSize: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  iconBtnGreen: {
    width: 40, height: 40, borderRadius: 10, border: "none",
    background: "#10b981", color: "#fff", fontSize: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  footer: {
    textAlign: "center" as const, padding: "30px 0 20px",
  },
  footerLine: {
    height: 1, background: "linear-gradient(90deg, transparent, #cbd5e1, transparent)",
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 13, color: "#64748b", padding: "6px 0", cursor: "pointer",
  },
  bottomBar: {
    position: "fixed" as const, bottom: 0, left: 0, right: 0,
    background: "#fff", borderTop: "1px solid #e2e8f0",
    display: "flex", justifyContent: "space-around", alignItems: "center",
    padding: "8px 0 12px", zIndex: 1000,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
  },
  tabBtn: {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
    background: "transparent", border: "none", cursor: "pointer",
    padding: "4px 16px", fontFamily: "Inter, sans-serif",
  },
  overlay: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999, padding: 20,
  },
  modal: {
    background: "#fff", borderRadius: 20, padding: 24,
    width: 380, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8,
  },
  modalInput: {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b",
    boxSizing: "border-box" as const, outline: "none", marginBottom: 4,
  },
  modalCancel: {
    flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0",
    background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  modalConfirm: {
    flex: 1, padding: "12px", borderRadius: 10, border: "none",
    background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
};
