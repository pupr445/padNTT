# Fitur baru: PAD Engine (potensi -> penetapan -> pembayaran -> piutang)

Fase 3 roadmap -- sebelumnya sama sekali belum ada di kode. Ini beda dari
`target_realisasi` yang sudah ada: target_realisasi itu target MAKRO
tahunan/bulanan dari dokumen anggaran (dikelola Bapenda, per jenis PAD),
sedangkan PAD Engine ini tagihan RESMI per OBJEK -- inilah yang menghasilkan
angka piutang yang sesungguhnya.

## Migrasi SQL baru (WAJIB, setelah schema_01–07)
- `supabase/schema_08_pad_engine.sql`:
  - `potensi_pad` — estimasi potensi dari observasi Pokja I (parameter x
    tarif). RLS: Pokja I + pimpinan.
  - `penetapan_pad` — tagihan resmi (setara SKRD) ke wajib retribusi. RLS:
    Bapenda + pimpinan (sengaja terpisah dari Pokja I -- pemisahan fungsi
    "mendata" vs "menetapkan tagihan resmi").
  - `pembayaran_pad` — pembayaran diterima terhadap satu penetapan (bisa
    dicicil). RLS: Bapenda + pimpinan.
  - Audit trail untuk ketiganya (pola sama seperti tabel lain).
  - Trigger otomatis: status penetapan (belum_lunas/sebagian/lunas)
    dihitung ulang dari total pembayaran setiap ada transaksi; status
    `objek_pad.status_verifikasi` ikut disetel ke `menunggak` kalau ada
    penetapan yang lewat jatuh tempo & belum lunas (dan kembali ke
    `terdaftar` kalau sudah lunas semua) -- otomatis nyambung ke legenda
    peta & dashboard yang sudah ada.
  - **Batasan yang jujur perlu diketahui**: trigger status `menunggak` di
    atas hanya jalan saat ADA transaksi baru di penetapan/pembayaran.
    Kalau jatuh tempo lewat tanpa ada transaksi baru yang menyentuhnya,
    status TIDAK otomatis berubah pada tanggal itu juga -- perlu pekerjaan
    terjadwal (pg_cron) untuk itu, belum termasuk di migrasi ini. Karena
    itu, semua angka piutang di dashboard & halaman objek DIHITUNG LANGSUNG
    dari penetapan_pad + pembayaran_pad, bukan mengandalkan status
    tersimpan itu semata.

## File baru
- `app/objek-pad/[id]/pad-engine-forms.tsx` — PotensiForm, PenetapanForm,
  PembayaranForm (semua client component, digating izin di dalamnya).
- Tombol hapus potensi/penetapan/pembayaran ditambahkan ke
  `app/objek-pad/[id]/delete-buttons.tsx`.
- `lib/icons.tsx` — tambah `IconWallet`.

## File yang diubah
- `app/objek-pad/[id]/page.tsx` — seksi baru "Potensi & penetapan PAD" di
  antara Lampiran dan Tindak Lanjut: catat potensi, tetapkan tagihan (bisa
  dari potensi yang sudah ada atau isi manual), riwayat pembayaran per
  penetapan dengan badge status & indikator "lewat tempo".
- `app/page.tsx` (dashboard) — kartu "Piutang / Tunggakan" sekarang
  menghitung dari `penetapan_pad`-`pembayaran_pad` sesungguhnya, BUKAN
  lagi `target - realisasi` (itu cuma proksi kekurangan vs target makro,
  bukan piutang riil per objek).
- `lib/types.ts` — tambah `PotensiPad`, `PenetapanPad`, `PembayaranPad`.
- `lib/permissions.ts` — tambah `canManagePotensi`, `canManagePenetapan`,
  `canManagePembayaran`.

## Sengaja belum termasuk (di luar cakupan langkah ini)
- Belum ada halaman ringkasan piutang LINTAS objek (mis. "semua tagihan
  jatuh tempo bulan ini") -- saat ini PAD Engine hanya bisa dilihat/dikelola
  per objek lewat halaman detailnya. Ringkasan lintas objek masuk cakupan
  langkah "dashboard eksekutif drill-down" berikutnya di roadmap.
- Belum ada cetak dokumen (SKRD/kwitansi) dari penetapan/pembayaran --
  masuk cakupan "document generation" di roadmap.

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error.
