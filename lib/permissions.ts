import type { Role } from "./types";

// ---------------------------------------------------------------
// Satu sumber kebenaran untuk aturan akses di UI. HARUS selalu sinkron
// dengan policy RLS di supabase/schema_02_auth_roles.sql dan
// supabase/schema_04_fix_rls_gaps.sql -- kalau policy SQL diubah,
// perbarui juga daftar role di sini. Tujuannya supaya UI tidak pernah
// menampilkan tombol/form untuk aksi yang toh akan ditolak RLS
// (prinsip review: "role-based experience" & "RBAC/RLS harus
// konsisten antara UI dan database").
//
// RLS di database tetap jadi pertahanan sesungguhnya -- fungsi di
// sini murni untuk UX (sembunyikan aksi yang tidak relevan, beri
// penjelasan alih-alih error setelah submit).
// ---------------------------------------------------------------

const PIMPINAN: Role[] = ["super_admin", "ketua_tim", "wakil_ketua", "sekretariat"];
const POKJA1: Role[] = ["pokja1_ketua", "pokja1_anggota"];
const POKJA2: Role[] = ["pokja2_ketua", "pokja2_anggota"];
const POKJA3: Role[] = ["pokja3_ketua", "pokja3_anggota"];

function has(role: Role | null | undefined, list: Role[]) {
  return !!role && list.includes(role);
}

// objek_pad -- insert/update: Pokja I + pimpinan + super_admin (schema_02 #4)
export function canCreateObjekPad(role: Role | null | undefined) {
  return has(role, [...POKJA1, ...PIMPINAN]);
}
export const canEditObjekPad = canCreateObjekPad;

// wajib_retribusi -- sama seperti objek_pad: Pokja I + pimpinan + super_admin
// (RLS sudah ada sejak schema_04, ini cuma menyamakan sisi UI)
export const canManageWajibRetribusi = canCreateObjekPad;

// delete objek_pad: super_admin saja
export function canDeleteObjekPad(role: Role | null | undefined) {
  return role === "super_admin";
}

// tindak_lanjut -- insert: Pokja I + Pokja II + pimpinan + super_admin
export function canCreateTindakLanjut(role: Role | null | undefined) {
  return has(role, [...POKJA1, ...POKJA2, ...PIMPINAN]);
}

// Pilihan "Pokja" yang boleh dipilih saat mencatat tindak lanjut baru.
// Pimpinan/sekretariat/super_admin bebas memilih (peran koordinasi lintas
// Pokja). Anggota/ketua Pokja I atau II dikunci ke Pokja sendiri saja --
// ini penting karena RLS UPDATE tindak_lanjut mensyaratkan
// (pokja = current_profile_pokja()): kalau UI membiarkan Pokja I mencatat
// atas nama Pokja II, orang itu sendiri tidak akan bisa mengoreksi
// catatannya lagi setelah tersimpan.
export function tindakLanjutPokjaOptions(
  role: Role | null | undefined,
  pokja: "I" | "II" | "III" | null | undefined
): Array<"I" | "II" | "III"> {
  if (has(role, PIMPINAN)) return ["I", "II", "III"];
  if (pokja) return [pokja];
  return ["I", "II", "III"];
}

// laporan_berkala -- insert: ketua tiap Pokja, Pokja III (ketua & anggota,
// karena Pokja III memang bertugas monitoring/evaluasi), pimpinan, super_admin
export function canCreateLaporan(role: Role | null | undefined) {
  return has(role, ["pokja1_ketua", "pokja2_ketua", "pokja3_ketua", "pokja3_anggota", ...PIMPINAN]);
}

// target_realisasi -- insert/update: Bapenda (pemegang data penerimaan) + pimpinan + super_admin
export function canManageTargetRealisasi(role: Role | null | undefined) {
  return has(role, ["bapenda", ...PIMPINAN]);
}

// pad_tariffs -- kelola tarif/formula: super_admin + Bapenda
export function canManageTarif(role: Role | null | undefined) {
  return has(role, ["bapenda", "super_admin"]);
}

// profiles / akun pengguna -- hanya super_admin yang mengundang & ubah role
export function canManageAkun(role: Role | null | undefined) {
  return role === "super_admin";
}

// lampiran -- upload: semua yang login boleh (RLS memang dibuka untuk semua);
// hapus: super_admin + pimpinan (ketua_tim/wakil_ketua/sekretariat), sesuai
// schema_05_lampiran_hardening.sql -- setiap hapus tetap tercatat di audit_logs.
export function canDeleteLampiran(role: Role | null | undefined) {
  return has(role, [...PIMPINAN]);
}

// tindak_lanjut -- delete: Pokja pemilik baris (sama seperti update) + pimpinan + super_admin
export function canDeleteTindakLanjut(
  role: Role | null | undefined,
  rowPokja: string | null | undefined,
  userPokja: "I" | "II" | "III" | null | undefined
) {
  if (has(role, PIMPINAN)) return true;
  return !!rowPokja && !!userPokja && rowPokja === userPokja;
}

// laporan_berkala -- update/delete: pembuat asli (dibuat_oleh_id) + pimpinan + super_admin
export function canEditLaporan(
  role: Role | null | undefined,
  dibuatOlehId: string | null | undefined,
  userId: string | null | undefined
) {
  if (has(role, PIMPINAN)) return true;
  return !!dibuatOlehId && !!userId && dibuatOlehId === userId;
}
export const canDeleteLaporan = canEditLaporan;

// target_realisasi -- delete: sama seperti insert/update (Bapenda + pimpinan + super_admin)
export function canDeleteTargetRealisasi(role: Role | null | undefined) {
  return has(role, ["bapenda", ...PIMPINAN]);
}

// potensi_pad -- Pokja I (yang turun ke lapangan) + pimpinan + super_admin,
// sama seperti izin objek_pad karena memang satu rangkaian kerja Pokja I.
export const canManagePotensi = canCreateObjekPad;

// penetapan_pad -- fungsi keuangan resmi: Bapenda + pimpinan + super_admin.
// Sengaja TIDAK termasuk Pokja I, supaya ada pemisahan antara "yang mendata
// potensi di lapangan" dan "yang menetapkan tagihan resmi".
export function canManagePenetapan(role: Role | null | undefined) {
  return has(role, ["bapenda", ...PIMPINAN]);
}

// pembayaran_pad -- sama seperti penetapan, pencatatan uang masuk tetap
// fungsi keuangan (Bapenda), bukan Pokja II meski mereka yang menagih di
// lapangan (aktivitas penagihan sendiri dicatat lewat tindak_lanjut).
export function canManagePembayaran(role: Role | null | undefined) {
  return has(role, ["bapenda", ...PIMPINAN]);
}

// audit_logs -- baca: pimpinan + Pokja III saja (tugasnya memang monitoring/evaluasi)
export function canViewAuditLog(role: Role | null | undefined) {
  return has(role, [...PIMPINAN, "pokja3_ketua", "pokja3_anggota"]);
}
