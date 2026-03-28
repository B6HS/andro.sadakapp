import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type TPEBrand = "mypos" | "ingenico" | "sumup" | null;

const STEPS = [
  { id: "welcome", title: "Bienvenue", icon: "🎯" },
  { id: "unbox", title: "Déballage", icon: "📦" },
  { id: "tpe", title: "Choix du TPE", icon: "💳" },
  { id: "hardware", title: "Montage", icon: "🔧" },
  { id: "network", title: "Réseau", icon: "📡" },
  { id: "power", title: "Mise sous tension", icon: "⚡" },
  { id: "pairing", title: "Appairage TPE", icon: "🔗" },
  { id: "done", title: "Terminé", icon: "✅" },
] as const;

const TPE_OPTIONS: { brand: TPEBrand; name: string; icon: string; desc: string }[] = [
  { brand: "mypos", name: "MyPOS", icon: "💳", desc: "Terminal Android avec app intégrée. Connexion Bluetooth/WiFi." },
  { brand: "ingenico", name: "Ingenico", icon: "🏦", desc: "Terminal professionnel Telium/TETRA. Connexion USB/Ethernet." },
  { brand: "sumup", name: "SumUp", icon: "📱", desc: "Terminal compact Bluetooth. Idéal pour les petites installations." },
];

