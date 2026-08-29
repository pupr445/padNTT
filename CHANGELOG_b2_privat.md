# Perubahan: Perkuat akses file B2 privat + audit lampiran (P0 #2)

## Migrasi SQL baru (WAJIB dijalankan)
- `supabase/schema_05_lampiran_hardening.sql` — jalankan di SQL Editor Supabase
  SETELAH schema_01–04. Isinya:
  - Kolom baru `lampiran.diunggah_oleh_id` (otomatis terisi `auth.uid()` saat
    insert, tidak bisa dipalsukan client) dan `lampiran.content_type`.
  - Trigger audit trail untuk `lampiran` — sebelumnya tabel ini TIDAK
    tercatat di `audit_logs`, padahal ini bukti lapangan yang paling sering
    dipersoalkan keabsahannya.
  - RLS delete lampiran diperluas: super_admin + pimpinan (sebelumnya
    super_admin saja), tapi sekarang selalu tercatat siapa yang menghapus.

## File kode yang diubah
- `lib/storage.ts` — tambah `KATEGORI_LAMPIRAN` (whitelist), validasi
  Content-Type per kategori, batas ukuran per kategori (foto 15 MB, dokumen
  25 MB, video 200 MB), sanitasi kategori & refId di key storage (bukan cuma
  nama file) untuk cegah path traversal, dan `ContentLength` diikat ke
  presigned URL supaya file yang benar-benar di-upload harus sama persis
  ukurannya dengan yang divalidasi.
- `app/api/upload/presign/route.ts` — sebelumnya cuma cek field ada/tidak.
  Sekarang: kategori harus dari whitelist, refId harus UUID valid DAN benar-
  benar menunjuk objek_pad yang ada (query lewat sesi user, tunduk RLS),
  content-type & ukuran divalidasi sebelum presigned URL diterbitkan.
- `app/objek-pad/[id]/upload.tsx` — kirim `size` file ke presign, simpan
  `content_type` asli, tampilkan batas ukuran ke user.
- `lib/types.ts` — tambah `content_type` ke tipe `Lampiran`.

## Yang TIDAK berubah (sudah benar sejak awal)
- Download tetap lewat presigned URL privat (`getDownloadUrl`, berlaku 1 jam)
  — bukan link publik permanen. Upload juga sudah lewat presigned PUT
  (berlaku 5 menit), bukan credential B2 yang di-expose ke browser.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
