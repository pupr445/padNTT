"use client";

import { createBrowserClient } from "@supabase/ssr";

// Dipakai di client component (form, upload, dsb). Sesi login otomatis
// dibaca dari cookie yang sama dengan server, lewat @supabase/ssr.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
