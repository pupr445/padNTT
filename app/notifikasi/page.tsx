import { createServerSupabase } from "@/lib/supabase/server";
import NotifikasiList from "./notifikasi-list";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data } = await db.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return data ?? [];
}

export default async function NotifikasiPage() {
  const items = await getData();

  return (
    <div>
      <p className="page-eyebrow">Pemberitahuan</p>
      <h1 className="page-title">Notifikasi</h1>
      <p className="page-subtitle">
        100 notifikasi terbaru untuk Anda -- tindak lanjut baru di Pokja Anda, laporan baru, objek yang
        menunggak, dan penetapan tagihan baru.
      </p>
      <NotifikasiList initial={items as any} />
    </div>
  );
}
