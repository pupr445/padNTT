"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_META: Record<string, { label: string; color: string; tint: string }> = {
  berjalan: { label: "Berjalan", color: "var(--status-blue)", tint: "var(--status-blue-tint)" },
  selesai: { label: "Selesai", color: "var(--status-green)", tint: "var(--status-green-tint)" },
  tertunda: { label: "Tertunda", color: "var(--status-yellow)", tint: "var(--status-yellow-tint)" },
};

export default function TindakLanjutStatus({
  id,
  status,
  canChange,
}: {
  id: string;
  status: string;
  canChange: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const meta = STATUS_META[status] ?? STATUS_META.berjalan;

  if (!canChange) {
    return <span className="badge" style={{ background: meta.tint, color: meta.color }}>{meta.label}</span>;
  }

  async function handleChange(next: string) {
    setBusy(true);
    await supabase.from("tindak_lanjut").update({ status: next }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => handleChange(e.target.value)}
      className="badge"
      style={{ background: meta.tint, color: meta.color, border: "none", cursor: "pointer", fontWeight: 600 }}
    >
      {Object.entries(STATUS_META).map(([key, m]) => (
        <option key={key} value={key}>{m.label}</option>
      ))}
    </select>
  );
}
