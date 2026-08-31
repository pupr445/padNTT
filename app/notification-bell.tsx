"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconBell } from "@/lib/icons";
import type { Notification } from "@/lib/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const menit = Math.floor(diffMs / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  return `${hari} hari lalu`;
}

export default function NotificationBell() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);
    setItems((data as Notification[]) ?? []);
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    setUnread(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // polling ringan, bukan realtime websocket
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [load]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(u - 1, 0));
  }

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost"
        style={{ position: "relative", padding: "6px 8px", color: "var(--text-on-ink)" }}
        aria-label="Notifikasi"
      >
        <IconBell size={17} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute", top: 2, right: 2, minWidth: 14, height: 14, borderRadius: 7,
              background: "var(--status-red)", color: "white", fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute", left: 0, bottom: "calc(100% + 8px)", width: 300, maxHeight: 360,
            overflowY: "auto", zIndex: 50, padding: 0, background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Notifikasi</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} style={{ fontSize: 11, color: "var(--marine)", background: "none", border: "none", cursor: "pointer" }}>
                Tandai semua dibaca
              </button>
            )}
          </div>
          {items.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", padding: 16, textAlign: "center" }}>Belum ada notifikasi.</p>
          )}
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => markRead(n.id)}
              style={{
                display: "block", padding: "10px 12px", borderBottom: "1px solid var(--line)",
                background: n.is_read ? "transparent" : "var(--marine-tint)",
              }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{n.title}</p>
              {n.body && <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "3px 0 0" }}>{n.body}</p>}
              <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: "4px 0 0" }}>{timeAgo(n.created_at)}</p>
            </Link>
          ))}
          <Link href="/notifikasi" style={{ display: "block", textAlign: "center", padding: 10, fontSize: 12, fontWeight: 600 }}>
            Lihat semua &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
