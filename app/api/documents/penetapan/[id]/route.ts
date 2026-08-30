import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateSkrdPdf } from "@/lib/documents/skrd";

// SELECT semua tabel terkait sudah terbuka untuk siapapun yang login (RLS),
// jadi siapapun yang login boleh mencetak/mengunduh -- konsisten dengan
// prinsip dashboard lintas-Pokja yang sudah dipakai di seluruh aplikasi.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { data: penetapan, error } = await supabase
    .from("penetapan_pad")
    .select("*, objek_pad(nama_objek, lokasi, kabupaten_kota, jenis_pad(nama), wajib_retribusi(nama, nik_npwp, alamat))")
    .eq("id", id)
    .maybeSingle();

  if (error || !penetapan) {
    return NextResponse.json({ error: "Penetapan tidak ditemukan." }, { status: 404 });
  }

  const [{ data: profile }, { data: namaPenetap }] = await Promise.all([
    supabase.from("profiles").select("nama_lengkap").eq("id", user.id).maybeSingle(),
    penetapan.ditetapkan_oleh_id
      ? supabase.rpc("get_nama_lengkap", { p_user_id: penetapan.ditetapkan_oleh_id })
      : Promise.resolve({ data: null }),
  ]);

  const objek = penetapan.objek_pad as any;
  const wajib = objek?.wajib_retribusi as any;

  const pdfBytes = await generateSkrdPdf({
    nomorPenetapan: penetapan.nomor_penetapan,
    tanggalDitetapkan: penetapan.tanggal_ditetapkan,
    jatuhTempo: penetapan.jatuh_tempo,
    periodeTahun: penetapan.periode_tahun,
    periodeBulan: penetapan.periode_bulan,
    jumlahDitetapkan: Number(penetapan.jumlah_ditetapkan),
    status: penetapan.status,
    objekNama: objek?.nama_objek ?? "-",
    objekLokasi: objek?.lokasi ?? null,
    objekKabupaten: objek?.kabupaten_kota ?? null,
    jenisPadNama: objek?.jenis_pad?.nama ?? "-",
    wajibNama: wajib?.nama ?? null,
    wajibNikNpwp: wajib?.nik_npwp ?? null,
    wajibAlamat: wajib?.alamat ?? null,
    ditetapkanOlehNama: (namaPenetap as any) ?? null,
    dicetakOlehNama: profile?.nama_lengkap ?? user.email ?? "-",
  });

  return new NextResponse(pdfBytes as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="SKRD-${(penetapan.nomor_penetapan || id).replace(/[^a-zA-Z0-9-]/g, "_")}.pdf"`,
    },
  });
}
