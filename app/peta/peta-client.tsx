"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { STATUS_META, statusMeta, type StatusVerifikasi } from "@/lib/status";

type ObjekPoint = {
  id: string;
  nama_objek: string;
  kabupaten_kota: string | null;
  status_verifikasi: string;
  koordinat_lat: number;
  koordinat_lng: number;
  jenis_pad_id: string;
  jenis_pad?: { nama: string } | null;
};

const NTT_CENTER: [number, number] = [-9.6, 121.8];
const ALL_STATUS = Object.keys(STATUS_META) as StatusVerifikasi[];

export default function PetaClient({
  objekPad,
  jenisPad,
  kabupatenList,
}: {
  objekPad: ObjekPoint[];
  jenisPad: { id: string; nama: string }[];
  kabupatenList: string[];
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const leafletRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  const [jenisFilter, setJenisFilter] = useState(searchParams.get("jenis") ?? "");
  const [kabFilter, setKabFilter] = useState(searchParams.get("kab") ?? "");
  const [activeStatus, setActiveStatus] = useState<Set<StatusVerifikasi>>(() => {
    const s = searchParams.get("status");
    return s && ALL_STATUS.includes(s as StatusVerifikasi) ? new Set([s as StatusVerifikasi]) : new Set(ALL_STATUS);
  });

  function toggleStatus(key: StatusVerifikasi) {
    setActiveStatus((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next.size === 0 ? new Set(ALL_STATUS) : next; // jangan biarkan kosong total
    });
  }

  const filtered = useMemo(
    () =>
      objekPad.filter(
        (o) =>
          activeStatus.has((o.status_verifikasi as StatusVerifikasi) ?? "belum_terdaftar") &&
          (!jenisFilter || o.jenis_pad_id === jenisFilter) &&
          (!kabFilter || o.kabupaten_kota === kabFilter)
      ),
    [objekPad, activeStatus, jenisFilter, kabFilter]
  );

  // Inisialisasi peta + cluster group sekali di awal.
  useEffect(() => {
    let cancelled = false;

    Promise.all([import("leaflet"), import("leaflet.markercluster") as any]).then(([L]) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current).setView(NTT_CENTER, 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const cluster = (L as any).markerClusterGroup({ maxClusterRadius: 50 });
      map.addLayer(cluster);

      mapRef.current = map;
      clusterRef.current = cluster;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render ulang marker setiap kali hasil filter berubah (bukan setiap kali
  // peta diinisialisasi ulang -- cluster group di-clear lalu diisi ulang).
  useEffect(() => {
    if (!ready || !clusterRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const cluster = clusterRef.current;
    cluster.clearLayers();
    markersRef.current = {};

    filtered.forEach((o) => {
      const meta = statusMeta(o.status_verifikasi);
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:${meta.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);color:white;font-size:10px;line-height:1;font-weight:700">${meta.glyph}</span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([o.koordinat_lat, o.koordinat_lng], { icon });
      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:13px;min-width:160px">
          <strong>${escapeHtml(o.nama_objek)}</strong><br/>
          <span style="color:#5b6270">${escapeHtml(o.jenis_pad?.nama ?? "")}</span><br/>
          <span style="color:#5b6270">${escapeHtml(o.kabupaten_kota ?? "-")}</span><br/>
          <a href="/objek-pad/${o.id}" style="color:${meta.color};font-weight:600">Lihat detail &rarr;</a>
        </div>`
      );
      cluster.addLayer(marker);
      markersRef.current[o.id] = marker;
    });
  }, [ready, filtered]);

  useEffect(() => {
    if (!ready || !focusId || !mapRef.current) return;
    const marker = markersRef.current[focusId];
    if (marker) {
      mapRef.current.setView(marker.getLatLng(), 13);
      marker.openPopup();
    }
  }, [ready, focusId, filtered]);

  function updateUrl(next: { jenis?: string; kab?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.jenis !== undefined) (next.jenis ? params.set("jenis", next.jenis) : params.delete("jenis"));
    if (next.kab !== undefined) (next.kab ? params.set("kab", next.kab) : params.delete("kab"));
    router.replace(`/peta${params.toString() ? `?${params}` : ""}`);
  }

  const anyFilterActive = jenisFilter || kabFilter || activeStatus.size !== ALL_STATUS.length;

  return (
    <div>
      <div className="card" style={{ padding: 12, marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <select
          value={jenisFilter}
          onChange={(e) => {
            setJenisFilter(e.target.value);
            updateUrl({ jenis: e.target.value });
          }}
          style={{ maxWidth: 220 }}
        >
          <option value="">Semua jenis PAD</option>
          {jenisPad.map((j) => (
            <option key={j.id} value={j.id}>{j.nama}</option>
          ))}
        </select>

        <select
          value={kabFilter}
          onChange={(e) => {
            setKabFilter(e.target.value);
            updateUrl({ kab: e.target.value });
          }}
          style={{ maxWidth: 220 }}
        >
          <option value="">Semua kabupaten/kota</option>
          {kabupatenList.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {anyFilterActive && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => {
              setJenisFilter("");
              setKabFilter("");
              setActiveStatus(new Set(ALL_STATUS));
              router.replace("/peta");
            }}
          >
            Reset filter
          </button>
        )}

        <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} dari {objekPad.length} objek
        </span>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {ALL_STATUS.map((key) => {
          const meta = STATUS_META[key];
          const isActive = activeStatus.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleStatus(key)}
              className="badge"
              title={meta.mapLabel}
              style={{
                background: isActive ? meta.tint : "var(--surface-muted, #f1f1ef)",
                color: isActive ? meta.color : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                opacity: isActive ? 1 : 0.55,
              }}
            >
              <span style={{ display: "inline-flex", width: 14, height: 14, borderRadius: "50%", background: isActive ? meta.color : "var(--text-muted)", color: "white", fontSize: 8.5, alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {meta.glyph}
              </span>
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div ref={mapContainerRef} style={{ height: 520, width: "100%" }} />
      </div>

      {objekPad.length === 0 && (
        <div className="empty-state" style={{ marginTop: 14 }}>
          Belum ada objek PAD dengan koordinat GPS. Tambahkan koordinat lewat halaman{" "}
          <a href="/objek-pad">Objek PAD</a> (tombol &ldquo;Ambil lokasi saat ini&rdquo;).
        </div>
      )}
      {objekPad.length > 0 && filtered.length === 0 && (
        <div className="empty-state" style={{ marginTop: 14 }}>Tidak ada objek yang cocok dengan filter ini.</div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
