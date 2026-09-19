# 🏢 Sistem Presensi & Penggajian Karyawan GPS Real-Time

> **Aplikasi Human Resource Management (HRM) modern berbasis Web dengan verifikasi lokasi GPS, kalkulasi lembur otomatis bertingkat, estimasi gaji real-time, laporan kerja manajerial, sinkronisasi spreadsheet, dan ekspor dokumen PDF/Excel.**
>
> ⚡ **Dibuat oleh: heruhendri**

---

[![Dibuat Oleh](https://img.shields.io/badge/Dibuat%20Oleh-heruhendri-10b981?style=for-the-badge)](https://github.com/)
[![React Version](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38b2ac?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📸 Tangkapan Layar Aplikasi (Screenshots)

![Tampilan Dashboard Aplikasi Presensi & Penggajian GPS](./public/screenshot.jpg)

*Antarmuka modern dengan mode gelap elegan, pemantauan radius GPS real-time, grafik analitik kehadiran, dan kalkulasi gaji otomatis.*

---

## 🌟 Tentang Proyek

Aplikasi **Sistem Presensi & Penggajian GPS** dibangun untuk menjawab kebutuhan perusahaan, instansi, dan UMKM dalam mengelola kehadiran karyawan secara presisi tanpa perlu mesin fingerprint fisik yang mahal.

Dilengkapi dengan validasi koordinat GPS dan radius kantor, sistem ini memastikan karyawan hanya dapat melakukan *check-in* saat benar-benar berada di lokasi kerja. Selain itu, sistem secara otomatis menghitung upah lembur bertingkat sesuai regulasi ketenagakerjaan, menghitung potongan keterlambatan per menit, menyediakan sistem pelaporan pekerjaan harian (daily work report), dan memungkinkan pencetakan slip gaji resmi sekali klik.

Seluruh elemen antarmuka, laporan PDF, dan workbook Excel dilengkapi watermark resmi: **"Dibuat oleh heruhendri"**.

---

## 🚀 Fitur Unggulan (Feature List)

### 1. 📍 Presensi Geolocation GPS Presisi
- **Geofencing Kantor**: Verifikasi otomatis jarak karyawan ke kantor menggunakan formula *Haversine Geodetic Distance*.
- **Radius Fleksibel**: Batas radius kantor (misal: 100 meter) dapat disesuaikan langsung dari dashboard admin.
- **Peta & Koordinat Real-Time**: Tampilan koordinat lintang/bujur (*latitude* & *longitude*) beserta indikator status GPS (Dalam Radius / Luar Radius).
- **Anti-Kecurangan**: Tombol check-in otomatis dinonaktifkan jika karyawan terdeteksi di luar radius lokasi resmi.

### 2. ⏱️ Kalkulasi Lembur Bertingkat (Tiered Overtime Engine)
- **Aturan Lembur Sesuai UU Ketenagakerjaan**:
  - Jam ke-1: Pengali **1.5x** upah per jam.
  - Jam ke-2 dan seterusnya: Pengali **2.0x** upah per jam.
- **Kustomisasi Multiplier**: Administrator dapat menambah atau memodifikasi tier kelipatan lembur sesuai kebijakan internal perusahaan.
- **Formula Pembagi Fleksibel**: Standar pembagi jam kerja bulanan (default: **173**) dapat dikonfigurasi.
- **Workflow Persetujuan Lembur**: Admin/Supervisor dapat meninjau dan menyetujui (*approve*) atau menolak lembur karyawan.

### 3. 💰 Estimasi Gaji Real-Time (Take Home Pay)
- **Komponen Penghasilan Terinci**:
  - Gaji Pokok (*Basic Salary*).
  - Tunjangan Tetap / Jabatan.
  - Uang Transport & Makan Harian (dihitung proporsional berdasarkan hari kehadiran).
  - Upah Lembur terverifikasi.
- **Komponen Potongan Otomatis**:
  - Denda keterlambatan berbasis menit (misal: Rp 1.000 / menit terlambat).
  - Potongan absensi/mangkir.
- **Pratinjau Slip Gaji Karyawan**: Karyawan dapat melihat proyeksi pendapatan dan rincian slip gaji mereka secara langsung.

### 4. 📝 Laporan Pekerjaan Harian (Work Report System)
- **Kewajiban Laporan Sebelum Check-Out**: Karyawan (khususnya tingkat Supervisor/Manager) diarahkan mengisi ringkasan pekerjaan harian sebelum menyelesaikan absensi pulang.
- **Metrik Pencapaian Kerja**: Menyertakan persentase progres harian, daftar tugas selesai, dan kendala lapangan.
- **Persetujuan Manajerial**: Admin dapat memverifikasi laporan kerja dan memberikan catatan evaluasi.

### 5. 📅 Manajemen Multi-Shift & Jam Kerja Kustom
- **Dukungan Shift Fleksibel**:
  - Shift Pagi (08:00 - 17:00).
  - Shift Siang (13:00 - 21:00).
  - Shift Malam (21:00 - 06:00).
- **Penetapan Shift Per Karyawan**: Setiap karyawan dapat ditugaskan ke shift berbeda sesuai jadwal operasional.
- **Toleransi Keterlambatan**: Admin dapat mengatur batas toleransi keterlambatan (misal: 15 menit).

### 6. 📄 Ekspor Dokumen Resmi (PDF & Excel XLSX)
- **Slip Gaji Karyawan (PDF)**:
  - Format dokumen resmi (*confidential*) lengkap dengan kop surat perusahaan.
  - Tabel rincian penghasilan (*Earnings*) dan potongan (*Deductions*).
  - Watermark resmi pengembang: **Dibuat oleh heruhendri**.
- **Laporan Rekapitulasi Gaji Departemen (PDF Landscape)**:
  - Rekap lengkap seluruh karyawan per divisi/departemen dengan total *Take Home Pay*.
- **Workbook Spreadsheet Excel (XLSX)**:
  - Multi-sheet: `Rekap Penggajian`, `Log Presensi GPS`, `Master Karyawan`, dan `Info Sistem`.

### 7. 🔴 Dashboard Live Monitoring Karyawan (Dapat Diaktifkan & Dinonaktifkan)
- **Saklar Monitoring Interaktif**: Administrator dapat menyalakan atau mematikan pemantauan live sesuai kebutuhan operasional (status saklar tersimpan rapi di *localStorage*).
- **Status Kehadiran Real-Time**:
  - 🟢 **Sedang Bekerja**: Karyawan yang telah check-in dan berada dalam batas geofence aman.
  - 🔴 **Di Luar Radius**: Karyawan yang check-in di luar radius kantor resmi.
  - 🔵 **Sudah Selesai**: Karyawan yang telah check-out hari ini.
  - ⚪ **Belum Hadir**: Karyawan yang belum melakukan absensi.
- **Kontrol Status Keaktifan (Active/Inactive Toggle)**: Kemudahan menonaktifkan atau mengaktifkan kembali akun/status karyawan kapan saja hanya dengan satu klik.
- **Aksi Cepat & Kirim Peringatan**: Kirim pesan push langsung ke karyawan atau buka posisi GPS mereka di peta satelit.

### 8. 🗺️ Dashboard Peta Presensi GPS (Check-in & Check-out Maps)
- **Peta Interaktif Geofencing**: Memvisualisasikan pusat koordinat kantor beserta lingkaran batas radius kerja (*geofence zone*) secara visual.
- **Pin Lokasi Check-In & Check-Out**: Setiap titik koordinat presensi dipetakan dengan akurat, membedakan lokasi saat mulai bekerja dan saat selesai shift.
- **Detail Analitik Koordinat**: Informasi lengkap mengenai jarak meter ke kantor, akurasi GPS perangkat, waktu pencatatan, dan tombol langsung ke Google Maps koordinat eksternal.
- **Kontrol Peta Lengkap**: Tombol perbesar (*zoom in*), perkecil (*zoom out*), atur ulang tampilan (*reset view*), dan pemilih fokus per karyawan.
- **Tersedia untuk Admin & Karyawan**: Baik Administrator maupun Karyawan dapat mengakses visualisasi peta presensi ini di portal masing-masing.

### 9. 🔄 Integrasi Database Google Sheets
- **Sinkronisasi Dua Arah**: Sinkronkan log presensi, data lembur, dan rekapitulasi gaji langsung ke Google Sheets.
- **Webhook & Spreadsheet URL**: Konfigurasi ID Spreadsheet dan URL Web App Google Apps Script langsung di dashboard.

### 10. 🔔 Notifikasi Push & Log Email Peringatan
- **Pusat Pemberitahuan (Notification Center)**: Notifikasi perubahan jadwal shift, persetujuan lembur, dan status presensi.
- **Log Notifikasi Email**: Riwayat pengiriman peringatan absensi dan slip gaji ke email karyawan dan admin.

### 11. 🔐 Keamanan, Manajemen Sesi & Ganti Password Admin
- **Kebijakan No Auto-Login**: Aplikasi memulai sesi dalam keadaan aman/terkunci saat dibuka atau di-refresh.
- **Modal Ganti Password Administrator**: Admin dapat mengubah username dan password admin secara langsung dengan validasi password lama dan verifikasi konfirmasi.
- **Pemisahan Peran (RBAC)**: Pemisahan hak akses yang tegas antara Administrator HRD dan Karyawan.

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

| Bagian | Teknologi | Keterangan |
|---|---|---|
| **Frontend Framework** | React 19 | Komponen berbasis fungsi, Hooks, dan render berkecepatan tinggi |
| **Bahasa Pemrograman** | TypeScript 5.0 | *Strict type-safety* untuk pencegahan bug runtime |
| **Build Tool** | Vite 6.0 | *Lightning fast bundling* & development server |
| **Styling** | Tailwind CSS 4.0 | Utility-first CSS modern dengan responsivitas mobile & desktop |
| **Ikonografi** | Lucide React | Koleksi ikon vektor konsisten dan elegan |
| **Pembuatan PDF** | jsPDF & jsPDF-AutoTable | Render dokumen slip gaji dan rekapitulasi PDF |
| **Ekspor Spreadsheet** | SheetJS (xlsx) | Pembuatan file Excel (.xlsx) multi-sheet tanpa server eksternal |
| **Visualisasi Data** | Recharts | Grafik tren kehadiran mingguan dan perbandingan departemen |
| **Geolokasi** | HTML5 Geolocation API | Pengambilan koordinat GPS perangkat real-time |

---

## 📖 Panduan Penggunaan Detail (Step-by-Step Guide)

### 1. Masuk ke Aplikasi (Login)
1. Buka aplikasi di peramban (browser).
2. Tampilan awal akan menyajikan status terkunci yang aman. Klik tombol **"Buka Formulir Masuk (Login)"**.
3. Pilih salah satu tab login:
   - **Tab Karyawan**: Pilih nama karyawan yang tersedia (misalnya: *Budi Santoso*, *Siti Rahma*, atau *Ahmad Fauzi*).
   - **Tab Admin HRD**: Masukkan username admin (`admin`) dan password admin (`admin123`).
4. Klik **"Masuk Sekarang"** atau **"Buka Dashboard Admin HRD"**.

### 2. Melakukan Presensi Masuk (Check-In GPS)
1. Setelah login sebagai Karyawan, berikan izin akses lokasi (*Allow Location Access*) saat diminta oleh peramban.
2. Perhatikan panel **Validasi Lokasi GPS**:
   - Jika lingkaran radar berwarna **Hijau** (status: *Di Dalam Radius*), tombol **"Check-In Sekarang"** akan aktif.
   - Jika lingkaran radar berwarna **Merah/Kuning** (status: *Di Luar Radius*), Anda perlu mendekat ke area kantor.
3. Klik **"Check-In Sekarang"** untuk mencatat waktu masuk dan koordinat GPS Anda.

### 3. Mengisi Laporan Kerja & Presensi Pulang (Check-Out)
1. Saat jam kerja berakhir, klik tombol **"Check-Out Pulang"**.
2. Sistem akan menampilkan dialog konfirmasi pengisian **Laporan Pekerjaan Harian**.
3. Klik **"Isi Laporan Sekarang"** dan lengkapi:
   - Judul Laporan & Rangkuman Kegiatan.
   - Progres Pekerjaan (0% - 100%).
   - Masalah atau kendala yang dihadapi (opsional).
4. Klik **"Kirim Laporan & Check-Out"**. Status kehadiran dan jam kerja Anda akan langsung diperbarui.

### 4. Menggunakan Dashboard Live Karyawan (Admin)
1. Masuk sebagai **Admin HRD** dan klik tab **"Live Karyawan"** (ikon radar merah/hijau).
2. Gunakan saklar toggle **"Status Monitoring: AKTIF / NONAKTIF"** di pojok kanan atas untuk mengontrol pemantauan real-time sesuai jam operasional.
3. Pantau status karyawan secara instan: *Sedang Bekerja*, *Di Luar Radius*, *Sudah Pulang*, dan *Belum Hadir*.
4. Klik saklar **"Aktif / Nonaktif"** pada baris karyawan untuk mengaktifkan atau menonaktifkan status kepegawaian kapan pun diperlukan.
5. Klik tombol **"Peta GPS"** pada karyawan untuk langsung membuka lokasi presensinya di peta visual.

### 5. Menggunakan Dashboard Peta Presensi GPS (Check-In & Check-Out Maps)
1. Buka tab **"Peta Presensi GPS"** (tersedia di Admin Dashboard maupun Portal Karyawan).
2. Amati visualisasi kantor dan lingkaran batas radius (*geofence zone*) berwarna hijau.
3. Periksa titik koordinat:
   - **Pin Hijau**: Titik koordinat saat karyawan melakukan Check-In masuk.
   - **Pin Biru / Oranye**: Titik koordinat saat karyawan melakukan Check-Out pulang.
4. Klik pin atau pilih nama karyawan di panel daftar untuk membaca koordinat lintang/bujur, jarak aktual ke kantor, akurasi GPS, dan membuka tautan langsung ke Google Maps satelit.
5. Gunakan kontrol zoom `+` / `-` serta tombol *Center Office* untuk navigasi visual yang nyaman.

### 6. Mengubah Password Admin (Administrator)
1. Masuk sebagai **Admin HRD**.
2. Pada bilah navigasi atas (Navbar), klik tombol **"Ganti Password Admin"** (ikon kunci).
3. Masukkan:
   - Password Admin Saat Ini.
   - Username Admin Baru (atau biarkan yang lama).
   - Password Admin Baru (minimal 6 karakter).
   - Konfirmasi Password Baru.
4. Klik **"Simpan Password Baru"**. Kredensial baru akan langsung tersimpan dan aktif untuk login berikutnya.

### 5. Mengatur Konfigurasi Kantor & Formula Lembur
1. Masuk sebagai **Admin HRD** dan buka tab **"Kebijakan & Lembur"**.
2. Anda dapat mengubah:
   - **Nama & Alamat Kantor**: Muncul pada kop surat dan slip gaji.
   - **Koordinat Latitude & Longitude Kantor**: Klik tombol *Deteksi Lokasi Saya* jika sedang berada di kantor.
   - **Radius Presensi Kantor**: Misal 50m, 100m, atau 200m.
   - **Kelipatan Lembur Bertingkat**: Tambah/ubah multiplier jam ke-1, jam ke-2, dll.
   - **Tarif Denda Keterlambatan**: Nominal potongan per menit keterlambatan.
3. Klik **"Simpan Perubahan Kebijakan"**.

### 6. Menyetujui Laporan Kerja & Lembur Karyawan
1. Masuk ke tab **"Laporan Kerja"** di dashboard admin.
2. Tinjau laporan harian yang dikirim oleh karyawan.
3. Klik tombol **"Setujui"** atau **"Review"** untuk menyetujui jam lembur yang diajukan.

### 7. Mengunduh Slip Gaji & Rekapitulasi (PDF & Excel)
- **Bagi Karyawan**: Buka tab *Slip Gaji* di portal karyawan, lalu klik **"Download PDF Slip Gaji"**.
- **Bagi Admin**:
  - Buka tab **"Ekspor Laporan"** di Dashboard Admin.
  - Pilih Departemen (Semua Departemen, IT & Engineering, Keuangan, dsb).
  - Klik **"Ekspor PDF Rekapitulasi Gaji"** untuk laporan cetak landscape resmi.
  - Klik **"Ekspor Excel (.XLSX) Lengkap"** untuk file spreadsheet multi-sheet.

---

## 💻 Panduan Instalasi Lokal (Getting Started)

### Prasyarat:
- [Node.js](https://nodejs.org/) versi 18.0.0 atau yang lebih baru.
- Manajer paket: `npm`, `yarn`, `pnpm`, atau `bun`.

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

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```

4. **Buka di Browser**:
   Akses `http://localhost:3000` pada peramban Anda.

5. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 📂 Struktur Direktori Proyek

```text
├── public/
│   ├── screenshot.jpg          # Tangkapan layar aplikasi untuk dokumentasi
│   └── favicon.ico             # Ikon aplikasi
├── src/
│   ├── assets/                 # Aset gambar & ilustrasi
│   ├── components/             # Komponen UI Modular
│   │   ├── AdminDashboard.tsx  # Pusat kendali HRD, penggajian, dan kebijakan
│   │   ├── EmployeePortal.tsx  # Portal presensi GPS dan slip gaji karyawan
│   │   ├── Navbar.tsx          # Bilah navigasi universal & drawer menu
│   │   ├── LoginModal.tsx      # Dialog otentikasi Karyawan & Admin
│   │   ├── ChangeAdminPasswordModal.tsx # Dialog ubah password admin
│   │   ├── WorkReportModal.tsx # Dialog pengisian laporan kerja harian
│   │   ├── WorkReportReviewModal.tsx # Dialog review laporan oleh admin
│   │   ├── ShiftManagementModal.tsx # Pengaturan shift kerja
│   │   ├── SpreadsheetSyncModal.tsx # Konfigurasi Google Sheets
│   │   ├── NotificationCenter.tsx # Panel notifikasi push
│   │   ├── EmailLogModal.tsx   # Panel riwayat notifikasi email
│   │   ├── AttendanceCharts.tsx # Visualisasi grafik absensi
│   │   └── EmployeePerformanceCharts.tsx # Visualisasi analitik performa
│   ├── utils/                  # Logika Bisnis & Helper
│   │   ├── payroll.ts          # Formula lembur & kalkulasi take home pay
│   │   ├── exportPdf.ts        # Generator slip gaji & rekap PDF
│   │   └── exportExcel.ts      # Generator workbook Excel (.xlsx)
│   ├── types.ts                # Deklarasi antarmuka & tipe data TypeScript
│   ├── App.tsx                 # Komponen utama & router status sesi
│   ├── main.tsx                # Titik masuk aplikasi React
│   └── index.css               # Konfigurasi Tailwind CSS
├── index.html                  # HTML entry point dengan metadata author heruhendri
├── metadata.json               # Metadata aplikasi & izin GPS
├── package.json                # Dependensi & script proyek
├── tsconfig.json               # Konfigurasi compiler TypeScript
└── README.md                   # Dokumentasi lengkap proyek
```

---

## 🏷️ Kredensial Default untuk Pengujian

| Peran | Username / ID | Password | Keterangan |
|---|---|---|---|
| **Admin HRD** | `admin` | `admin123` | Akses penuh dashboard, kebijakan, penggajian, & ganti password |
| **Karyawan 1** | `EMP-001` (Budi Santoso) | *(Pilih nama di tab Karyawan)* | Software Engineer (IT & Engineering) |
| **Karyawan 2** | `EMP-002` (Siti Rahma) | *(Pilih nama di tab Karyawan)* | Finance Officer (Keuangan) |
| **Karyawan 3** | `EMP-003` (Ahmad Fauzi) | *(Pilih nama di tab Karyawan)* | Sales Supervisor (Pemasaran & Penjualan) |
| **Karyawan 4** | `EMP-004` (Dewi Lestari) | *(Pilih nama di tab Karyawan)* | HR Specialist (Human Resources) |

---

## 🛡️ Lisensi & Hak Cipta

Proyek ini dirancang, dikembangkan, dan dipelihara oleh **heruhendri**.

Hak Cipta © 2026 **heruhendri**. Dilindungi oleh undang-undang.
Dipersilakan untuk digunakan, dipelajari, dan dikembangkan lebih lanjut dengan tetap menyertakan atribusi nama pembuat asli.

---

<p align="center">
  <b>✨ Dibuat dengan dedikasi oleh heruhendri ✨</b><br>
  <i>Sistem Presensi GPS & Penggajian Karyawan Real-Time</i>
</p>
