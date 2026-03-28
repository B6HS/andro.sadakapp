import { Navigate, useSearchParams } from "react-router-dom";
import Index from "./Index";
import Login from "./Login";
import { isAndroidKioskWebView, isStandaloneDisplay } from "@/lib/welcome-config";

/**
 * Entrée association `/:tenantSlug` :
 * - Navigateur → connexion (`login` relatif)
 * - `?borne=1` → force la borne (dev)
 * - WebView APK / PWA → redirection vers `borne`
 */
export default function HomeGate() {
  const [params] = useSearchParams();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const searchPart = search.startsWith("?") ? search.slice(1) : search;

  if (params.get("borne") === "1") {
    return <Index />;
  }

  if (typeof window !== "undefined") {
    if (isAndroidKioskWebView()) {
      return <Navigate to={searchPart ? `borne?${searchPart}` : "borne"} replace />;
    }
    if (isStandaloneDisplay()) {
      return <Navigate to={searchPart ? `borne?${searchPart}` : "borne"} replace />;
    }
  }

  return <Login />;
}
