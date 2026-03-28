import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  {
    id: "start",
    icon: "🚀",
    title: "Démarrage de la borne",
    steps: [
      "Branchez la borne sur secteur (câble USB-C fourni)",
      "Allumez la tablette en maintenant le bouton power 3 secondes",
      "Attendez l'affichage de l'écran d'accueil (~30 secondes)",
      "Allumez le terminal de paiement (TPE)",
      "Vérifiez que les deux appareils sont sous tension",
    ],
  },
  {
    id: "wifi",
    icon: "📡",
    title: "Connexion au réseau",
    steps: [
      "Accédez aux Paramètres Android > WiFi",
      "Sélectionnez votre réseau WiFi et entrez le mot de passe",
      "Vérifiez que le signal est stable (au moins 3 barres)",
      "Alternativement : branchez un câble Ethernet via adaptateur USB-C",
      "Testez la connexion en ouvrant le navigateur",
    ],
    tip: "💡 Le WiFi 5 GHz est recommandé pour une meilleure stabilité. Si possible, utilisez un câble Ethernet.",
  },
  {
    id: "app",
    icon: "📱",
    title: "Lancement de l'application",
    steps: [
      "Ouvrez l'application sadaq.app/android sur la tablette",
      "L'écran de don s'affiche automatiquement",
      "Vérifiez que les causes apparaissent correctement",
      "Testez le défilement entre les causes",
      "Vérifiez que les montants de don sont affichés",
    ],
  },
  {
    id: "causes",
    icon: "🎯",
    title: "Personnalisation des causes",
    steps: [
      "Connectez-vous au Dashboard Admin (bouton ⚙️)",
      "Rendez-vous dans l'onglet « Causes »",
      "Ajoutez vos causes : nom, icône, objectif de collecte",
      "Activez/désactivez les causes selon vos besoins",
      "Les causes mises à jour s'affichent en temps réel sur la borne",
    ],
    tip: "💡 Vous pouvez avoir jusqu'à 10 causes actives simultanément. Les donateurs verront les causes actives sur l'écran principal.",
  },
  {
    id: "dashboard",
    icon: "📊",
    title: "Gestion du Dashboard",
    steps: [
      "Accédez au Dashboard depuis n'importe quel navigateur",
      "Consultez les statistiques de dons en temps réel",
      "Exportez les rapports de dons (CSV/PDF)",
      "Gérez les utilisateurs ayant accès au dashboard",
      "Configurez les notifications de dons",
    ],
    tip: "💡 Le dashboard est accessible sur mobile et tablette. Ajoutez-le en favori pour un accès rapide.",
  },
  {
    id: "payment",
    icon: "💳",
    title: "Premier don test",
    steps: [
      "Sur la borne, sélectionnez une cause",
      "Choisissez un montant (ex: 1€ pour le test)",
      "Approchez la carte bancaire sur le TPE",
      "Attendez la confirmation « Paiement accepté »",
      "Vérifiez que le don apparaît dans le Dashboard",
      "Si le TPE ne répond pas, redémarrez-le et réessayez",
    ],
  },
  {
    id: "troubleshoot",
    icon: "🔧",
    title: "Dépannage",
    steps: [],
    faq: [
      { q: "La borne ne s'allume pas", a: "Vérifiez le câble d'alimentation et la prise secteur. Essayez un autre câble USB-C." },
      { q: "Pas de connexion WiFi", a: "Rapprochez la borne du routeur. Vérifiez le mot de passe WiFi. Redémarrez le routeur." },
      { q: "Le TPE ne se connecte pas", a: "Redémarrez le TPE. Vérifiez le Bluetooth/câble USB. Re-appairez depuis les paramètres." },
      { q: "Le paiement est refusé", a: "Vérifiez la connexion réseau du TPE. Essayez avec une autre carte. Contactez le support." },
      { q: "Les causes ne s'affichent pas", a: "Vérifiez la connexion Internet. Rafraîchissez l'app. Vérifiez que les causes sont activées dans le dashboard." },
      { q: "L'écran reste noir", a: "Maintenez le bouton power 10 sec pour forcer le redémarrage. Vérifiez la batterie." },
    ],
  },
] as const;

