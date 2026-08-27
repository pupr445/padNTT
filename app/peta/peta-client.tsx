"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import { STATUS_META, statusMeta } from "@/lib/status";

type ObjekPoint = {
  id: string;
  nama_objek: string;
  kabupaten_kota: string | null;
  status_verifikasi: string;
  koordinat_lat: number;
  koordinat_lng: number;
  jenis_pad?: { nama: string } | null;
};

// Pusat provinsi NTT (perkiraan tengah gugusan Flores-Sumba-Timor) sebagai default view.
const NTT_CENTER: [number, number] = [-9.6, 121.8];

export default function PetaClient({ objekPad }: { objekPad: ObjekPoint[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView(NTT_CENTER, 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      objekPad.forEach((o) => {
        const meta = statusMeta(o.status_verifikasi);
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${meta.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([o.koordinat_lat, o.koordinat_lng], { icon }).addTo(map);
        marker.bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;min-width:160px">
            <strong>${escapeHtml(o.nama_objek)}</strong><br/>
            <span style="color:#5b6270">${escapeHtml(o.jenis_pad?.nama ?? "")}</span><br/>
            <span style="color:#5b6270">${escapeHtml(o.kabupaten_kota ?? "-")}</span><br/>
            <a href="/objek-pad/${o.id}" style="color:${meta.color};font-weight:600">Lihat detail &rarr;</a>
          </div>`
        );
        markersRef.current[o.id] = marker;
      });

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

  useEffect(() => {
    if (!ready || !focusId || !mapRef.current) return;
    const marker = markersRef.current[focusId];
    if (marker) {
      mapRef.current.setView(marker.getLatLng(), 13);
      marker.openPopup();
    }
  }, [ready, focusId]);

  return (
    <div>
      <div className="card" style={{ padding: 12, marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => {
          const meta = STATUS_META[key];
          return (
            <span key={key} className="badge" style={{ background: meta.tint, color: meta.color }}>
              <span className="status-dot" style={{ background: meta.color }} />
              {meta.label}
            </span>
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
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
