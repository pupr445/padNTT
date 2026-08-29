"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { getAllMutations, syncPendingMutations, type PendingMutation } from "./offline-queue";

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState<PendingMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    try {
      setPending(await getAllMutations());
    } catch {
      // IndexedDB tidak tersedia (mode privat/browser lama) -- diamkan,
      // form tetap jalan normal, cuma tanpa antrean offline.
    }
  }, []);

  const sync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setSyncing(true);
    try {
      await syncPendingMutations(supabase);
    } catch {
      // biarkan, akan dicoba lagi di kesempatan berikutnya
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [refresh, supabase]);

  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    refresh();
    sync();

    function handleOnline() {
      setIsOnline(true);
      sync();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    // Jaga-jaga: cek antrean berkala, untuk kasus koneksi "menyala" tapi
    // browser tidak selalu kirim event online yang akurat (umum di HP).
    const interval = setInterval(() => {
      if (navigator.onLine) sync();
      else refresh();
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pending, syncing, syncNow: sync, refresh };
}
