"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function detectKategori(file: File): "foto-lapangan" | "video" | "dokumen" {
  if (file.type.startsWith("image/")) return "foto-lapangan";
  if (file.type.startsWith("video/")) return "video";
  return "dokumen";
}

export default function UploadLampiran({ objekPadId }: { objekPadId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const kategori = detectKategori(file);

      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori,
          refId: objekPadId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat URL unggah.");
      }
      const { uploadUrl, key } = await presignRes.json();

      // contentLength diikat ke presigned URL di server -- kalau file yang
      // benar-benar dikirim di sini ukurannya beda, B2 akan menolak PUT ini.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Gagal mengunggah file ke penyimpanan.");

      const { error: insertError } = await supabase.from("lampiran").insert({
        r2_key: key,
        nama_file: file.name,
        tipe_file: kategori,
        content_type: file.type,
        ukuran_bytes: file.size,
        objek_pad_id: objekPadId,
      });
      if (insertError) throw new Error(insertError.message);

      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan saat mengunggah.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="upload-drop">
      <label htmlFor="lampiran-input" className="btn">
        {uploading ? "Mengunggah..." : "+ Unggah lampiran"}
      </label>
      <input id="lampiran-input" type="file" onChange={handleFile} disabled={uploading} accept="image/*,video/*,.pdf,.doc,.docx" style={{ display: "none" }} />
      {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
        Foto maks. 15 MB, dokumen maks. 25 MB, video maks. 200 MB.
      </p>
    </div>
  );
}
