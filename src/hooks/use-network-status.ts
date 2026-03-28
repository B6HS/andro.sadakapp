import { useState, useEffect } from "react";
import { getPendingCount } from "@/lib/offline-storage";
import { onSyncUpdate } from "@/lib/sync-service";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Load pending count
    getPendingCount().then(setPendingCount);

    // Listen to sync updates
    const unsub = onSyncUpdate(setPendingCount);

    // Refresh pending count periodically
    const interval = setInterval(() => {
      getPendingCount().then(setPendingCount);
    }, 5000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsub();
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
