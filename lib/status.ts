// Satu sumber kebenaran untuk warna status objek PAD — dipakai di badge,
// dashboard, legenda peta (/peta), dan penanda pin GIS supaya konsisten
// di seluruh aplikasi (sesuai skema warna pada dokumen rancangan: merah/
// kuning/biru/hitam mengikuti tahapan validasi objek).

export type StatusVerifikasi = "belum_terdaftar" | "proses_verifikasi" | "terdaftar" | "menunggak";

export const STATUS_META: Record<
  StatusVerifikasi,
  { label: string; color: string; tint: string; mapLabel: string; glyph: string }
> = {
  belum_terdaftar: {
    label: "Belum terdaftar",
    color: "var(--status-red)",
    tint: "var(--status-red-tint)",
    mapLabel: "Merah bulat kosong — belum tervalidasi",
    glyph: "\u25CB", // lingkaran kosong
  },
  proses_verifikasi: {
    label: "Proses verifikasi",
    color: "var(--status-yellow)",
    tint: "var(--status-yellow-tint)",
    mapLabel: "Kuning segitiga — sudah didata",
    glyph: "\u25B2", // segitiga
  },
  terdaftar: {
    label: "Terdaftar",
    color: "var(--status-blue)",
    tint: "var(--status-blue-tint)",
    mapLabel: "Biru kotak — sudah tervalidasi",
    glyph: "\u25A0", // kotak
  },
  menunggak: {
    label: "Menunggak",
    color: "var(--status-black)",
    tint: "var(--status-black-tint)",
    mapLabel: "Hitam tanda seru — bermasalah / tunggakan",
    glyph: "!",
  },
};

export function statusMeta(status: string) {
  return STATUS_META[status as StatusVerifikasi] ?? STATUS_META.belum_terdaftar;
}

export function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
