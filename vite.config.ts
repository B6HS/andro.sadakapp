import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

/** Ex. `/` pour https://andro.sadak.app/ ou `/android/` pour chemin sur sadaq.app */
function normalizeBase(raw: string): string {
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const baseRaw =
    process.env.VITE_BASE_PATH ?? fileEnv.VITE_BASE_PATH ?? "/android/";
  const base = normalizeBase(baseRaw);

  return {
  base,
  server: {
    host: "::",
    /** Port dev local — ouvrir http://localhost:8787/android/ */
    port: 8787,
    strictPort: false,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/icon-192.png", "icons/icon-512.png"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/oeczfyzawjkfnfnncgxz\.supabase\.co\/rest\/v1\/causes/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "causes-api-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/oeczfyzawjkfnfnncgxz\.supabase\.co\/rest\/v1\/settings/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "settings-api-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      manifest: {
        name: "Sadaq — Borne de don",
        short_name: "Sadaq",
        description: "Borne de don — myPOS · mode hors-ligne",
        scope: base,
        theme_color: "#10b981",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "./borne",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};
});
