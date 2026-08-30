# Fitur baru: Dashboard drill-down + GIS filtering lanjutan

Item P1 dari review UI/UX. Tidak ada migrasi SQL -- murni penambahan UI di
atas data yang sudah ada.

## Drill-down dashboard -> daftar objek
- `app/objek-pad/page.tsx` + `app/objek-pad/filters.tsx` (baru) — halaman
  daftar objek PAD sekarang bisa difilter lewat query string
  (`?jenis=&status=&kab=`) dengan dropdown filter di UI.
- `app/page.tsx` (dashboard) — elemen berikut sekarang bisa diklik dan
  menuju `/objek-pad` dengan filter otomatis terisi:
  - Kartu "Piutang/tunggakan" -> `/objek-pad?status=menunggak`
  - Angka "Objek PAD tercatat" -> `/objek-pad` (semua)
  - Tiap baris "Target vs realisasi per jenis PAD" -> filter jenis
  - Tiap baris "Objek berdasarkan kabupaten/kota" -> filter kabupaten
    (kecuali baris "Belum diisi", karena bukan nilai yang bisa difilter)
  - Tiap badge legenda status -> filter status
  - **Sengaja TIDAK diklikkan**: kartu "Total target" dan "Realisasi
    penerimaan" -- keduanya angka makro dari `target_realisasi` (per jenis
    PAD+kabupaten+periode dari dokumen anggaran), bukan agregat langsung
    dari objek individual, jadi "drill-down ke daftar objek" tidak akurat
    merepresentasikan angka itu.

## GIS filtering & clustering (`/peta`)
- Filter dropdown jenis PAD & kabupaten/kota (query string juga, bisa
  dibagikan linknya).
- Legenda status sekarang jadi TOGGLE yang bisa diklik (multi-select) --
  sebelumnya cuma dekorasi, sekarang benar-benar menyaring titik di peta.
- **Aksesibilitas**: tiap status sekarang punya BENTUK berbeda, bukan
  cuma warna -- lingkaran kosong (belum terdaftar), segitiga (proses
  verifikasi), kotak (terdaftar), tanda seru (menunggak). Ditambahkan
  karena warna saja tidak cukup buat pengguna buta warna.
- Marker clustering (`leaflet.markercluster`) -- titik yang berdekatan
  dikelompokkan jadi satu angka saat zoom out, pecah otomatis saat zoom in.
  Sebelumnya semua titik dirender lepas, berat & sulit dibaca kalau jumlah
  objek sudah banyak di satu area.

## Dependency baru
- `leaflet.markercluster` (+ `@types/leaflet.markercluster` sbg dev dep).

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
