"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Diamkan -- aplikasi tetap jalan normal tanpa service worker,
        // cuma tidak "installable" sebagai PWA.
      });
    }
  }, []);
  return null;
}
