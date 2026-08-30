# Aset baru: favicon & ikon PWA sesuai brand OPTIMA PAD NTT

Digambar ulang jadi PNG/ICO nyata berdasarkan mockup logo yang diberikan
(bulan sabit emas + grafik batang teal + bulu emas, di atas latar navy),
memakai palet warna persis dari mockup:
- Navy `#0D1B2A`, Teal `#0FA3A3`, Gold `#D4AF37`, Cream `#F6F1E6`

## Kejujuran soal hasil gambar ulang
Ini digambar ulang dari nol pakai bentuk geometris (bukan file asli desainer),
jadi hasilnya sebuah INTERPRETASI dari mockup, bukan reproduksi presisi:
- Elemen bulan sabit, grafik batang, dan bulu -- sudah mendekati, cukup
  jelas terbaca sampai ukuran 48px (favicon kecil).
- Elemen siluet kepulauan NTT di dasar mockup asli SENGAJA DIHILANGKAN --
  sudah dicoba beberapa kali, hasilnya selalu terlihat seperti balok/pita
  solid, bukan siluet pulau yang halus. Ikon jadi lebih bersih tanpa elemen
  itu daripada dipaksakan jelek.
- Kalau ada file source asli dari desainer (SVG/AI/Figma), lebih baik pakai
  itu langsung -- tinggal ekspor ke ukuran yang sama dan timpa file di
  `public/icons/` + `public/favicon.ico` (nama file dijaga sama persis
  supaya tidak perlu ubah kode lain).

## File yang diganti/ditambah
- `public/favicon.ico` (baru, multi-resolusi 16/32/48)
- `public/icons/icon-{16,32,48,72,96,128,144,152,192,256,512,1024}.png`
  (baru semua, timpa placeholder lama)
- `public/icons/icon-maskable-512.png` (logo diperkecil ke ~68% + padding,
  supaya tidak terpotong saat di-mask lingkaran/squircle oleh Android)
- `public/icons/apple-touch-icon.png` (180x180, dari mockup)
- `public/manifest.json` — daftar ikon lengkap semua ukuran,
  `background_color`/`theme_color` diganti ke navy brand (`#0D1B2A`,
  sebelumnya cream/teal generik)
- `app/layout.tsx` — metadata `icons` sekarang mengarah ke favicon.ico +
  beberapa ukuran PNG (bukan cuma satu ukuran), `viewport.themeColor`
  disesuaikan ke navy
- `public/sw.js` — nama cache dinaikkan ke v2 supaya browser yang sudah
  pernah instal PWA dengan ikon LAMA otomatis membersihkan cache lama dan
  mengambil ikon baru (bukan nyangkut di ikon placeholder sebelumnya)

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error. Preview visual
sudah dicek manual di beberapa ukuran (512px dan 48px) sebelum dipasang.
