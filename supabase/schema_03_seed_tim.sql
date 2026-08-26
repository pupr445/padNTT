-- Seed: Struktur Tim Terpadu Optimalisasi PAD (Lampiran SK No. 272/KEP/HK/2026)
-- Nama pejabat definitif tidak selalu tertulis di lampiran (banyak berupa nama jabatan);
-- isi/kolom nama_jabatan mengikuti apa yang tertulis di dokumen. Sesuaikan bila ada pembaruan.

insert into tim_struktur (nomor, nama_jabatan, kedudukan, pokja, rincian_tugas) values
(1, 'Gubernur NTT', 'Pelindung/Pengarah', null, 'Memberikan arahan secara umum terkait pelaksanaan tugas tim'),
(2, 'Kajati NTT', 'Pelindung/Pengarah', null, 'Memberikan arahan secara umum terkait pelaksanaan tugas tim'),
(3, 'Kapolda NTT', 'Pelindung/Pengarah', null, 'Memberikan arahan secara umum terkait pelaksanaan tugas tim'),
(4, 'Kepala Dinas Pekerjaan Umum dan Perumahan Rakyat Provinsi NTT', 'Ketua', null, 'Bertanggung jawab atas pelaksanaan kegiatan sekaligus mengkoordinir tim kerja'),
(5, 'Asisten Perdata dan Tata Usaha Negara pada Kejaksaan Tinggi NTT', 'Wakil Ketua I', null, 'Membantu Ketua dalam pelaksanaan kegiatan penerbitan, pemulihan, dan penyelesaian masalah hukum barang milik daerah Provinsi NTT'),
(6, 'Kepala Biro Hukum Setda Provinsi NTT', 'Wakil Ketua II', null, 'Membantu Ketua dalam pelaksanaan kegiatan penerbitan, pemulihan, dan penyelesaian masalah hukum barang milik daerah Provinsi NTT'),
(7, 'Sekretaris Dinas PUPR Provinsi NTT', 'Sekretaris', null, 'Membuat rencana kegiatan & jadwal, menyiapkan konsep surat, inventarisasi pemanfaatan utilitas jalan, membuat konsep laporan'),

-- Pokja I — Inventarisasi & pendataan objek PAD
(8, 'Kepala Bidang Sumber Daya Air pada Dinas PUPR Prov. NTT', 'Ketua Pokja I', 'I', 'Mengkoordinir inventarisasi objek PAD (utilitas jalan, alat berat, pajak air permukaan); berkoordinasi dengan Pokja lain'),
(9, 'Putu Agus Eka Sabana Putra, S.H., M.H. / Koordinator JPN Kejaksaan Tinggi NTT', 'Anggota', 'I', 'Inventarisasi, pendataan, validasi, survei, verifikasi, pemetaan, analisis potensi penerimaan'),
(10, 'Kepala Bidang PHI dan Pengawasan Ketenagakerjaan pada Disnakertrans Prov. NTT', 'Anggota', 'I', null),
(11, 'Kepala Seksi Perencanaan Teknis dan Evaluasi pada Dinas PUPR Prov. NTT', 'Anggota', 'I', null),
(12, 'Alboin Mauricio Blegur, S.H., M.H. / JPN Kejaksaan Tinggi NTT', 'Anggota', 'I', null),
(13, 'Misyati Yahya, SY / Fungsional Pengawas Ketenagakerjaan Ahli Muda, Disnakertrans Prov. NTT', 'Anggota', 'I', null),
(14, 'Hanny I. C. Ratuwalu, S.H., M.Hum / Perancang Perundang-undangan Ahli Muda, Biro Hukum Setda Prov. NTT', 'Anggota', 'I', null),
(15, 'Lucky Isakti Sinlaeloe, S.H. / Perancang Perundang-undangan Ahli Pertama, Biro Hukum Setda Prov. NTT', 'Anggota', 'I', null),
(16, 'Ndara Nduka, S.H. / Penelaah Teknis Kebijakan, Biro Hukum Setda Prov. NTT', 'Anggota', 'I', null),
(17, 'Kasubag Umum dan Kepegawaian Dinas PUPR Prov. NTT', 'Anggota', 'I', null),
(18, 'Kasubag Keuangan Dinas PUPR Prov. NTT', 'Anggota', 'I', null),
(19, 'Reinhard Tambunan, S.T., M.Eng / Penata Kelola Jalan dan Jembatan Ahli Pertama, Dinas PUPR Prov. NTT', 'Anggota', 'I', null),
(20, 'Jaiminto Dos Santos, A.Md.T / Penata Laksana Jalan dan Jembatan Terampil, Dinas PUPR Prov. NTT', 'Anggota', 'I', null),
(21, 'Novia Natalia, S.T., M.M. / Penata Layanan Operasional, Dinas PUPR Prov. NTT', 'Anggota', 'I', null),

