-- =========================================================
-- Migration 10: Notification center -- tabel notifikasi in-app +
-- trigger yang mengisi otomatis saat event tertentu terjadi.
--
-- CATATAN DESAIN PENTING: trigger di sini HANYA untuk event yang
-- terjadi PERSIS SAAT ADA aksi tulis (insert/update) -- bukan event
-- berbasis waktu (misal "3 hari sebelum jatuh tempo"), karena itu
-- butuh pekerjaan terjadwal (pg_cron) yang tidak termasuk di migrasi
-- ini, sama seperti batasan yang sudah dicatat di schema_08. Untuk
-- info "jatuh tempo mendekat", pakai perhitungan LANGSUNG dari
-- penetapan_pad di halaman terkait (lihat app/notifications/page.tsx),
-- bukan notifikasi tersimpan.
-- =========================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('tindak_lanjut_baru', 'laporan_baru', 'objek_menunggak', 'penetapan_baru')),
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

create index idx_notifications_recipient on notifications(recipient_id, is_read, created_at desc);

alter table notifications enable row level security;

-- Hanya boleh melihat & menandai baca notifikasi MILIK SENDIRI. Tidak ada
-- policy insert untuk role manapun -- baris notifikasi HANYA dibuat lewat
-- fungsi security definer di bawah (dipanggil trigger), supaya orang tidak
-- bisa mengirim notifikasi palsu ke user lain lewat API langsung.
create policy "lihat notifikasi sendiri" on notifications
  for select using (recipient_id = auth.uid());
create policy "tandai baca notifikasi sendiri" on notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "hapus notifikasi sendiri" on notifications
  for delete using (recipient_id = auth.uid());

-- ---------------------------------------------------------
-- Helper: kirim notifikasi ke semua profil aktif dengan role tertentu,
-- kecuali p_exclude (biasanya si pembuat perubahan itu sendiri).
-- ---------------------------------------------------------
create or replace function notify_roles(
  p_roles text[], p_kind text, p_title text, p_body text, p_link text, p_exclude uuid default null
)
returns void language plpgsql security definer as $$
begin
  insert into notifications (recipient_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link
  from profiles
  where role = any(p_roles) and aktif = true and (p_exclude is null or id <> p_exclude);
end;
$$;

-- Tindak lanjut baru -> beri tahu anggota Pokja yang bersangkutan (selain pembuatnya)
create or replace function trg_notify_tindak_lanjut()
returns trigger language plpgsql as $$
declare
  v_roles text[];
begin
  v_roles := case new.pokja
    when 'I' then array['pokja1_ketua','pokja1_anggota']
    when 'II' then array['pokja2_ketua','pokja2_anggota']
    when 'III' then array['pokja3_ketua','pokja3_anggota']
    else null
  end;
  if v_roles is not null then
    perform notify_roles(
      v_roles, 'tindak_lanjut_baru',
      'Tindak lanjut baru di Pokja ' || new.pokja,
      coalesce(new.deskripsi, new.jenis_kegiatan),
      '/objek-pad/' || new.objek_pad_id,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

create trigger notify_on_tindak_lanjut after insert on tindak_lanjut
  for each row execute function trg_notify_tindak_lanjut();

-- Laporan berkala baru -> beri tahu pimpinan
create or replace function trg_notify_laporan()
returns trigger language plpgsql as $$
begin
  perform notify_roles(
    array['super_admin','ketua_tim','wakil_ketua','sekretariat'],
    'laporan_baru', 'Laporan baru: ' || new.judul, new.ringkasan, '/laporan', auth.uid()
  );
  return new;
end;
$$;

create trigger notify_on_laporan after insert on laporan_berkala
  for each row execute function trg_notify_laporan();

-- Objek berubah jadi "menunggak" (dari trigger refresh_objek_tunggakan_status
-- di schema_08) -> beri tahu pimpinan + Pokja II (penertiban/intervensi)
create or replace function trg_notify_menunggak()
returns trigger language plpgsql as $$
begin
  if new.status_verifikasi = 'menunggak' and old.status_verifikasi is distinct from 'menunggak' then
    perform notify_roles(
      array['super_admin','ketua_tim','wakil_ketua','sekretariat','pokja2_ketua','pokja2_anggota'],
      'objek_menunggak', 'Objek menunggak: ' || new.nama_objek,
      'Status berubah jadi menunggak -- ada tagihan lewat jatuh tempo yang belum lunas.',
      '/objek-pad/' || new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_on_menunggak after update on objek_pad
  for each row execute function trg_notify_menunggak();

-- Penetapan tagihan baru -> beri tahu pimpinan (transparansi keuangan)
create or replace function trg_notify_penetapan()
returns trigger language plpgsql as $$
begin
  perform notify_roles(
    array['super_admin','ketua_tim','wakil_ketua','sekretariat'],
    'penetapan_baru', 'Penetapan tagihan baru',
    'Nomor: ' || coalesce(new.nomor_penetapan, '(belum diisi)'),
    '/objek-pad/' || new.objek_pad_id,
    auth.uid()
  );
  return new;
end;
$$;

create trigger notify_on_penetapan after insert on penetapan_pad
  for each row execute function trg_notify_penetapan();
