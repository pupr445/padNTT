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
// hapus: super_admin saja, supaya bukti lapangan tidak mudah hilang
export function canDeleteLampiran(role: Role | null | undefined) {
  return role === "super_admin";
}

// audit_logs -- baca: pimpinan + Pokja III saja (tugasnya memang monitoring/evaluasi)
export function canViewAuditLog(role: Role | null | undefined) {
  return has(role, [...PIMPINAN, "pokja3_ketua", "pokja3_anggota"]);
}
