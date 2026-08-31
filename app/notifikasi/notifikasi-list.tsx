"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  tindak_lanjut_baru: "Tindak lanjut",
  laporan_baru: "Laporan",
  objek_menunggak: "Menunggak",
  penetapan_baru: "Penetapan",
};

export default function NotifikasiList({ initial }: { initial: Notification[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const unreadCount = items.filter((n) => !n.is_read).length;

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button type="button" className="btn" onClick={markAllRead}>
            Tandai semua dibaca ({unreadCount})
          </button>
        </div>
      )}
      <div className="stack">
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.link ?? "#"}
            onClick={() => !n.is_read && markRead(n.id)}
            className="card"
            style={{ display: "block", background: n.is_read ? "var(--surface)" : "var(--marine-tint)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{n.title}</p>
              <span className="badge" style={{ background: "var(--status-blue-tint)", color: "var(--status-blue)", flexShrink: 0 }}>
                {KIND_LABEL[n.kind] ?? n.kind}
              </span>
            </div>
            {n.body && <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "6px 0" }}>{n.body}</p>}
            <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              {new Date(n.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </Link>
        ))}
        {items.length === 0 && <div className="empty-state">Belum ada notifikasi.</div>}
      </div>
    </div>
  );
}
