import { createServerSupabase } from "@/lib/supabase/server";
import PetaClient from "./peta-client";

export const revalidate = 0;

async function getData() {
  const db = await createServerSupabase();
  const { data: objekPad } = await db
    .from("objek_pad")
    .select("id, nama_objek, kabupaten_kota, status_verifikasi, koordinat_lat, koordinat_lng, jenis_pad_id, jenis_pad(nama)")
    .not("koordinat_lat", "is", null)
    .not("koordinat_lng", "is", null);
  const { data: jenisPad } = await db.from("jenis_pad").select("id, nama").order("nama");

  const kabupatenList = Array.from(
    new Set((objekPad ?? []).map((o) => o.kabupaten_kota).filter((k): k is string => !!k))
  ).sort();

  return { objekPad: objekPad ?? [], jenisPad: jenisPad ?? [], kabupatenList };
}

export default async function PetaPage() {
  const { objekPad, jenisPad, kabupatenList } = await getData();

  return (
    <div>
      <p className="page-eyebrow">Pokja I &middot; GIS</p>
      <h1 className="page-title">Peta potensi PAD</h1>
      <p className="page-subtitle">
        Sebaran objek PAD di seluruh kabupaten/kota NTT. Setiap status punya warna DAN bentuk
        berbeda (bukan warna saja), supaya tetap terbaca bagi pengguna buta warna. Hanya objek
        dengan koordinat GPS yang tersimpan yang tampil di sini.
      </p>
      <PetaClient objekPad={objekPad as any} jenisPad={jenisPad} kabupatenList={kabupatenList} />
    </div>
  );
}
