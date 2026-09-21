# 🏢 Sistem Presensi & Penggajian Karyawan GPS Real-Time

> **Aplikasi Human Resource Management (HRM) & Payroll terpadu berbasis Web dengan verifikasi presensi Geolocation GPS berakurasi tinggi, verifikasi foto selfie kamera ber-watermark, sesi aman 30 hari anti-kebobolan berikatan hardware fingerprint (SHA-256), monitoring karyawan live real-time, visualisasi peta check-in/check-out, kalkulasi lembur bertingkat & lembur tanggal merah, laporan kerja harian dengan rekomendasi manajerial, pencadangan otomatis Telegram Bot & JSON, pengaturan profil perusahaan & nama aplikasi, sinkronisasi Google Sheets, serta ekspor dokumen resmi PDF dan Excel.**
>
> ⚡ **Dibuat oleh: heruhendri**

---

[![Dibuat Oleh](https://img.shields.io/badge/Dibuat%20Oleh-heruhendri-10b981?style=for-the-badge)](https://github.com/)
[![React Version](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38b2ac?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-amber?style=for-the-badge)](./LICENSE)

---

## 📸 Pratinjau Antarmuka Aplikasi

![Tampilan Dashboard Aplikasi Presensi & Penggajian GPS](./public/screenshot.jpg)

*Antarmuka responsif berkecepatan tinggi dengan integrasi Geolocation GPS, verifikasi kamera selfie ber-watermark, sesi aman 30 hari hardware fingerprint, cadangan cloud Telegram Bot, peta interaktif geofence, monitoring live, analitik grafis kehadiran, serta cetak slip gaji otomatis.*

---

## 🌟 Tentang Aplikasi

Aplikasi **Sistem Presensi & Penggajian Karyawan GPS** dirancang untuk menjawab tantangan tata kelola kehadiran kerja modern pada perusahaan, kantor instansi, dan UMKM tanpa ketergantungan pada perangkat biometrik/fingerprint fisik yang rentan rusak dan berbiaya mahal.

Dengan memanfaatkan sensor **HTML5 Geolocation API** dan formula geodetik **Haversine**, sistem memverifikasi jarak fisik karyawan secara presisi terhadap radius koordinat kantor resmi (*geofencing*). Karyawan hanya dapat melakukan *check-in* saat terbukti berada di area kantor, sementara karyawan dinas luar atau tugas sementara dapat mengajukan presensi remote dengan persetujuan manajerial.

Sistem juga dilengkapi **Verifikasi Foto Selfie Kamera** dengan stempel waktu, koordinat GPS, dan watermark digital resmi, sistem **Sesi Masuk Aman 30 Hari Anti-Kebobolan** berbasis *hardware fingerprint* dan tanda tangan kriptografis SHA-256, mekanisme **Pencadangan Otomatis ke Telegram Bot & Berkas JSON**, serta mesin penggajian otomatis (*payroll engine*) yang menghitung upah lembur bertingkat sesuai UU Ketenagakerjaan No. 13/2003 & PP No. 35/2021, kompensasi lembur hari libur nasional, potongan keterlambatan per menit, tunjangan transport/makan, hingga pencetakan dokumen resmi PDF dan buku kerja Excel multi-sheet.

Seluruh elemen antarmuka, bilah navigasi, footer sistem, dokumen cetak PDF, dan berkas Excel secara konsisten memuat tanda resmi: **"Dibuat oleh heruhendri"**.

---

## 🚀 Fitur-Fitur Lengkap (Feature Overview)

### 1. 📍 Presensi Geolocation GPS & Geofencing Presisi
- **Validasi Jarak Otomatis**: Menghitung jarak meter antara posisi perangkat karyawan dan koordinat kantor secara langsung.
- **Radius Fleksibel**: Admin bebas mengatur batas geofence kantor (default: 100 meter, dapat diatur 20m–500m+).
- **Anti-Kecurangan Geofence**: Tombol absensi terkunci otomatis jika koordinat GPS berada di luar radius kantor yang sah.
- **Pendeteksi Akurasi Satelit**: Menampilkan radius akurasi meter dari sensor GPS perangkat guna mencegah manipulasi *mock location*.
- **Tugas Luar & Penugasan Sementara (Temporary Duty)**: Fitur penugasan dinas luar kota atau proyek cabang dengan koordinat GPS dan radius kustom untuk jangka waktu tertentu.

### 2. 📸 Verifikasi Foto Selfie Kamera (Live Camera & Instant Watermark)
- **Pengambilan Foto Wajah Langsung**: Verifikasi kehadiran dengan kamera depan perangkat saat presensi (*live capture*).
- **Watermark Kriptografis Otomatis**: Setiap foto langsung diberi stempel permanen di atas kanvas:
  - Nama Karyawan & ID Karyawan
  - Waktu dan Tanggal Presisi (WIB)
  - Koordinat GPS (Latitude & Longitude)
  - Status Verifikasi Lokasi (*Di Dalam Radius Kantor / Dinas Luar*)
  - Tanda Pengembang Resmi: **"Dibuat oleh heruhendri"**
- **Pencegah Manipulasi & Titip Absen**: Memastikan foto diambil secara langsung dari kamera aktif tanpa rekayasa galeri.

### 3. 🛡️ Sesi Masuk 30 Hari Aman & Proteksi Anti-Kebobolan (Defense-in-Depth)
- **Ingat Saya Selama 30 Hari**: Pengguna (Karyawan maupun Admin HRD) dapat memilih tetap masuk otomatis di perangkat pribadi selama 30 hari tanpa harus login berulang kali.
- **Pengikatan Sidik Jari Perangkat (Hardware Fingerprint Binding)**:
  - Sesi diikat ke identitas fisik peramban (*User-Agent, screen resolution, timezone, color depth, hardware entropy salt*).
  - Jika token atau storage disalin ke perangkat/laptop lain, sesi otomatis ditolak dan dihapus.
- **Tanda Tangan Kriptografis (HMAC SHA-256 Signature)**:
  - Data sesi ditandatangani secara digital dengan kunci rahasia sistem (*system salt*).
  - Perubahan manual pada *localStorage* (misal memanipulasi role menjadi admin atau memperpanjang tanggal) akan membatalkan tanda tangan dan sesi langsung hangus.
- **Pencabutan Sesi Otomatis Saat Ganti Password (Auto-Revocation)**:
  - Sesi diikat dengan *hash* kata sandi aktif. Jika Admin atau Karyawan mengubah kata sandi, seluruh sesi 30 hari di perangkat lama langsung gugur otomatis.
- **Batas Waktu Ketidakaktifan 7 Hari (7-Day Idle Inactivity Timeout)**:
  - Jika perangkat tidak dibuka/digunakan selama 7 hari berturut-turut, sesi ditutup demi keamanan.
- **Deteksi Interaksi (Activity Heartbeat)**:
  - Pembaruan stempel waktu aktivitas otomatis saat pengguna aktif berinteraksi di aplikasi.
- **Pencegah Brute-Force & Lockout Otomatis**:
  - Batas maksimal 5 kali kegagalan login berturut-turut. Jika terlampaui, sistem menerapkan pendinginan (*lockout cooldown*) selama 60 detik dengan penghitung waktu mundur.
- **Pusat Audit Keamanan Sesi (Secure Session Modal)**:
  - Tombol indikator status sesi di Navbar menampilkan sisa hari aktif (misal: *Sesi 30H Aman 30h*).
  - Klik tombol untuk melihat audit keamanan: nama perangkat terikat, potongan hash fingerprint, signature SHA-256, masa berlaku, dan tombol **"Putuskan Sesi di Perangkat Ini & Keluar"**.

### 4. 🗺️ Visualisasi Peta Presensi GPS (Check-in & Check-out Maps)
- **Peta Interaktif Terintegrasi**: Memetakan pusat kantor, batas zona geofence lingkaran hijau, dan posisi karyawan.
- **Dua Titik Koordinat Presensi**:
  - 🟢 **Pin Hijau**: Posisi GPS saat karyawan melakukan *Check-In* masuk kerja.
  - 🔵 **Pin Biru / Oranye**: Posisi GPS saat karyawan melakukan *Check-Out* pulang kerja.
- **Detail Pin Lengkap**: Klik pin pada peta untuk melihat nama, waktu pencatatan, jarak ke kantor, akurasi sinyal, dan tautan langsung ke Google Maps Satelit.
- **Fitur Navigasi Peta**: Tombol *Zoom In*, *Zoom Out*, *Reset View (Center Office)*, serta fokus otomatis pada karyawan terpilih.
- **Tersedia untuk Semua Pengguna**: Dapat diakses baik oleh Administrator di dashboard maupun oleh Karyawan di portal pribadi.

### 5. 🔴 Live Monitoring Karyawan Real-Time
- **Saklar Monitoring Interaktif**: Admin dapat mengaktifkan atau menonaktifkan pemantauan live sesuai jam operasional kantor.
- **Empat Kategori Status Kehadiran**:
  - 🟢 **Sedang Bekerja**: Karyawan telah check-in dan berada aman di dalam radius kerja.
  - 🔴 **Di Luar Radius**: Karyawan terdeteksi check-in di luar area kantor resmi.
  - 🔵 **Sudah Selesai**: Karyawan telah menyelesaikan absensi pulang hari ini.
  - ⚪ **Belum Hadir**: Karyawan yang belum melakukan absensi pada hari berjalan.
- **Kontrol Keaktifan Akun (Active/Inactive Toggle)**: Kemudahan menonaktifkan atau mengaktifkan kembali akun karyawan kapan pun dengan satu klik.
- **Aksi Cepat Intervensi**: Admin dapat langsung mengirimkan notifikasi peringatan atau melacak posisi karyawan di peta.

### 6. 💾 Cadangkan & Pulihkan Data (Telegram Bot & Berkas JSON)
- **Pencadangan Otomatis ke Telegram Bot**:
  - Mengirimkan salinan basis data sistem langsung ke akun/grup Telegram pribadi via Telegram Bot API Document upload.
  - Konfigurasi mudah dengan memasukkan *Bot Token* dan *Chat ID*.
  - Menampilkan ringkasan jumlah karyawan, riwayat absensi, shift kerja, dan kebijakan perusahaan.
- **Ekspor & Impor File JSON Mandiri**:
  - Unduh berkas cadangan komprehensif (`.json`) ke penyimpanan lokal dengan sekali klik.
  - Pulihkan seluruh data (*Full Restore*) dari berkas cadangan kapan pun dibutuhkan.
- **Pemulihan Cepat**: Memastikan data perusahaan terlindungi dari risiko kehilangan data atau pembersihan browser tanpa sengaja.

### 7. 🧹 Pembersihan Data Operasional / Reset Sistem (Clean Start)
- **Pembersihan Data Operasional (Operational Reset)**:
  - Menghapus riwayat absensi harian, laporan kerja, dan log notifikasi email untuk memulai periode buku kerja baru yang bersih.
  - Tetap mempertahankan data master karyawan, akun login, jadwal shift, dan profil perusahaan.
- **Reset Penuh (Full Factory Reset)**:
  - Mengosongkan seluruh data aplikasi kembali ke kondisi awal dengan proteksi ketik kata konfirmasi dan auto-backup otomatis sebelum eksekusi.

### 8. 🏢 Profil Perusahaan & Kustomisasi Branding Nama Aplikasi
- **Branding Sistem Bebas**: Admin dapat mengubah **Nama Aplikasi**, **Slogan / Tagline**, dan **Versi Sistem**.
- **Identitas Legal Perusahaan**: Pengaturan nama resmi entitas (PT/CV), bidang industri, nomor NPWP perusahaan, dan email notifikasi admin.
- **Kontak & Lokasi Kantor**: Alamat fisik kantor lengkap, kota, kode pos, nomor telepon HRD, email resmi, dan alamat website.
- **Pimpinan Penandatangan Dokumen**: Nama direktur penandatangan slip gaji dan jabatan resmi.
- **Logo Perusahaan**: Mendukung unggah logo langsung dari perangkat (disimpan lokal dalam format base64 aman) atau via URL eksternal.
- **Preset Pengisian Cepat**: Tersedia tombol preset profil instan untuk PT Nusantara Sinergi Utama, PT Teknologi Maju Bersama, dan CV Karya Mandiri Digital.
- **Pratinjau Langsung (Live Preview)**: Tampilan visual pratinjau header navbar, kop surat dokumen cetak, dan footer sistem secara real-time.

### 9. ⏱️ Mesin Lembur Bertingkat & Lembur Hari Libur Nasional
- **Formula Tiered Overtime (Regulasi Ketenagakerjaan)**:
  - Jam ke-1: Kelipatan **1.5x** upah per jam.
  - Jam ke-2 dan seterusnya: Kelipatan **2.0x** upah per jam.
  - Multiplier dan batas jam dapat disesuaikan fleksibel oleh HRD.
- **Kompensasi Lembur Hari Libur (Holiday Overtime)**:
  - Deteksi otomatis hari Minggu dan hari libur nasional Indonesia.
  - Pengali lembur khusus hari libur (kelipatan hingga **2.0x – 4.0x**).
- **Standar Pembagi Jam Kerja**: Mendukung pembagi jam kerja bulanan standar (default **173 jam**) atau kustomisasi sesuai kesepakatan kerja.
- **Workflow Persetujuan Lembur**: Pengajuan lembur melalui laporan kerja harian dengan mekanisme verifikasi (*Approve/Reject*) oleh supervisor/admin.

### 10. 💰 Estimasi Gaji Real-Time (Take Home Pay)
- **Komponen Penghasilan (Earnings)**:
  - Gaji Pokok (*Basic Salary*).
  - Tunjangan Jabatan / Tetap.
  - Uang Makan & Transport Harian (proporsional berdasarkan kehadiran aktual).
  - Upah Lembur Hari Kerja & Lembur Tanggal Merah.
- **Komponen Potongan (Deductions)**:
  - Denda keterlambatan presisi berbasis menit (misal: Rp 1.000 / menit).
  - Potongan ketidakhadiran / mangkir kerja (*unpaid leave*).
- **Periode Cut-Off & Penggajian**: Pengaturan tanggal tutup buku bulanan dan tanggal pembayaran gaji yang dapat disesuaikan.
- **Pratinjau Slip Gaji**: Karyawan dapat melihat proyeksi pendapatan bersih (*Take Home Pay*) mereka secara transparan.

### 11. 📝 Laporan Pekerjaan Harian & Rekomendasi Manajerial (Work Reports)
- **Kewajiban Laporan Kerja**: Karyawan mengisi ringkasan pekerjaan harian sebelum melakukan presensi pulang (*check-out*).
- **Detail Laporan**: Judul pekerjaan, rincian aktivitas yang diselesaikan, persentase progres harian (0%–100%), serta kendala yang dihadapi.
- **Advisor Rekomendasi Pintar**: Sistem mengevaluasi ketercapaian target harian dan menyajikan rekomendasi tindak lanjut bagi manajer.
- **Persetujuan & Catatan Evaluasi**: Administrator dapat memberikan nilai persetujuan dan umpan balik (*feedback*) bagi setiap karyawan.

### 12. 📅 Manajemen Karyawan, Multi-Shift & Jam Kerja
- **Manajemen Karyawan Lengkap**: Tambah, ubah, nonaktifkan, dan hapus karyawan (disertai modal konfirmasi aman pencegah salah hapus).
- **Dukungan Multi-Shift**:
  - Shift Reguler / Kantor (08:00 – 17:00)
  - Shift Pagi Operasional (07:00 – 15:30)
  - Shift Siang Operasional (13:30 – 22:00)
  - Shift Malam Keamanan/Produksi (21:30 – 06:00)
- **Toleransi Keterlambatan**: Ambang batas toleransi keterlambatan (misal: 15 menit) sebelum denda mulai diberlakukan.

### 13. 📄 Ekspor Dokumen Resmi (PDF & Excel XLSX)
- **Slip Gaji Karyawan (PDF)**:
  - Format resmi dan rapi (*confidential*) lengkap dengan kop surat perusahaan, alamat, NPWP, dan logo.
  - Tabel rincian penghasilan dan potongan, nominal terbilang, dan tanda tangan direktur.
  - Dilengkapi watermark resmi: **"Dibuat oleh heruhendri"**.
- **Laporan Rekapitulasi Gaji Departemen (PDF Landscape)**:
  - Laporan cetak rekapitulasi komprehensif per departemen untuk arsip audit dan manajemen.
- **Workbook Spreadsheet Excel (XLSX)**:
  - Berkas spreadsheet multi-sheet: `Rekap Penggajian`, `Log Presensi GPS`, `Master Karyawan`, dan `Info Sistem`.

### 14. 📊 Visualisasi & Analitik Performa (Recharts)
- **Grafik Tren Kehadiran**: Tren kehadiran harian dan mingguan dalam bentuk grafik batang dan garis.
- **Distribusi Presensi Departemen**: Analisis tingkat kepatuhan dan ketepatan waktu per divisi.
- **Matriks Lembur & Produktivitas**: Visualisasi perbandingan jam lembur dan efisiensi kerja karyawan.

### 15. 🔄 Integrasi Database Google Sheets
- **Sinkronisasi Otomatis & Manual**: Kirim data absensi, pengajuan lembur, dan rekap penggajian langsung ke Google Sheets.
- **Dukungan Google Apps Script**: Kemudahan konfigurasi Webhook URL Apps Script dan Sheet ID langsung dari dashboard admin.

---

## 🛠️ Arsitektur & Tumpukan Teknologi (Tech Stack)

| Lapisan / Modul | Teknologi | Fungsi & Keunggulan |
|---|---|---|
| **Frontend Framework** | React 19 (`react` & `react-dom`) | Komponen modular modern, hooks terstandar, dan performa render kilat |
| **Bahasa Pemrograman** | TypeScript 5.8 | Tipe data ketat (*strict types*) untuk keamanan runtime maksimal |
| **Bundler & Server** | Vite 6.2 | *Hot Module Replacement*, build produksi cepat, dan konfigurasi ringan |
| **Styling & CSS** | Tailwind CSS 4.1 | Utility-first styling modern dengan skema warna ramah mata |
| **Keamanan & Kriptografi** | Web Crypto API (SHA-256) | Pembuatan hash sidik jari perangkat, HMAC session signature & rate limiting |
| **Cloud Backup** | Telegram Bot API | Pengiriman dokumen cadangan sistem (.json) secara otomatis ke Telegram |
| **Sensor & Kamera** | HTML5 Geolocation & MediaDevices API | Pengambilan koordinat GPS real-time & capture foto selfie verifikasi |
| **Pengolahan Gambar** | HTML5 Canvas 2D | Pencetakan watermark otomatis pada foto selfie presensi |
| **Ikon Antarmuka** | Lucide React | Pustaka ikon SVG konsisten, modern, dan ringan |
| **Pembuatan PDF** | jsPDF & jsPDF-AutoTable | Pembuatan slip gaji dan laporan rekapitulasi PDF berformat resmi |
| **Pengolah Spreadsheet** | SheetJS (`xlsx`) | Generator workbook Excel (.xlsx) multi-sheet langsung di browser |
| **Grafik & Data Viz** | Recharts 3.10 | Komponen diagram batang, garis, dan area interaktif yang responsif |
| **Penyimpanan Lokal** | Browser `localStorage` | Persistensi data lokal yang andal, aman, dan tanpa instalasi server DB rumit |

---

## 🔑 Kredensial Pengujian (Demo Accounts)

Sistem telah dilengkapi data awal (*mock data*) yang siap digunakan untuk pengujian langsung:

| Peran | Login Identifier (ID / Username / No. HP) | Password Default | Nama & Jabatan | Keterangan Akses |
|---|---|---|---|---|
| **Administrator HRD** | `admin` | `admin123` | **Administrator HRD** | Hak akses penuh: seluruh menu HR, penggajian, peta GPS, profil perusahaan, backup, reset data, & shift |
| **Karyawan 1** | `EMP001` atau `budi.santoso` atau `081234567890` | `password123` | **Budi Santoso** — Senior Software Engineer (IT & Digital) | Presensi GPS, selfie kamera, isi laporan kerja harian, lihat slip gaji |
| **Karyawan 2** | `EMP002` atau `siti.rahmawati` atau `081298765432` | `password123` | **Siti Rahmawati** — Operational Supervisor (Operasional) | Presensi GPS, shift pagi operasional, laporan kerja, slip gaji |
| **Karyawan 3** | `EMP003` atau `ahmad.fauzi` atau `081311223344` | `password123` | **Ahmad Fauzi** — Sales Executive (Pemasaran) | Presensi GPS, shift reguler, laporan kerja, slip gaji |
| **Karyawan 4** | `EMP004` atau `dewi.lestari` atau `081355667788` | `password123` | **Dewi Lestari** — HR Specialist (Human Resources) | Presensi GPS, shift reguler, laporan kerja, slip gaji |
| **Karyawan 5** | `EMP005` atau `hendra.wijaya` atau `081399887766` | `password123` | **Hendra Wijaya** — Site Coordinator (Konstruksi) | Presensi GPS, tugas luar / dinas lapangan, slip gaji |

> 💡 *Catatan Keamanan:*
> 1. Pada tab login Karyawan, Anda dapat memasukkan **ID Karyawan** (cth: `EMP001`), **Username** (`budi.santoso`), atau **Nomor Telepon** terdaftar dengan kata sandi `password123`.
> 2. Centang opsi **"Ingat saya selama 30 hari"** untuk mengaktifkan sesi aman berikatan hardware fingerprint.
> 3. Administrator dapat mengubah kata sandi kapan saja melalui tombol **"Ganti Password Admin"** di bilah navigasi. Mengubah kata sandi admin otomatis membatalkan seluruh sesi 30 hari lama.
> 4. Sistem mengunci percobaan login salah 5 kali berturut-turut selama 60 detik demi mencegah serangan tebak kata sandi (*anti-brute-force*).

---

## 📖 Panduan Penggunaan Lengkap (User Manual)

### A. Alur Kerja Karyawan

1. **Masuk ke Portal Karyawan**:
   - Buka aplikasi pada peramban perangkat Anda (laptop atau smartphone).
   - Klik tombol **"Buka Formulir Masuk (Login)"**.
   - Pilih tab **"Karyawan"**.
   - Masukkan ID Karyawan (contoh: `EMP001`), Username (`budi.santoso`), atau Nomor HP terdaftar.
   - Masukkan kata sandi Anda (`password123`).
   - Centang **"Ingat saya selama 30 hari"** jika menggunakan perangkat pribadi agar tidak perlu login ulang.
   - Klik **"Masuk ke Portal Karyawan"**.

2. **Melakukan Presensi Masuk (Check-In GPS & Verifikasi Selfie)**:
   - Izinkan peramban mengakses lokasi perangkat (*Allow Location*).
   - Sistem akan menghitung jarak fisik Anda ke titik koordinat kantor:
     - Radar **Hijau** (*Di Dalam Radius*): Tombol **"Check-In Sekarang"** akan menyala hijau dan siap digunakan.
     - Radar **Merah** (*Di Luar Radius*): Tombol terkunci untuk memastikan Anda berada di area kantor sah.
   - Klik **"Check-In Sekarang"**:
     - Modal **Verifikasi Foto Selfie Kamera** akan terbuka.
     - Arahkan kamera ke wajah Anda, lalu klik **"Ambil Foto & Verifikasi"**.
     - Sistem mencetak watermark nama, ID, waktu, dan koordinat GPS secara otomatis pada foto.
     - Presensi masuk berhasil tercatat.

3. **Melihat Titik Presensi di Peta GPS**:
   - Buka tab **"Peta Presensi GPS"** untuk memverifikasi titik koordinat check-in Anda pada peta geofence interaktif.

4. **Mengisi Laporan Kerja & Melakukan Presensi Pulang (Check-Out)**:
   - Saat jam kerja berakhir, klik tombol **"Check-Out Pulang"**.
   - Dialog pengisian **Laporan Pekerjaan Harian** akan muncul secara otomatis.
   - Lengkapi judul pekerjaan, poin capaian tugas hari ini, persentase progres kerja (0%–100%), dan kendala jika ada.
   - Klik **"Kirim Laporan & Check-Out"**. Presensi pulang dan titik GPS check-out berhasil dicatat.

5. **Mengunduh Slip Gaji Resmi (PDF)**:
   - Buka tab **"Slip Gaji"** pada portal karyawan.
   - Periksa rincian gaji pokok, tunjangan, lembur, dan potongan keterlambatan.
   - Klik tombol **"Unduh Slip Gaji (PDF)"** untuk mengunduh dokumen slip gaji berformat resmi dengan tanda **"Dibuat oleh heruhendri"**.

6. **Memeriksa Status Sesi 30 Hari**:
   - Klik tombol pill **"Sesi 30H Aman"** di bilah navigasi atas untuk melihat masa berlaku sesi perangkat dan memutuskan sesi jika berganti perangkat.

---

### B. Alur Kerja Administrator HRD

1. **Masuk ke Dashboard Admin**:
   - Pada modal login, pilih tab **"Admin HRD"**.
   - Masukkan Username (`admin`) dan Password (`admin123`).
   - Centang opsi **"Ingat sesi Admin selama 30 hari"** jika menggunakan laptop kantor pribadi.
   - Klik tombol **"Buka Dashboard Admin HRD"**.

2. **Memantau Karyawan Secara Real-Time (Live Dashboard)**:
   - Pilih tab **"Live Karyawan"** di menu navigasi atas.
   - Gunakan saklar **Status Monitoring** (Aktif / Nonaktif) untuk memulai sesi pemantauan.
   - Pantau status karyawan (*Sedang Bekerja*, *Di Luar Radius*, *Sudah Pulang*, *Belum Hadir*).
   - Klik tombol **"Peta GPS"** pada baris karyawan untuk melacak posisinya langsung.

3. **Menganalisis Titik Presensi pada Peta Geofence**:
   - Buka tab **"Peta Presensi GPS"**.
   - Amati persebaran pin check-in (hijau) dan check-out (biru) seluruh karyawan terhadap zona batas kantor.
   - Periksa akurasi GPS dan jarak meter pada setiap titik pencatatan.

4. **Melakukan Backup Data ke Telegram Bot & File JSON**:
   - Klik tombol **"Backup & Pulihkan"** pada bilah navigasi atas.
   - Masukkan **Bot Token** dan **Chat ID Telegram** Anda.
   - Klik tombol **"Kirim Backup ke Telegram Sekarang"** untuk mengirimkan salinan database JSON ke ruang obrolan Telegram.
   - Atau klik **"Unduh File Backup (.JSON)"** untuk menyimpan salinan cadangan ke komputer lokal.

5. **Membersihkan Data Operasional (Reset Buku Kerja Baru)**:
   - Klik tombol **"Kosongkan Data"** pada bilah navigasi atas.
   - Pilih opsi **"Hanya Data Operasional"** untuk membersihkan absensi lama dan laporan kerja tanpa menghapus karyawan.
   - Sistem menyediakan fitur auto-backup sebelum proses pembersihan dijalankan.

6. **Mengelola Profil Perusahaan & Branding Aplikasi**:
   - Buka tab **"Profil & Nama Aplikasi"** (atau tombol *Profil Perusahaan* di Navbar).
   - Sesuaikan **Nama Aplikasi**, **Slogan / Tagline**, **Nama Perusahaan (PT/CV)**, **Alamat Kantor**, **NPWP**, dan **Kontak HRD**.
   - Masukkan nama Direktur Penandatangan Dokumen dan jabatannya.
   - Unggah berkas logo perusahaan baru atau masukkan URL logo.
   - Klik **"Simpan Profil & Branding Aplikasi"**. Perubahan langsung diterapkan di navbar, slip gaji, dan laporan.

7. **Mengatur Kebijakan Kantor & Formula Lembur**:
   - Buka tab **"Kebijakan HR"**.
   - Atur koordinat kantor (*Latitude* & *Longitude*) atau klik *Deteksi Lokasi Saya*.
   - Atur batas radius presensi (misal: 100 meter).
   - Atur kelipatan lembur bertingkat serta tarif denda keterlambatan per menit.
   - Atur tanggal penutupan buku (*cut-off*) dan tanggal penggajian bulanan.

8. **Mengelola Hari Libur & Lembur Tanggal Merah**:
   - Buka tab **"Lembur Hari Libur"**.
   - Tambah tanggal merah nasional atau hari libur khusus perusahaan.
   - Tentukan kelipatan upah lembur khusus hari libur sesuai kesepakatan kerja.

9. **Meninjau & Menyetujui Laporan Kerja**:
   - Buka tab **"Laporan Kerja"**.
   - Tinjau progres capaian tugas harian karyawan serta rekomendasi pintar (*smart advisor*).
   - Berikan catatan evaluasi manajerial dan konfirmasi persetujuan jam lembur.

10. **Ekspor Laporan Resmi (PDF & Excel)**:
    - Buka tab **"Ekspor Laporan"**.
    - Pilih departemen yang diinginkan (*Semua Departemen* atau spesifik).
    - Klik **"Ekspor PDF Rekapitulasi Gaji"** untuk dokumen landscape resmi.
    - Klik **"Ekspor Excel (.XLSX) Lengkap"** untuk mendapatkan spreadsheet multi-sheet terstruktur.

11. **Mengubah Kata Sandi Administrator**:
    - Klik tombol **"Ganti Password Admin"** pada bilah navigasi atas (Navbar).
    - Masukkan kata sandi lama, username baru/tetap, dan kata sandi baru.
    - Simpan untuk memperbarui kredensial keamanan. Sesi 30 hari lama di seluruh perangkat otomatis dicabut.

---

## 💻 Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat Sistem
- **Node.js**: Versi 18.0.0 atau yang lebih baru (disarankan LTS v20+).
- **Manajer Paket**: `npm`, `pnpm`, `yarn`, atau `bun`.

### Langkah-Langkah:

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/heruhendri/presensi-penggajian-gps.git
   cd presensi-penggajian-gps
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembangan (Development Server)**:
   ```bash
   npm run dev
   ```
   *Aplikasi akan berjalan pada port `http://localhost:3000` (atau host `0.0.0.0:3000`).*

4. **Uji Validasi Kode (Linting)**:
   ```bash
   npm run lint
   ```

5. **Build untuk Rilis Produksi**:
   ```bash
   npm run build
   ```
   *Berkas hasil kompilasi siap di-hosting akan tersedia di direktori `dist/`.*

---

## 📂 Struktur Direktori Proyek

```text
├── public/
│   ├── favicon.ico                   # Ikon favicon aplikasi
│   └── screenshot.jpg                # Tangkapan layar dashboard untuk dokumentasi
├── src/
│   ├── assets/                       # File aset visual & ikon tambahan
│   ├── components/                   # Komponen Antarmuka Pengguna Modular
│   │   ├── AdminDashboard.tsx        # Pusat kendali operasional HR & penggajian
│   │   ├── AdminRecommendationCharts.tsx # Diagram rekomendasi kerja manajerial
│   │   ├── AdminWorkReportSection.tsx# Panel pengelolaan laporan kerja harian
│   │   ├── AttendanceApprovalSection.tsx # Verifikasi kehadiran khusus & dinas
│   │   ├── AttendanceCharts.tsx      # Grafik tren kehadiran mingguan karyawan
│   │   ├── AttendanceMapsDashboard.tsx # Peta interaktif check-in & check-out GPS
│   │   ├── BackupRestoreModal.tsx    # Modal cadangan Telegram Bot & ekspor/impor JSON
│   │   ├── CameraVerificationModal.tsx # Verifikasi foto selfie kamera ber-watermark
│   │   ├── ChangeAdminPasswordModal.tsx # Modal dialog ubah kata sandi admin
│   │   ├── ClearDataModal.tsx        # Pembersihan data operasional & reset sistem
│   │   ├── CompanyProfileSettings.tsx# Form pengaturan profil & branding aplikasi
│   │   ├── DeleteEmployeeModal.tsx   # Modal konfirmasi aman penghapusan karyawan
│   │   ├── EmailLogModal.tsx         # Panel riwayat pengiriman notifikasi email
│   │   ├── EmployeeModal.tsx         # Dialog tambah dan edit data karyawan
│   │   ├── EmployeePerformanceCharts.tsx # Grafik matriks performa & produktivitas
│   │   ├── EmployeePortal.tsx        # Portal presensi GPS dan slip gaji karyawan
│   │   ├── HolidayOvertimeManager.tsx# Manajemen hari libur & lembur tanggal merah
│   │   ├── LiveEmployeeDashboard.tsx # Dashboard pemantauan live kehadiran real-time
│   │   ├── LoginModal.tsx            # Modal otentikasi login multi-identifier & rate limit
│   │   ├── Navbar.tsx                # Bilah navigasi universal, drawer menu & status sesi
│   │   ├── NotificationCenter.tsx    # Panel notifikasi push sistem
│   │   ├── RemoteAttendanceModal.tsx # Pengajuan absensi tugas luar / WFH
│   │   ├── SecureSessionModal.tsx    # Pusat manajemen & audit sesi aman 30 hari
│   │   ├── ShiftManagementModal.tsx  # Pengaturan jam kerja dan pergantian shift
│   │   ├── SpreadsheetSyncModal.tsx  # Dialog konfigurasi integrasi Google Sheets
│   │   ├── TemporaryDutyModal.tsx    # Penugasan dinas sementara & proyek cabang
│   │   ├── WorkReportModal.tsx       # Dialog pengisian laporan kerja sebelum check-out
│   │   └── WorkReportReviewModal.tsx # Dialog peninjauan laporan kerja oleh supervisor
│   ├── data/
│   │   ├── indonesianCities.ts       # Referensi daftar kota di Indonesia
│   │   └── mockData.ts               # Data awal karyawan, kebijakan kantor, & log
│   ├── utils/                        # Logika Bisnis & Perhitungan Inti
│   │   ├── cameraWatermark.ts        # Generator watermark digital pada foto kamera
│   │   ├── emailNotifier.ts          # Layanan pengiriman notifikasi email
│   │   ├── employeeUtils.ts          # Utilitas pencarian & pemfilteran karyawan
│   │   ├── exportExcel.ts            # Generator berkas spreadsheet Excel (.xlsx)
│   │   ├── exportPdf.ts              # Generator dokumen slip gaji & rekapitulasi PDF
│   │   ├── geo.ts                    # Kalkulasi jarak Geodesi formula Haversine
│   │   ├── holidays.ts               # Basis data hari libur nasional Indonesia
│   │   ├── payroll.ts                # Mesin kalkulasi lembur & gaji bersih (THP)
│   │   ├── secureSession.ts          # Kriptografi SHA-256, fingerprint & rate-limit
│   │   ├── sheetsSync.ts             # Logika sinkronisasi database Google Sheets
│   │   ├── telegramBackup.ts         # Integrasi pengiriman berkas cadangan Telegram Bot
│   │   └── workReportAdvisor.ts      # Mesin analisis & pemberi rekomendasi kerja
│   ├── App.tsx                       # Titik simpul utama aplikasi & manajemen status
│   ├── index.css                     # Gaya global Tailwind CSS
│   ├── main.tsx                      # Titik masuk rendering React DOM
│   └── types.ts                      # Deklarasi antarmuka TypeScript terpusat
├── index.html                        # Berkas HTML utama dengan metadata author heruhendri
├── metadata.json                     # Konfigurasi perizinan sensor Geolocation GPS & kamera
├── package.json                      # Daftar pustaka dependensi & skrip eksekusi
├── tsconfig.json                     # Konfigurasi kompilasi TypeScript
└── README.md                         # Dokumentasi lengkap sistem
```

---

## 🔒 Regulasi & Kepatuhan Perhitungan Gaji

Aplikasi ini mengacu pada regulasi ketenagakerjaan Republik Indonesia:
1. **Perhitungan Upah Lembur Per Jam**: `1 / 173 x Upah Sebulan (Gaji Pokok + Tunjangan Tetap)`.
2. **Kelipatan Lembur Hari Kerja Biasa**:
   - 1 jam pertama: **1.5x upah per jam**.
   - Jam ke-2 dan seterusnya: **2.0x upah per jam**.
3. **Lembur Hari Istirahat Mingguan / Hari Libur Resmi**:
   - Dihitung berjenjang dengan kelipatan **2.0x hingga 4.0x upah per jam** sesuai ketentuan PP No. 35 Tahun 2021.
4. **Potongan Keterlambatan**: Dihitung secara proporsional per menit keterlambatan melewati batas toleransi resmi.

---

## 🛡️ Lisensi & Hak Cipta

Aplikasi ini dikonsep, dirancang, dan dikembangkan secara eksklusif oleh **heruhendri**.

Hak Cipta © 2026 **heruhendri**. Seluruh hak dilindungi undang-undang (*All rights reserved*).  
Dilarang menghapus atau mengubah atribusi nama pembuat (*watermark*) pada antarmuka aplikasi, dokumen slip gaji PDF, dan berkas Excel hasil ekspor.

---

<p align="center">
  <b>✨ Dikembangkan dengan ketelitian dan dedikasi oleh heruhendri ✨</b><br>
  <i>Solusi Cerdas Manajemen Presensi Geolocation GPS, Keamanan Sesi Kriptografis, & Penggajian Karyawan Terpadu</i>
</p>
