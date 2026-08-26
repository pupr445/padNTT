-- =========================================================
-- Migration 02: Autentikasi, Role, Tarif Configurable, Audit Trail
-- Dijalankan SETELAH schema.sql (migration 01)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Profil pengguna (1:1 dengan auth.users Supabase Auth)
--    Role mengikuti struktur Tim Terpadu pada SK Gubernur NTT
--    No. 272/KEP/HK/2026 (Pelindung/Ketua/Wakil Ketua/Sekretariat/
--    Pokja I-III) ditambah instansi mitra (Bapenda, PUPR, Kejati,
--    Inspektorat) dan Viewer untuk pimpinan yang hanya melihat.
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  email text,
  role text not null default 'viewer' check (role in (
    'super_admin',
    'ketua_tim', 'wakil_ketua', 'sekretariat',
    'pokja1_ketua', 'pokja1_anggota',
    'pokja2_ketua', 'pokja2_anggota',
    'pokja3_ketua', 'pokja3_anggota',
    'bapenda', 'pupr', 'kejati', 'inspektorat',
    'viewer'
  )),
  pokja text check (pokja in ('I', 'II', 'III')),
  instansi text,
  aktif boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table profiles is 'Profil & role pengguna, 1:1 dengan auth.users. Role awal dibuat "viewer" oleh trigger; super_admin mengubah role lewat SQL Editor atau nanti lewat halaman kelola akun.';

-- Auto-buat baris profiles saat ada user baru daftar/dibuat lewat Supabase Auth.
-- nama_lengkap diambil dari user metadata "nama_lengkap" jika dikirim saat sign up,
-- fallback ke bagian sebelum "@" di email.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama_lengkap, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper untuk RLS: role & pokja user yang sedang login (aman dipakai di policy)
create or replace function current_profile_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid() and aktif = true;
$$;

create or replace function current_profile_pokja()
returns text
language sql stable security definer set search_path = public
as $$
  select pokja from profiles where id = auth.uid() and aktif = true;
$$;

create or replace function is_admin_or_pimpinan()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_profile_role() in ('super_admin', 'ketua_tim', 'wakil_ketua', 'sekretariat');
$$;

alter table profiles enable row level security;

create policy "profil sendiri & pimpinan bisa lihat semua" on profiles
  for select using (id = auth.uid() or is_admin_or_pimpinan());

create policy "hanya super_admin ubah role/aktif" on profiles
  for update using (current_profile_role() = 'super_admin')
  with check (current_profile_role() = 'super_admin');

-- ---------------------------------------------------------
-- 2. Tarif PAD configurable (BUKAN hard-code di aplikasi)
--    Menjawab kebutuhan: Perda NTT No 1/2024 sudah diubah oleh
--    Perda NTT No 1/2026, jadi tarif/formula harus bisa diubah
--    admin tanpa deploy ulang kode.
-- ---------------------------------------------------------
create table pad_tariffs (
  id uuid primary key default gen_random_uuid(),
  jenis_pad_id uuid references jenis_pad(id) not null,
  nama_tarif text not null,
  dasar_pengenaan text not null,          -- deskripsi basis pengenaan, misal "panjang utilitas per meter per tahun"
  satuan text not null,                   -- 'meter' | 'unit' | 'm3' | 'hari' | dst — bebas sesuai jenis PAD
  tarif_rp numeric not null check (tarif_rp >= 0),
  formula_perhitungan text not null default 'tarif_rp * parameter_jumlah * periode',
  dasar_hukum text,                       -- misal 'Perda NTT No 1 Tahun 2026'
  berlaku_mulai date not null default current_date,
  berlaku_sampai date,
  is_active boolean not null default true,
  catatan text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table pad_tariffs is 'Tarif per jenis PAD, configurable dari aplikasi (bukan hard-code). Formula default generik: tarif_rp x parameter_jumlah x periode — parameter_jumlah/periode ditentukan saat perhitungan potensi per objek (Fase 3).';

create index idx_pad_tariffs_jenis on pad_tariffs(jenis_pad_id);
create index idx_pad_tariffs_active on pad_tariffs(is_active);

alter table pad_tariffs enable row level security;

create policy "semua yang login bisa lihat tarif" on pad_tariffs
  for select using (current_profile_role() is not null);

create policy "super_admin & bapenda kelola tarif" on pad_tariffs
  for all using (current_profile_role() in ('super_admin', 'bapenda'))
  with check (current_profile_role() in ('super_admin', 'bapenda'));

-- Contoh baris tarif generik (silakan sesuaikan angka riil dari Perda NTT No 1/2026):
insert into pad_tariffs (jenis_pad_id, nama_tarif, dasar_pengenaan, satuan, tarif_rp, dasar_hukum)
select id, 'Tarif dasar ' || nama, 'per satuan per periode (sesuaikan)', 'unit', 0,
       'Perda NTT No 1 Tahun 2026 (nilai perlu divalidasi Bapenda)'
from jenis_pad;

-- ---------------------------------------------------------
-- 3. Audit trail (wajib untuk sistem yang menyangkut PAD)
--    Semua INSERT/UPDATE/DELETE pada tabel inti otomatis
--    tercatat lewat trigger — tidak bisa diisi manual/dipalsukan
--    dari sisi aplikasi.
-- ---------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references profiles(id),
  data_sebelum jsonb,
  data_sesudah jsonb,
  created_at timestamptz default now()
);

create index idx_audit_logs_table_record on audit_logs(table_name, record_id);
create index idx_audit_logs_actor on audit_logs(actor_id);

