# OPTIMA PAD NTT — Aplikasi Optimalisasi PAD Dinas PUPR Provinsi NTT

Aplikasi internal Tim Terpadu Optimalisasi Pendapatan Asli Daerah (PAD) berdasarkan
SK Gubernur NTT No. 272/KEP/HK/2026, mencakup 3 objek: Retribusi Pemanfaatan Utilitas
Jalan, Retribusi Pelayanan Alat Berat, dan Pajak Air Permukaan.

**Stack:** Next.js (App Router) · Supabase (Postgres + Auth + RLS) · Backblaze B2
(file storage) · Cloudflare Workers (hosting, via OpenNext) · GitHub Actions (CI/CD
auto-deploy) · Leaflet (peta potensi PAD)

> Riwayat pembaruan besar: desain ulang total UI/UX (sistem desain baru, bagian 6),
> penambahan halaman **Peta Potensi PAD** (GIS, bagian 7), halaman **kelola akun/role**
> khusus Super Admin (bagian 8), dan **auto-deploy ke Cloudflare lewat GitHub Actions**
> setiap kali ada commit ke `main` (bagian 5) — jadi Anda tidak perlu menjalankan
> `npm run deploy` manual lagi, cukup commit/push lewat GitHub (bisa sepenuhnya dari
> browser, tanpa CLI).

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
   - **Akun pertama ini WAJIB lewat cara manual di atas** (ayam-telur: perlu satu
     super_admin dulu sebelum halaman admin bisa dipakai). Akun berikutnya (ketua
     Pokja, anggota, Bapenda, dst.) tinggal diundang lewat halaman `/admin` di
     aplikasi begitu super_admin pertama sudah login — lihat bagian 6.

## 2. Setup Backblaze B2

