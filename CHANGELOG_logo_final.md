# Ganti ke logo final (gambar asli, bukan hasil gambar ulang)

Sebelumnya (CHANGELOG_logo_favicon.md) favicon/ikon PWA digambar ulang dari
nol pakai bentuk geometris karena cuma ada mockup referensi. Sekarang sudah
dapat gambar jadi -- semua ikon diganti dari file itu langsung, plus dipasang
juga sebagai logo DI DALAM aplikasi (sidebar & halaman login), bukan cuma
favicon/PWA.

## File yang diganti (isi PNG-nya, nama file tetap sama)
- `public/favicon.ico`, `public/icons/icon-*.png`, `public/icons/icon-maskable-512.png`,
  `public/icons/apple-touch-icon.png` -- semua di-generate ulang dari gambar
  yang diberikan (resize per ukuran, sudut sudah transparan dari sumbernya
  jadi tidak perlu proses tambahan; apple-touch-icon dikasih latar navy solid
  krn iOS tidak menerima ikon transparan dgn baik).

## File baru
- `public/brand/logo.png` (160x160) — dipakai untuk logo DI DALAM aplikasi.

## File yang diubah
- `app/layout.tsx` — brand-mark di sidebar (sebelumnya kotak teal + ikon pin
  SVG generik) sekarang pakai `<img src="/brand/logo.png">`.
- `app/login/page.tsx` — logo di panel kiri halaman login, sama.
- `app/globals.css` — class `.brand-mark` disesuaikan supaya cocok dipakai
  sebagai `<img>` (object-fit: cover), gradient teal lama dihapus karena
  logo aslinya sudah punya latar navy sendiri.

## Kejujuran soal keterbacaan di ukuran kecil
Gambar sumbernya detail & bergaya 3D/glossy -- di ukuran BESAR (sidebar,
login, ikon PWA 192px ke atas) hasilnya tajam dan bagus. Tapi di ukuran
favicon KECIL (16-32px, yang muncul di tab browser), detailnya jadi padat
dan kurang tajam -- tetap kebaca sebagai "ikon emas-navy khas", tapi
elemen bulan/grafik/pulau di dalamnya tidak setajam versi besar. Ini
batasan wajar dari logo bergaya detail dipakai di ukuran sekecil itu, bukan
sesuatu yang saya bisa perbaiki lebih lanjut tanpa desain ulang yang lebih
sederhana khusus untuk ukuran kecil.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