export default function InstallationGuide() {
  const { user, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedTPE, setSelectedTPE] = useState<TPEBrand>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  if (loading) return <div style={s.loading}>Chargement…</div>;
  if (!user || !isSuperAdmin) { navigate("/login"); return null; }

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const toggleCheck = (key: string) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }));

  const canNext = () => {
    if (currentStep.id === "tpe") return !!selectedTPE;
    return true;
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate("/admin-portal")}>← Portail</button>
        <h1 style={s.h1}>📋 Guide d'Installation</h1>
        <span style={s.stepCount}>Étape {step + 1}/{STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* Step indicators */}
      <div style={s.stepIndicators}>
        {STEPS.map((st, i) => (
          <button
            key={st.id}
            style={{
              ...s.stepDot,
              background: i <= step ? "#10b981" : "rgba(16,185,129,0.15)",
              color: i <= step ? "#000" : "#6b9e8a",
              cursor: i <= step ? "pointer" : "default",
            }}
            onClick={() => i <= step && setStep(i)}
          >
            {st.icon}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={s.card}>
        <h2 style={s.h2}>{currentStep.icon} {currentStep.title}</h2>

        {currentStep.id === "welcome" && (
          <div>
            <p style={s.text}>
              Bienvenue dans l'assistant d'installation <strong>sadaq.app/android</strong>. 
              Ce guide vous accompagnera étape par étape pour mettre en service votre borne de don.
            </p>
            <div style={s.infoBox}>
              <strong>📌 Avant de commencer, assurez-vous d'avoir :</strong>
              <ul style={s.ul}>
                <li>La tablette (Android 10+ recommandé)</li>
                <li>Le terminal de paiement (MyPOS, Ingenico ou SumUp)</li>
                <li>Le support/socle de la borne</li>
                <li>Les câbles d'alimentation</li>
                <li>Un accès WiFi ou câble Ethernet</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep.id === "unbox" && (
          <div>
            <p style={s.text}>Vérifiez le contenu du pack et cochez chaque élément :</p>
            <div style={s.checklistGrid}>
              {[
                "Tablette Android",
                "Câble USB-C + chargeur",
                "Support/socle borne",
                "Terminal de paiement (TPE)",
                "Câble TPE (USB/Bluetooth)",
                "Câble Ethernet (si filaire)",
                "Notice rapide",
                "Autocollants QR code",
              ].map(item => (
                <label key={item} style={s.checkItem} onClick={() => toggleCheck(item)}>
                  <span style={{
                    ...s.checkbox,
                    background: checklist[item] ? "#10b981" : "transparent",
                    borderColor: checklist[item] ? "#10b981" : "rgba(16,185,129,0.3)",
                  }}>
                    {checklist[item] && "✓"}
                  </span>
                  <span style={{ color: checklist[item] ? "#10b981" : "#e2e8f0" }}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep.id === "tpe" && (
          <div>
            <p style={s.text}>Sélectionnez le terminal de paiement à installer :</p>
            <div style={s.tpeGrid}>
              {TPE_OPTIONS.map(opt => (
                <button
                  key={opt.brand}
                  style={{
                    ...s.tpeCard,
                    borderColor: selectedTPE === opt.brand ? "#10b981" : "rgba(16,185,129,0.15)",
                    background: selectedTPE === opt.brand ? "rgba(16,185,129,0.08)" : "#0d140d",
                  }}
                  onClick={() => setSelectedTPE(opt.brand)}
                >
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{opt.name}</div>
                  <div style={{ fontSize: 12, color: "#6b9e8a", lineHeight: 1.5 }}>{opt.desc}</div>
                  {selectedTPE === opt.brand && <div style={s.selectedBadge}>✓ Sélectionné</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep.id === "hardware" && (
          <div>
            <h3 style={s.h3}>🔧 Montage physique de la borne</h3>
            <div style={s.instructions}>
              <Step n={1} text="Fixez le socle/support sur la surface prévue (comptoir, mur, pupitre)" />
              <Step n={2} text="Insérez la tablette dans le support. Assurez-vous qu'elle est bien clipsée." />
              <Step n={3} text="Branchez le câble d'alimentation de la tablette (USB-C) vers le chargeur" />
              {selectedTPE === "mypos" && (
                <>
                  <Step n={4} text="Placez le terminal MyPOS à côté ou sous la tablette" />
                  <Step n={5} text="Branchez le MyPOS sur secteur via son propre chargeur" />
                </>
              )}
              {selectedTPE === "ingenico" && (
                <>
                  <Step n={4} text="Fixez le terminal Ingenico sur son support dédié" />
                  <Step n={5} text="Connectez le câble USB entre la tablette et le terminal" />
                  <Step n={6} text="Branchez l'alimentation du terminal Ingenico" />
                </>
              )}
              {selectedTPE === "sumup" && (
                <>
                  <Step n={4} text="Chargez le terminal SumUp avant l'installation (batterie intégrée)" />
                  <Step n={5} text="Placez le SumUp dans le cradle/support prévu" />
                </>
              )}
            </div>
            <div style={s.warningBox}>
              ⚠️ Ne mettez pas sous tension avant d'avoir terminé le câblage réseau.
            </div>
          </div>
        )}

        {currentStep.id === "network" && (
          <div>
            <h3 style={s.h3}>📡 Configuration réseau</h3>
            <div style={s.tabs}>
              <div style={s.tabSection}>
                <h4 style={s.h4}>🌐 Option A — WiFi</h4>
                <div style={s.instructions}>
                  <Step n={1} text="Allumez la tablette et accédez aux Paramètres > WiFi" />
                  <Step n={2} text="Connectez-vous au réseau WiFi du client" />
                  <Step n={3} text="Vérifiez que le signal est stable (au moins 3 barres)" />
                </div>
              </div>
              <div style={s.tabSection}>
                <h4 style={s.h4}>🔌 Option B — Ethernet (recommandé)</h4>
                <div style={s.instructions}>
                  <Step n={1} text="Branchez le câble Ethernet dans la tablette (via adaptateur USB-C si nécessaire)" />
                  <Step n={2} text="La connexion doit être automatique" />
                  <Step n={3} text="Vérifiez dans Paramètres > Réseau que 'Ethernet connecté' apparaît" />
                </div>
              </div>
            </div>
            {selectedTPE === "mypos" && (
              <div style={s.infoBox}>
                <strong>MyPOS :</strong> Le terminal utilise sa propre carte SIM 4G intégrée. 
                Assurez-vous que la couverture réseau est suffisante.
              </div>
            )}
            {selectedTPE === "sumup" && (
              <div style={s.infoBox}>
                <strong>SumUp :</strong> Le terminal se connecte via Bluetooth à la tablette. 
                Activez le Bluetooth sur la tablette.
              </div>
            )}
          </div>
        )}

        {currentStep.id === "power" && (
          <div>
            <h3 style={s.h3}>⚡ Mise sous tension</h3>
            <div style={s.instructions}>
              <Step n={1} text="Branchez l'alimentation de la tablette" />
              <Step n={2} text="Allumez la tablette (bouton power)" />
              <Step n={3} text={`Allumez le terminal ${selectedTPE === "mypos" ? "MyPOS" : selectedTPE === "ingenico" ? "Ingenico" : "SumUp"}`} />
              <Step n={4} text="Attendez le démarrage complet (~30 secondes)" />
              <Step n={5} text="Vérifiez que la connexion réseau est active" />
            </div>
            <div style={s.successBox}>
              ✅ La tablette doit afficher l'écran d'accueil Android. 
              Le terminal doit afficher son écran de veille.
            </div>
          </div>
        )}

        {currentStep.id === "pairing" && (
          <div>
            <h3 style={s.h3}>🔗 Appairage du TPE avec la borne</h3>
            {selectedTPE === "mypos" && (
              <div style={s.instructions}>
                <Step n={1} text="Sur le MyPOS, lancez l'application sadaq.app/android (pré-installée)" />
                <Step n={2} text="Notez le Terminal ID affiché sur l'écran MyPOS" />
                <Step n={3} text="Sur la tablette, ouvrez sadaq.app/android > Paramètres > Terminal" />
                <Step n={4} text="Entrez le Terminal ID du MyPOS" />
                <Step n={5} text="Lancez un paiement test de 0,01€ pour vérifier la connexion" />
                <Step n={6} text="Validez que le paiement apparaît dans l'historique" />
              </div>
            )}
            {selectedTPE === "ingenico" && (
              <div style={s.instructions}>
                <Step n={1} text="Vérifiez que le câble USB est bien connecté" />
                <Step n={2} text="Sur la tablette, un pop-up de connexion USB doit apparaître" />
                <Step n={3} text="Autorisez la connexion USB" />
                <Step n={4} text="Ouvrez sadaq.app/android > Paramètres > Terminal" />
                <Step n={5} text="Le terminal Ingenico doit apparaître comme 'Connecté'" />
                <Step n={6} text="Lancez un paiement test de 0,01€" />
                <Step n={7} text="Vérifiez que le montant s'affiche sur le terminal Ingenico" />
              </div>
            )}
            {selectedTPE === "sumup" && (
              <div style={s.instructions}>
                <Step n={1} text="Activez le Bluetooth sur la tablette" />
                <Step n={2} text="Allumez le terminal SumUp (bouton power 3 sec)" />
                <Step n={3} text="Sur la tablette, ouvrez sadaq.app/android > Paramètres > Terminal" />
                <Step n={4} text="Appuyez sur 'Rechercher un terminal Bluetooth'" />
                <Step n={5} text="Sélectionnez le SumUp dans la liste" />
                <Step n={6} text="Validez l'appairage sur les deux appareils" />
                <Step n={7} text="Lancez un paiement test de 0,01€" />
              </div>
            )}
            <div style={s.warningBox}>
              ⚠️ Si le paiement test échoue, vérifiez la connexion réseau et redémarrez les deux appareils.
            </div>
          </div>
        )}

        {currentStep.id === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h3 style={{ ...s.h3, fontSize: 22, textAlign: "center" }}>Installation terminée !</h3>
            <p style={s.text}>
              La borne <strong>sadaq.app/android</strong> est prête avec le terminal <strong>
              {selectedTPE === "mypos" ? "MyPOS" : selectedTPE === "ingenico" ? "Ingenico" : "SumUp"}
              </strong>.
            </p>
            <div style={s.summaryBox}>
              <h4 style={s.h4}>📝 Récapitulatif</h4>
              <ul style={{ ...s.ul, textAlign: "left" }}>
                <li>✅ Pack déballé et vérifié</li>
                <li>✅ TPE : {selectedTPE === "mypos" ? "MyPOS" : selectedTPE === "ingenico" ? "Ingenico" : "SumUp"}</li>
                <li>✅ Montage physique effectué</li>
                <li>✅ Réseau configuré</li>
                <li>✅ Appareils sous tension</li>
                <li>✅ TPE appairé et testé</li>
              </ul>
            </div>
            <p style={{ ...s.text, marginTop: 16 }}>
              N'oubliez pas d'enregistrer cette borne dans le <strong>Portail Revendeur</strong> 
              avec le bon Terminal ID.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={s.nav}>
        <button
          style={isFirst ? s.navBtnDisabled : s.navBtn}
          disabled={isFirst}
          onClick={() => setStep(s => s - 1)}
        >
          ← Précédent
        </button>
        {!isLast ? (
          <button
            style={canNext() ? s.navBtnPrimary : s.navBtnDisabled}
            disabled={!canNext()}
            onClick={() => setStep(s => s + 1)}
          >
            Suivant →
          </button>
        ) : (
          <button style={s.navBtnPrimary} onClick={() => navigate("/admin-portal")}>
            Retour au portail
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
      <span style={{
        minWidth: 28, height: 28, borderRadius: "50%", background: "rgba(16,185,129,0.15)",
        color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>{n}</span>
      <span style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    width: "100%", minHeight: "100vh", background: "#000",
    fontFamily: "'Inter', sans-serif", color: "#e2e8f0", padding: "24px 32px", maxWidth: 900, margin: "0 auto",
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
    background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  h1: { fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 },
  h2: { fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 16px" },
  h3: { fontSize: 16, fontWeight: 600, color: "#fff", margin: "16px 0 12px" },
  h4: { fontSize: 14, fontWeight: 700, color: "#10b981", margin: "0 0 12px" },
  stepCount: { fontSize: 13, color: "#6b9e8a", fontWeight: 600 },
  progressTrack: {
    height: 4, borderRadius: 4, background: "rgba(16,185,129,0.1)", marginBottom: 16, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #10b981, #34d399)",
    transition: "width 0.4s ease",
  },
  stepIndicators: {
    display: "flex", justifyContent: "center", gap: 8, marginBottom: 24,
  },
  stepDot: {
    width: 40, height: 40, borderRadius: "50%", border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, transition: "all 0.3s",
  },
  card: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16,
    padding: 28, marginBottom: 24, minHeight: 300,
  },
  text: { color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 },
  ul: { color: "#e2e8f0", fontSize: 14, lineHeight: 2, paddingLeft: 20, margin: "8px 0" },
  infoBox: {
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 12, padding: 16, fontSize: 13, color: "#93c5fd", lineHeight: 1.6, marginTop: 16,
  },
  warningBox: {
    background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
    borderRadius: 12, padding: 16, fontSize: 13, color: "#fcd34d", lineHeight: 1.6, marginTop: 16,
  },
  successBox: {
    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 12, padding: 16, fontSize: 13, color: "#6ee7b7", lineHeight: 1.6, marginTop: 16,
  },
  summaryBox: {
    background: "#0d140d", border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 12, padding: 20, marginTop: 16, textAlign: "left" as const,
  },
  checklistGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12,
  },
  checkItem: {
    display: "flex", gap: 10, alignItems: "center", cursor: "pointer",
    padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.04)",
    border: "1px solid rgba(16,185,129,0.1)", fontSize: 13, transition: "all 0.2s",
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, border: "2px solid rgba(16,185,129,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#000", transition: "all 0.2s", flexShrink: 0,
  },
  tpeGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16,
  },
  tpeCard: {
    background: "#0d140d", border: "2px solid rgba(16,185,129,0.15)", borderRadius: 16,
    padding: 24, cursor: "pointer", textAlign: "center" as const, transition: "all 0.3s",
  },
  selectedBadge: {
    marginTop: 10, background: "rgba(16,185,129,0.15)", color: "#10b981",
    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, display: "inline-block",
  },
  instructions: { marginTop: 8 },
  tabs: { display: "flex", flexDirection: "column" as const, gap: 20, marginTop: 12 },
  tabSection: {
    background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.1)",
    borderRadius: 12, padding: 16,
  },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  navBtn: {
    background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 50, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  navBtnPrimary: {
    background: "#10b981", color: "#000", border: "none",
    borderRadius: 50, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer",
    boxShadow: "0 0 20px rgba(16,185,129,0.3)",
  },
  navBtnDisabled: {
    background: "rgba(16,185,129,0.05)", color: "#2d4a3e", border: "1px solid rgba(16,185,129,0.1)",
    borderRadius: 50, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "not-allowed",
  },
};
