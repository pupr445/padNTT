-- =========================================================
-- Migration 08: PAD Engine (Fase 3 roadmap) -- potensi -> penetapan
-- -> pembayaran -> piutang. Sebelumnya sama sekali belum ada di
-- kode; hanya ada target_realisasi (target makro tahunan/bulanan
-- dari dokumen anggaran, dikelola Bapenda) yang TIDAK sama dengan
-- tagihan resmi per objek. Ketiga tabel baru di sini menghasilkan
-- data piutang yang sesungguhnya (bukan sekadar "target - realisasi").
-- Jalankan SETELAH migration 01-07.
-- =========================================================

-- ---------------------------------------------------------
-- 1. potensi_pad -- hasil observasi/pendataan Pokja I di lapangan:
--    berapa estimasi potensi PAD dari satu objek, dihitung dari
--    tarif (pad_tariffs) x parameter (volume/luas/dst). Ini BUKAN
--    tagihan resmi -- masih perkiraan sebelum ditetapkan Bapenda.
-- ---------------------------------------------------------
create table potensi_pad (
  id uuid primary key default gen_random_uuid(),
  objek_pad_id uuid not null references objek_pad(id) on delete cascade,
  tarif_id uuid references pad_tariffs(id),
  periode_tahun int not null,
  periode_bulan int, -- null = estimasi tahunan
  parameter_jumlah numeric not null check (parameter_jumlah >= 0), -- misal: panjang meter, volume m3, jumlah unit
  tarif_rp_saat_itu numeric not null check (tarif_rp_saat_itu >= 0), -- disalin dari pad_tariffs.tarif_rp SAAT dicatat,
                                                                       -- supaya histori tidak berubah kalau tarif diubah kelak
  estimasi_potensi numeric not null check (estimasi_potensi >= 0), -- dihitung app-side: parameter_jumlah * tarif_rp_saat_itu
  catatan text,
  dicatat_oleh_id uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create index idx_potensi_objek on potensi_pad(objek_pad_id);

-- ---------------------------------------------------------
-- 2. penetapan_pad -- tagihan resmi (setara SKRD) kepada wajib
--    retribusi, dikeluarkan Bapenda berdasar potensi_pad atau
--    langsung. Ini yang jadi dasar piutang.
-- ---------------------------------------------------------
create table penetapan_pad (
  id uuid primary key default gen_random_uuid(),
  objek_pad_id uuid not null references objek_pad(id) on delete cascade,
  potensi_pad_id uuid references potensi_pad(id),
  nomor_penetapan text,
  periode_tahun int not null,
  periode_bulan int,
  jumlah_ditetapkan numeric not null check (jumlah_ditetapkan > 0),
  tanggal_ditetapkan date not null default current_date,
  jatuh_tempo date not null,
  status text not null default 'belum_lunas' check (status in ('belum_lunas', 'sebagian', 'lunas', 'dibatalkan')),
  catatan text,
  ditetapkan_oleh_id uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create index idx_penetapan_objek on penetapan_pad(objek_pad_id);
create index idx_penetapan_status on penetapan_pad(status);

-- ---------------------------------------------------------
-- 3. pembayaran_pad -- pembayaran yang diterima atas satu penetapan.
--    Bisa dicicil (parsial), makanya dipisah dari penetapan_pad.
-- ---------------------------------------------------------
create table pembayaran_pad (
  id uuid primary key default gen_random_uuid(),
  penetapan_id uuid not null references penetapan_pad(id) on delete cascade,
  jumlah_dibayar numeric not null check (jumlah_dibayar > 0),
  tanggal_bayar date not null default current_date,
  metode text, -- transfer | tunai | lainnya
  lampiran_id uuid references lampiran(id), -- bukti bayar, opsional
  catatan text,
  dicatat_oleh_id uuid references profiles(id) default auth.uid(),
  created_at timestamptz default now()
);

create index idx_pembayaran_penetapan on pembayaran_pad(penetapan_id);

alter table potensi_pad enable row level security;
alter table penetapan_pad enable row level security;
alter table pembayaran_pad enable row level security;

-- ---------------------------------------------------------
-- 4. RLS -- pola sama seperti tabel lain: SELECT terbuka untuk semua
--    yang login (dashboard lintas Pokja), INSERT/UPDATE/DELETE
--    dibatasi ke peran yang relevan.
-- ---------------------------------------------------------

-- potensi_pad: Pokja I (yang turun ke lapangan) + pimpinan + super_admin
create policy "semua login baca potensi" on potensi_pad for select using (auth.role() = 'authenticated');
create policy "pokja1 & pimpinan kelola potensi" on potensi_pad for insert
  with check (current_profile_role() in ('pokja1_ketua', 'pokja1_anggota') or is_admin_or_pimpinan());
create policy "pokja1 & pimpinan ubah potensi" on potensi_pad for update
  using (current_profile_role() in ('pokja1_ketua', 'pokja1_anggota') or is_admin_or_pimpinan());
create policy "pokja1 & pimpinan hapus potensi" on potensi_pad for delete
  using (current_profile_role() in ('pokja1_ketua', 'pokja1_anggota') or is_admin_or_pimpinan());

-- penetapan_pad: fungsi keuangan -- Bapenda + pimpinan + super_admin (bukan Pokja I,
-- supaya ada pemisahan antara "yang mendata potensi" dan "yang menetapkan tagihan resmi")
create policy "semua login baca penetapan" on penetapan_pad for select using (auth.role() = 'authenticated');
create policy "bapenda & pimpinan kelola penetapan" on penetapan_pad for insert
  with check (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());
create policy "bapenda & pimpinan ubah penetapan" on penetapan_pad for update
  using (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());
create policy "bapenda & pimpinan hapus penetapan" on penetapan_pad for delete
  using (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());

-- pembayaran_pad: sama seperti penetapan -- pencatatan uang masuk tetap fungsi keuangan
create policy "semua login baca pembayaran" on pembayaran_pad for select using (auth.role() = 'authenticated');
create policy "bapenda & pimpinan kelola pembayaran" on pembayaran_pad for insert
  with check (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());
create policy "bapenda & pimpinan ubah pembayaran" on pembayaran_pad for update
  using (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());
create policy "bapenda & pimpinan hapus pembayaran" on pembayaran_pad for delete
  using (current_profile_role() = 'bapenda' or is_admin_or_pimpinan());

-- ---------------------------------------------------------
-- 5. Audit trail -- pakai fungsi log_audit_trail() yang sudah ada
--    sejak schema_02, sama seperti tabel lain.
-- ---------------------------------------------------------
create trigger audit_potensi_pad after insert or update or delete on potensi_pad
  for each row execute function log_audit_trail();
create trigger audit_penetapan_pad after insert or update or delete on penetapan_pad
  for each row execute function log_audit_trail();
create trigger audit_pembayaran_pad after insert or update or delete on pembayaran_pad
  for each row execute function log_audit_trail();

-- ---------------------------------------------------------
-- 6. Sinkron otomatis: status penetapan (lunas/sebagian/belum_lunas)
--    dari total pembayaran, dan status_verifikasi objek_pad ('menunggak')
--    dari ada/tidaknya penetapan yang lewat jatuh tempo & belum lunas.
--
--    CATATAN PENTING (batasan yang jujur perlu diketahui): trigger ini
--    hanya jalan saat ADA aksi tulis (insert/update/delete) di
--    penetapan_pad/pembayaran_pad. Kalau jatuh_tempo lewat tapi tidak
--    ada transaksi baru yang menyentuh baris itu, status_verifikasi
--    TIDAK otomatis berubah jadi "menunggak" pada tanggal itu juga --
--    perlu pekerjaan terjadwal (pg_cron) untuk itu, belum termasuk di
--    migrasi ini. Untuk angka piutang yang akurat, selalu hitung
--    LANGSUNG dari penetapan_pad+pembayaran_pad (seperti di dashboard
--    dan halaman objek), jangan andalkan status_verifikasi semata.
-- ---------------------------------------------------------
create or replace function refresh_objek_tunggakan_status(p_objek_id uuid)
returns void language plpgsql security definer as $$
declare
  v_ada_tunggakan boolean;
  v_status_sekarang text;
begin
  select exists (
    select 1 from penetapan_pad
    where objek_pad_id = p_objek_id
      and status not in ('lunas', 'dibatalkan')
      and jatuh_tempo < current_date
  ) into v_ada_tunggakan;

  select status_verifikasi into v_status_sekarang from objek_pad where id = p_objek_id;

  if v_ada_tunggakan and v_status_sekarang is distinct from 'menunggak' then
    update objek_pad set status_verifikasi = 'menunggak', updated_at = now() where id = p_objek_id;
  elsif not v_ada_tunggakan and v_status_sekarang = 'menunggak' then
    update objek_pad set status_verifikasi = 'terdaftar', updated_at = now() where id = p_objek_id;
  end if;
end;
$$;

create or replace function recompute_penetapan_status(p_penetapan_id uuid)
returns void language plpgsql security definer as $$
declare
  v_total numeric;
  v_ditetapkan numeric;
  v_status_lama text;
  v_objek uuid;
begin
  select jumlah_ditetapkan, objek_pad_id, status into v_ditetapkan, v_objek, v_status_lama
  from penetapan_pad where id = p_penetapan_id;

  if v_ditetapkan is null then
    return; -- penetapan sudah dihapus di tengah transaksi
  end if;

  if v_status_lama = 'dibatalkan' then
    return; -- jangan timpa status "dibatalkan" dengan hitungan otomatis
  end if;

  select coalesce(sum(jumlah_dibayar), 0) into v_total from pembayaran_pad where penetapan_id = p_penetapan_id;

  update penetapan_pad
    set status = case
      when v_total <= 0 then 'belum_lunas'
      when v_total < v_ditetapkan then 'sebagian'
      else 'lunas'
    end
    where id = p_penetapan_id;

  perform refresh_objek_tunggakan_status(v_objek);
end;
$$;

create or replace function trg_pembayaran_recompute()
returns trigger language plpgsql as $$
begin
  perform recompute_penetapan_status(coalesce(new.penetapan_id, old.penetapan_id));
  return coalesce(new, old);
end;
$$;

create trigger pembayaran_recompute_status
  after insert or update or delete on pembayaran_pad
  for each row execute function trg_pembayaran_recompute();

create or replace function trg_penetapan_recompute()
returns trigger language plpgsql as $$
begin
  perform refresh_objek_tunggakan_status(new.objek_pad_id);
  return new;
end;
$$;

create trigger penetapan_recompute_status
  after insert or update on penetapan_pad
  for each row execute function trg_penetapan_recompute();
