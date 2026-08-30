import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateKwitansiPdf } from "@/lib/documents/kwitansi";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { data: pembayaran, error } = await supabase
    .from("pembayaran_pad")
    .select(
      "*, penetapan_pad(nomor_penetapan, periode_tahun, periode_bulan, jumlah_ditetapkan, objek_pad(nama_objek, jenis_pad(nama), wajib_retribusi(nama)), pembayaran_pad(jumlah_dibayar))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !pembayaran) {
    return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
  }

  const [{ data: profile }, { data: namaPencatat }] = await Promise.all([
    supabase.from("profiles").select("nama_lengkap").eq("id", user.id).maybeSingle(),
    pembayaran.dicatat_oleh_id
      ? supabase.rpc("get_nama_lengkap", { p_user_id: pembayaran.dicatat_oleh_id })
      : Promise.resolve({ data: null }),
  ]);

  const penetapan = pembayaran.penetapan_pad as any;
  const objek = penetapan?.objek_pad;
  const totalDibayar = (penetapan?.pembayaran_pad ?? []).reduce((s: number, b: any) => s + Number(b.jumlah_dibayar), 0);

  const pdfBytes = await generateKwitansiPdf({
    kwitansiId: pembayaran.id,
    jumlahDibayar: Number(pembayaran.jumlah_dibayar),
    tanggalBayar: pembayaran.tanggal_bayar,
    metode: pembayaran.metode,
    objekNama: objek?.nama_objek ?? "-",
    jenisPadNama: objek?.jenis_pad?.nama ?? "-",
    nomorPenetapan: penetapan?.nomor_penetapan ?? null,
    periodeTahun: penetapan?.periode_tahun ?? new Date(pembayaran.tanggal_bayar).getFullYear(),
    periodeBulan: penetapan?.periode_bulan ?? null,
    jumlahDitetapkan: Number(penetapan?.jumlah_ditetapkan ?? 0),
    totalDibayarSampaiIni: totalDibayar,
    wajibNama: objek?.wajib_retribusi?.nama ?? null,
    dicatatOlehNama: (namaPencatat as any) ?? profile?.nama_lengkap ?? user.email ?? "-",
  });

  return new NextResponse(pdfBytes as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Kwitansi-${pembayaran.id.slice(0, 8)}.pdf"`,
    },
  });
}
