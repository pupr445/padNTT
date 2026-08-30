"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { STATUS_META } from "@/lib/status";
import type { JenisPad } from "@/lib/types";

export default function ObjekPadFilters({
  jenisPad,
  kabupatenList,
}: {
  jenisPad: JenisPad[];
  kabupatenList: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/objek-pad${params.toString() ? `?${params}` : ""}`);
  }

  const active = searchParams.get("jenis") || searchParams.get("status") || searchParams.get("kab");

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
      <select value={searchParams.get("jenis") ?? ""} onChange={(e) => setParam("jenis", e.target.value)} style={{ maxWidth: 220 }}>
        <option value="">Semua jenis PAD</option>
        {jenisPad.map((j) => (
          <option key={j.id} value={j.id}>{j.nama}</option>
        ))}
      </select>

      <select value={searchParams.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} style={{ maxWidth: 180 }}>
        <option value="">Semua status</option>
        {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => (
          <option key={key} value={key}>{STATUS_META[key].label}</option>
        ))}
      </select>

      <select value={searchParams.get("kab") ?? ""} onChange={(e) => setParam("kab", e.target.value)} style={{ maxWidth: 220 }}>
        <option value="">Semua kabupaten/kota</option>
        {kabupatenList.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      {active && (
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/objek-pad")} style={{ fontSize: 12 }}>
          Reset filter
        </button>
      )}
    </div>
  );
}
