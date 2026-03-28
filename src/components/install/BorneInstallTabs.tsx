import type { ReactNode } from "react";
import { Download, CheckCircle, Smartphone, Share, MoreVertical, Monitor, CreditCard, Wifi } from "lucide-react";
import type { BeforeInstallPromptEvent } from "@/hooks/use-pwa-install";
import { getPublicAppUrl } from "@/lib/public-urls";

export type InstallTabType = "tpe" | "mobile";

type Props = {
  /** URL affichée dans l'étape « allez sur … » (ex: /install ou /auto-install) */
  installPath: string;
  activeTab: InstallTabType;
  onTabChange: (tab: InstallTabType) => void;
  isInstalled: boolean;
  isIOS: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
  /** Route /auto-install : focus le bouton dès que l'invite PWA est prête */
  autoFocusInstallButton?: boolean;
};

export function BorneInstallTabs({
  installPath,
  activeTab,
  onTabChange,
  isInstalled,
  isIOS,
  deferredPrompt,
  onInstallClick,
  autoFocusInstallButton = false,
}: Props) {
  const fullInstallUrl = getPublicAppUrl(installPath);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "rgba(16, 185, 129, 0.05)",
          borderRadius: 12,
          padding: 4,
          border: "1px solid rgba(16, 185, 129, 0.1)",
        }}
      >
        <TabButton
          active={activeTab === "tpe"}
          onClick={() => onTabChange("tpe")}
          icon={<CreditCard size={16} />}
          label="Terminal myPOS"
        />
        <TabButton
          active={activeTab === "mobile"}
          onClick={() => onTabChange("mobile")}
          icon={<Smartphone size={16} />}
          label="Mobile / Tablette"
        />
      </div>

      {activeTab === "tpe" ? (
        <TPEInstall fullInstallUrl={fullInstallUrl} />
      ) : (
        <MobileInstall
          isInstalled={isInstalled}
          isIOS={isIOS}
          deferredPrompt={deferredPrompt}
          onInstallClick={onInstallClick}
          autoFocusInstallButton={autoFocusInstallButton}
        />
      )}
    </>
  );
}

/* ─── TPE myPOS Installation ─── */
export function TPEInstall({ fullInstallUrl }: { fullInstallUrl: string }) {
  return (
    <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: 16,
          padding: "1.25rem",
        }}
      >
        <p style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>
          📋 Prérequis
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Step n={1} icon={<CreditCard size={18} color="#10b981" />} text="Terminal myPOS Smart (Android)" />
          <Step n={2} icon={<Wifi size={18} color="#10b981" />} text="Connexion Wi-Fi ou 4G active" />
          <Step n={3} icon={<Monitor size={18} color="#10b981" />} text="Accès au portail admin sadaq.app/android" />
        </div>
      </div>

      <div
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: 16,
          padding: "1.25rem",
        }}
      >
        <p style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>
          🔧 Installation sur le TPE
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Step n={1} icon={<Monitor size={18} color="#10b981" />} text="Ouvrez le navigateur Chrome sur le TPE" />
          <Step
            n={2}
            icon={<Wifi size={18} color="#10b981" />}
            text={
              <>
                Allez sur <strong style={{ wordBreak: "break-all" }}>{fullInstallUrl}</strong>
              </>
            }
          />
          <Step n={3} icon={<Download size={18} color="#10b981" />} text='Appuyez sur "Installer l&apos;application"' />
          <Step n={4} icon={<CheckCircle size={18} color="#10b981" />} text="L'app se lance en mode kiosque plein écran" />
        </div>
      </div>

      <div
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: 16,
          padding: "1.25rem",
        }}
      >
        <p style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>
          ⚙️ Configuration
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Step n={1} icon={<Monitor size={18} color="#10b981" />} text="Connectez-vous avec vos identifiants admin" />
          <Step n={2} icon={<CreditCard size={18} color="#10b981" />} text="Sélectionnez votre borne dans le dashboard" />
          <Step n={3} icon={<CheckCircle size={18} color="#10b981" />} text="Les paiements CB sont automatiquement activés" />
        </div>
      </div>

      <div
        style={{
          background: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.2)",
          borderRadius: 12,
          padding: "1rem",
          fontSize: "0.8rem",
          color: "#fbbf24",
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Paiement CB :</strong> Le SDK myPOS est intégré nativement. Les paiements par carte bancaire fonctionnent
        automatiquement sur les terminaux myPOS Smart.
      </div>
    </div>
  );
}

function MobileInstall({
  isInstalled,
  isIOS,
  deferredPrompt,
  onInstallClick,
  autoFocusInstallButton,
}: {
  isInstalled: boolean;
  isIOS: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
  autoFocusInstallButton: boolean;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {isInstalled ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <CheckCircle size={48} color="#10b981" />
          <p style={{ fontSize: "1.125rem", color: "#10b981", fontWeight: 600 }}>Application installée ✓</p>
          <p style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "center" }}>
            Ouvrez l'application depuis votre écran d'accueil
          </p>
        </div>
      ) : deferredPrompt ? (
        <button
          type="button"
          autoFocus={autoFocusInstallButton}
          onClick={onInstallClick}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "1rem 2rem",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            fontSize: "1.125rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1.03)";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLElement).style.transform = "scale(1)";
          }}
        >
          <Download size={24} />
          Installer l'application
        </button>
      ) : isIOS ? (
        <div
          style={{
            width: "100%",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 16,
            padding: "1.5rem",
          }}
        >
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", textAlign: "center" }}>
            Installation sur iPhone / iPad
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Step n={1} icon={<Share size={20} color="#10b981" />} text='Appuyez sur le bouton "Partager"' />
            <Step n={2} icon={<Smartphone size={20} color="#10b981" />} text={"Sur l'écran d'accueil"} />
            <Step n={3} icon={<CheckCircle size={20} color="#10b981" />} text='Appuyez sur "Ajouter"' />
          </div>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 16,
            padding: "1.5rem",
          }}
        >
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", textAlign: "center" }}>
            Installation sur Android
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Step n={1} icon={<MoreVertical size={20} color="#10b981" />} text="Ouvrez le menu du navigateur (⋮)" />
            <Step n={2} icon={<Download size={20} color="#10b981" />} text={"Installer l'application"} />
            <Step n={3} icon={<CheckCircle size={20} color="#10b981" />} text='Confirmez "Installer"' />
          </div>
        </div>
      )}
    </div>
  );
}

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "0.6rem 1rem",
      borderRadius: 10,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.8rem",
      fontWeight: 600,
      transition: "all 0.2s",
      background: active ? "rgba(16, 185, 129, 0.2)" : "transparent",
      color: active ? "#10b981" : "#64748b",
      boxShadow: active ? "0 2px 8px rgba(16, 185, 129, 0.15)" : "none",
    }}
  >
    {icon}
    {label}
  </button>
);

const Step = ({ n, icon, text }: { n: number; icon: ReactNode; text: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
      <strong style={{ color: "#10b981" }}>{n}.</strong> {text}
    </span>
  </div>
);
