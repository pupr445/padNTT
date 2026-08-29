// =========================================================
// Antrean offline untuk form lapangan (objek PAD & tindak lanjut).
//
// Kenapa IndexedDB, bukan Background Sync API: Background Sync tidak
// didukung Safari/iOS (device yang sangat mungkin dipakai petugas
// lapangan), jadi tidak bisa diandalkan sendirian. Pendekatan di sini:
// simpan ke IndexedDB saat gagal kirim karena jaringan, lalu coba kirim
// ulang saat (a) event "online" browser menyala, (b) tombol "Sinkronkan
// sekarang" ditekan, atau (c) form berikutnya dibuka (lihat use-offline-
// queue.ts). Servis worker (sw.js) HANYA meng-cache app shell/ikon --
// bukan yang menangani antrean data ini.
// =========================================================

import type { SupabaseClient } from "@supabase/supabase-js";

const DB_NAME = "optima-pad-offline";
const DB_VERSION = 1;
const STORE = "pending_mutations";

export type PendingTable = "objek_pad" | "tindak_lanjut";

export type PendingMutation = {
  id: string;
  table: PendingTable;
  payload: Record<string, unknown>;
  label: string; // ringkasan buat ditampilkan ke user, misal nama objek/deskripsi
  createdAt: number;
  status: "pending" | "failed";
  errorMessage?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function queueMutation(table: PendingTable, payload: Record<string, unknown>, label: string): Promise<string> {
  const db = await openDb();
  const id = genId();
  const mutation: PendingMutation = { id, table, payload, label, createdAt: Date.now(), status: "pending" };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(mutation);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllMutations(): Promise<PendingMutation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PendingMutation[]).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function removeMutation(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function markFailed(id: string, message: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const m = getReq.result as PendingMutation | undefined;
      if (m) store.put({ ...m, status: "failed", errorMessage: message });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Heuristik sederhana: bedakan "gagal karena jaringan" (layak diantre) vs
// "gagal karena ditolak server" (RLS/validasi -- JANGAN diantre, karena akan
// gagal lagi berulang-ulang dan menyembunyikan error yang sebenarnya perlu
// dibetulkan penggunanya sekarang, bukan nanti).
export function isLikelyNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true; // fetch() gagal total = TypeError di browser
  const msg = String((err as any)?.message ?? "").toLowerCase();
  return msg.includes("failed to fetch") || msg.includes("load failed") || msg.includes("network");
}

// Coba kirim ulang semua yang masih tertunda, satu per satu (berurutan
// berdasarkan waktu dibuat) supaya data yang dicatat lebih dulu di lapangan
// juga tersinkron lebih dulu. Satu kegagalan tidak menghentikan antrean lain.
export async function syncPendingMutations(supabase: SupabaseClient): Promise<{ synced: number; failed: number }> {
  const mutations = await getAllMutations();
  let synced = 0;
  let failed = 0;
  for (const m of mutations) {
    try {
      const { error } = await supabase.from(m.table).insert(m.payload);
      if (error) throw error;
      await removeMutation(m.id);
      synced++;
    } catch (err: any) {
      if (isLikelyNetworkError(err)) {
        // Masih offline / koneksi putus lagi di tengah sync -- coba lagi nanti,
        // jangan ditandai "failed" (itu untuk error yang bukan soal jaringan).
        break;
      }
      await markFailed(m.id, err?.message ?? "Ditolak server.");
      failed++;
    }
  }
  return { synced, failed };
}
