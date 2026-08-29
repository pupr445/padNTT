// Label tabel dalam bahasa manusia -- dipakai di halaman /audit supaya
// nama tabel teknis (snake_case) tidak langsung ditampilkan ke pengguna.
export const TABEL_LABEL: Record<string, string> = {
  objek_pad: "Objek PAD",
  tindak_lanjut: "Tindak lanjut",
  laporan_berkala: "Laporan berkala",
  target_realisasi: "Target/realisasi",
  pad_tariffs: "Tarif PAD",
  lampiran: "Lampiran",
};

export function tabelLabel(tableName: string) {
  return TABEL_LABEL[tableName] ?? tableName;
}

// Field yang dipakai sebagai "judul" ringkas baris tiap tabel, dicoba
// berurutan sampai ketemu yang ada isinya.
const RINGKASAN_FIELDS: Record<string, string[]> = {
  objek_pad: ["nama_objek"],
  tindak_lanjut: ["deskripsi", "jenis_kegiatan"],
  laporan_berkala: ["judul"],
  target_realisasi: ["periode_tahun"],
  pad_tariffs: ["nama_tarif"],
  lampiran: ["nama_file"],
};

export function ringkasanBaris(tableName: string, data: Record<string, any> | null): string {
  if (!data) return "-";
  const fields = RINGKASAN_FIELDS[tableName] ?? [];
  for (const f of fields) {
    if (data[f]) return String(data[f]);
  }
  return "-";
}

// Untuk UPDATE: daftar nama field yang nilainya berubah antara sebelum & sesudah
// (perbandingan dangkal -- cukup untuk ringkasan, bukan diff mendalam).
const FIELD_DIABAIKAN = new Set(["updated_at", "created_at"]);

export function fieldBerubah(sebelum: Record<string, any> | null, sesudah: Record<string, any> | null): string[] {
  if (!sebelum || !sesudah) return [];
  const keys = new Set([...Object.keys(sebelum), ...Object.keys(sesudah)]);
  const changed: string[] = [];
  for (const k of keys) {
    if (FIELD_DIABAIKAN.has(k)) continue;
    if (JSON.stringify(sebelum[k]) !== JSON.stringify(sesudah[k])) changed.push(k);
  }
  return changed;
}
