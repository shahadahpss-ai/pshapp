// Node.js Express server to connect MySQL database for Portal PSH JMSK
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '60mb' }));
app.use(bodyParser.urlencoded({ limit: '60mb', extended: true }));

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Default password for local mysql (xampp/wamp) is blank
  database: 'psh_database',
  port: 3306
};

let dbConnection = null;
let isDbConnected = false;

function connectDatabase() {
  const conn = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  conn.connect((err) => {
    if (err) {
      console.warn("⚠️ Amaran: Gagal menyambung ke MySQL. Memulakan mod fallback LocalStorage.");
      isDbConnected = false;
      return;
    }

    conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (dbErr) => {
      if (dbErr) {
        console.error("❌ Gagal membina pangkalan data psh_database:", dbErr);
        isDbConnected = false;
        conn.end();
        return;
      }

      dbConnection = mysql.createPool(dbConfig);
      console.log("🚀 Berjaya menyambung ke MySQL Database: psh_database");
      isDbConnected = true;
      conn.end();
    });
  });
}

connectDatabase();

// 1. API Endpoint: Check DB connection status
app.get('/api/status', (req, res) => {
  res.json({ databaseConnected: isDbConnected });
});

// 2. API Endpoint: Fetch all courses
app.get('/api/courses', (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: "MySQL offline" });
  }

  dbConnection.query('SELECT * FROM courses', (err, results) => {
    if (err) return res.status(500).json(err);
    
    // Map snake_case database columns to camelCase JS state variables
    const mapped = results.map(c => ({
      id: c.id,
      nama: c.nama,
      kategori: c.kategori,
      tarikh: c.tarikh ? c.tarikh.toISOString().split('T')[0] : '', // Format YYYY-MM-DD
      masa: c.masa,
      lokasi: c.lokasi,
      penceramah: c.penceramah,
      urusetia: c.urusetia,
      peserta: c.peserta,
      maxPeserta: c.max_peserta,
      yuran: Number(c.yuran),
      status: c.status,
      laporan: c.laporan_ringkasan ? {
        ringkasan: c.laporan_ringkasan,
        feedback: c.laporan_feedback,
        cadangan: c.laporan_cadangan,
        tarikhLaporan: c.laporan_tarikh
      } : null
    }));
    
    res.json(mapped);
  });
});

// 3. API Endpoint: Add course
app.post('/api/courses', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const c = req.body;
  const sql = `INSERT INTO courses (id, nama, kategori, tarikh, masa, lokasi, penceramah, urusetia, peserta, max_peserta, yuran, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [c.id, c.nama, c.kategori, c.tarikh, c.masa, c.lokasi, c.penceramah, c.urusetia, c.peserta, c.maxPeserta, c.yuran, c.status];

  dbConnection.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 4. API Endpoint: Update course (inc. reports status & ulasan)
app.put('/api/courses/:id', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const id = req.params.id;
  const c = req.body;
  
  const sql = `UPDATE courses SET nama=?, kategori=?, tarikh=?, masa=?, lokasi=?, penceramah=?, urusetia=?, max_peserta=?, status=?, laporan_ringkasan=?, laporan_feedback=?, laporan_cadangan=?, laporan_tarikh=? WHERE id=?`;
  const params = [
    c.nama, c.kategori, c.tarikh, c.masa, c.lokasi, c.penceramah, c.urusetia, c.maxPeserta, c.status,
    c.laporan ? c.laporan.ringkasan : null,
    c.laporan ? c.laporan.feedback : null,
    c.laporan ? c.laporan.cadangan : null,
    c.laporan ? c.laporan.tarikhLaporan : null,
    id
  ];

  dbConnection.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 5. API Endpoint: Delete course
app.delete('/api/courses/:id', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const id = req.params.id;
  dbConnection.query('DELETE FROM courses WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// 6. API Endpoint: Fetch registrations
app.get('/api/registrations', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const sql = `
    SELECT r.*, c.nama as courseName 
    FROM registrations r 
    JOIN courses c ON r.course_id = c.id
  `;
  
  dbConnection.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    
    const mapped = results.map(r => ({
      id: r.id,
      courseId: r.course_id,
      courseName: r.courseName,
      nama: r.nama,
      ic: r.ic,
      tel: r.tel,
      emel: r.emel,
      bank: r.bank,
      receiptName: r.receipt_name,
      receiptData: r.receipt_data,
      tarikhDaftar: r.tarikh_daftar
    }));
    
    res.json(mapped);
  });
});

// 7. API Endpoint: Add registration (with transaction to update course capacity)
app.post('/api/registrations', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const r = req.body;
  
  dbConnection.getConnection((err, conn) => {
    if (err) return res.status(500).json(err);
    
    conn.beginTransaction((txErr) => {
      if (txErr) { conn.release(); return res.status(500).json(txErr); }
      
      const insertSql = `INSERT INTO registrations (id, course_id, nama, ic, tel, emel, bank, receipt_name, receipt_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertParams = [r.id, r.courseId, r.nama, r.ic, r.tel, r.emel, r.bank, r.receiptName, r.receiptData];
      
      conn.query(insertSql, insertParams, (insertErr) => {
        if (insertErr) {
          return conn.rollback(() => { conn.release(); res.status(500).json(insertErr); });
        }
        
        conn.query('UPDATE courses SET peserta = peserta + 1 WHERE id=?', [r.courseId], (updateErr) => {
          if (updateErr) {
            return conn.rollback(() => { conn.release(); res.status(500).json(updateErr); });
          }
          
          conn.commit((commitErr) => {
            if (commitErr) {
              return conn.rollback(() => { conn.release(); res.status(500).json(commitErr); });
            }
            conn.release();
            res.json({ success: true });
          });
        });
      });
    });
  });
});