-- Pokja II — Penertiban, optimalisasi, penindakan hukum
(22, 'Kepala Bidang Bina Marga pada Dinas PUPR Prov. NTT', 'Ketua Pokja II', 'II', 'Mengkoordinir kegiatan intervensi, penertiban, optimalisasi; berkoordinasi dengan Pokja lain'),
(23, 'Kabag. Bantuan Hukum pada Biro Hukum Setda Prov. NTT', 'Anggota', 'II', 'Sosialisasi, pemeriksaan lapangan terpadu, penertiban, tindakan administratif, pendampingan hukum, koordinasi penagihan'),
(24, 'Ronald Oktha, S.H., M.H. / JPN Kejaksaan Tinggi NTT', 'Anggota', 'II', null),
(25, 'Gerson A. Saudila, S.H., M.H. / JPN Kejaksaan Tinggi NTT', 'Anggota', 'II', null),
(26, 'Kepala Sub Bidang Pendataan dan Penerimaan, Bapenda Prov. NTT', 'Anggota', 'II', null),
(27, 'Kepala Seksi Pembangunan Jalan dan Jembatan, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(28, 'Fideon G. Siokain, S.H. / Analis Hukum Ahli Muda, Biro Hukum Setda Prov. NTT', 'Anggota', 'II', null),
(29, 'Erich Alfaredo Boro, S.E. / Penelaah Teknis Kebijakan, Bapenda Prov. NTT', 'Anggota', 'II', null),
(30, 'Mozes Sinlae, S.H. / Penelaah Teknis Kebijakan, Satpol PP Prov. NTT', 'Anggota', 'II', null),
(31, 'Rudy A. Eradmus, S.H. / Fungsional Pol. PP Ahli Pertama, Satpol PP Prov. NTT', 'Anggota', 'II', null),
(32, 'Antonius Yosef Hera, S.S.T. / Penata Layanan Operasional, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(33, 'Endarto Franci, YN Core Taka, S.T. / Teknisi Sarana dan Prasarana, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(34, 'Marino Ado Galot Pukan, S.T. / Teknisi Sarana dan Prasarana, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(35, 'Aldi Melfin Rafael Ollah, A.Md.T / Penata Laksana Jalan dan Jembatan Terampil, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(36, 'Dyah Eka Maharani, S.T. / Penata Laksana Jalan dan Jembatan Pemula, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(37, 'Marianus M. Angkasawan, S.T. / Penelaah Teknis Kebijakan, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),
(38, 'Yades Amendo Bukang / Operator Layanan Operasional, Dinas PUPR Prov. NTT', 'Anggota', 'II', null),

-- Pokja III — Penyelesaian masalah hukum, pelaporan, evaluasi
(39, 'Kepala Seksi Perencanaan Sumber Daya Air, Dinas PUPR Prov. NTT', 'Ketua Pokja III', 'III', 'Mengkoordinir kegiatan penyelesaian masalah hukum, pelaporan dan evaluasi; berkoordinasi dengan Pokja lain'),
(40, 'Herry C. Franklin, S.H., M.H. / JPN Kejaksaan Tinggi NTT', 'Anggota', 'III', 'Monitoring laporan Pokja I & II, evaluasi capaian PAD, analisis efektivitas, identifikasi kendala & solusi, laporan berkala'),
(41, 'Yuliana B. Aran, S.P., M.M. / Auditor Madya, Inspektorat Prov. NTT', 'Anggota', 'III', null),
(42, 'Habel Eduard Therik / Auditor Penyelia, Inspektorat Prov. NTT', 'Anggota', 'III', null),
(43, 'Marni D. Oenunu, S.S.T. Keb., M.H. / Analis Kebijakan Ahli Pertama, Biro Hukum Setda Prov. NTT', 'Anggota', 'III', null),
(44, 'Kepala Seksi Pelaksanaan SDA, Dinas PUPR Prov. NTT', 'Anggota', 'III', null),
(45, 'Amanda Putri Maharani, S.T. / Pengelolah Sumber Daya Air Ahli Pertama, Dinas PUPR Prov. NTT', 'Anggota', 'III', 'Menyusun rekomendasi kebijakan, dokumentasi kegiatan, menyampaikan laporan ke Ketua Tim/Gubernur');
