-- Skrip Pembinaan Pangkalan Data MySQL bagi Portal PSH JMSK
-- Sila import skrip ini ke dalam phpMyAdmin atau MySQL Client anda.

CREATE DATABASE IF NOT EXISTS psh_database;
USE psh_database;

-- 1. Jadual Maklumat Kursus (courses)
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    tarikh DATE NOT NULL,
    masa VARCHAR(100) NOT NULL,
    lokasi VARCHAR(255) NOT NULL,
    penceramah VARCHAR(100) NOT NULL,
    urusetia VARCHAR(100) NOT NULL,
    peserta INT DEFAULT 0,
    max_peserta INT NOT NULL,
    yuran DECIMAL(10,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'Belum Dilaksanakan',
    laporan_ringkasan TEXT,
    laporan_feedback TEXT,
    laporan_cadangan TEXT,
    laporan_tarikh VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Jadual Pendaftaran Peserta (registrations)
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    ic VARCHAR(20) NOT NULL,
    tel VARCHAR(20) NOT NULL,
    emel VARCHAR(255) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    receipt_name VARCHAR(255) NOT NULL,
    receipt_data LONGTEXT NOT NULL, -- Menyimpan data Base64 fail resit
    tarikh_daftar DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Jadual Galeri Gambar PSH (gallery)
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    kategori VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data awal bagi Kursus PSH
INSERT IGNORE INTO courses (id, nama, kategori, tarikh, masa, lokasi, penceramah, urusetia, peserta, max_peserta, status) VALUES
('MAT-01', 'Kursus Analisis Data dengan Excel & Statistik Asas', 'Matematik', '2026-07-11', '09:00 AM - 04:00 PM', 'Makmal Simulasi Matematik (Bilik 204)', 'Dr. Hasmadi bin Abdul Rahman', 'Puan Noor Asma binti Harun', 18, 30, 'Telah Dilaksanakan'),
('MAT-02', 'Kursus Pengiraan Cukai Pendapatan & Kewangan Peribadi', 'Matematik', '2026-07-18', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 1', 'Puan Salmah binti Kassim', 'Encik Khairul Anuar bin Salim', 25, 40, 'Belum Dilaksanakan'),
('SCI-01', 'Kursus Bioteknologi Rumah: Pembuatan Sabun Organik', 'Sains', '2026-07-25', '08:30 AM - 04:30 PM', 'Makmal Kimia Gunaan (Makmal 1)', 'Dr. Fiona binti Gunting', 'Cik Nur Hidayah binti Razali', 12, 20, 'Telah Dilaksanakan'),
('SCI-02', 'Kursus Asas Sistem Penapis Air Mesra Alam', 'Sains', '2026-08-01', '09:00 AM - 01:00 PM', 'Makmal Fizik JMSK (Bilik 102)', 'Encik Elvin bin Mojikon', 'Puan Suzana binti Mat Isa', 15, 25, 'Belum Dilaksanakan'),
('COMP-01', 'Kursus Asas Pembangunan Laman Web HTML/CSS', 'Komputer', '2026-08-08', '09:00 AM - 05:00 PM', 'Makmal Komputer Teknologi (Makmal 4)', 'Encik Mohd Azlan bin Awang', 'Encik Ahmad Firdaus bin Zulkifli', 22, 30, 'Belum Dilaksanakan'),
('COMP-02', 'Kursus Keselamatan Siber & Perlindungan Data Peribadi', 'Komputer', '2026-08-15', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 2', 'Puan Dayang Nurul binti Mohd', 'Cik Siti Aminah binti Osman', 28, 50, 'Belum Dilaksanakan');

-- Seed data awal bagi Galeri PSH
INSERT IGNORE INTO gallery (id, title, description, image_url, kategori) VALUES
(1, 'Sesi Praktikal Bengkel Excel', 'Peserta sedang melakukan analisis statistik menggunakan formula pivot table.', 'images/kursus_matematik.png', 'Matematik'),
(2, 'Eksperimen Sabun Organik', 'Demontrasi penghasilan sabun menggunakan bahan semulajadi di makmal kimia.', 'images/kursus_sains.png', 'Sains'),
(3, 'Pembinaan Laman Web Pertama', 'Pelajar JMSK sedang menulis kod HTML/CSS untuk membina portfolio peribadi.', 'images/kursus_komputer.png', 'Komputer');

-- 4. Jadual Maklumat Akaun Pengguna (users)
CREATE TABLE IF NOT EXISTS users (
    ic VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    tel VARCHAR(20) NOT NULL,
    emel VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    tarikh_daftar DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Jadual Penilaian Kursus (evaluations)
CREATE TABLE IF NOT EXISTS evaluations (
    id VARCHAR(50) PRIMARY KEY,
    registration_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    ic VARCHAR(20) NOT NULL,
    rating_speaker INT NOT NULL,
    rating_content INT NOT NULL,
    rating_facilities INT NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
