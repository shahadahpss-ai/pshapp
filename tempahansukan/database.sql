CREATE DATABASE IF NOT EXISTS psh_sukan_db;
USE psh_sukan_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  ic VARCHAR(12) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'pengguna' -- 'pengguna' (pelajar/staf), 'admin' (penyelaras sukan)
);

-- 2. Facilities Table
CREATE TABLE IF NOT EXISTS facilities (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'Tersedia', -- 'Tersedia', 'Penyenggaraan'
  description VARCHAR(255)
);

-- 3. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  borrowed INT DEFAULT 0,
  description VARCHAR(255)
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(50) PRIMARY KEY,
  user_ic VARCHAR(12) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  item_id VARCHAR(20) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(20) NOT NULL, -- 'facility', 'equipment'
  quantity INT DEFAULT 1,
  booking_date DATE NOT NULL,
  session VARCHAR(50) NOT NULL, -- 'Pagi (8:00 AM - 12:00 PM)', 'Petang (2:00 PM - 6:00 PM)', 'Malam (8:00 PM - 10:00 PM)'
  status VARCHAR(20) DEFAULT 'Menunggu', -- 'Menunggu', 'Lulus', 'Tolak', 'Selesai'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Seed Sample Users (Default password is 'sukan123' for all)
INSERT IGNORE INTO users (ic, name, password, role) VALUES
('050101121234', 'Ahmad Bin Daniel (Pelajar)', 'sukan123', 'pengguna'),
('040202125678', 'Siti Aminah Binti Rosli (Pelajar)', 'sukan123', 'pengguna'),
('800505129999', 'Encik Ramli Bin Kassim (Staf)', 'sukan123', 'pengguna'),
('admin', 'Penyelaras JSKK', 'admin123', 'admin');

-- Seed Sample Facilities
INSERT IGNORE INTO facilities (id, name, icon, status, description) VALUES
('FAC-DEWAN', 'Dewan Sukan Serbaguna (Indoor)', '🏢', 'Tersedia', 'Gelanggang Badminton, Bola Jaring & Bola Tampar Indoor.'),
('FAC-FUTSAL', 'Gelanggang Futsal Luar (Outdoor)', '⚽', 'Tersedia', 'Gelanggang futsal bertar berserta lampu limpah.'),
('FAC-TAMPAR', 'Gelanggang Bola Tampar Sandakan', '🏐', 'Tersedia', 'Gelanggang bola tampar outdoor bersebelahan dewan.'),
('FAC-PADANG', 'Padang Bola Sepak JSKK', '🌿', 'Penyenggaraan', 'Padang bola sepak rumput semula jadi (Sesi penyuburan rumput).');

-- Seed Sample Equipment
INSERT IGNORE INTO equipment (id, name, icon, quantity, borrowed, description) VALUES
('EQP-BADM', 'Set Raket & Bulu Tangkis', '🏸', 12, 0, 'Set mengandungi 2 raket dan 3 biji bulu tangkis.'),
('EQP-FUTS', 'Bola Futsal Molten', '⚽', 6, 0, 'Bola futsal bersaiz 4 untuk kegunaan gelanggang keras.'),
('EQP-BOLA', 'Bola Sepak Adidas', '⚽', 8, 0, 'Bola sepak saiz 5 kulit sintetik premium.'),
('EQP-TAMP', 'Set Jaring & Bola Tampar', '🏐', 4, 0, 'Mengandungi 1 bola tampar berserta jaring mudah alih.'),
('EQP-PING', 'Set Ping Pong (Raket & Bola)', '🏓', 5, 0, 'Set mengandungi 2 raket berserta 3 biji bola ping pong.');
