import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { rupiah } from "@/lib/status";

const NAVY = rgb(0x0d / 255, 0x1b / 255, 0x2a / 255);
const MUTED = rgb(0.4, 0.42, 0.46);
const LINE = rgb(0.85, 0.85, 0.83);

export type SkrdData = {
  nomorPenetapan: string | null;
  tanggalDitetapkan: string;
  jatuhTempo: string;
  periodeTahun: number;
  periodeBulan: number | null;
  jumlahDitetapkan: number;
  status: string;
  objekNama: string;
  objekLokasi: string | null;
  objekKabupaten: string | null;
  jenisPadNama: string;
  wajibNama: string | null;
  wajibNikNpwp: string | null;
  wajibAlamat: string | null;
  ditetapkanOlehNama: string | null;
  dicetakOlehNama: string;
};

const BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fmtTanggal(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`;
}

/** Menghasilkan dokumen SKRD (Surat Ketetapan Retribusi Daerah) sebagai PDF A4. */
export async function generateSkrdPdf(data: SkrdData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  let y = 800;
  const width = 595.28 - margin * 2;

  function text(t: string, x: number, size: number, f = font, color = rgb(0, 0, 0)) {
    page.drawText(t, { x, y, size, font: f, color });
  }
  function center(t: string, size: number, f = font, color = rgb(0, 0, 0)) {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (595.28 - w) / 2, y, size, font: f, color });
  }
  function line() {
    page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.75, color: LINE });
  }

  // --- Kop surat ---
  center("PEMERINTAH PROVINSI NUSA TENGGARA TIMUR", 11, bold, NAVY);
  y -= 15;
  center("DINAS PEKERJAAN UMUM DAN PENATAAN RUANG", 10, font, NAVY);
  y -= 13;
  center("Tim Terpadu Optimalisasi PAD -- SK Gubernur NTT No. 272/KEP/HK/2026", 8.5, font, MUTED);
  y -= 18;
  line();
  y -= 26;

  center("SURAT KETETAPAN RETRIBUSI DAERAH (SKRD)", 13, bold, NAVY);
  y -= 16;
  center(`Nomor: ${data.nomorPenetapan || "-- belum diisi manual --"}`, 9.5, font, MUTED);
  y -= 34;

  // --- Data wajib retribusi ---
  text("A. Data Wajib Retribusi", margin, 10.5, bold, NAVY);
  y -= 18;
  const rows1: [string, string][] = [
    ["Nama", data.wajibNama || "-- belum ditautkan --"],
    ["NIK / NPWP", data.wajibNikNpwp || "-"],
    ["Alamat", data.wajibAlamat || "-"],
  ];
  for (const [label, value] of rows1) {
    text(label, margin + 4, 9.5, font);
    text(":", margin + 108, 9.5, font);
    text(value, margin + 118, 9.5, font, NAVY);
    y -= 16;
  }
  y -= 10;

  // --- Data objek ---
  text("B. Data Objek PAD", margin, 10.5, bold, NAVY);
  y -= 18;
  const rows2: [string, string][] = [
    ["Nama objek", data.objekNama],
    ["Jenis PAD", data.jenisPadNama],
    ["Lokasi", data.objekLokasi || "-"],
    ["Kabupaten/Kota", data.objekKabupaten || "-"],
  ];
  for (const [label, value] of rows2) {
    text(label, margin + 4, 9.5, font);
    text(":", margin + 108, 9.5, font);
    text(value, margin + 118, 9.5, font, NAVY);
    y -= 16;
  }
  y -= 10;

  // --- Rincian penetapan ---
  text("C. Rincian Penetapan", margin, 10.5, bold, NAVY);
  y -= 18;
  const periode = data.periodeBulan ? `${BULAN[data.periodeBulan]} ${data.periodeTahun}` : `Tahun ${data.periodeTahun}`;
  const rows3: [string, string][] = [
    ["Periode", periode],
    ["Tanggal ditetapkan", fmtTanggal(data.tanggalDitetapkan)],
    ["Jatuh tempo", fmtTanggal(data.jatuhTempo)],
  ];
  for (const [label, value] of rows3) {
    text(label, margin + 4, 9.5, font);
    text(":", margin + 108, 9.5, font);
    text(value, margin + 118, 9.5, font, NAVY);
    y -= 16;
  }
  y -= 6;

  // --- Kotak jumlah ---
  y -= 6;
  page.drawRectangle({ x: margin, y: y - 34, width, height: 40, color: rgb(0.06, 0.11, 0.16) });
  text("JUMLAH YANG HARUS DIBAYAR", margin + 16, 9, bold, rgb(0.85, 0.85, 0.85));
  const jumlahStr = rupiah(data.jumlahDitetapkan);
  const jumlahW = bold.widthOfTextAtSize(jumlahStr, 15);
  page.drawText(jumlahStr, { x: margin + width - 16 - jumlahW, y: y - 30, size: 15, font: bold, color: rgb(1, 1, 1) });
  y -= 60;

  text(
    "Wajib retribusi diminta membayar sejumlah tersebut di atas paling lambat pada tanggal jatuh tempo,",
    margin,
    8.5,
    font,
    MUTED
  );
  y -= 12;
  text("ke rekening kas daerah yang ditunjuk, dan menyimpan bukti pembayaran.", margin, 8.5, font, MUTED);
  y -= 50;

  // --- Tanda tangan ---
  const rightColX = margin + width - 190;
  text(`Kupang, ${fmtTanggal(data.tanggalDitetapkan)}`, rightColX, 9.5, font);
  y -= 14;
  text("Pejabat yang menetapkan,", rightColX, 9.5, font);
  y -= 60;
  text(data.ditetapkanOlehNama || "( .............................. )", rightColX, 9.5, bold, NAVY);
  y -= 12;
  text("NIP. ..............................", rightColX, 8.5, font, MUTED);

  // --- Footer disclaimer ---
  page.drawText(
    `Dokumen ini dibuat otomatis oleh sistem OPTIMA PAD NTT oleh ${data.dicetakOlehNama} pada ${new Date().toLocaleString("id-ID")}. ` +
      "Sah setelah ditandatangani pejabat berwenang dan dicap basah/elektronik resmi.",
    { x: margin, y: 40, size: 7, font, color: MUTED, maxWidth: width, lineHeight: 9 }
  );

  return pdf.save();
}
