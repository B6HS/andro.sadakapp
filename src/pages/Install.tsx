import { useState } from "react";
import { BorneInstallTabs } from "@/components/install/BorneInstallTabs";
import type { InstallTabType } from "@/components/install/BorneInstallTabs";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const Install = () => {
  const { deferredPrompt, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<InstallTabType>("tpe");

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
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        SADAKA
      </h1>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#64748b",
          marginBottom: "1.5rem",
        }}
      >
        Installation de la borne
      </p>

      <BorneInstallTabs
        installPath="/install"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isInstalled={isInstalled}
        isIOS={isIOS}
        deferredPrompt={deferredPrompt}
        onInstallClick={() => void promptInstall()}
      />

      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.75rem",
          color: "#334155",
          textAlign: "center",
        }}
      >
        Fonctionne hors-ligne • Aucune donnée collectée
      </p>
    </div>
  );
};

export default Install;
