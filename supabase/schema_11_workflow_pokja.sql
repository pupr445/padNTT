-- =========================================================
-- Migration 11: Diferensiasi workflow Pokja I/II/III -- deadline
-- (dasar SLA) + jenis kegiatan "monitoring_evaluasi" yang SEBELUMNYA
-- TIDAK ADA di daftar, padahal itu tugas inti Pokja III. Tanpa ini,
-- Pokja III terpaksa mencatat kegiatan monitoring/evaluasi sebagai
-- "lainnya" -- tidak bisa dibedakan dari catatan lain-lain.
-- Jalankan SETELAH migration 01-10.
-- =========================================================

alter table tindak_lanjut add column if not exists deadline date;
comment on column tindak_lanjut.deadline is 'Target penyelesaian, dasar indikator SLA terlambat/tepat waktu di UI.';

-- Ganti CHECK constraint jenis_kegiatan supaya termasuk monitoring_evaluasi.
-- Dicari dulu nama constraint-nya secara dinamis (bukan diasumsikan tetap)
-- supaya migrasi ini tidak gagal kalau nama constraint auto-generate-nya
-- berbeda dari dugaan.
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'tindak_lanjut'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%jenis_kegiatan%';

  if v_conname is not null then
    execute format('alter table tindak_lanjut drop constraint %I', v_conname);
  end if;
end $$;

alter table tindak_lanjut add constraint tindak_lanjut_jenis_kegiatan_check
  check (jenis_kegiatan in (
    'sosialisasi', 'pemeriksaan_lapangan', 'penertiban',
    'tindakan_administratif', 'pendampingan_hukum', 'penagihan',
    'monitoring_evaluasi', 'lainnya'
  ));
