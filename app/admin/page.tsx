import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ROLE_LABEL } from "@/lib/types";
import UserTable from "./user-table";
import InviteForm from "./invite-form";

export const revalidate = 0;

export default async function AdminPage() {
  const actor = await getCurrentProfile();

  if (!actor || actor.role !== "super_admin") {
    return (
      <div>
        <p className="page-eyebrow">Kelola akun</p>
        <h1 className="page-title">Akses ditolak</h1>
        <div className="empty-state">
          Halaman ini khusus Super Admin. Akun Anda saat ini: {actor ? ROLE_LABEL[actor.role] : "belum login"}.
        </div>
      </div>
    );
  }

  const db = await createServerSupabase();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("*")
    .order("nama_lengkap", { ascending: true });

  return (
    <div>
      <p className="page-eyebrow">Super Admin</p>
      <h1 className="page-title">Kelola akun & role</h1>
      <p className="page-subtitle">
        Tambah anggota tim baru dan atur role/Pokja mereka. Perubahan role berlaku langsung
        (tidak perlu logout-login) karena dicek ulang di setiap query lewat Row Level Security.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "var(--status-red)", background: "var(--status-red-tint)", marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--status-red)", margin: 0 }}>Gagal memuat daftar akun</p>
          <p className="mono" style={{ fontSize: 12, color: "var(--status-red)", margin: "6px 0 0" }}>{error.message}</p>
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <InviteForm />
      </div>

      <UserTable profiles={profiles ?? []} currentUserId={actor.id} />
    </div>
  );
}
