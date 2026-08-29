# Perubahan: Konsistensi UI dengan RLS (Prioritas P0 #1)

Berdasarkan hasil review UI/UX, RLS & audit trail di database (schema_02, schema_04)
sudah solid, tapi UI belum konsisten: tombol/form untuk menambah data tetap tampil
ke semua role walau RLS akan menolak submit-nya. Perubahan ini menutup celah itu.

## File baru
- `lib/permissions.ts` — satu sumber kebenaran aturan akses UI, mencerminkan 1:1
  policy RLS di `schema_02_auth_roles.sql` dan `schema_04_fix_rls_gaps.sql`.
  **Kalau policy SQL diubah, perbarui juga file ini.**

## File yang diubah
- `app/objek-pad/page.tsx` — form "+ Tambah objek PAD" hanya tampil untuk
  Pokja I / pimpinan / super_admin (sesuai RLS insert objek_pad). Role lain
  melihat catatan singkat "hanya bisa melihat".
- `app/objek-pad/[id]/tindak-lanjut-form.tsx` + `app/objek-pad/[id]/page.tsx` —
  form "+ Catat tindak lanjut" hanya tampil untuk Pokja I/II/pimpinan/super_admin.
  Dropdown "Pokja" tidak lagi bebas pilih I/II/III — anggota/ketua Pokja I atau II
  dikunci ke Pokja mereka sendiri (mencegah rekam data atas nama Pokja lain yang
  nantinya tidak bisa mereka koreksi sendiri, karena RLS UPDATE tindak_lanjut
  mensyaratkan pokja baris = pokja user).
- `app/laporan/page.tsx` + `app/laporan/form.tsx` — form "+ Buat laporan" hanya
  tampil untuk Ketua Pokja I/II, Pokja III (ketua & anggota), atau pimpinan.
  Dropdown Pokja dikunci ke Pokja sendiri untuk Ketua Pokja I/II; Pokja III dan
  pimpinan tetap bebas pilih (tugasnya lintas Pokja).

## Belum termasuk (di luar cakupan langkah ini)
- Halaman untuk mengelola `pad_tariffs` (tabel & RLS sudah ada, UI belum ada).
- Audit trail sudah tercatat di `audit_logs`, tapi belum ada halaman untuk
  membacanya (RLS baca sudah dibatasi ke pimpinan & Pokja III).
- Verifikasi: `npx tsc --noEmit` dan `npx next build` sudah dijalankan, keduanya
  lulus tanpa error.
