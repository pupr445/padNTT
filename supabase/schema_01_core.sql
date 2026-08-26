-- =========================================================
-- Skema Database: Optimalisasi PAD Dinas PUPR Provinsi NTT
-- Berdasarkan SK Gubernur NTT No. 272/KEP/HK/2026
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. Jenis PAD (referensi statis: 3 jenis sesuai SK)
-- ---------------------------------------------------------
create table jenis_pad (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null, -- 'utilitas_jalan' | 'alat_berat' | 'air_permukaan'
  nama text not null,
  deskripsi text,
  created_at timestamptz default now()
);

insert into jenis_pad (kode, nama, deskripsi) values
  ('utilitas_jalan', 'Retribusi Pemanfaatan Utilitas Jalan', 'Pemanfaatan utilitas terhadap jalan, penggunaan alat berat, dan pemanfaatan air permukaan'),
  ('alat_berat', 'Retribusi Pelayanan Alat Berat', 'Retribusi atas pelayanan penggunaan alat berat milik daerah'),
  ('air_permukaan', 'Pajak Air Permukaan', 'Pajak atas pengambilan/pemanfaatan air permukaan');

-- ---------------------------------------------------------
-- 2. Struktur tim (sesuai lampiran SK: Pelindung, Ketua, dst)
-- ---------------------------------------------------------
create table tim_struktur (
  id uuid primary key default gen_random_uuid(),
  nomor int,
  nama_jabatan text not null,       -- nama orang / jabatan instansi
  kedudukan text not null,          -- Pelindung/Pengarah, Ketua, Wakil Ketua I/II, Sekretaris, Ketua Pokja I/II/III, Anggota
  pokja text,                       -- null | 'I' | 'II' | 'III'
  rincian_tugas text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 3. Wajib retribusi / pajak (subjek)
-- ---------------------------------------------------------
create table wajib_retribusi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_wajib text,                 -- perorangan | badan usaha
  nik_npwp text,
  alamat text,
  kontak text,
  kabupaten_kota text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 4. Objek PAD (inventarisasi & identifikasi objek)
--    -> tugas Pokja I: inventarisasi, pendataan, verifikasi
-- ---------------------------------------------------------
create table objek_pad (
  id uuid primary key default gen_random_uuid(),
  jenis_pad_id uuid references jenis_pad(id) not null,
  wajib_retribusi_id uuid references wajib_retribusi(id),
  nama_objek text not null,
  lokasi text,
  kabupaten_kota text,
  koordinat_lat numeric,
  koordinat_lng numeric,
  status_verifikasi text default 'belum_terdaftar'
    check (status_verifikasi in ('belum_terdaftar','terdaftar','proses_verifikasi','menunggak')),
  keterangan text,
  dibuat_oleh text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 5. Target & realisasi PAD per objek per periode
-- ---------------------------------------------------------
create table target_realisasi (
  id uuid primary key default gen_random_uuid(),
  jenis_pad_id uuid references jenis_pad(id) not null,
  objek_pad_id uuid references objek_pad(id),
  periode_tahun int not null,
  periode_bulan int,                -- null = target tahunan
  target_rp numeric not null default 0,
  realisasi_rp numeric not null default 0,
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 6. Tindak lanjut (Pokja II: penertiban, sosialisasi,
--    penagihan, pendampingan hukum)
-- ---------------------------------------------------------
create table tindak_lanjut (
  id uuid primary key default gen_random_uuid(),
  objek_pad_id uuid references objek_pad(id),
  jenis_kegiatan text not null
    check (jenis_kegiatan in (
      'sosialisasi','pemeriksaan_lapangan','penertiban',
      'tindakan_administratif','pendampingan_hukum','penagihan','lainnya'
    )),
  deskripsi text,
  pokja text,                       -- 'I' | 'II' | 'III'
  pic text,                         -- penanggung jawab kegiatan
  tanggal_kegiatan date not null default current_date,
  status text default 'berjalan' check (status in ('berjalan','selesai','tertunda')),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 7. Laporan berkala (Pokja III -> Ketua Tim / Gubernur)
-- ---------------------------------------------------------
create table laporan_berkala (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  periode text not null,            -- misal '2026-Q3' atau 'Juli 2026'
  ringkasan text,
  pokja text,
  dibuat_oleh text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 8. Lampiran file (metadata; file fisik disimpan di R2)
--    Bisa terhubung ke objek_pad, tindak_lanjut, atau laporan
-- ---------------------------------------------------------
create table lampiran (
  id uuid primary key default gen_random_uuid(),
  r2_key text not null,             -- path/key object di storage (nama kolom historis; dipakai untuk B2 juga)
  nama_file text not null,
  tipe_file text,                   -- image | video | document
  ukuran_bytes bigint,
  objek_pad_id uuid references objek_pad(id),
  tindak_lanjut_id uuid references tindak_lanjut(id),
  laporan_id uuid references laporan_berkala(id),
  diunggah_oleh text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------
create index idx_objek_pad_jenis on objek_pad(jenis_pad_id);
create index idx_objek_pad_status on objek_pad(status_verifikasi);
create index idx_target_realisasi_periode on target_realisasi(periode_tahun, periode_bulan);
create index idx_tindak_lanjut_objek on tindak_lanjut(objek_pad_id);
create index idx_lampiran_objek on lampiran(objek_pad_id);

-- ---------------------------------------------------------
-- Row Level Security (disiapkan, disederhanakan untuk single-user
-- dulu — nanti tinggal aktifkan policy per role saat multi-user)
-- ---------------------------------------------------------
alter table objek_pad enable row level security;
alter table target_realisasi enable row level security;
alter table tindak_lanjut enable row level security;
alter table laporan_berkala enable row level security;
alter table lampiran enable row level security;

create policy "allow all for authenticated" on objek_pad for all using (auth.role() = 'authenticated');
create policy "allow all for authenticated" on target_realisasi for all using (auth.role() = 'authenticated');
create policy "allow all for authenticated" on tindak_lanjut for all using (auth.role() = 'authenticated');
create policy "allow all for authenticated" on laporan_berkala for all using (auth.role() = 'authenticated');
create policy "allow all for authenticated" on lampiran for all using (auth.role() = 'authenticated');
