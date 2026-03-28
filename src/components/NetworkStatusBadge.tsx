import { useNetworkStatus } from "@/hooks/use-network-status";

export default function NetworkStatusBadge() {
  const { isOnline, pendingCount } = useNetworkStatus();

  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end",
    }}>
      {/* Network status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: isOnline ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.2)",
        border: `1px solid ${isOnline ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.4)"}`,
        borderRadius: 20, padding: "6px 14px",
        backdropFilter: "blur(10px)",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isOnline ? "#10b981" : "#ef4444",
          boxShadow: `0 0 6px ${isOnline ? "#10b981" : "#ef4444"}`,
          animation: isOnline ? "none" : "pulse 1.5s infinite",
        }} />
        <span style={{
          fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif",
          color: isOnline ? "#10b981" : "#ef4444",
        }}>
          {isOnline ? "En ligne" : "Hors ligne"}
        </span>
      </div>

      {/* Pending sync badge */}
      {pendingCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(245,158,11,0.15)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 20, padding: "5px 12px",
          backdropFilter: "blur(10px)",
        }}>
          <span style={{ fontSize: 12 }}>⏳</span>
          <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: "Inter, sans-serif",
            color: "#f59e0b",
          }}>
            {pendingCount} don{pendingCount > 1 ? "s" : ""} en attente
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