export default function ClientTutorial() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (loading) return <div style={st.loading}>Chargement…</div>;
  if (!user || !isAdmin) { navigate("/login"); return null; }

  const section = SECTIONS[activeSection];
  const totalSteps = SECTIONS.reduce((sum, s) => sum + s.steps.length, 0);
  const doneSteps = Object.values(completedSteps).filter(Boolean).length;
  const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const toggleStep = (key: string) =>
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={st.container}>
      {/* Header */}
      <div style={st.header}>
        <button style={st.backBtn} onClick={() => navigate("/admin")}>← Dashboard</button>
        <h1 style={st.h1}>📖 Guide de Démarrage</h1>
        <span style={st.badge}>{progress}% complété</span>
      </div>

      {/* Progress */}
      <div style={st.progressTrack}>
        <div style={{ ...st.progressFill, width: `${progress}%` }} />
      </div>

      {/* Section tabs */}
      <div style={st.tabs}>
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            style={{
              ...st.tab,
              background: i === activeSection ? "rgba(16,185,129,0.15)" : "transparent",
              borderColor: i === activeSection ? "#10b981" : "rgba(16,185,129,0.1)",
              color: i === activeSection ? "#10b981" : "#6b9e8a",
            }}
            onClick={() => setActiveSection(i)}
          >
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={st.card}>
        <h2 style={st.h2}>{section.icon} {section.title}</h2>

        {section.steps.length > 0 && (
          <div style={st.stepList}>
            {section.steps.map((text, i) => {
              const key = `${section.id}-${i}`;
              const done = !!completedSteps[key];
              return (
                <button key={key} style={st.stepRow} onClick={() => toggleStep(key)}>
                  <span style={{
                    ...st.stepCheck,
                    background: done ? "#10b981" : "transparent",
                    borderColor: done ? "#10b981" : "rgba(16,185,129,0.3)",
                  }}>
                    {done && "✓"}
                  </span>
                  <span style={{
                    ...st.stepNum,
                    background: done ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.08)",
                  }}>{i + 1}</span>
                  <span style={{
                    color: done ? "#6b9e8a" : "#e2e8f0",
                    textDecoration: done ? "line-through" : "none",
                    fontSize: 14, lineHeight: 1.6, textAlign: "left" as const,
                  }}>{text}</span>
                </button>
              );
            })}
          </div>
        )}

        {"tip" in section && section.tip && (
          <div style={st.tipBox}>{section.tip}</div>
        )}

        {"faq" in section && section.faq && (
          <div style={st.faqList}>
            {section.faq.map((item, i) => (
              <div key={i} style={st.faqItem}>
                <button
                  style={st.faqQuestion}
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <span style={{ color: "#fcd34d", marginRight: 8 }}>⚠️</span>
                  <span style={{ flex: 1, textAlign: "left" as const }}>{item.q}</span>
                  <span style={{ color: "#6b9e8a", fontSize: 18 }}>
                    {expandedFaq === i ? "−" : "+"}
                  </span>
                </button>
                {expandedFaq === i && (
                  <div style={st.faqAnswer}>✅ {item.a}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={st.nav}>
        <button
          style={activeSection === 0 ? st.navBtnDisabled : st.navBtn}
          disabled={activeSection === 0}
          onClick={() => setActiveSection(s => s - 1)}
        >
          ← Précédent
        </button>
        <span style={{ color: "#6b9e8a", fontSize: 13 }}>
          {activeSection + 1} / {SECTIONS.length}
        </span>
        {activeSection < SECTIONS.length - 1 ? (
          <button style={st.navBtnPrimary} onClick={() => setActiveSection(s => s + 1)}>
            Suivant →
          </button>
        ) : (
          <button style={st.navBtnPrimary} onClick={() => navigate("/admin")}>
            Retour au Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  container: {
    width: "100%", minHeight: "100vh", background: "#000",
    fontFamily: "'Inter', sans-serif", color: "#e2e8f0",
    padding: "24px 32px", maxWidth: 960, margin: "0 auto",
  },
  loading: {
    width: "100%", height: "100vh", background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#10b981", fontFamily: "Inter, sans-serif",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  backBtn: {
    background: "rgba(16,185,129,0.1)", color: "#10b981",
    border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8,
    padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  h1: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  h2: { fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 20px" },
  badge: {
    background: "rgba(16,185,129,0.1)", color: "#10b981",
    borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700,
  },
  progressTrack: {
    height: 4, borderRadius: 4, background: "rgba(16,185,129,0.1)",
    marginBottom: 20, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 4,
    background: "linear-gradient(90deg, #10b981, #34d399)",
    transition: "width 0.4s ease",
  },
  tabs: {
    display: "flex", gap: 8, marginBottom: 24, overflowX: "auto" as const,
    paddingBottom: 4,
  },
  tab: {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    gap: 4, padding: "10px 14px", borderRadius: 12,
    border: "1px solid rgba(16,185,129,0.1)", cursor: "pointer",
    background: "transparent", minWidth: 80, transition: "all 0.2s",
  },
  card: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 16, padding: 28, marginBottom: 24, minHeight: 320,
  },
  stepList: { display: "flex", flexDirection: "column" as const, gap: 8 },
  stepRow: {
    display: "flex", gap: 12, alignItems: "center", padding: "12px 16px",
    borderRadius: 12, background: "rgba(16,185,129,0.03)",
    border: "1px solid rgba(16,185,129,0.08)", cursor: "pointer",
    transition: "all 0.2s", width: "100%",
  },
  stepCheck: {
    width: 24, height: 24, borderRadius: 6,
    border: "2px solid rgba(16,185,129,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#000", flexShrink: 0,
    transition: "all 0.2s",
  },
  stepNum: {
    minWidth: 28, height: 28, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "#10b981", flexShrink: 0,
  },
  tipBox: {
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 12, padding: 16, fontSize: 13, color: "#93c5fd",
    lineHeight: 1.6, marginTop: 20,
  },
  faqList: { display: "flex", flexDirection: "column" as const, gap: 8 },
  faqItem: {
    borderRadius: 12, border: "1px solid rgba(16,185,129,0.1)",
    overflow: "hidden",
  },
  faqQuestion: {
    width: "100%", display: "flex", alignItems: "center", gap: 8,
    padding: "14px 16px", background: "rgba(245,158,11,0.04)",
    border: "none", cursor: "pointer", color: "#e2e8f0",
    fontSize: 14, fontWeight: 600,
  },
  faqAnswer: {
    padding: "12px 16px 14px 44px", background: "rgba(16,185,129,0.04)",
    color: "#6ee7b7", fontSize: 13, lineHeight: 1.6,
  },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  navBtn: {
    background: "rgba(16,185,129,0.1)", color: "#10b981",
    border: "1px solid rgba(16,185,129,0.3)", borderRadius: 50,
    padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  navBtnPrimary: {
    background: "#10b981", color: "#000", border: "none", borderRadius: 50,
    padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 0 20px rgba(16,185,129,0.3)",
  },
  navBtnDisabled: {
    background: "rgba(16,185,129,0.05)", color: "#2d4a3e",
    border: "1px solid rgba(16,185,129,0.1)", borderRadius: 50,
    padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "not-allowed",
  },
};