create or replace function log_audit_trail()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into audit_logs (table_name, record_id, action, actor_id, data_sebelum, data_sesudah)
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    TG_OP,
    auth.uid(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_objek_pad after insert or update or delete on objek_pad
  for each row execute function log_audit_trail();
create trigger audit_tindak_lanjut after insert or update or delete on tindak_lanjut
  for each row execute function log_audit_trail();
create trigger audit_target_realisasi after insert or update or delete on target_realisasi
  for each row execute function log_audit_trail();
create trigger audit_laporan_berkala after insert or update or delete on laporan_berkala
  for each row execute function log_audit_trail();
create trigger audit_pad_tariffs after insert or update or delete on pad_tariffs
  for each row execute function log_audit_trail();

alter table audit_logs enable row level security;

-- Audit log hanya boleh dibaca pimpinan & Pokja III (tugasnya memang monitoring/evaluasi).
-- Tidak ada policy INSERT/UPDATE/DELETE untuk role biasa -> hanya trigger (security definer) yang bisa menulis.
create policy "pimpinan & pokja3 baca audit log" on audit_logs
  for select using (
    is_admin_or_pimpinan() or current_profile_role() in ('pokja3_ketua', 'pokja3_anggota')
  );

-- ---------------------------------------------------------
-- 4. Ganti RLS lama (blanket "allow all for authenticated")
--    dengan kebijakan per-role sesuai kewenangan Pokja di SK.
-- ---------------------------------------------------------
drop policy if exists "allow all for authenticated" on objek_pad;
drop policy if exists "allow all for authenticated" on target_realisasi;
drop policy if exists "allow all for authenticated" on tindak_lanjut;
drop policy if exists "allow all for authenticated" on laporan_berkala;
drop policy if exists "allow all for authenticated" on lampiran;

-- objek_pad: semua yang login boleh lihat (dashboard lintas Pokja butuh ini).
-- Insert/update: Pokja I (pemilik tugas inventarisasi) + pimpinan + super_admin.
-- Delete: super_admin saja (koreksi data harusnya lewat perubahan status, bukan hapus).
create policy "semua yang login lihat objek pad" on objek_pad
  for select using (current_profile_role() is not null);

create policy "pokja1 & pimpinan kelola objek pad" on objek_pad
  for insert with check (
    current_profile_role() in ('pokja1_ketua', 'pokja1_anggota', 'super_admin') or is_admin_or_pimpinan()
  );

create policy "pokja1 & pimpinan ubah objek pad" on objek_pad
  for update using (
    current_profile_role() in ('pokja1_ketua', 'pokja1_anggota', 'super_admin') or is_admin_or_pimpinan()
  );

create policy "super_admin hapus objek pad" on objek_pad
  for delete using (current_profile_role() = 'super_admin');

-- target_realisasi: lihat semua; kelola oleh Bapenda (pemegang data penerimaan) + pimpinan + super_admin.
create policy "semua yang login lihat target realisasi" on target_realisasi
  for select using (current_profile_role() is not null);

create policy "bapenda & pimpinan kelola target realisasi" on target_realisasi
  for insert with check (current_profile_role() in ('bapenda', 'super_admin') or is_admin_or_pimpinan());

create policy "bapenda & pimpinan ubah target realisasi" on target_realisasi
  for update using (current_profile_role() in ('bapenda', 'super_admin') or is_admin_or_pimpinan());

-- tindak_lanjut: lihat semua. Insert oleh Pokja I (temuan awal) & Pokja II (penertiban) + pimpinan.
-- Update dibatasi ke Pokja yang tercatat mengerjakan (kolom pokja) + super_admin, supaya
-- "anggota Pokja I tidak bisa mengubah hasil penertiban Pokja II" seperti diminta di rancangan.
create policy "semua yang login lihat tindak lanjut" on tindak_lanjut
  for select using (current_profile_role() is not null);

create policy "pokja1 pokja2 pimpinan buat tindak lanjut" on tindak_lanjut
  for insert with check (
    current_profile_role() in ('pokja1_ketua', 'pokja1_anggota', 'pokja2_ketua', 'pokja2_anggota', 'super_admin')
    or is_admin_or_pimpinan()
  );

create policy "pokja pemilik & pimpinan ubah tindak lanjut" on tindak_lanjut
  for update using (
    current_profile_role() = 'super_admin'
    or is_admin_or_pimpinan()
    or (pokja is not null and pokja = current_profile_pokja())
  );

-- laporan_berkala: lihat semua. Dibuat oleh Ketua tiap Pokja / Pokja III (tugas monitoring-evaluasi) / pimpinan.
create policy "semua yang login lihat laporan" on laporan_berkala
  for select using (current_profile_role() is not null);

create policy "ketua pokja & pokja3 & pimpinan buat laporan" on laporan_berkala
  for insert with check (
    current_profile_role() in (
      'pokja1_ketua', 'pokja2_ketua', 'pokja3_ketua', 'pokja3_anggota', 'super_admin'
    ) or is_admin_or_pimpinan()
  );

-- lampiran: semua yang login boleh lihat & unggah (menempel ke record yang sudah dibatasi di atas);
-- hapus dibatasi super_admin agar bukti lapangan tidak mudah hilang.
create policy "semua yang login lihat lampiran" on lampiran
  for select using (current_profile_role() is not null);

create policy "semua yang login unggah lampiran" on lampiran
  for insert with check (current_profile_role() is not null);

create policy "super_admin hapus lampiran" on lampiran
  for delete using (current_profile_role() = 'super_admin');
