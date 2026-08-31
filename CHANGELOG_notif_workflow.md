# Fitur baru: Notification center + diferensiasi workflow Pokja

Dua item terakhir dari roadmap awal (P1).

## 1. Notification center

### Migrasi SQL baru
- `supabase/schema_10_notifications.sql` — tabel `notifications` + RLS
  (cuma boleh lihat/tandai-baca/hapus notifikasi MILIK SENDIRI, tidak ada
  policy insert untuk siapapun -- baris notifikasi hanya bisa dibuat lewat
  fungsi `notify_roles()` security definer yang dipanggil trigger, supaya
  orang tidak bisa kirim notifikasi palsu ke user lain lewat API langsung).
  Trigger otomatis untuk 4 event:
  - Tindak lanjut baru -> anggota Pokja terkait
  - Laporan berkala baru -> pimpinan
  - Objek berubah jadi "menunggak" -> pimpinan + Pokja II
  - Penetapan tagihan baru -> pimpinan

  **Batasan yang jujur perlu diketahui**: semua trigger di atas berbasis
  event tulis (insert/update), BUKAN berbasis waktu. Jadi tidak ada
  notifikasi otomatis semacam "3 hari sebelum jatuh tempo" -- itu perlu
  pekerjaan terjadwal (pg_cron) yang tidak termasuk migrasi ini, sama
  seperti batasan yang sudah dicatat di schema_08 (PAD Engine).

### File baru
- `app/notification-bell.tsx` — ikon lonceng di sidebar dgn badge jumlah
  belum dibaca, dropdown 8 notifikasi terbaru, polling tiap 30 detik
  (bukan realtime websocket -- cukup untuk skala tim ini).
- `app/notifikasi/page.tsx` + `notifikasi-list.tsx` — halaman lengkap 100
  notifikasi terbaru, tandai baca per item / semua sekaligus.
- `lib/icons.tsx` — tambah `IconBell`.

## 2. Diferensiasi workflow Pokja (PIC, deadline, SLA)

### Prasyarat yang ditemukan
Kolom `jenis_kegiatan` di `tindak_lanjut` TIDAK PERNAH punya opsi untuk
Pokja III (monitoring/evaluasi) -- daftar yang ada dari awal cuma pas untuk
Pokja I & II. Pokja III terpaksa selalu pilih "Lainnya". Dibetulkan di:
- `supabase/schema_11_workflow_pokja.sql` (migrasi baru) — tambah opsi
  `monitoring_evaluasi` ke CHECK constraint (dicari dulu nama constraint-nya
  secara dinamis, bukan diasumsikan tetap), tambah kolom `deadline date`.

### File baru
- `lib/workflow-pokja.ts` — satu sumber kebenaran: jenis kegiatan yang
  relevan per Pokja + target SLA (hari) per jenis. Kalau daftar ini diubah,
  ingat sinkronkan juga CHECK constraint di schema_11.
- `app/objek-pad/[id]/tindak-lanjut-status.tsx` — ubah status
  (berjalan/selesai/tertunda) langsung dari daftar, hanya untuk Pokja
  pemilik baris atau pimpinan (permission sama seperti hapus).

### File yang diubah
- `app/objek-pad/[id]/tindak-lanjut-form.tsx` — pilihan "Jenis kegiatan"
  sekarang MENGIKUTI Pokja yang dipilih (bukan satu daftar gabungan
  semuanya seperti sebelumnya); field deadline baru, otomatis disarankan
  dari SLA jenis kegiatan tapi tetap bisa diubah manual.
- `app/objek-pad/[id]/page.tsx` — tampilkan tenggat + indikator merah
  "lewat SLA" kalau deadline lewat dan status belum selesai; status
  sekarang bisa diubah inline.
- `app/tindak-lanjut/page.tsx` — judul sebelumnya salah kaprah bilang
  "Pokja II" padahal datanya lintas-Pokja; sekarang ada filter per Pokja,
  badge status, dan indikator SLA yang sama.
- `lib/types.ts` — tambah `deadline` ke tipe `TindakLanjut`, tambah tipe
  `Notification`.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error, termasuk route
`/notifikasi` baru.
