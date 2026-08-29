-- =========================================================
-- Migration 07: Pokja III (monitoring/evaluasi) sudah boleh baca
-- audit_logs sejak schema_02, tapi RLS profiles belum mengikutkan
-- mereka -- akibatnya nama pelaku (join audit_logs -> profiles)
-- akan tampil kosong untuk Pokja III meski baris log-nya sendiri
-- terlihat. Perluas SELECT profiles supaya konsisten dengan hak
-- baca audit_logs yang sudah ada.
-- =========================================================

drop policy if exists "profil sendiri & pimpinan bisa lihat semua" on profiles;
create policy "profil sendiri, pimpinan & pokja3 bisa lihat semua" on profiles
  for select using (
    id = auth.uid() or is_admin_or_pimpinan() or current_profile_role() in ('pokja3_ketua', 'pokja3_anggota')
  );

-- Catatan: ini HANYA memperluas siapa yang boleh MELIHAT profil (nama,
-- role, Pokja, status aktif) -- policy UPDATE profiles tetap "hanya
-- super_admin" (tidak berubah), jadi Pokja III tetap tidak bisa mengubah
-- role/akun siapapun.
