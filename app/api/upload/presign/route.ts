import { NextRequest, NextResponse } from "next/server";
import { buildStorageKey, getUploadUrl, isKategoriLampiran, isValidRefId, validateUpload } from "@/lib/storage";
import { createServerSupabase } from "@/lib/supabase/server";

// Node.js runtime (default) -- OpenNext Cloudflare adapter menjalankan Next.js
// di Workers pakai kompatibilitas Node.js penuh, tidak perlu "edge" runtime lagi.

// Body: { kategori: 'foto-lapangan' | 'dokumen' | 'video', refId: string, filename: string, contentType: string, size: number }
export async function POST(req: NextRequest) {
  // Jangan percaya middleware saja -- route ini dikecualikan dari redirect
  // otomatis, jadi cek sesi login secara eksplisit di sini.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const { kategori, refId, filename, contentType, size } = await req.json();

  if (!kategori || !refId || !filename || !contentType || !size) {
    return NextResponse.json(
      { error: "Data tidak lengkap. Kirim kategori, refId, filename, contentType, dan size." },
      { status: 400 }
    );
  }

  // Jangan percaya nilai kategori/refId dari client mentah-mentah -- kategori
  // harus dari daftar yang dikenal, refId harus berformat UUID yang valid,
  // supaya tidak dipakai untuk menyisipkan path aneh ke key storage B2.
  if (!isKategoriLampiran(kategori)) {
    return NextResponse.json({ error: "Kategori lampiran tidak dikenal." }, { status: 400 });
  }
  if (!isValidRefId(refId)) {
    return NextResponse.json({ error: "refId tidak valid." }, { status: 400 });
  }

  // Pastikan refId benar-benar menunjuk objek PAD yang ada. Query ini pakai
  // client Supabase milik sesi user (bukan service role), jadi tetap tunduk
  // RLS -- konsisten dengan aturan yang sama dipakai UI lain.
  const { data: objek, error: objekError } = await supabase
    .from("objek_pad")
    .select("id")
    .eq("id", refId)
    .maybeSingle();
  if (objekError || !objek) {
    return NextResponse.json({ error: "Objek PAD tujuan lampiran tidak ditemukan." }, { status: 404 });
  }

  const validationError = validateUpload(kategori, contentType, Number(size));
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const key = buildStorageKey(kategori, refId, filename);
  const uploadUrl = await getUploadUrl(key, contentType, Number(size));

  return NextResponse.json({ uploadUrl, key });
}
