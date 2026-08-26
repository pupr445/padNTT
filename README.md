# Aplikasi Optimalisasi PAD — Dinas PUPR Provinsi NTT

Aplikasi internal Tim Terpadu Optimalisasi Pendapatan Asli Daerah (PAD) berdasarkan
SK Gubernur NTT No. 272/KEP/HK/2026, mencakup 3 objek: Retribusi Pemanfaatan Utilitas
Jalan, Retribusi Pelayanan Alat Berat, dan Pajak Air Permukaan.

**Stack:** Next.js (App Router) · Supabase (Postgres) · Backblaze B2 (file storage) ·
Cloudflare Pages (hosting) · GitHub (versioning/CI)

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan berurutan (urutan penting karena saling bergantung):
   1. `supabase/schema_01_core.sql` — tabel inti (objek PAD, target/realisasi, tindak lanjut, laporan, lampiran).
   2. `supabase/schema_02_auth_roles.sql` — profil pengguna & role, tarif configurable, audit trail, RLS per role.
   3. `supabase/schema_03_seed_tim.sql` — data awal struktur tim sesuai lampiran SK.
3. Ambil `Project URL` dan `anon public key` dari **Settings → API**, juga
   `service_role key` (rahasia, jangan expose ke browser).
4. **Buat akun pengguna pertama (super_admin):**
   - Buka **Authentication → Users → Add user**, isi email & password (atau invite by email).
   - Trigger otomatis membuat baris di tabel `profiles` dengan role default `viewer`.
   - Buka **Table Editor → profiles**, ubah kolom `role` akun tadi menjadi `super_admin`
     (atau lewat SQL Editor: `update profiles set role = 'super_admin' where email = 'admin@ntt.go.id';`).
   - Setelah punya 1 akun `super_admin`, akun-akun berikutnya (ketua Pokja, anggota, Bapenda,
     dst.) dibuat lewat cara yang sama lalu role-nya diatur oleh super_admin — belum ada
     halaman admin khusus untuk ini di UI (lihat bagian "yang masih disederhanakan").

## 2. Setup Backblaze B2

