import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage";
import { getCurrentProfile } from "@/lib/auth";
import {
  canCreateTindakLanjut,
  canDeleteLampiran,
  canDeleteTindakLanjut,
  canManagePenetapan,
  canManagePembayaran,
  canManagePotensi,
  tindakLanjutPokjaOptions,
} from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/types";
import UploadLampiran from "./upload";
import TambahTindakLanjut from "./tindak-lanjut-form";
import { PenetapanForm, PembayaranForm, PotensiForm } from "./pad-engine-forms";
import {
  DeleteLampiranButton,
  DeletePembayaranButton,
  DeletePenetapanButton,
  DeletePotensiButton,
  DeleteTindakLanjutButton,
} from "./delete-buttons";
import { rupiah, statusMeta } from "@/lib/status";
import { IconMapPin, IconFileText, IconWallet } from "@/lib/icons";

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

  const { data: potensi } = await db
    .from("potensi_pad")
    .select("*")
    .eq("objek_pad_id", id)
    .order("created_at", { ascending: false });

  const { data: penetapan } = await db
    .from("penetapan_pad")
    .select("*, pembayaran_pad(*)")
    .eq("objek_pad_id", id)
    .order("tanggal_ditetapkan", { ascending: false });

  const tarifList = objek
    ? (
        await db
          .from("pad_tariffs")
          .select("*")
          .eq("jenis_pad_id", objek.jenis_pad_id)
          .eq("is_active", true)
          .order("nama_tarif")
      ).data ?? []
    : [];

  // Bucket B2 privat -> generate presigned download URL (berlaku 1 jam) per file,
  // bukan link publik permanen.
  const lampiran = await Promise.all(
    (lampiranRaw ?? []).map(async (l) => ({
      ...l,
      downloadUrl: await getDownloadUrl(l.r2_key),
    }))
  );

  return {
    objek,
    tindakLanjut: tindakLanjut ?? [],
    lampiran,
    potensi: potensi ?? [],
    penetapan: penetapan ?? [],
    tarifList,
  };
}