// 8. API Endpoint: Delete registration (with transaction to update course capacity)
app.delete('/api/registrations/:id', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  const id = req.params.id;
  
  dbConnection.getConnection((err, conn) => {
    if (err) return res.status(500).json(err);
    
    conn.beginTransaction((txErr) => {
      if (txErr) { conn.release(); return res.status(500).json(txErr); }
      
      conn.query('SELECT course_id FROM registrations WHERE id=?', [id], (selectErr, selectResults) => {
        if (selectErr || selectResults.length === 0) {
          return conn.rollback(() => { conn.release(); res.status(500).json(selectErr || {error: "Not found"}); });
        }
        
        const courseId = selectResults[0].course_id;
        
        conn.query('DELETE FROM registrations WHERE id=?', [id], (deleteErr) => {
          if (deleteErr) {
            return conn.rollback(() => { conn.release(); res.status(500).json(deleteErr); });
          }
          
          conn.query('UPDATE courses SET peserta = GREATEST(0, peserta - 1) WHERE id=?', [courseId], (updateErr) => {
            if (updateErr) {
              return conn.rollback(() => { conn.release(); res.status(500).json(updateErr); });
            }
            
            conn.commit((commitErr) => {
              if (commitErr) {
                return conn.rollback(() => { conn.release(); res.status(500).json(commitErr); });
              }
              conn.release();
              res.json({ success: true });
            });
          });
        });
      });
    });
  });
});

// 9. API Endpoint: Reset/Truncate all database records
app.post('/api/reset-database', (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: "MySQL offline" });

  dbConnection.getConnection((err, conn) => {
    if (err) return res.status(500).json(err);
    
    conn.beginTransaction((txErr) => {
      if (txErr) { conn.release(); return res.status(500).json(txErr); }
      
      conn.query('DELETE FROM registrations', (delErr) => {
        if (delErr) return conn.rollback(() => { conn.release(); res.status(500).json(delErr); });
        
        conn.query('DELETE FROM courses', (delCoursesErr) => {
          if (delCoursesErr) return conn.rollback(() => { conn.release(); res.status(500).json(delCoursesErr); });
          
          // Re-insert initial courses seed
          const seedSql = `
            INSERT INTO courses (id, nama, kategori, tarikh, masa, lokasi, penceramah, urusetia, peserta, max_peserta) VALUES 
            ('MAT-01', 'Kursus Analisis Data dengan Excel & Statistik Asas', 'Matematik', '2026-07-11', '09:00 AM - 04:00 PM', 'Makmal Simulasi Matematik (Bilik 204)', 'Dr. Hasmadi bin Abdul Rahman', 'Puan Noor Asma binti Harun', 0, 30),
            ('MAT-02', 'Kursus Pengiraan Cukai Pendapatan & Kewangan Peribadi', 'Matematik', '2026-07-18', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 1', 'Puan Salmah binti Kassim', 'Encik Khairul Anuar bin Salim', 0, 40),
            ('SCI-01', 'Kursus Bioteknologi Rumah: Pembuatan Sabun Organik', 'Sains', '2026-07-25', '08:30 AM - 04:30 PM', 'Makmal Kimia Gunaan (Makmal 1)', 'Dr. Fiona binti Gunting', 'Cik Nur Hidayah binti Razali', 0, 20),
            ('SCI-02', 'Kursus Asas Sistem Penapis Air Mesra Alam', 'Sains', '2026-08-01', '09:00 AM - 01:00 PM', 'Makmal Fizik JMSK (Bilik 102)', 'Encik Elvin bin Mojikon', 'Puan Suzana binti Mat Isa', 0, 25),
            ('COMP-01', 'Kursus Asas Pembangunan Laman Web HTML/CSS', 'Komputer', '2026-08-08', '09:00 AM - 05:00 PM', 'Makmal Komputer Teknologi (Makmal 4)', 'Encik Mohd Azlan bin Awang', 'Encik Ahmad Firdaus bin Zulkifli', 0, 30),
            ('COMP-02', 'Kursus Keselamatan Siber & Perlindungan Data Peribadi', 'Komputer', '2026-08-15', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 2', 'Puan Dayang Nurul binti Mohd', 'Cik Siti Aminah binti Osman', 0, 50)
          `;
          
          conn.query(seedSql, (seedErr) => {
            if (seedErr) return conn.rollback(() => { conn.release(); res.status(500).json(seedErr); });
            
            conn.commit((commitErr) => {
              if (commitErr) return conn.rollback(() => { conn.release(); res.status(500).json(commitErr); });
              conn.release();
              res.json({ success: true });
            });
          });
        });
      });
    });
  });
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Pelayan Web PSH JMSK berjalan di http://localhost:${PORT}/`);
  console.log(`Sila pastikan MySQL Server (XAMPP/WAMP) diaktifkan.`);
  console.log(`=================================================`);
});
