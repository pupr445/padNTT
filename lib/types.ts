// Tipe data inti (sesuai supabase/schema_01_core.sql & schema_02_auth_roles.sql)

export type Role =
  | "super_admin"
  | "ketua_tim"
  | "wakil_ketua"
  | "sekretariat"
  | "pokja1_ketua"
  | "pokja1_anggota"
  | "pokja2_ketua"
  | "pokja2_anggota"
  | "pokja3_ketua"
  | "pokja3_anggota"
  | "bapenda"
  | "pupr"
  | "kejati"
  | "inspektorat"
  | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  ketua_tim: "Ketua Tim",
  wakil_ketua: "Wakil Ketua",
  sekretariat: "Sekretariat",
  pokja1_ketua: "Ketua Pokja I",
  pokja1_anggota: "Anggota Pokja I",
  pokja2_ketua: "Ketua Pokja II",
  pokja2_anggota: "Anggota Pokja II",
  pokja3_ketua: "Ketua Pokja III",
  pokja3_anggota: "Anggota Pokja III",
  bapenda: "Bapenda",
  pupr: "PUPR",
  kejati: "Kejaksaan Tinggi",
  inspektorat: "Inspektorat",
  viewer: "Peninjau",
};

export type Profile = {
  id: string;
  nama_lengkap: string;
  email: string | null;
  role: Role;
  pokja: "I" | "II" | "III" | null;
  instansi: string | null;
  aktif: boolean;
};

export type JenisPad = {
  id: string;
  kode: "utilitas_jalan" | "alat_berat" | "air_permukaan";
  nama: string;
  deskripsi: string | null;
};

export type PadTariff = {
  id: string;
  jenis_pad_id: string;
  nama_tarif: string;
  dasar_pengenaan: string;
  satuan: string;
  tarif_rp: number;
  formula_perhitungan: string;
  dasar_hukum: string | null;
  berlaku_mulai: string;
  berlaku_sampai: string | null;
  is_active: boolean;
};

export type ObjekPad = {
  id: string;
  jenis_pad_id: string;
  nama_objek: string;
  lokasi: string | null;
  kabupaten_kota: string | null;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
  status_verifikasi: "belum_terdaftar" | "terdaftar" | "proses_verifikasi" | "menunggak";
  keterangan: string | null;
  created_at: string;
};

export type TargetRealisasi = {
  id: string;
  jenis_pad_id: string;
  objek_pad_id: string | null;
  periode_tahun: number;
  periode_bulan: number | null;
  target_rp: number;
  realisasi_rp: number;
};

export type TindakLanjut = {
  id: string;
  objek_pad_id: string | null;
  jenis_kegiatan: string;
  deskripsi: string | null;
  pokja: string | null;
  pic: string | null;
  tanggal_kegiatan: string;
  status: "berjalan" | "selesai" | "tertunda";
};

export type Lampiran = {
  id: string;
  r2_key: string;
  nama_file: string;
  tipe_file: string | null;
  objek_pad_id: string | null;
  tindak_lanjut_id: string | null;
  created_at: string;
};
