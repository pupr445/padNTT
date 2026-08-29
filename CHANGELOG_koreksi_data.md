# Perubahan: Jalan koreksi data yang sebelumnya tidak ada (menjawab pertanyaan "apakah super_admin bisa akses semua?")

Saat ditelusuri satu-satu, ternyata beberapa tabel TIDAK punya policy
UPDATE/DELETE sama sekali -- bukan soal role, tapi memang belum ada jalan
koreksi lewat aplikasi untuk siapapun, termasuk super_admin.

## Migrasi SQL baru (WAJIB dijalankan setelah schema_01–05)
- `supabase/schema_06_koreksi_data.sql`:
  - `laporan_berkala` — tambah kolom `dibuat_oleh_id` (otomatis dari
    `auth.uid()`), lalu tambah policy UPDATE & DELETE (pembuat asli +
    pimpinan + super_admin). Sebelumnya laporan yang sudah tersimpan
    tidak bisa diubah/dihapus sama sekali lewat app.
  - `tindak_lanjut` — tambah policy DELETE (Pokja pemilik baris + pimpinan
    + super_admin, sama seperti policy UPDATE yang sudah ada).
  - `target_realisasi` — tambah policy DELETE (Bapenda + pimpinan +
    super_admin, sama seperti policy INSERT/UPDATE yang sudah ada).

## File kode yang diubah
- `lib/permissions.ts` — tambah `canDeleteTindakLanjut`, `canEditLaporan`/
  `canDeleteLaporan`, `canDeleteTargetRealisasi`. Juga perbaiki
  `canDeleteLampiran` yang sebelumnya masih "super_admin saja" padahal
  RLS-nya (schema_05) sudah dilebarkan ke pimpinan juga -- baru ketahuan
  tidak sinkron saat ditelusuri ulang.
- `lib/icons.tsx` — tambah `IconTrash`.
- `app/objek-pad/[id]/delete-buttons.tsx` (baru) — tombol hapus tindak
  lanjut & lampiran, hanya render kalau `canDelete...` true.
- `app/objek-pad/[id]/page.tsx` — pasang tombol hapus di atas, restrukturisasi
  kartu lampiran supaya tombol hapus tidak bersarang di dalam link unduh.
- `app/laporan/delete-laporan-button.tsx` (baru) + `app/laporan/page.tsx` —
  tombol hapus laporan untuk pembuat asli atau pimpinan.
- `lib/types.ts` — tambah tipe `LaporanBerkala` (sebelumnya belum ada tipe
  eksplisit untuk tabel ini) dengan field `dibuat_oleh_id`.

## Masih di luar cakupan (bukan "kekurangan", tapi fitur baru -- masuk Fase 3/PAD Engine)
- Belum ada UI untuk mengelola `target_realisasi` sama sekali (baik create
  maupun delete) -- saat ini nilainya kemungkinan diisi manual lewat
  Supabase. Policy DELETE di atas disiapkan duluan supaya begitu UI-nya
  dibangun, RLS-nya sudah lengkap.
- Belum ada halaman edit laporan (hanya hapus) -- edit penuh butuh form
  terpisah, ditunda sampai ada kebutuhan konkret.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
