"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconTrash } from "@/lib/icons";

function DeleteButton({
  label,
  confirmText,
  onDelete,
}: {
  label?: string;
  confirmText: string;
  onDelete: () => Promise<{ error: string | null }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    const { error } = await onDelete();
    setBusy(false);
    if (error) {
      setError(error);
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
        title={label ?? "Hapus"}
      >
        <IconTrash size={13} />
      </button>
      {error && <span className="error-text" style={{ fontSize: 11 }}>{error}</span>}
    </span>
  );
}

export function DeleteTindakLanjutButton({ id }: { id: string }) {
  const supabase = createClient();
  return (
    <DeleteButton
      confirmText="Hapus catatan tindak lanjut ini? Tindakan ini tercatat di audit log dan tidak bisa dibatalkan."
      onDelete={async () => {
        const { error } = await supabase.from("tindak_lanjut").delete().eq("id", id);
        return { error: error?.message ?? null };
      }}
    />
  );
}

export function DeleteLampiranButton({ id }: { id: string }) {
  const supabase = createClient();
  return (
    <DeleteButton
      confirmText="Hapus lampiran ini? File di penyimpanan tidak otomatis terhapus, tapi tercatat di audit log."
      onDelete={async () => {
        const { error } = await supabase.from("lampiran").delete().eq("id", id);
        return { error: error?.message ?? null };
      }}
    />
  );
}
