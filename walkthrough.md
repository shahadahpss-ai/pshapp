h# Walkthrough: Portal PSH & SabahGrade

Di dalam workspace anda, terdapat dua aplikasi web premium berestetika tinggi yang dibina menggunakan prinsip reka bentuk terperinci:

---

## 1. Halaman Utama Portal PSH JMSK (Kemas Kini Peranan)
Portal maklumat, pendaftaran, dan laporan kursus Pembelajaran Sepanjang Hayat (PSH) yang dianjurkan oleh **Jabatan Matematik, Sains & Komputer (JMSK)**.

- **Alamat Localhost:** **[http://localhost:8080/](http://localhost:8080/)**
- **Fail Utama (di bawah folder `/psh-app/`):**
  * HTML: [index.html](file:///c:/Users/norshahadah/Desktop/CPCM29060107/psh-app/index.html)
  * CSS: [style.css](file:///c:/Users/norshahadah/Desktop/CPCM29060107/psh-app/style.css)
  * JS Logik: [app.js](file:///c:/Users/norshahadah/Desktop/CPCM29060107/psh-app/app.js)
  * Database: [pshData.js](file:///c:/Users/norshahadah/Desktop/CPCM29060107/psh-app/pshData.js)

---

## Ciri-Ciri Utama Portal PSH JMSK Baharu

### A. Reka Bentuk Pinterest Design & Emerald JMSK (`#00875A`)
* **Aesthetics Corporate Emerald:** Rona hijau zamrud korporat jabatan sebagai identiti rasmi bagi tajuk aktif dan butang primer.
* **Bucu Membulat Tinggi (Radius 24px):** Kad maklumat, borang pendaftaran modal, dan bingkai imej direka bulat secara elegan.
* **Kesan Hover Dinamik:** Setiap gambar galeri dan kad kursus membesar sedikit (*scale on hover*) dengan bayangan yang lancar.

### B. Halaman Log Masuk Bersepadu (Landing Screen)
* **Log Masuk Pengguna:** Menggunakan Nombor Kad Pengenalan peserta (12 digit, cth: `080412125131`). Tiada password diperlukan.
* **Log Masuk Urusetia:** Username: `urusetia` / Password: `urusetia123`.
* **Log Masuk Admin:** Username: `admin` / Password: `admin123`.

### C. Workspace Pengguna (User Flow)
* **Pengasingan Bulan Tawaran (Page Kursus):** Kad-kad kursus diasingkan secara automatik mengikut Bulan Tawaran (cth: *Bulan Julai 2026, Bulan Ogos 2026*) lengkap dengan tajuk pembahagi bulanan yang bersih bagi penyusunan kronologi.
* **Pendaftaran Kursus & Muat Naik Resit:** Peserta mendaftar dengan memuat naik resit yuran RM10.00 mereka (format PDF, PNG, atau JPG) yang disimpan terus sebagai Base64 di `localStorage`.
* **Sejarah Saya:** Tab peribadi untuk membolehkan peserta melihat senarai kursus yang didaftar serta meneliti/memuat turun semula resit bayaran yang dihantar.

### D. Panel Urusetia (Secretariat Flow)
* **Pendaftaran Peserta (Sub-Tab Bulan & Kursus):** Mengasingkan pendaftaran peserta mengikut kursus spesifik yang dikelompokkan mengikut bulan pelaksanaan.
* **Ringkasan Paparan Utama (Urusetia):** Sebaik sahaja log masuk, paparan utama urusetia merumuskan bilangan kursus yang belum dilaksanakan, jumlah kehadiran peserta bagi kursus yang telah laksana, dan jumlah keseluruhan kutipan yuran yang diperoleh setakat hari ini.
* **Kutipan Yuran:** Memaparkan secara dinamik hasil yuran terkumpul bagi setiap sub-tab kursus terpilih.
* **Laporan Pelaksanaan PSH:**
  * Memaparkan status pelaksanaan setiap kursus (*Belum Dilaksanakan / Telah Dilaksanakan*).
  * **Nyahaktif Butang Tulis Laporan:** Sekiranya kursus berstatus *"Belum Dilaksanakan"*, butang *"Tulis Laporan"* dinyahaktifkan secara visual (berwarna kelabu & tidak boleh diklik). Urusetia perlu menekan butang *"Sahkan Kursus Telah Dilaksanakan"* terlebih dahulu untuk membuka kunci butang laporan.
  * Urusetia boleh mengisi ulasan laporan rasmi: *Ringkasan Aktiviti, Maklum Balas Peserta, dan Cadangan Penambahbaikan*.
  * Butang **Cetak Laporan** menjana dokumen rasmi laporan PSH dengan format surat pekeliling lengkap untuk tujuan tandatangan Ketua Jabatan JMSK.

### E. Panel Pentadbir (Admin Master Dashboard)
* **Dashboard Sistem (Admin):** Halaman read-only khusus untuk admin memantau metrik keseluruhan sistem (jumlah kursus, peserta, dan laporan selesai).
* **Selenggara Sistem (Reset Database):** Admin mempunyai kawalan khas untuk menetapkan semula pangkalan data sistem PSH kepada tetapan contoh asal (reset cache localStorage).
* **Senarai Kursus (Read-Only):** Admin boleh melihat semua tawaran kursus JMSK berserta statusnya tanpa kebenaran untuk melakukan sebarang perubahan CRUD.

### F. Urus Rekod Kursus (Hanya Urusetia)
* **Tambah, Edit, & Padam Kursus:** Fungsi CRUD penuh bagi menambah, mengedit, atau memadam kursus JMSK kini dipindahkan sepenuhnya ke bawah peranan **Urusetia** sahaja. Tab *"Urus Rekod Kursus"* hanya wujud apabila log masuk sebagai Urusetia.

### G. Integrasi MySQL Database & Penyediaan PHP Backend
Sistem kini dilengkapi dengan sokongan pangkalan data MySQL berstruktur penuh berserta ciri fallback LocalStorage hibrid yang canggih:
* **Skema Pangkalan Data (`database.sql`):** Mengandungi struktur jadual `courses`, `registrations`, dan `gallery` berserta kunci asing (`FOREIGN KEY`) dan data contoh (seed data) yang dioptimumkan.
* **PHP API Backend (`api.php`):** API berasaskan PHP yang digunakan untuk menyambungkan frontend JavaScript kepada pangkalan data MySQL XAMPP.
* **Mod Fallback Pintar (Dual-Mode):**
  * **Mod MySQL:** Jika MySQL Server aktif dan disambungkan ke backend, lencana hijau `Mod: MySQL Database` dipaparkan di sidebar, dan data disimpan/dibaca secara terus daripada database MySQL.
  * **Mod LocalStorage:** Jika MySQL Server offline atau server ditutup, sistem secara automatik beralih ke mod penyimpanan pelayar lokal dengan lencana jingga `Mod: LocalStorage` tanpa merosakkan kefungsian aplikasi.

### H. Pemasangan & Pendeployan Ke XAMPP
Portal PSH JMSK telah dideploy secara penuh ke dalam direktori web root XAMPP:
* **Folder Destinasi:** [pshapp di C:/xampp/htdocs](file:///C:/xampp/htdocs/pshapp)
* **Akses Laman Web:** Portal kini boleh diakses secara langsung melalui pelayan Apache XAMPP anda di URL: **http://localhost/pshapp/**

### I. Pendaftaran Akaun Pengguna (Sign Up / Register)
Sistem pendaftaran akaun login baharu telah diintegrasikan sebelum masuk ke paparan pengguna:
* **Aliran Pengguna (User Flow):**
  1. Pengguna melawat halaman log masuk. Di bawah tab *"Pengguna"*, pautan *"Belum mempunyai akaun? Daftar Akaun Baru"* disediakan.
  2. Mengklik pautan tersebut akan memaparkan **Borang Pendaftaran Akaun** (Nama Penuh, No. KP, No. Telefon, Emel, dan Kata Laluan).
  3. Setelah pendaftaran dihantar, akaun disimpan ke MySQL (atau LocalStorage) dan sistem kembali ke borang log masuk dengan mengisi medan No. KP dan kata laluan secara automatik.
  4. Pengguna boleh log masuk dengan selamat.
* **Integrasi Data CSV:** Kesemua 50 orang pelajar daripada fail `senarai_pelajar_sabah.csv` telah diimport ke dalam pangkalan data MySQL sebagai akaun berdaftar dengan kata laluan lalai (default password) **`user123`** untuk memudahkan sesi ujian.

### K. Tetapan Semula Kata Laluan 2-Langkah (Forgot Password Wizard)
Proses penukaran kata laluan telah dipisahkan secara fizikal kepada dua skrin/langkah yang berbeza bagi memberikan aliran penggunaan yang jelas dan selamat:
* **Langkah 1: Skrin Pengesahan Maklumat Diri (`#forgot-verify-form`)**
  * Pengguna memasukkan **Nombor Kad Pengenalan**, **Nombor Telefon**, dan **Alamat Emel** yang berdaftar.
  * Sistem akan menyemak padanan rekod ini di dalam database (MySQL / LocalStorage). Jika sepadan, sistem akan beralih ke Langkah 2.
* **Langkah 2: Skrin Tukar Kata Laluan Baharu (`#forgot-reset-form`)**
  * Skrin berasingan ini dipaparkan khas untuk meminta pengguna memasukkan **Kata Laluan Baharu** dan **Sahkan Kata Laluan Baharu**.
  * Ini membezakan dengan jelas proses pengesahan maklumat lama dan proses penetapan kata laluan baharu.
* **Tangkapan Skrin Ujian & Pendedahan:**
  * **Langkah 2 (Cipta Kata Laluan Baharu):** ![Step 2 Form](C:\Users\norshahadah\.gemini\antigravity-ide\brain\55abbdef-8296-4330-817f-e2c56dfcdb1d\step2_verify_1782859382121.png)
  * **Workspace Berjaya Masuk:** ![Workspace Loaded](C:\Users\norshahadah\.gemini\antigravity-ide\brain\55abbdef-8296-4330-817f-e2c56dfcdb1d\workspace_loaded_1782859415753.png)

### L. Penilaian Kursus PSH (Course Evaluation Flow)
Pengguna kini boleh memberikan maklum balas dan penarafan bagi kursus yang telah mereka sertai:
* **Tab Navigasi Khusus (Penilaian Kursus):** Satu tab khusus bertajuk **"Penilaian Kursus"** kini ditambahkan terus pada bar menu tepi (*sidebar menu*) peserta. Tab ini menyenaraikan semua kursus yang disertai oleh peserta berserta indikator status penilaian sama ada **"Belum Dinilai"** (merah) atau **"Telah Dinilai"** (hijau).
* **Butang Tindakan Penilaian:** Di tab *Sejarah Pendaftaran* peribadi pengguna dan tab *Penilaian Kursus*, terdapat butang **"Penilaian Kursus 📋"** atau **"Beri Penilaian 📋"** bagi setiap kursus berdaftar.
* **Modal Penilaian Kursus:** Mengklik butang ini akan memaparkan modal penilaian interaktif untuk mengumpul skor bagi 3 komponen (Penceramah, Kandungan, dan Fasiliti) menggunakan sistem penarafan bintang (1-5 ⭐) berserta satu ulasan bertulis bebas.
* **Status "Dinilai" & "Selesai Dinilai":** Setelah penilaian dihantar, data direkodkan ke MySQL (atau LocalStorage) dan butang bertukar kepada label **"✓ Dinilai"** atau **"✓ Selesai Dinilai"** (berstatus kelabu/hijau & dinyahaktifkan) untuk mengelakkan penilaian berulang.
* **Tangkapan Skrin Ujian & Pendedahan:**
  * **Modal Penilaian Terbuka:** ![Modal Penilaian](C:\Users\norshahadah\.gemini\antigravity-ide\brain\55abbdef-8296-4330-817f-e2c56dfcdb1d\evaluation_modal_open_1782860014658.png)
  * **Penilaian Selesai Dihantar:** ![Penilaian Selesai](C:\Users\norshahadah\.gemini\antigravity-ide\brain\55abbdef-8296-4330-817f-e2c56dfcdb1d\evaluation_submitted_1782860076523.png)

### M. Integrasi Sub-Menu Penyelaras ULPL pada Sidebar Navigasi
Pilihan navigasi baharu kini diposisikan secara tersusun terus di bawah menu tepi (*sidebar navigation menu*) Penyelaras ULPL sebagai sub-menu bertapis:
* **Dashboard Utama:** Pautan navigasi induk untuk memaparkan statistik ringkasan dan kad selenggara sistem.
* **📚 Senarai Kursus:** Pautan sub-menu untuk membuka senarai penuh penawaran kursus JMSK berserta status.
* **👤 Urusetia Kursus:** Pautan sub-menu untuk menyemak senarai tugasan pegawai urusetia dan status laporan.
* **📊 Analisis Kursus:** Pautan sub-menu untuk memaparkan purata penilaian kursus (Penceramah, Kandungan, Fasiliti) yang dikira secara masa-nyata (*real-time*) daripada data undian peserta.

---

## 3. Sistem Tempahan Peralatan & Kemudahan Sukan (PoliSport Book)
Satu sistem tempahan peralatan sukan dan kemudahan gelanggang atas talian yang dibina khusus untuk **Jabatan Sukan, Kokurikulum & Kebudayaan (JSKK), Politeknik Sandakan Sabah**.

* **Alamat Laman Web (Live Netlify):** **[https://pshapp-shahadah.netlify.app/tempahansukan/](https://pshapp-shahadah.netlify.app/tempahansukan/)**
* **Alamat Localhost (XAMPP Apache):** **[http://localhost/tempahansukan/](http://localhost/tempahansukan/)**
* **Fail Utama (di bawah folder `/tempahansukan/`):**
  * HTML: [index.html](file:///c:/Users/norshahadah/Desktop/CPCM29060107/tempahansukan/index.html)
  * CSS: [style.css](file:///c:/Users/norshahadah/Desktop/CPCM29060107/tempahansukan/style.css)
  * JS Logik: [app.js](file:///c:/Users/norshahadah/Desktop/CPCM29060107/tempahansukan/app.js)
  * Database Schema: [database.sql](file:///c:/Users/norshahadah/Desktop/CPCM29060107/tempahansukan/database.sql)
  * REST API: [api.php](file:///c:/Users/norshahadah/Desktop/CPCM29060107/tempahansukan/api.php)

### Ciri-Ciri Utama PoliSport Book
1. **Reka Bentuk Gaya Vodafone Red:** Antara muka premium bertemakan kelabu/hitam pekat (*deep charcoal/ink*) dengan kemasan merah scarlet korporat (`#e60000`) serta kad maklumat status membulat (radius 6px) mengikut standard *Vodafone Design System*.
2. **Log Masuk Dwi-Peranan:**
   * **Pelajar / Staf:** Log masuk menggunakan No. Kad Pengenalan sampel (cth: `050101121234` / kata laluan: `sukan123`). Boleh menyemak baki ketersediaan peralatan, menempah gelanggang/padang pada tarikh dan sesi tertentu, serta memantau status kelulusan.
   * **Penyelaras JSKK (Admin):** Log masuk menggunakan ID `admin` (kata laluan: `admin123`). Boleh meluluskan permohonan (`Lulus`), menolak (`Tolak`), atau menyelesaikan pemulangan alatan (`Selesai/Pulang`), di samping mengurus had siling kuantiti stok inventori.
3. **Resit Kelulusan & Kod QR:** Permohonan yang diluluskan akan mendapat butang *"Lihat Slip"* yang memaparkan slip kelulusan digital gaya resit kurier bertulis mono-jarak berserta mock Kod QR verifikasi untuk ditunjukkan di Stor Sukan JSKK.
4. **Validasi Ketersediaan & Stok Automatik:**
   * Sistem menghalang tempahan gelanggang bertindih (*double booking*) pada tarikh dan sesi (Pagi/Petang/Malam) yang sama.
   * Stok peralatan (cth: raket badminton) akan berkurangan secara dinamik sebaik sahaja tempahan diluluskan, dan bertambah semula secara automatik selepas peralatan ditandakan selesai pemulangan oleh Penyelaras.
5. **Dwi-Mod API & Offline Fallback (Hybrid):** Menggunakan API PHP (`api.php`) dan MySQL (`psh_sukan_db`) sekiranya pelayan Apache/MySQL diaktifkan, dan beralih secara automatik ke penyimpanan `localStorage` pelayar sekiranya dijalankan pada pelayan statik (offline-first).
6. **Video Rekod Pengesahan Aliran Ujian:** Aliran log masuk pelajar, permohonan dewan, log masuk admin, dan kelulusan tempahan telah diuji secara automatik dan dirakam di:
   * **Ujian Aliran Sukan:** ![Ujian Aliran](file:///C:/Users/norshahadah/.gemini/antigravity-ide/brain/55abbdef-8296-4330-817f-e2c56dfcdb1d/sukan_booking_flow_1782882361837.webp)
