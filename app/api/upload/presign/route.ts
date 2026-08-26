import { NextRequest, NextResponse } from "next/server";
import { buildStorageKey, getUploadUrl } from "@/lib/storage";
import { createServerSupabase } from "@/lib/supabase/server";

// Node.js runtime (default) -- OpenNext Cloudflare adapter menjalankan Next.js
// di Workers pakai kompatibilitas Node.js penuh, tidak perlu "edge" runtime lagi.

// Body: { kategori: 'foto-lapangan' | 'dokumen' | 'video', refId: string, filename: string, contentType: string }
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

  const { kategori, refId, filename, contentType } = await req.json();

  if (!kategori || !refId || !filename || !contentType) {
    return NextResponse.json(
      { error: "Data tidak lengkap. Kirim kategori, refId, filename, dan contentType." },
      { status: 400 }
    );
  }

  const key = buildStorageKey(kategori, refId, filename);
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
