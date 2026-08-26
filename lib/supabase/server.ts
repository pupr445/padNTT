import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Dipakai di server component / route handler. Ikut sesi login user yang
// sedang aktif lewat cookie, sehingga semua query TETAP tunduk pada RLS
// (data yang kembali otomatis dibatasi sesuai role, bukan bypass semua).
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component (bukan Route Handler/Server Action) —
            // aman diabaikan karena middleware yang menangani refresh sesi.
          }
        },
      },
    }
  );
}

// Klien admin dengan service role key -> BYPASS RLS sepenuhnya.
// Hanya dipakai untuk operasi tepercaya sisi server yang memang butuh akses
// penuh (mis. trigger/maintenance tertentu). JANGAN dipakai untuk membaca/
// menulis data atas nama user biasa — gunakan createServerSupabase() di atas
// supaya RLS per role tetap berlaku.
export function createAdminSupabase() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
