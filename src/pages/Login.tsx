import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TENANT_SLUG } from "@/lib/brand";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err, isSuperAdmin } = await signIn(email, password);
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : err.message
      );
      setLoading(false);
      return;
    }

    if (isSuperAdmin) {
      navigate("/admin-portal");
      setLoading(false);
      return;
    }

    if (tenantSlug) {
      navigate(`/${tenantSlug}/admin`);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: bu } = await supabase
      .from("borne_users")
      .select("borne_id")
      .eq("user_id", user.id)
      .limit(1);

    const bid = bu?.[0]?.borne_id;
    if (bid) {
      const { data: br } = await supabase.from("bornes").select("tenant_id").eq("id", bid).maybeSingle();
      if (br?.tenant_id) {
        const { data: tn } = await supabase.from("tenants").select("slug").eq("id", br.tenant_id).maybeSingle();
        if (tn?.slug) {
          navigate(`/${tn.slug}/admin`);
          setLoading(false);
          return;
        }
      }
    }

    navigate(`/${DEFAULT_TENANT_SLUG}/admin`);
    setLoading(false);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ width: 320, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span
            style={{
              fontFamily: "'Scheherazade New', serif",
              fontSize: 36,
              fontWeight: 700,
              color: "#10b981",
              direction: "rtl" as const,
            }}
          >
            صدقة
          </span>
        </div>

        {tenantSlug && (
          <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
            Association : <strong style={{ color: "#94a3b8" }}>{tenantSlug}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                color: "#f87171",
                fontSize: 13,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid #1a1a1a",
              padding: "14px 0",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              marginBottom: 8,
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#10b981")}
            onBlur={(e) => (e.target.style.borderBottomColor = "#1a1a1a")}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid #1a1a1a",
              padding: "14px 0",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              marginBottom: 32,
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#10b981")}
            onBlur={(e) => (e.target.style.borderBottomColor = "#1a1a1a")}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "#10b981",
              color: "#000",
              border: "none",
              borderRadius: 50,
              padding: 14,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: loading ? 0.4 : 1,
            }}
          >
            {loading ? "…" : "Connexion"}
          </button>
        </form>
      </div>
    </div>
  );
}