1. Buat akun di [backblaze.com/b2](https://www.backblaze.com/cloud-storage), lalu buat
   **Bucket** baru, misal `pad-ntt-lampiran`. Kalau mau file bisa diakses langsung lewat
   link (foto/video), set bucket ke **Public**.
2. Buka **Bucket Details** untuk melihat **Endpoint** (contoh: `s3.us-west-004.backblazeb2.com`)
   — catat bagian region-nya (`us-west-004`) juga.
3. Buka **App Keys → Add a New Application Key**, pilih akses ke bucket ini saja (read & write).
   Catat `keyID` dan `applicationKey` (applicationKey hanya ditampilkan sekali, simpan baik-baik).
4. URL publik file mengikuti pola: `https://{endpoint-f-number}.backblazeb2.com/file/{nama-bucket}`
   — nomor `f004` dsb bisa dilihat contohnya di halaman bucket settings.

> B2 kompatibel dengan S3 API, jadi kode di `lib/storage.ts` tetap pakai
> `@aws-sdk/client-s3` seperti biasa — cuma beda endpoint & kredensial.

## 3. Environment variables

Salin `.env.example` menjadi `.env.local`, isi semua nilai dari langkah 1 & 2:

```bash
cp .env.example .env.local
```

## 4. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 5. Deploy ke Cloudflare Workers

Sejak Desember 2025, Cloudflare merekomendasikan **OpenNext adapter + Cloudflare Workers**
untuk Next.js (menggantikan `@cloudflare/next-on-pages` + Pages yang kini deprecated).
Project ini sudah dikonfigurasi untuk itu (`wrangler.toml`, `open-next.config.ts`).

Login ke akun Cloudflare-mu dulu lewat CLI:

```bash
npx wrangler login
```

Lalu build & deploy:

```bash
npm run deploy
```

(Perintah ini menjalankan `opennextjs-cloudflare build` lalu `opennextjs-cloudflare deploy`.)

Untuk preview lokal yang mendekati environment production (jalan di runtime Workers, bukan Node.js biasa):

```bash
npm run preview
```

**Environment variables saat deploy:** isi lewat `wrangler secret put NAMA_VAR` untuk nilai
rahasia (service role key, application key B2), atau lewat dashboard **Workers & Pages →
project kamu → Settings → Variables**. Untuk CI/CD otomatis, hubungkan repo GitHub lewat
**Workers Builds** di dashboard Cloudflare.

## 6. Struktur folder

```
app/
  layout.tsx                -> Sidebar + info user login + tombol keluar
  login/page.tsx             -> Halaman login (email + password)
  page.tsx                  -> Dashboard utama
  objek-pad/                -> Daftar & tambah objek PAD (Pokja I)
    [id]/page.tsx           -> Detail objek + upload lampiran + tindak lanjut
  tindak-lanjut/page.tsx    -> Log semua tindak lanjut (Pokja II)
  laporan/page.tsx          -> Laporan berkala (Pokja III)
  tim/page.tsx              -> Struktur tim sesuai lampiran SK
  api/upload/presign/       -> API route untuk presigned URL upload ke B2 (cek sesi login)
lib/
  supabase/client.ts        -> Klien Supabase browser (client component)
  supabase/server.ts        -> Klien Supabase server (RLS aktif) + klien admin (service role)
  auth.ts                   -> getCurrentProfile() -> nama, role, pokja user login
  actions/auth.ts           -> Server action logout
  types.ts                  -> Tipe data & label role
  storage.ts                -> Klien Backblaze B2 (S3-compatible) + helper presigned URL
middleware.ts                -> Proteksi rute + refresh sesi login
supabase/
  schema_01_core.sql        -> Skema tabel inti
  schema_02_auth_roles.sql  -> Profil/role, tarif configurable, audit trail, RLS per role
  schema_03_seed_tim.sql    -> Data awal struktur tim dari lampiran SK
```

## 7. Alur upload file (foto/video/dokumen)

1. Browser minta presigned URL ke `POST /api/upload/presign` (server yang tahu
   kredensial B2, browser tidak pernah menyentuhnya).
2. Browser upload file langsung ke B2 pakai presigned URL tadi (`PUT`), tidak lewat server —
   lebih cepat dan hemat resource.
3. Setelah berhasil, metadata file (key, nama, tipe) disimpan ke tabel `lampiran` di Supabase,
   terhubung ke objek PAD / tindak lanjut / laporan terkait.

## 8. Role pengguna & hak akses (RLS)

Semua pengguna login bisa **melihat** seluruh data (dashboard lintas Pokja memang butuh ini).
Yang dibatasi per role adalah hak **menulis/mengubah**, ditegakkan di level database lewat
Row Level Security Postgres (bukan cuma disembunyikan di UI) — jadi tetap aman meski ada yang
coba akses API langsung:

| Role | Bisa kelola |
|---|---|
| `super_admin` | Semua (termasuk hapus data & ubah role user) |
| `ketua_tim`, `wakil_ketua`, `sekretariat` | Semua modul (baca+tulis), tanpa hapus |
| `pokja1_ketua`, `pokja1_anggota` | Objek PAD (inventarisasi), buat tindak lanjut awal |
| `pokja2_ketua`, `pokja2_anggota` | Tindak lanjut (yang ditandai pokja mereka) |
| `pokja3_ketua`, `pokja3_anggota` | Laporan berkala, baca audit log (tugas monitoring-evaluasi) |
| `bapenda` | Target/realisasi, tarif PAD (`pad_tariffs`) |
| `pupr`, `kejati`, `inspektorat`, `viewer` | Hanya baca (sesuai peran mitra di SK) |

Tabel `audit_logs` mencatat otomatis setiap insert/update/delete pada tabel inti (siapa,
kapan, data sebelum/sesudah) lewat trigger database — tidak bisa dimatikan atau dipalsukan
dari sisi aplikasi.



## 9. Catatan biaya B2

Backblaze B2 punya free tier (10GB storage) dan tidak mensyaratkan kartu kredit di awal untuk
tier gratis, jadi cocok untuk mulai development dulu. Kalau nanti mau pindah balik ke Cloudflare
R2 (misal karena sudah di ekosistem Cloudflare untuk hosting), tinggal ganti isi `lib/storage.ts`
dan env vars — struktur kode lain (API route, komponen upload) tidak perlu berubah karena
keduanya sama-sama S3-compatible.

## 10. Status pengujian lokal

Sudah diuji: `npm run build` sukses tanpa error dan `npx tsc --noEmit` bersih. Alur yang
sudah diverifikasi secara statis (build-time): middleware redirect ke `/login`, cookie session
lewat `@supabase/ssr`, dan semua halaman/komponen sudah pakai client Supabase yang tunduk RLS
(bukan lagi service-role bypass-semua). Belum diuji: login/logout end-to-end, insert/update
data lewat form, dan upload file ke B2 dengan Supabase project & bucket B2 sungguhan — itu
baru bisa dites setelah kamu isi `.env.local` dengan kredensial asli dan jalankan migration
`schema_02_auth_roles.sql` (lihat bagian 1).

Catatan versi: project ini pakai Next.js 15.5.24 (bukan versi lama yang tadinya dipilih),
karena versi sebelumnya (15.5.2) punya kerentanan keamanan kritis CVE-2025-66478 dan versi
15.5.7 (patch pertama) belum kompatibel dengan adapter OpenNext yang kita pakai untuk deploy
ke Cloudflare Workers.

## 11. Yang masih disederhanakan (untuk dikembangkan nanti)

- **Halaman admin kelola akun/role**: belum ada UI untuk super_admin mengubah role user lain —
  sementara lewat Table Editor/SQL Editor Supabase langsung (lihat bagian 1, langkah 4).
- **Formula perhitungan potensi PAD**: tabel `pad_tariffs` sudah configurable, tapi formula
  masih generik (`tarif_rp × parameter_jumlah × periode`) dan nilai tarifnya masih 0 (contoh
  placeholder) — perlu diisi angka riil dari Perda NTT No 1/2026 per jenis PAD, idealnya
  divalidasi Bapenda dulu sebelum dipakai untuk menghitung tagihan sungguhan.
- **Alur penetapan & tagihan berjenjang** (Fase 3 di roadmap): status objek PAD saat ini masih
  4 state sederhana (`belum_terdaftar/terdaftar/proses_verifikasi/menunggak`), belum mencakup
  seluruh alur penetapan-tagihan-pembayaran-piutang yang lebih rinci.
- **GIS/peta potensi PAD**: kolom koordinat sudah ada di `objek_pad`, tapi belum ada
  visualisasi peta di dashboard.
- **Target/realisasi**: perlu diisi manual dulu lewat Supabase Table Editor atau
  ditambahkan form input di halaman Dashboard/Laporan.
- **Aplikasi lapangan offline-first (PWA)** dan **modul intelligence** (Fase 6): belum digarap.
- **Ekspor laporan ke PDF/Word**: belum ada, bisa ditambahkan pakai skill docx/pdf.
