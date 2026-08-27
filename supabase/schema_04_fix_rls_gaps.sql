-- ---------------------------------------------------------
-- Perbaikan: jenis_pad, tim_struktur, dan wajib_retribusi dibuat di
-- schema_01_core.sql TANPA "enable row level security" dan TANPA policy
-- apa pun -- beda dari semua tabel lain di schema_01/02. Di banyak
-- konfigurasi Supabase, tabel yang tidak dapat privilege eksplisit
-- (lewat policy atau GRANT) tidak akan terbaca oleh anon/authenticated
-- role yang dipakai app (baik RLS aktif atau tidak, tergantung default
-- privilege project Anda) -- inilah kemungkinan besar penyebab data
-- "tidak muncul di app" walau datanya sudah ada di tabel.
--
-- Jalankan file ini sekali di SQL Editor Supabase (aman dijalankan
-- berkali-kali -- pakai "if not exists"/DROP+CREATE).
-- ---------------------------------------------------------

alter table jenis_pad enable row level security;
alter table tim_struktur enable row level security;
alter table wajib_retribusi enable row level security;

-- GRANT eksplisit -- jaring pengaman kalau default privilege project Anda
-- ternyata tidak otomatis berlaku untuk tabel-tabel ini.
grant select on jenis_pad, tim_struktur, wajib_retribusi to authenticated, anon;
grant insert, update, delete on jenis_pad, tim_struktur, wajib_retribusi to authenticated;

drop policy if exists "semua yang login bisa lihat jenis pad" on jenis_pad;
create policy "semua yang login bisa lihat jenis pad" on jenis_pad
  for select using (auth.role() = 'authenticated');

drop policy if exists "semua yang login bisa lihat struktur tim" on tim_struktur;
create policy "semua yang login bisa lihat struktur tim" on tim_struktur
  for select using (auth.role() = 'authenticated');

drop policy if exists "semua yang login bisa lihat wajib retribusi" on wajib_retribusi;
create policy "semua yang login bisa lihat wajib retribusi" on wajib_retribusi
  for select using (auth.role() = 'authenticated');

-- Tulis/ubah dibatasi ke super_admin & pimpinan saja (data referensi,
-- jarang berubah) -- sesuaikan kalau Pokja I juga perlu menulis wajib_retribusi.
drop policy if exists "pimpinan kelola jenis pad" on jenis_pad;
create policy "pimpinan kelola jenis pad" on jenis_pad
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'ketua_tim', 'wakil_ketua', 'sekretariat')
    )
  );

drop policy if exists "super_admin kelola struktur tim" on tim_struktur;
create policy "super_admin kelola struktur tim" on tim_struktur
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'ketua_tim', 'wakil_ketua', 'sekretariat')
    )
  );

drop policy if exists "pokja1 kelola wajib retribusi" on wajib_retribusi;
create policy "pokja1 kelola wajib retribusi" on wajib_retribusi
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'ketua_tim', 'wakil_ketua', 'sekretariat', 'pokja1_ketua', 'pokja1_anggota')
    )
  );
