import { createServerSupabase } from "@/lib/supabase/server";
import PetaClient from "./peta-client";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data: objekPad } = await db
    .from("objek_pad")
    .select("id, nama_objek, kabupaten_kota, status_verifikasi, koordinat_lat, koordinat_lng, jenis_pad(nama)")
    .not("koordinat_lat", "is", null)
    .not("koordinat_lng", "is", null);
  const { data: totalObjek } = await db.from("objek_pad").select("id", { count: "exact", head: true });
  return { objekPad: objekPad ?? [], totalCount: (totalObjek as any)?.length ?? 0 };
}

export default async function PetaPage() {
  const { objekPad } = await getData();

  return (
    <div>
      <p className="page-eyebrow">Pokja I &middot; GIS</p>
      <h1 className="page-title">Peta potensi PAD</h1>
      <p className="page-subtitle">
        Sebaran objek PAD di seluruh kabupaten/kota NTT, diwarnai sesuai status validasi.
        Hanya objek dengan koordinat GPS yang tersimpan yang tampil di sini.
      </p>
      <PetaClient objekPad={objekPad as any} />
    </div>
  );
}
