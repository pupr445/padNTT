# Fitur baru: Document generation (SKRD & kwitansi)

Item P1 terakhir dari roadmap yang benar-benar baru. Mencetak dokumen resmi
langsung dari data yang sudah ada di PAD Engine (penetapan_pad, pembayaran_pad).

## Prasyarat yang ditemukan & dibenahi dulu
Ketika membangun ini, ketahuan `objek_pad.wajib_retribusi_id` tidak pernah
diisi oleh form manapun -- padahal kolomnya sudah ada sejak schema_01.
Tanpa ini, dokumen SKRD akan selalu kosong nama wajib pajaknya. Ditambahkan:
- `app/objek-pad/[id]/wajib-retribusi-section.tsx` (baru) — form tautkan/ubah
  data wajib retribusi (nama, NIK/NPWP, alamat, kontak) langsung dari
  halaman detail objek. RLS-nya sudah ada sejak schema_04 (Pokja I +
  pimpinan), cuma UI-nya belum ada.
- `lib/types.ts` — tambah tipe `WajibRetribusi`.
- `lib/permissions.ts` — tambah `canManageWajibRetribusi`.

Ditemukan juga: RLS `profiles` tidak terbuka untuk semua orang (hanya diri
sendiri/pimpinan/Pokja III), padahal siapapun yang login boleh mencetak
dokumen -- akibatnya nama pejabat penetap/pencatat pembayaran akan kosong
di dokumen buat kebanyakan role. Solusinya BUKAN memperluas RLS profiles
(itu akan membocorkan email semua orang ke semua orang), tapi:
- `supabase/schema_09_nama_lengkap_rpc.sql` (migrasi baru, WAJIB dijalankan)
  — fungsi `get_nama_lengkap(uuid)` yang sengaja SEMPIT, cuma return nama,
  bisa dipanggil siapapun yang login.

## File baru (generator dokumen)
- `lib/documents/terbilang.ts` — angka ke terbilang bahasa Indonesia (diuji
  manual utk berbagai nilai, termasu ribuan/jutaan/miliaran).
- `lib/documents/skrd.ts` — generate PDF Surat Ketetapan Retribusi Daerah
  (A4) dari data penetapan_pad + objek_pad + wajib_retribusi.
- `lib/documents/kwitansi.ts` — generate PDF tanda terima pembayaran dari
  data pembayaran_pad, termasuk terbilang & sisa tagihan kalau parsial.
- `app/api/documents/penetapan/[id]/route.ts` — endpoint unduh/lihat SKRD
  (PDF), dilindungi cek login (SELECT semua tabel terkait memang sudah
  terbuka utk semua yg login, jadi ini konsisten dgn pola akses yang sudah
  ada, bukan pengecualian baru).
- `app/api/documents/pembayaran/[id]/route.ts` — endpoint unduh/lihat
  kwitansi (PDF).

## File yang diubah
- `app/objek-pad/[id]/page.tsx` — tombol "Cetak SKRD" per baris penetapan,
  "Cetak kwitansi" per baris pembayaran, render section wajib retribusi.

## Dependency baru
- `pdf-lib` (generate PDF server-side, murni JS -- aman utk Cloudflare
  Workers, tidak ada native binding).

## Kejujuran soal dokumen ini
Disclaimer sudah dicantumkan di footer tiap dokumen: PDF ini dibuat OTOMATIS
oleh sistem, BELUM sah secara hukum sampai ditandatangani pejabat berwenang
(tanda tangan basah/elektronik resmi) -- sistem ini cuma mencetak draf
terformat dari data yang sudah tercatat, bukan menerbitkan dokumen hukum.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error. Kedua generator
PDF juga dites JALAN SUNGGUHAN (bukan cuma type-check) dengan data contoh,
hasilnya dirender ke gambar dan diperiksa visual -- layout rapi, tidak ada
teks tumpang tindih, angka & terbilang benar.
