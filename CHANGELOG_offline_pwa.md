# Fitur baru: Offline sync untuk form lapangan (PWA)

Prioritas P0 terakhir dari review UI/UX. Fokus ke DUA form yang benar-benar
diisi di lapangan dengan koneksi tidak menentu: tambah objek PAD dan catat
tindak lanjut. Laporan berkala (Pokja III) TIDAK termasuk karena sifatnya
kerja kantor/rekap, bukan input langsung di lokasi.

## Cara kerja (penting untuk dipahami, bukan cuma dijalankan)
- **BUKAN** Background Sync API browser -- itu tidak didukung Safari/iOS,
  jadi tidak bisa diandalkan sendirian untuk petugas yang pakai iPhone.
- Sebagai gantinya: saat submit form gagal karena masalah jaringan (device
  offline, atau request time out/gagal total), data disimpan ke **IndexedDB**
  di perangkat, bukan hilang begitu saja.
- Antrean itu otomatis dicoba kirim ulang saat: event "online" browser
  menyala, tombol "Sinkronkan sekarang" ditekan, atau setiap 15 detik selama
  browser mendeteksi online (jaga-jaga karena event "online" di HP kadang
  tidak akurat).
- Kalau yang gagal BUKAN soal jaringan (misalnya ditolak RLS/validasi server),
  data TIDAK diantre -- error-nya langsung ditampilkan ke user saat itu juga,
  supaya tidak "hilang" ke antrean dan gagal berulang-ulang tanpa disadari.
- Service worker (`public/sw.js`) HANYA meng-cache ikon & manifest (app
  shell) supaya aplikasi "installable" sebagai PWA (Add to Home Screen) --
  BUKAN yang menangani logika offline data. Halaman & data tetap selalu
  diambil dari jaringan supaya tidak menampilkan versi basi.

## File baru
- `lib/offline-queue.ts` — antrean IndexedDB: queueMutation, getAllMutations,
  syncPendingMutations, heuristik isLikelyNetworkError.
- `lib/use-offline-queue.ts` — hook React: status online/offline, daftar
  pending, fungsi sinkron manual/otomatis.
- `app/offline-status.tsx` — badge di sidebar, muncul HANYA saat offline
  atau ada data yang masih menunggu sinkron (diam kalau semua normal).
- `public/manifest.json` + `public/icons/*.png` — supaya bisa "Add to Home
  Screen" di HP petugas lapangan. Ikon masih placeholder sederhana (lingkaran
  + huruf P warna brand) -- ganti dengan logo resmi kalau sudah ada asetnya.
- `public/sw.js` + `app/sw-register.tsx` — registrasi service worker minimal.

## File yang diubah
- `app/layout.tsx` — tambah metadata manifest/ikon, render
  `<ServiceWorkerRegister />` dan `<OfflineStatusBadge />`.
- `app/objek-pad/form.tsx` dan `app/objek-pad/[id]/tindak-lanjut-form.tsx` —
  submit sekarang coba kirim langsung; kalau gagal karena jaringan, otomatis
  masuk antrean offline dengan pesan konfirmasi kuning (beda dari pesan error
  merah), bukan gagal total.

## Yang BELUM termasuk (di luar cakupan langkah ini)
- Upload lampiran (foto/video/dokumen) BELUM bisa diantre offline -- ini
  butuh penyimpanan file (bukan cuma data form) di IndexedDB/Cache Storage
  yang jauh lebih kompleks (ukuran, kuota, format presigned URL yang
  kedaluwarsa dalam 5 menit). Untuk sekarang, upload lampiran tetap butuh
  koneksi aktif saat itu juga.
- Belum dites di perangkat/deploy sungguhan (Cloudflare Workers) -- hanya
  divalidasi lewat `next build` lokal. Setelah deploy, coba: buka app,
  matikan koneksi (mode pesawat), isi & simpan form objek PAD, badge
  "Sedang offline" harus muncul, lalu nyalakan koneksi lagi dan pastikan
  data benar-benar masuk ke database.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
