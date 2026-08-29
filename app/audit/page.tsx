import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { canViewAuditLog } from "@/lib/permissions";
import { tabelLabel, ringkasanBaris, fieldBerubah } from "@/lib/audit";
import { ROLE_LABEL } from "@/lib/types";
import { IconHistory } from "@/lib/icons";

export const revalidate = 0;

const AKSI_META: Record<string, { label: string; color: string; tint: string }> = {
  INSERT: { label: "Tambah", color: "var(--status-green)", tint: "var(--status-green-tint)" },
  UPDATE: { label: "Ubah", color: "var(--status-blue)", tint: "var(--status-blue-tint)" },
  DELETE: { label: "Hapus", color: "var(--status-red)", tint: "var(--status-red-tint)" },
};

async function getData() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, table_name, record_id, action, data_sebelum, data_sesudah, created_at, actor:profiles(nama_lengkap, role)")
    .order("created_at", { ascending: false })
    .limit(300);
  return { logs: data ?? [], error: error?.message ?? null };
}

export default async function AuditPage() {
  const [{ logs, error }, profile] = await Promise.all([getData(), getCurrentProfile()]);

  if (!canViewAuditLog(profile?.role)) {
    return (
      <div className="empty-state">
        Halaman ini khusus untuk pimpinan tim dan Pokja III (tugas monitoring/evaluasi). Peran Anda:{" "}
        {profile ? ROLE_LABEL[profile.role] : "-"}.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <IconHistory size={20} />
        <h1 style={{ margin: 0 }}>Audit log</h1>
      </div>
      <p style={{ color: "var(--text-secondary)", marginTop: 4, marginBottom: 20 }}>
        Riwayat tambah/ubah/hapus data di seluruh modul -- 300 aktivitas terbaru. Tidak bisa diubah atau dihapus
        oleh siapapun, termasuk super_admin (tercatat lewat trigger database, bukan lewat aplikasi).
      </p>

      {error && <div className="empty-state">Gagal memuat audit log: {error}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 11.5, color: "var(--text-muted)", textTransform: "uppercase" }}>
              <th style={{ padding: "0 10px 8px 0" }}>Waktu</th>
              <th style={{ padding: "0 10px 8px 0" }}>Tabel</th>
              <th style={{ padding: "0 10px 8px 0" }}>Aksi</th>
              <th style={{ padding: "0 10px 8px 0" }}>Aktor</th>
              <th style={{ padding: "0 10px 8px 0" }}>Ringkasan</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => {
              const aksi = AKSI_META[l.action] ?? AKSI_META.UPDATE;
              const dataUtama = l.action === "DELETE" ? l.data_sebelum : l.data_sesudah;
              const ringkasan = ringkasanBaris(l.table_name, dataUtama);
              const changed = l.action === "UPDATE" ? fieldBerubah(l.data_sebelum, l.data_sesudah) : [];

              return (
                <tr key={l.id}>
                  <td className="mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(l.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{tabelLabel(l.table_name)}</td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: aksi.color,
                        background: aksi.tint,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {aksi.label}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {l.actor?.nama_lengkap ?? <span style={{ color: "var(--text-muted)" }}>Sistem</span>}
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {ringkasan}
                    {changed.length > 0 && (
                      <span style={{ color: "var(--text-muted)" }}> &middot; ubah: {changed.join(", ")}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && !error && (
              <tr>
                <td colSpan={5} style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>
                  Belum ada aktivitas tercatat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
