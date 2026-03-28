import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  /** Déployé sous https://sadaq.app/android/ */
  base: "/android/",
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
        name: "sadaq.app/android — Borne de don",
        short_name: "sadaq.app/android",
        description: "Borne de don — sadaq.app/android · myPOS · mode hors-ligne",
        scope: "/android/",
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
}));
