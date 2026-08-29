# Fitur baru: Halaman Audit Log

## Migrasi SQL baru (WAJIB, urutan: setelah schema_01–06)
- `supabase/schema_07_audit_visibility.sql` — perluas RLS SELECT `profiles`
  ke Pokja III. Sebelumnya Pokja III sudah boleh baca `audit_logs` (sejak
  schema_02) tapi TIDAK boleh baca `profiles`, jadi nama pelaku di log akan
  tampil kosong buat mereka. Policy UPDATE profiles tetap hanya super_admin,
  tidak berubah.

## File baru
- `lib/audit.ts` — terjemahan nama tabel ke bahasa manusia, ekstraksi
  "judul" ringkas per baris (nama_objek/judul/deskripsi/dst tergantung
  tabel), dan deteksi field mana yang berubah untuk aksi UPDATE.
- `app/audit/page.tsx` — halaman baru, isi: 300 aktivitas terbaru
  (tambah/ubah/hapus) di semua modul, kolom waktu/tabel/aksi/aktor/ringkasan.
  Gated `canViewAuditLog` (pimpinan + Pokja III) — role lain lihat pesan
  "khusus untuk..." bukan data kosong.
- `lib/icons.tsx` — tambah `IconHistory`.

## File yang diubah
- `app/nav-links.tsx` — tambah menu "Audit log" di grup Administrasi,
  hanya render untuk role yang diizinkan (`canViewAuditLog`).

## Verifikasi
`npx tsc --noEmit` dan `npx next build` lulus tanpa error (route /audit
muncul di hasil build).
