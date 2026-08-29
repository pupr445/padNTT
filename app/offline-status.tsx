"use client";

import { useOfflineQueue } from "@/lib/use-offline-queue";

export default function OfflineStatusBadge() {
  const { isOnline, pending, syncing, syncNow } = useOfflineQueue();

  if (isOnline && pending.length === 0) return null;

  const failedCount = pending.filter((p) => p.status === "failed").length;

  return (
    <div
      style={{
        margin: "0 16px 12px",
        padding: "8px 10px",
        borderRadius: 10,
        fontSize: 11.5,
        background: !isOnline ? "rgba(193,67,43,0.18)" : "rgba(184,135,31,0.18)",
        color: "var(--text-on-ink)",
      }}
    >
      <div style={{ fontWeight: 600 }}>{!isOnline ? "Sedang offline" : `${pending.length} data menunggu sinkron`}</div>
      <div style={{ opacity: 0.85, marginTop: 2 }}>
        {!isOnline
          ? pending.length > 0
            ? `${pending.length} data lapangan tersimpan di perangkat ini.`
            : "Data baru akan disimpan di perangkat ini dulu."
          : failedCount > 0
          ? `${failedCount} gagal terkirim (bukan soal jaringan) -- perlu dicek manual.`
          : "Akan terkirim otomatis begitu koneksi stabil."}
      </div>
      {isOnline && pending.length > 0 && (
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="btn btn-ghost"
          style={{ marginTop: 6, padding: "3px 8px", fontSize: 11, color: "var(--text-on-ink)", borderColor: "rgba(255,255,255,0.3)" }}
        >
          {syncing ? "Menyinkronkan..." : "Sinkronkan sekarang"}
        </button>
      )}
    </div>
  );
}
