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

// Bikin key yang konsisten: {kategori}/{objekId}/{timestamp}-{filename}
export function buildStorageKey(kategori: string, refId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  return `${kategori}/${refId}/${Date.now()}-${safeName}`;
}

// Presigned URL untuk upload langsung dari browser (PUT), berlaku 5 menit
export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
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
