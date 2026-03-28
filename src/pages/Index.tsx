import { useSearchParams } from "react-router-dom";
import "../styles/sadaq-android.css";
// @ts-ignore
import BorneSA from "../lib/BorneSA_v2-2.jsx";
// @ts-ignore
import BorneIqraa from "../lib/BorneIqraa.jsx";

/**
 * Borne tactile : route canonique **`/borne`** (APK, prod). Variantes : `?app=sa` (défaut) ou `?app=iqraa`.
 * Dev : `http://localhost:8787/android/iqraa/borne` (slug = association)
 */
export default function Index() {
  const [params] = useSearchParams();
  const app = (params.get("app") || "sa").toLowerCase();
  if (app === "iqraa") return <BorneIqraa />;
  return <BorneSA />;
}