1. Buat akun di [backblaze.com/b2](https://www.backblaze.com/cloud-storage), lalu buat
   **Bucket** baru, misal `pad-ntt-lampiran`.
2. Buka **Bucket Details** untuk melihat **Endpoint** (contoh: `s3.us-west-004.backblazeb2.com`).
3. Buka **App Keys → Add a New Application Key**, pilih akses ke bucket ini saja (read & write).
   Catat `keyID` dan `applicationKey` (hanya ditampilkan sekali).
4. URL publik file (kalau bucket di-set Public) mengikuti pola:
   `https://{endpoint-f-number}.backblazeb2.com/file/{nama-bucket}`.

> B2 kompatibel dengan S3 API, jadi kode di `lib/storage.ts` tetap pakai
> `@aws-sdk/client-s3` — cuma beda endpoint & kredensial.

## 3. Environment variables (development lokal)

```bash
cp .env.example .env.local
```

Isi semua nilai dari langkah 1 & 2 di `.env.local`.

## 4. Jalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## 5. Deploy otomatis ke Cloudflare Workers (CI/CD via GitHub Actions)

Setiap **push/commit ke branch `main`**, GitHub Actions (`.github/workflows/deploy.yml`)
otomatis menjalankan build lalu deploy ke Cloudflare Workers — persis seperti alur
RANGKUL. Anda tidak perlu install atau login `wrangler` di komputer sendiri; semuanya
jalan di server GitHub. Cukup lakukan commit lewat GitHub web (upload file / edit
langsung di browser, atau `git push` dari editor apa pun) dan deploy berjalan sendiri
dalam 1–2 menit.

**Yang perlu disiapkan sekali saja (lewat browser, di halaman GitHub repo Anda):**

1. Buka repo di GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
2. Tambahkan secret berikut satu per satu:

   | Nama secret | Isi |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | Token API dari Cloudflare dashboard → My Profile → API Tokens → buat token dengan permission **Workers Scripts: Edit** (dan **Account Settings: Read** kalau diminta) |
   | `CLOUDFLARE_ACCOUNT_ID` | Account ID Cloudflare (terlihat di sidebar kanan dashboard Cloudflare, atau di URL dashboard) |
   | `NEXT_PUBLIC_SUPABASE_URL` | sama seperti di `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sama seperti di `.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | sama seperti di `.env.local` |
   | `B2_REGION`, `B2_ENDPOINT`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME` | sama seperti di `.env.local` |
   | `B2_PUBLIC_URL` | opsional, isi kalau bucket B2 di-set Public |

3. Push/commit apa saja ke `main` → cek tab **Actions** di GitHub untuk melihat progres
   deploy. Setelah sukses, aplikasi live di `https://pad-ntt-app.<subdomain-workers-anda>.workers.dev`
   (atau custom domain kalau sudah dihubungkan di Cloudflare dashboard).

Workflow ini juga otomatis mendorong 7 secret server-only (`SUPABASE_SERVICE_ROLE_KEY`,
`B2_*`) sebagai **Cloudflare Worker secret** (`wrangler secret`) di setiap deploy, jadi
nilainya tersedia lewat `process.env` saat aplikasi berjalan di Workers — bukan cuma
saat proses build.

**Deploy manual (opsional, kalau ingin dari komputer sendiri):**

```bash
npx wrangler login
npm run deploy
```

## 6. Sistem desain (UI/UX)

Desain lama (kartu putih polos, sidebar teks datar) diganti dengan sistem desain baru
bertema "instrumen navigasi kelautan + presisi data fiskal" — cocok untuk provinsi
kepulauan yang datanya bicara soal peta dan uang:

- **Tipografi:** Space Grotesk untuk judul/angka besar, IBM Plex Sans untuk teks,
  IBM Plex Mono untuk koordinat GPS/rupiah/timestamp (angka tabular, mudah dipindai).
- **Warna:** sidebar navy gelap (`--ink`), latar kerja krem hangat (`--paper`), aksen
  teal laut (`--marine`) untuk aksi utama, emas (`--gold`) untuk data kabupaten/kota.
- **Bahasa status tunggal:** 4 warna status objek PAD (merah/kuning/biru/hitam,
  lihat `lib/status.ts`) dipakai identik di badge, dashboard, dan pin peta — supaya
  status sebuah objek langsung dikenali di mana pun ditampilkan.
- Semua token ada di `app/globals.css`, komponen dasar (`.card`, `.btn`, `.badge`,
  `.stat-card`, dst.) dipakai ulang di semua halaman.

## 7. Peta potensi PAD (GIS) — `/peta`

Halaman baru yang memvisualisasikan seluruh objek PAD yang sudah punya koordinat GPS
di peta (Leaflet + OpenStreetMap), dengan pin berwarna sesuai status validasi dan
legenda yang sama dengan dashboard. Form "Tambah objek PAD" sekarang punya tombol
**"Ambil lokasi saat ini"** yang memakai GPS perangkat (browser Geolocation API) untuk
mengisi koordinat otomatis saat petugas di lapangan.

## 8. Kelola akun (`/admin`)

Khusus role `super_admin` -- link "Kelola akun" otomatis muncul di sidebar. Dua hal
bisa dilakukan di sini:

- **Undang anggota baru**: isi email + nama + role + Pokja -> sistem membuat akun
  Supabase Auth dan mengirim email berisi link untuk anggota tersebut mengatur
  password sendiri (tidak ada password sementara yang perlu Anda kirim manual).
- **Ubah role/Pokja/status aktif** anggota yang sudah ada, langsung dari tabel --
  perubahan berlaku seketika lewat Row Level Security, tidak perlu deploy ulang
  atau minta anggota logout-login.

Akun `super_admin` tidak bisa menonaktifkan dirinya sendiri lewat halaman ini
(pengaman supaya tidak ada yang terkunci keluar sistem tanpa sengaja).

## 9. Struktur folder

```
app/
  layout.tsx                -> Shell aplikasi (sidebar navy + info user + keluar)
  nav-links.tsx              -> Sidebar nav (client component, highlight rute aktif)
  login/page.tsx             -> Halaman login (split hero + form)
  page.tsx                  -> Dashboard: stat kartu, target vs realisasi, legenda status
  objek-pad/                -> Daftar & tambah objek PAD (Pokja I), termasuk koordinat GPS
    [id]/page.tsx           -> Detail objek + upload lampiran + tindak lanjut
  peta/                     -> Peta potensi PAD (GIS, Leaflet)
  tindak-lanjut/page.tsx    -> Log tindak lanjut bergaya timeline (Pokja II)
  laporan/page.tsx          -> Laporan berkala (Pokja III)
  tim/page.tsx              -> Struktur tim sesuai lampiran SK
  admin/                    -> Kelola akun & role (khusus super_admin)
  api/upload/presign/       -> API route presigned URL upload ke B2
lib/
  supabase/client.ts        -> Klien Supabase browser
  supabase/server.ts        -> Klien Supabase server (RLS) + klien admin (service role)
  auth.ts                   -> getCurrentProfile()
  actions/auth.ts           -> Server action logout
  actions/admin.ts          -> Server action undang anggota baru (Supabase Admin API)
  types.ts                  -> Tipe data & label role
  status.ts                 -> Satu sumber warna/legenda status (badge, dashboard, peta)
  icons.tsx                 -> Ikon SVG sidebar (tanpa dependency library ikon)
  storage.ts                -> Klien Backblaze B2 (S3-compatible)
middleware.ts                -> Proteksi rute + refresh sesi login
.github/workflows/deploy.yml -> CI/CD: build & deploy otomatis ke Cloudflare saat push ke main
supabase/                    -> Skema SQL (lihat bagian 1)
```

## 10. Alur upload file (foto/video/dokumen)

1. Browser minta presigned URL ke `POST /api/upload/presign`.
2. Browser upload file langsung ke B2 pakai presigned URL (`PUT`), tidak lewat server.
3. Metadata file disimpan ke tabel `lampiran` di Supabase, terhubung ke objek PAD /
   tindak lanjut / laporan terkait.

## 11. Role pengguna & hak akses (RLS)

Semua pengguna login bisa **melihat** seluruh data. Yang dibatasi per role adalah hak
**menulis/mengubah**, ditegakkan di level database lewat Row Level Security Postgres:

| Role | Bisa kelola |
|---|---|
| `super_admin` | Semua (termasuk hapus data & ubah role user) |
| `ketua_tim`, `wakil_ketua`, `sekretariat` | Semua modul (baca+tulis), tanpa hapus |
| `pokja1_ketua`, `pokja1_anggota` | Objek PAD (inventarisasi), buat tindak lanjut awal |
| `pokja2_ketua`, `pokja2_anggota` | Tindak lanjut (yang ditandai pokja mereka) |
| `pokja3_ketua`, `pokja3_anggota` | Laporan berkala, baca audit log |
| `bapenda` | Target/realisasi, tarif PAD (`pad_tariffs`) |
| `pupr`, `kejati`, `inspektorat`, `viewer` | Hanya baca |

Tabel `audit_logs` mencatat otomatis setiap insert/update/delete pada tabel inti lewat
trigger database.

## 12. Catatan biaya B2

Backblaze B2 punya free tier (10GB storage) tanpa kartu kredit di awal. Kalau nanti
mau pindah ke Cloudflare R2, tinggal ganti isi `lib/storage.ts` dan env vars — struktur
kode lain tidak berubah karena keduanya S3-compatible.

## 13. Status pengujian

`npm run build` dan `npx tsc --noEmit` sukses tanpa error (termasuk setelah desain
ulang UI dan penambahan halaman peta). Belum diuji dengan kredensial Supabase/B2
sungguhan — itu baru bisa dites setelah `.env.local` diisi kredensial asli.

Catatan versi: Next.js 15.5.24 (bukan versi lama yang punya kerentanan keamanan kritis
CVE-2025-66478); Leaflet 1.9.x untuk peta.

**Wajib Node.js 22 atau lebih baru** (workflow CI dan `package.json` sudah dikunci ke
ini). Node 20 gagal build dengan error `SyntaxError: Named export 'unstable_readConfig'
not found` saat `opennextjs-cloudflare build` -- itu bug kompatibilitas interop CJS/ESM
antara Node 20 dan versi `wrangler` yang dipakai, sudah diverifikasi hilang total di
Node 22. Kalau develop lokal masih pakai Node 20, upgrade dulu (nvm install 22).

## 14. Yang masih disederhanakan (roadmap lanjutan)

- **Halaman admin kelola akun/role**: sudah ada di `/admin` (khusus role `super_admin`,
  muncul otomatis di sidebar). Bisa undang anggota baru lewat email (mengirim link
  set password via Supabase Auth), lalu ubah role/Pokja/status aktif langsung dari
  tabel tanpa lewat SQL Editor lagi. Kalau nanti mengundang banyak anggota sekaligus,
  pertimbangkan setup SMTP custom di Supabase (Settings -> Auth -> SMTP) karena
  pengirim email bawaan Supabase punya batas kirim per jam.
- **Formula perhitungan potensi PAD**: tabel `pad_tariffs` sudah configurable, tapi
  tarifnya masih 0 (placeholder) — perlu diisi angka riil dari Perda NTT No 1/2026,
  idealnya divalidasi Bapenda dulu.
- **Alur penetapan & tagihan berjenjang** (Fase 3 di dokumen): status objek PAD masih
  4 state sederhana, belum mencakup seluruh alur penetapan-tagihan-pembayaran-piutang.
- **PWA offline-first** untuk petugas lapangan (Fase, sesuai dokumen): belum digarap —
  ini pekerjaan terpisah yang cukup besar (service worker, local queue, sync).
- **Modul intelligence** (deteksi objek belum terdaftar, ranking potensi, rekomendasi
  prioritas pemeriksaan — Fase 6 dokumen): belum digarap.
- **Modul surat & dokumen otomatis** (surat tugas, berita acara, dsb — bagian 3.10
  dokumen): belum digarap, bisa memakai skill pembuatan docx/PDF.
- **Ekspor laporan ke PDF/Word**: belum ada.
- **Dashboard pimpinan terpisah** (ringkasan super-sederhana untuk Gubernur/Ketua Tim,
  bagian 3.11 dokumen): saat ini dashboard masih satu untuk semua role — bisa
  dipersempit per role kalau diperlukan.

Item-item di atas masing-masing adalah pekerjaan besar tersendiri (terutama PWA
offline-first dan modul dokumen otomatis) — beri tahu prioritas mana yang paling
mendesak untuk digarap berikutnya.
