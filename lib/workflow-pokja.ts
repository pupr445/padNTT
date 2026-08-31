// ---------------------------------------------------------
// Diferensiasi workflow per Pokja: jenis kegiatan yang relevan +
// target SLA (hari) untuk saran deadline. Kalau daftar ini diubah,
// perbarui juga CHECK constraint jenis_kegiatan di
// supabase/schema_11_workflow_pokja.sql supaya tetap sinkron.
// ---------------------------------------------------------

export type JenisKegiatan =
  | "sosialisasi"
  | "pemeriksaan_lapangan"
  | "penertiban"
  | "tindakan_administratif"
  | "pendampingan_hukum"
  | "penagihan"
  | "monitoring_evaluasi"
  | "lainnya";

type Opsi = { value: JenisKegiatan; label: string; slaHari: number };

// Pokja I -- Inventarisasi & Validasi
const POKJA_I: Opsi[] = [
  { value: "sosialisasi", label: "Sosialisasi", slaHari: 14 },
  { value: "pemeriksaan_lapangan", label: "Pemeriksaan lapangan", slaHari: 7 },
];

// Pokja II -- Intervensi & Penertiban
const POKJA_II: Opsi[] = [
  { value: "penertiban", label: "Penertiban", slaHari: 30 },
  { value: "tindakan_administratif", label: "Tindakan administratif", slaHari: 30 },
  { value: "pendampingan_hukum", label: "Pendampingan hukum", slaHari: 60 },
  { value: "penagihan", label: "Penagihan", slaHari: 14 },
];

// Pokja III -- Monitoring & Evaluasi
const POKJA_III: Opsi[] = [{ value: "monitoring_evaluasi", label: "Monitoring & evaluasi", slaHari: 30 }];

const LAINNYA: Opsi = { value: "lainnya", label: "Lainnya", slaHari: 14 };

const BY_POKJA: Record<"I" | "II" | "III", Opsi[]> = { I: POKJA_I, II: POKJA_II, III: POKJA_III };

export function jenisKegiatanOptions(pokja: "I" | "II" | "III" | null | undefined): Opsi[] {
  const base = pokja ? BY_POKJA[pokja] ?? [] : [];
  return [...base, LAINNYA];
}

const ALL_OPSI = [...POKJA_I, ...POKJA_II, ...POKJA_III, LAINNYA];

export const JENIS_KEGIATAN_LABEL: Record<string, string> = Object.fromEntries(ALL_OPSI.map((o) => [o.value, o.label]));

export function slaHariFor(jenis: string): number {
  return ALL_OPSI.find((o) => o.value === jenis)?.slaHari ?? LAINNYA.slaHari;
}

export function suggestDeadline(jenis: string, dariTanggal = new Date()): string {
  const d = new Date(dariTanggal);
  d.setDate(d.getDate() + slaHariFor(jenis));
  return d.toISOString().slice(0, 10);
}

export const POKJA_LABEL: Record<"I" | "II" | "III", string> = {
  I: "Pokja I -- Inventarisasi & Validasi",
  II: "Pokja II -- Intervensi & Penertiban",
  III: "Pokja III -- Monitoring & Evaluasi",
};
