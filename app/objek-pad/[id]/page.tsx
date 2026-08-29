import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage";
import { getCurrentProfile } from "@/lib/auth";
import { canCreateTindakLanjut, tindakLanjutPokjaOptions } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/types";
import UploadLampiran from "./upload";
import TambahTindakLanjut from "./tindak-lanjut-form";
import { statusMeta } from "@/lib/status";
import { IconMapPin, IconFileText } from "@/lib/icons";

export const revalidate = 0;

async function getData(id: string) {
  const db = await createServerSupabase();
  const { data: objek } = await db.from("objek_pad").select("*, jenis_pad(nama)").eq("id", id).single();
  const { data: tindakLanjut } = await db
    .from("tindak_lanjut")
    .select("*")
    .eq("objek_pad_id", id)
    .order("tanggal_kegiatan", { ascending: false });
  const { data: lampiranRaw } = await db
    .from("lampiran")
    .select("*")
    .eq("objek_pad_id", id)
    .order("created_at", { ascending: false });

  // Bucket B2 privat -> generate presigned download URL (berlaku 1 jam) per file,
  // bukan link publik permanen.
  const lampiran = await Promise.all(
    (lampiranRaw ?? []).map(async (l) => ({
      ...l,
      downloadUrl: await getDownloadUrl(l.r2_key),
    }))
  );

  return { objek, tindakLanjut: tindakLanjut ?? [], lampiran };
}

export default async function ObjekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ objek, tindakLanjut, lampiran }, profile] = await Promise.all([getData(id), getCurrentProfile()]);

  if (!objek) {
    return <div className="empty-state">Objek tidak ditemukan.</div>;
  }

  const canCreateTL = canCreateTindakLanjut(profile?.role);
  const pokjaOptions = tindakLanjutPokjaOptions(profile?.role, profile?.pokja);
  const roleLabel = profile ? ROLE_LABEL[profile.role] : "-";

  const meta = statusMeta(objek.status_verifikasi);
  const hasCoords = objek.koordinat_lat && objek.koordinat_lng;

  return (
    <div>
      <p className="page-eyebrow">{objek.jenis_pad?.nama}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h1 className="page-title" style={{ margin: 0 }}>{objek.nama_objek}</h1>
        <span className="badge" style={{ background: meta.tint, color: meta.color }}>{meta.label}</span>
      </div>
      <p className="page-subtitle" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span>{objek.kabupaten_kota ?? "-"} {objek.lokasi ? `\u00b7 ${objek.lokasi}` : ""}</span>
        {hasCoords && (
          <Link href={`/peta?focus=${objek.id}`} className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5 }}>
            <IconMapPin size={13} /> {Number(objek.koordinat_lat).toFixed(5)}, {Number(objek.koordinat_lng).toFixed(5)}
          </Link>
        )}
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-label">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconFileText size={15} /> Lampiran (foto / video / dokumen)</span>
        </p>
        <UploadLampiran objekPadId={objek.id} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 14 }}>
          {lampiran.map((l) => (
            <a key={l.id} href={l.downloadUrl} target="_blank" rel="noreferrer" className="card card-link" style={{ padding: 10, textAlign: "center" }}>
              <p style={{ fontSize: 11.5, margin: 0, wordBreak: "break-word" }}>{l.nama_file}</p>
            </a>
          ))}
          {lampiran.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)", gridColumn: "1 / -1" }}>Belum ada lampiran.</p>}
        </div>
      </div>

      <div className="card">
        <p className="section-label">Tindak lanjut</p>
        <TambahTindakLanjut
          objekPadId={objek.id}
          canCreate={canCreateTL}
          pokjaOptions={pokjaOptions}
          roleLabel={roleLabel}
        />
        <div className="stack" style={{ marginTop: 14 }}>
          {tindakLanjut.map((t) => (
            <div key={t.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <p style={{ fontSize: 13.5, margin: 0 }}>{t.deskripsi ?? t.jenis_kegiatan}</p>
              <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
                {t.jenis_kegiatan} &middot; Pokja {t.pokja ?? "-"} &middot; {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
              </p>
            </div>
          ))}
          {tindakLanjut.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada tindak lanjut.</p>}
        </div>
      </div>
    </div>
  );
}
