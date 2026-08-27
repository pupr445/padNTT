// Satu sumber kebenaran untuk warna status objek PAD — dipakai di badge,
// dashboard, legenda peta (/peta), dan penanda pin GIS supaya konsisten
// di seluruh aplikasi (sesuai skema warna pada dokumen rancangan: merah/
// kuning/biru/hitam mengikuti tahapan validasi objek).

export type StatusVerifikasi = "belum_terdaftar" | "proses_verifikasi" | "terdaftar" | "menunggak";

export const STATUS_META: Record<
  StatusVerifikasi,
  { label: string; color: string; tint: string; mapLabel: string }
> = {
  belum_terdaftar: {
    label: "Belum terdaftar",
    color: "var(--status-red)",
    tint: "var(--status-red-tint)",
    mapLabel: "Merah — belum tervalidasi",
  },
  proses_verifikasi: {
    label: "Proses verifikasi",
    color: "var(--status-yellow)",
    tint: "var(--status-yellow-tint)",
    mapLabel: "Kuning — sudah didata",
  },
  terdaftar: {
    label: "Terdaftar",
    color: "var(--status-blue)",
    tint: "var(--status-blue-tint)",
    mapLabel: "Biru — sudah tervalidasi",
  },
  menunggak: {
    label: "Menunggak",
    color: "var(--status-black)",
    tint: "var(--status-black-tint)",
    mapLabel: "Hitam — bermasalah / tunggakan",
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
