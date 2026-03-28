import { useState } from "react";
import {
  isAndroidKioskWebView,
  isStandaloneDisplay,
  isWelcomeDone,
  saveWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/welcome-config";
import { PRODUCT_LABEL } from "@/lib/brand";

/**
 * Premier lancement après installation PWA (mode autonome) : message de bienvenue + réglages locaux.
 * Le SDK myPOS natif est fourni par l’APK Android (WebView + interface JavaScript).
 */
export default function WelcomeOnboarding() {
  const [open, setOpen] = useState(
    () => !isWelcomeDone() && (isStandaloneDisplay() || isAndroidKioskWebView())
  );
  const [orgName, setOrgName] = useState("");
  const [headline, setHeadline] = useState(`Bienvenue sur ${PRODUCT_LABEL}`);
  const [body, setBody] = useState(
    "Cette borne fonctionne hors connexion puis synchronise les dons vers le cloud. Le terminal myPOS est prêt une fois l’APK installée."
  );

  if (!open) return null;

  const submit = () => {
    const cfg: WelcomeConfig = {
      orgName: orgName.trim(),
      headline: headline.trim() || PRODUCT_LABEL,
      body: body.trim(),
    };
    saveWelcomeConfig(cfg);
    setOpen(false);
  };

  const skip = () => {
    saveWelcomeConfig({
      orgName: "",
      headline: PRODUCT_LABEL,
      body: "",
    });
    setOpen(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(2, 10, 6, 0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
          border: "1px solid rgba(16, 185, 129, 0.35)",
          background: "linear-gradient(180deg, #041a0e 0%, #020a06 100%)",
          padding: "1.5rem",
          color: "#e2e8f0",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.2em", color: "#10b981", marginBottom: "0.35rem" }}>
          SADAQ.APP
        </div>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.35rem", color: "#f8fafc" }}>Configuration de bienvenue</h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.5 }}>
          Application autonome : les dons hors-ligne sont envoyés en fin de journée et depuis l’admin (bouton Synchroniser).
          Sur TPE myPOS, le pont natif <strong style={{ color: "#10b981" }}>Android</strong> active les paiements CB.
        </p>

        <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>Nom de l’association (optionnel)</label>
        <input
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Ex. Association …"
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "0.75rem",
            padding: "0.65rem 0.75rem",
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f1f5f9",
            fontSize: "0.9rem",
          }}
        />

        <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>Titre affiché</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "0.75rem",
            padding: "0.65rem 0.75rem",
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f1f5f9",
            fontSize: "0.9rem",
          }}
        />

        <label style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginBottom: 4 }}>Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "1rem",
            padding: "0.65rem 0.75rem",
            borderRadius: 10,
            border: "1px solid #1e293b",
            background: "#0f172a",
            color: "#f1f5f9",
            fontSize: "0.875rem",
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={submit}
            style={{
              flex: 1,
              minWidth: 120,
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
            }}
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={skip}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "1px solid #334155",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              background: "transparent",
              color: "#94a3b8",
            }}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
