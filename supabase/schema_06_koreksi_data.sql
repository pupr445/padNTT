-- =========================================================
-- Migration 06: Jalan koreksi data yang sebelumnya tidak ada sama
-- sekali di RLS -- tindak_lanjut, laporan_berkala, target_realisasi
-- tidak punya policy DELETE (laporan_berkala malah tidak punya
-- UPDATE juga), jadi sebelumnya TIDAK ADA yang bisa membetulkan
-- salah input di tabel-tabel ini lewat aplikasi, termasuk
-- super_admin -- harus lewat SQL Editor langsung.
-- Jalankan SETELAH migration 01-05.
-- =========================================================

-- ---------------------------------------------------------
-- 1. laporan_berkala: tambah kolom "siapa yang benar-benar buat"
--    dari sesi login (pola sama seperti diunggah_oleh_id di
--    lampiran, migration 05) -- supaya UPDATE/DELETE bisa dibatasi
--    ke pembuat asli + pimpinan, bukan cuma pimpinan/super_admin.
--    Kolom "dibuat_oleh" (text) lama dibiarkan untuk tampilan.
-- ---------------------------------------------------------
alter table laporan_berkala
  add column if not exists dibuat_oleh_id uuid references profiles(id) default auth.uid();

comment on column laporan_berkala.dibuat_oleh_id is 'Diisi otomatis dari auth.uid() saat insert -- dipakai RLS UPDATE/DELETE, bukan input bebas.';

create policy "pembuat & pimpinan ubah laporan" on laporan_berkala
  for update using (is_admin_or_pimpinan() or dibuat_oleh_id = auth.uid());

create policy "pembuat & pimpinan hapus laporan" on laporan_berkala
  for delete using (is_admin_or_pimpinan() or dibuat_oleh_id = auth.uid());

-- ---------------------------------------------------------
-- 2. tindak_lanjut: DELETE belum ada sama sekali. Disamakan dengan
--    policy UPDATE yang sudah ada (Pokja pemilik baris + pimpinan).
-- ---------------------------------------------------------
create policy "pokja pemilik & pimpinan hapus tindak lanjut" on tindak_lanjut
  for delete using (
    is_admin_or_pimpinan() or (pokja is not null and pokja = current_profile_pokja())
  );

-- ---------------------------------------------------------
-- 3. target_realisasi: DELETE belum ada sama sekali. Disamakan
--    dengan policy INSERT/UPDATE yang sudah ada (Bapenda + pimpinan).
-- ---------------------------------------------------------
create policy "bapenda & pimpinan hapus target realisasi" on target_realisasi
  for delete using (current_profile_role() in ('bapenda', 'super_admin') or is_admin_or_pimpinan());
