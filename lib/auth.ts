import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Ambil profil (nama, role, pokja) pengguna yang sedang login.
// Return null kalau belum login atau profil belum aktif.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, email, role, pokja, instansi, aktif")
    .eq("id", user.id)
    .single();

  return (profile as Profile) ?? null;
}
