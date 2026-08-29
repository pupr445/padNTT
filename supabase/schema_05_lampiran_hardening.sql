-- =========================================================
-- Migration 05: Perkuat lampiran (bukti lapangan) -- audit trail
-- + atribusi pengunggah otomatis. Jalankan SETELAH migration 01-04.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Kolom baru: siapa yang benar-benar upload (dari sesi login,
--    bukan input bebas) + tipe MIME asli file untuk preview/download
--    yang lebih akurat. Kolom "diunggah_oleh" (text) yang lama
--    dibiarkan untuk kompatibilitas tampilan lama, tapi sumber
--    kebenarannya sekarang "diunggah_oleh_id".
-- ---------------------------------------------------------
alter table lampiran
  add column if not exists diunggah_oleh_id uuid references profiles(id) default auth.uid(),
  add column if not exists content_type text;

comment on column lampiran.diunggah_oleh_id is 'Diisi otomatis dari auth.uid() saat insert -- tidak bisa dipalsukan lewat form.';

-- ---------------------------------------------------------
-- 2. Audit trail untuk lampiran -- sebelumnya tabel ini TIDAK
--    tercatat di audit_logs, beda dari objek_pad/tindak_lanjut/
--    laporan_berkala/pad_tariffs. Bukti lapangan (foto/video/dokumen)
--    justru yang paling sering dipersoalkan keabsahannya, jadi
--    penting tercatat siapa unggah dan siapa hapus.
-- ---------------------------------------------------------
create trigger audit_lampiran after insert or update or delete on lampiran
  for each row execute function log_audit_trail();

-- ---------------------------------------------------------
-- 3. RLS delete lampiran: sebelumnya hanya super_admin. Tambahkan
--    pimpinan (ketua_tim/wakil_ketua/sekretariat) supaya koreksi
--    lampiran salah unggah tidak harus selalu lewat super_admin,
--    tapi tetap tercatat di audit_logs lewat trigger di atas.
-- ---------------------------------------------------------
drop policy if exists "super_admin hapus lampiran" on lampiran;
create policy "super_admin & pimpinan hapus lampiran" on lampiran
  for delete using (is_admin_or_pimpinan());
