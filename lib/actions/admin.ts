"use server";

import { createAdminSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Role } from "@/lib/types";

type InviteInput = {
  email: string;
  nama_lengkap: string;
  role: Role;
  pokja: "I" | "II" | "III" | null;
  instansi: string | null;
};

// Hanya super_admin yang boleh menambah akun -- dicek dua kali: sekali di sini
// (server action, sebelum panggil Admin API yang bypass RLS), dan sekali lagi
// lewat RLS biasa untuk operasi baca/tulis lain di seluruh app.
export async function inviteUser(input: InviteInput) {
  const actor = await getCurrentProfile();
  if (!actor || actor.role !== "super_admin") {
    return { error: "Hanya Super Admin yang bisa menambah akun." };
  }

  if (!input.email.trim() || !input.nama_lengkap.trim()) {
    return { error: "Email dan nama lengkap wajib diisi." };
  }

  const admin = createAdminSupabase();

  // Membuat user Auth baru + mengirim email undangan (link set password) lewat
  // pengirim email bawaan Supabase. Kalau nanti mengundang banyak orang sekaligus,
  // pertimbangkan setup SMTP custom di Supabase (Settings -> Auth -> SMTP) karena
  // pengirim bawaan punya batas kirim per jam.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email.trim(), {
    data: { nama_lengkap: input.nama_lengkap.trim() },
  });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user.id;

  // Trigger handle_new_user() otomatis membuat baris profiles (role default
  // "viewer") saat baris di atas jalan -- di sini kita langsung set role/pokja
  // sesuai pilihan Super Admin supaya tidak perlu langkah kedua manual.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      nama_lengkap: input.nama_lengkap.trim(),
      role: input.role,
      pokja: input.pokja,
      instansi: input.instansi?.trim() || null,
    })
    .eq("id", userId);

  if (updateError) {
    return { error: `Akun dibuat, tapi gagal set role: ${updateError.message}` };
  }

  revalidatePath("/admin");
  return { success: true };
}
