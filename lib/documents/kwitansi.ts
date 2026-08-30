import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { rupiah } from "@/lib/status";
import { rupiahTerbilang } from "./terbilang";

const NAVY = rgb(0x0d / 255, 0x1b / 255, 0x2a / 255);
const TEAL = rgb(0x0f / 255, 0xa3 / 255, 0xa3 / 255);
const MUTED = rgb(0.4, 0.42, 0.46);
const LINE = rgb(0.85, 0.85, 0.83);

export type KwitansiData = {
  kwitansiId: string; // dipakai sebagai bagian nomor kwitansi
  jumlahDibayar: number;
  tanggalBayar: string;
  metode: string | null;
  objekNama: string;
  jenisPadNama: string;
  nomorPenetapan: string | null;
  periodeTahun: number;
  periodeBulan: number | null;
  jumlahDitetapkan: number;
  totalDibayarSampaiIni: number;
  wajibNama: string | null;
  dicatatOlehNama: string;
};

const BULAN = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fmtTanggal(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export async function generateKwitansiPdf(data: KwitansiData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 420]); // setengah A4, kwitansi tidak perlu setinggi surat
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  let y = 370;
  const width = 595.28 - margin * 2;

  function text(t: string, x: number, size: number, f = font, color = rgb(0, 0, 0)) {
    page.drawText(t, { x, y, size, font: f, color });
  }
  function center(t: string, size: number, f = font, color = rgb(0, 0, 0)) {
    const w = f.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (595.28 - w) / 2, y, size, font: f, color });
  }

  center("PEMERINTAH PROVINSI NUSA TENGGARA TIMUR", 10.5, bold, NAVY);
  y -= 14;
  center("TANDA TERIMA PEMBAYARAN PAD", 9.5, font, MUTED);
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.75, color: LINE });
  y -= 8;

  const nomor = `KW/${data.kwitansiId.slice(0, 8).toUpperCase()}/${new Date(data.tanggalBayar).getFullYear()}`;
  text(`No: ${nomor}`, margin, 9, font, MUTED);
  const tgl = fmtTanggal(data.tanggalBayar);
  const tglW = font.widthOfTextAtSize(tgl, 9);
  text(tgl, margin + width - tglW, 9, font, MUTED);
  y -= 26;

  text("Telah terima dari", margin, 9.5, font);
  text(":", margin + 130, 9.5, font);
  text(data.wajibNama || "-- wajib retribusi belum ditautkan --", margin + 140, 9.5, bold, NAVY);
  y -= 18;

  text("Untuk pembayaran", margin, 9.5, font);
  text(":", margin + 130, 9.5, font);
  const periode = data.periodeBulan ? `${BULAN[data.periodeBulan]} ${data.periodeTahun}` : `Tahun ${data.periodeTahun}`;
  text(`${data.jenisPadNama} -- ${data.objekNama} (${periode})`, margin + 140, 9.5, font, NAVY);
  y -= 18;

  text("No. penetapan", margin, 9.5, font);
  text(":", margin + 130, 9.5, font);
  text(data.nomorPenetapan || "-", margin + 140, 9.5, font, NAVY);
  y -= 18;

  text("Metode", margin, 9.5, font);
  text(":", margin + 130, 9.5, font);
  text(data.metode || "-", margin + 140, 9.5, font, NAVY);
  y -= 30;

  // Kotak jumlah
  page.drawRectangle({ x: margin, y: y - 34, width, height: 42, color: NAVY });
  text("JUMLAH DITERIMA", margin + 16, 9, bold, rgb(0.85, 0.85, 0.85));
  const jumlahStr = rupiah(data.jumlahDibayar);
  const jumlahW = bold.widthOfTextAtSize(jumlahStr, 16);
  page.drawText(jumlahStr, { x: margin + width - 16 - jumlahW, y: y - 30, size: 16, font: bold, color: rgb(1, 1, 1) });
  y -= 56;

  text(`Terbilang: ${rupiahTerbilang(data.jumlahDibayar)}`, margin, 9, font, MUTED);
  y -= 16;

  const sisa = Math.max(data.jumlahDitetapkan - data.totalDibayarSampaiIni, 0);
  if (sisa > 0) {
    text(
      `Total dibayar sampai saat ini: ${rupiah(data.totalDibayarSampaiIni)} dari ${rupiah(data.jumlahDitetapkan)} -- sisa ${rupiah(sisa)}.`,
      margin,
      8.5,
      font,
      MUTED
    );
  } else {
    text(`Tagihan LUNAS (total dibayar ${rupiah(data.totalDibayarSampaiIni)}).`, margin, 8.5, bold, TEAL);
  }
  y -= 50;

  const rightColX = margin + width - 170;
  text("Penerima,", rightColX, 9.5, font);
  y -= 50;
  text(data.dicatatOlehNama, rightColX, 9.5, bold, NAVY);

  page.drawText(
    `Dokumen ini dibuat otomatis oleh sistem OPTIMA PAD NTT pada ${new Date().toLocaleString("id-ID")}. ` +
      "Sah sebagai bukti pembayaran internal, bukan pengganti bukti setor bank/kas daerah.",
    { x: margin, y: 30, size: 7, font, color: MUTED, maxWidth: width, lineHeight: 9 }
  );

  return pdf.save();
}
