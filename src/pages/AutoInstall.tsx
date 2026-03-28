import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BorneInstallTabs } from "@/components/install/BorneInstallTabs";
import type { InstallTabType } from "@/components/install/BorneInstallTabs";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { getAutoInstallUrl } from "@/lib/public-urls";

/**
 * URL dédiée « auto-install » : même parcours que /install avec chemin /auto-install
 * pour les TPE (bookmark) + focus PWA sur mobile/tablette lorsque l’invite est disponible.
 * L’admin super (/admin-portal) et le back-office borne (/admin) restent inchangés.
 */
export default function AutoInstall() {
  const [searchParams] = useSearchParams();
  const { deferredPrompt, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const autoInstallHref = getAutoInstallUrl();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(autoInstallHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const initialTab = useMemo<InstallTabType>(() => {
    const t = searchParams.get("tab");
    if (t === "tpe") return "tpe";
    if (t === "mobile") return "mobile";
    return "mobile";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<InstallTabType>(initialTab);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020a06 0%, #041a0e 50%, #020a06 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.5rem",
        fontFamily: "Inter, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: "linear-gradient(135deg, #0a1f15, #0d2818)",
          border: "2px solid #1a3a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
          marginTop: "1rem",
          boxShadow: "0 20px 60px rgba(16, 185, 129, 0.15)",
        }}
      >
        <span
          style={{
            fontFamily: "'Scheherazade New', serif",
            fontSize: 52,
            color: "#10b981",
            fontWeight: 700,
          }}
        >
          صدقة
        </span>
      </div>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: "0.25rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Auto-install
      </h1>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#64748b",
          marginBottom: "0.75rem",
          textAlign: "center",
          maxWidth: 420,
        }}
      >
        Ouvrez cette URL sur le terminal Android (myPOS) ou enregistrez-la en favori : installation PWA et guide TPE.
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          marginBottom: "1rem",
          padding: "1rem 1.1rem",
          borderRadius: 14,
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#10b981",
            marginBottom: "0.5rem",
          }}
        >
          Lien Android — auto-install
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#e2e8f0",
            wordBreak: "break-all",
            lineHeight: 1.45,
            marginBottom: "0.75rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
          }}
        >
          {autoInstallHref}
        </p>
        <button
          type="button"
          onClick={() => void copyLink()}
          style={{
            width: "100%",
            padding: "0.65rem 1rem",
            borderRadius: 10,
            border: "1px solid rgba(16, 185, 129, 0.45)",
            background: "rgba(16, 185, 129, 0.18)",
            color: "#6ee7b7",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? "Copié dans le presse-papiers" : "Copier le lien"}
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: 12,
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          fontSize: "0.78rem",
          color: "#94a3b8",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "#10b981" }}>Super-admin</strong> (utilisateurs, bornes, clés API) :{" "}
        <span style={{ wordBreak: "break-all" }}>/admin-portal</span>
        <br />
        <strong style={{ color: "#10b981" }}>Admin borne</strong> :{" "}
        <span style={{ wordBreak: "break-all" }}>ex. /android/iqraa/admin</span>
      </div>

      <BorneInstallTabs
        installPath="/auto-install"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isInstalled={isInstalled}
        isIOS={isIOS}
        deferredPrompt={deferredPrompt}
        onInstallClick={() => void promptInstall()}
        autoFocusInstallButton={activeTab === "mobile" && !!deferredPrompt && !isInstalled}
      />

      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.75rem",
          color: "#334155",
          textAlign: "center",
        }}
      >
        Chrome Android : l’invite d’installation suit un geste utilisateur — le bouton est pré-sélectionné.
      </p>
    </div>
  );
}
