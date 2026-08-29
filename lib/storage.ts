import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Backblaze B2 kompatibel dengan S3 API lewat "S3 Compatible API".
// Endpoint didapat dari B2 dashboard -> Buckets -> (bucket kamu) -> Endpoint,
// bentuknya seperti: s3.us-west-004.backblazeb2.com
export const storage = new S3Client({
  region: process.env.B2_REGION || "us-west-004",
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const BUCKET = process.env.B2_BUCKET_NAME!;

// Kategori lampiran yang diizinkan -- dipakai untuk validasi di route presign
// (jangan hanya percaya nilai dari client) dan untuk membangun key storage.
export const KATEGORI_LAMPIRAN = ["foto-lapangan", "video", "dokumen"] as const;
export type KategoriLampiran = (typeof KATEGORI_LAMPIRAN)[number];

// Content-Type yang diizinkan per kategori -- mencegah orang mengunggah file
// executable/berbahaya dengan menyamar sebagai kategori lain.
const ALLOWED_CONTENT_TYPES: Record<KategoriLampiran, RegExp> = {
  "foto-lapangan": /^image\/(jpeg|png|webp|heic|heif)$/,
  video: /^video\/(mp4|quicktime|webm)$/,
  dokumen: /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};

// Batas ukuran per kategori (bytes) -- ditegakkan di presign (ContentLength)
// supaya tidak bisa dilewati dengan mengubah nilai di browser.
const MAX_SIZE_BYTES: Record<KategoriLampiran, number> = {
  "foto-lapangan": 15 * 1024 * 1024, // 15 MB -- cukup untuk foto HP resolusi tinggi
  video: 200 * 1024 * 1024, // 200 MB
  dokumen: 25 * 1024 * 1024, // 25 MB
};

export function isKategoriLampiran(v: unknown): v is KategoriLampiran {
  return typeof v === "string" && (KATEGORI_LAMPIRAN as readonly string[]).includes(v);
}

export function validateUpload(kategori: KategoriLampiran, contentType: string, size: number): string | null {
  if (!ALLOWED_CONTENT_TYPES[kategori].test(contentType)) {
    return `Tipe file "${contentType}" tidak diizinkan untuk kategori ${kategori}.`;
  }
  if (!Number.isFinite(size) || size <= 0) {
    return "Ukuran file tidak valid.";
  }
  if (size > MAX_SIZE_BYTES[kategori]) {
    const maxMb = Math.round(MAX_SIZE_BYTES[kategori] / (1024 * 1024));
    return `File melebihi batas ${maxMb} MB untuk kategori ${kategori}.`;
  }
  return null;
}

// UUID v4 longgar (cukup untuk validasi format id dari tabel Supabase/Postgres)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidRefId(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function sanitizeSegment(v: string) {
  return v.replace(/[^a-zA-Z0-9\-_]/g, "_");
}

// Bikin key yang konsisten: {kategori}/{objekId}/{timestamp}-{filename}
// kategori & refId disaring juga (bukan cuma filename) supaya tidak bisa
// dipakai untuk path traversal ("../") di key storage.
export function buildStorageKey(kategori: string, refId: string, filename: string) {
  const safeKategori = sanitizeSegment(kategori);
  const safeRefId = sanitizeSegment(refId);
  const safeName = sanitizeSegment(filename);
  return `${safeKategori}/${safeRefId}/${Date.now()}-${safeName}`;
}

// Presigned URL untuk upload langsung dari browser (PUT), berlaku 5 menit.
// contentLength diikat ke command supaya B2 menolak kalau ukuran aktual saat
// PUT tidak sama persis dengan yang divalidasi di presign (mencegah "bait and
// switch": minta presign untuk file kecil lalu upload file lain yang lebih besar).
export async function getUploadUrl(key: string, contentType: string, contentLength: number) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(storage, command, { expiresIn: 300 });
}

// Presigned URL untuk melihat/unduh file privat (kalau bucket tidak public)
export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(storage, command, { expiresIn: 3600 });
}

// Kalau bucket di-set "Public" di B2, ini cukup untuk <img>/<video> src langsung.
// Format URL publik B2 native: https://f004.backblazeb2.com/file/{bucketName}/{key}
// (nomor "f004" mengikuti region-mu, sesuaikan dari dashboard B2)
export function getPublicUrl(key: string) {
  return `${process.env.B2_PUBLIC_URL}/${key}`;
}
