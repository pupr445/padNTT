-- =========================================================
-- Migration 09: fungsi sempit untuk menampilkan nama pejabat/petugas
-- di dokumen cetak (SKRD, kwitansi) -- SIAPAPUN yang login boleh
-- mencetak dokumen (SELECT semua tabel terkait sudah terbuka), tapi
-- RLS profiles TIDAK terbuka untuk semua (hanya diri sendiri, pimpinan,
-- Pokja III -- lihat schema_02 & schema_07). Tanpa ini, nama pejabat
-- yang menetapkan/mencatat akan kosong di dokumen buat kebanyakan role.
--
-- Sengaja dibuat fungsi SEMPIT (cuma return nama), BUKAN memperluas
-- RLS SELECT profiles ke semua orang -- itu akan membocorkan email dan
-- data lain yang tidak perlu buat keperluan cetak dokumen ini.
-- =========================================================

create or replace function get_nama_lengkap(p_user_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select nama_lengkap from profiles where id = p_user_id;
$$;

grant execute on function get_nama_lengkap(uuid) to authenticated;