export default async function ObjekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ objek, tindakLanjut, lampiran, potensi, penetapan, tarifList }, profile] = await Promise.all([
    getData(id),
    getCurrentProfile(),
  ]);

  if (!objek) {
    return <div className="empty-state">Objek tidak ditemukan.</div>;
  }

  const canCreateTL = canCreateTindakLanjut(profile?.role);
  const pokjaOptions = tindakLanjutPokjaOptions(profile?.role, profile?.pokja);
  const roleLabel = profile ? ROLE_LABEL[profile.role] : "-";
  const canDeleteAttachment = canDeleteLampiran(profile?.role);
  const canPotensi = canManagePotensi(profile?.role);
  const canPenetapan = canManagePenetapan(profile?.role);
  const canPembayaran = canManagePembayaran(profile?.role);

  const potensiOptions = potensi.map((p: any) => ({
    id: p.id,
    label: `${p.periode_tahun} \u00b7 ${rupiah(p.estimasi_potensi)}`,
    estimasi: p.estimasi_potensi,
  }));

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
            <div key={l.id} className="card" style={{ padding: 10, textAlign: "center", position: "relative" }}>
              <a href={l.downloadUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                <p style={{ fontSize: 11.5, margin: 0, wordBreak: "break-word" }}>{l.nama_file}</p>
              </a>
              {canDeleteAttachment && (
                <div style={{ marginTop: 6 }}>
                  <DeleteLampiranButton id={l.id} />
                </div>
              )}
            </div>
          ))}
          {lampiran.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)", gridColumn: "1 / -1" }}>Belum ada lampiran.</p>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-label">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><IconWallet size={15} /> Potensi & penetapan PAD</span>
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <PotensiForm objekPadId={objek.id} tarifList={tarifList} canManage={canPotensi} />
          <PenetapanForm objekPadId={objek.id} potensiOptions={potensiOptions} canManage={canPenetapan} />
        </div>

        {potensi.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 8px" }}>
              Riwayat potensi
            </p>
            <div className="stack">
              {potensi.map((p: any) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}>
                  <span>
                    Tahun {p.periode_tahun} &middot; {p.parameter_jumlah} &times; {rupiah(p.tarif_rp_saat_itu)} ={" "}
                    <strong className="mono">{rupiah(p.estimasi_potensi)}</strong>
                  </span>
                  {(canPotensi || profile?.role === "super_admin") && <DeletePotensiButton id={p.id} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 8px" }}>
          Penetapan tagihan
        </p>
        <div className="stack">
          {penetapan.map((p: any) => {
            const totalDibayar = (p.pembayaran_pad ?? []).reduce((s: number, b: any) => s + Number(b.jumlah_dibayar), 0);
            const sisa = Math.max(Number(p.jumlah_ditetapkan) - totalDibayar, 0);
            const badge =
              p.status === "lunas"
                ? { label: "Lunas", color: "var(--status-green)", tint: "var(--status-green-tint)" }
                : p.status === "sebagian"
                ? { label: "Sebagian", color: "var(--status-yellow)", tint: "var(--status-yellow-tint)" }
                : p.status === "dibatalkan"
                ? { label: "Dibatalkan", color: "var(--text-muted)", tint: "var(--status-black-tint)" }
                : { label: "Belum lunas", color: "var(--status-red)", tint: "var(--status-red-tint)" };
            const lewatTempo = p.status !== "lunas" && p.status !== "dibatalkan" && new Date(p.jatuh_tempo) < new Date();

            return (
              <div key={p.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 13.5, margin: 0 }}>
                      {p.nomor_penetapan || `Penetapan ${p.periode_tahun}`} &middot; <span className="mono">{rupiah(p.jumlah_ditetapkan)}</span>
                    </p>
                    <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
                      Jatuh tempo {new Date(p.jatuh_tempo).toLocaleDateString("id-ID")}
                      {lewatTempo && <span style={{ color: "var(--status-red)" }}> &middot; lewat tempo</span>}
                      {totalDibayar > 0 && ` \u00b7 dibayar ${rupiah(totalDibayar)}, sisa ${rupiah(sisa)}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge" style={{ background: badge.tint, color: badge.color }}>{badge.label}</span>
                    {canPenetapan && <DeletePenetapanButton id={p.id} />}
                  </div>
                </div>

                {(p.pembayaran_pad ?? []).length > 0 && (
                  <div style={{ marginTop: 8, marginLeft: 4 }}>
                    {p.pembayaran_pad.map((b: any) => (
                      <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-secondary)", padding: "3px 0" }}>
                        <span>
                          {new Date(b.tanggal_bayar).toLocaleDateString("id-ID")} &middot; {b.metode ?? "-"} &middot; <span className="mono">{rupiah(b.jumlah_dibayar)}</span>
                        </span>
                        {canPembayaran && <DeletePembayaranButton id={b.id} />}
                      </div>
                    ))}
                  </div>
                )}

                {p.status !== "lunas" && p.status !== "dibatalkan" && (
                  <div style={{ marginTop: 4 }}>
                    <PembayaranForm penetapanId={p.id} canManage={canPembayaran} />
                  </div>
                )}
              </div>
            );
          })}
          {penetapan.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada penetapan tagihan.</p>}
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
            <div key={t.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ fontSize: 13.5, margin: 0 }}>{t.deskripsi ?? t.jenis_kegiatan}</p>
                <p className="mono" style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
                  {t.jenis_kegiatan} &middot; Pokja {t.pokja ?? "-"} &middot; {new Date(t.tanggal_kegiatan).toLocaleDateString("id-ID")}
                </p>
              </div>
              {canDeleteTindakLanjut(profile?.role, t.pokja, profile?.pokja) && <DeleteTindakLanjutButton id={t.id} />}
            </div>
          ))}
          {tindakLanjut.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Belum ada tindak lanjut.</p>}
        </div>
      </div>
    </div>
  );
}
