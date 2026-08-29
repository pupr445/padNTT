"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconTrash } from "@/lib/icons";

export default function DeleteLaporanButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!window.confirm("Hapus laporan ini? Tindakan ini tercatat di audit log dan tidak bisa dibatalkan.")) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.from("laporan_berkala").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleClick}
        disabled={busy}
        style={{ padding: "4px 6px", color: "var(--status-red)" }}
        title="Hapus laporan"
      >
        <IconTrash size={13} />
      </button>
      {error && <span className="error-text" style={{ fontSize: 11 }}>{error}</span>}
    </span>
  );
}
