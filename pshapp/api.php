<?php
// PHP API Backend for Portal PSH JMSK
// Connects to local MySQL database and provides JSON endpoints

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database config
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "psh_database";

// Attempt database connection
$conn = @new mysqli($host, $user, $pass, $dbname);

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'status') {
    if ($conn->connect_error) {
        echo json_encode(["databaseConnected" => false, "error" => $conn->connect_error]);
    } else {
        echo json_encode(["databaseConnected" => true]);
    }
    exit;
}

if ($conn->connect_error) {
    http_response_code(503);
    echo json_encode(["error" => "MySQL Server Offline"]);
    exit;
}

// 1. Get all courses
if ($action === 'get_courses') {
    $result = $conn->query("SELECT * FROM courses");
    $courses = [];
    while ($row = $result->fetch_assoc()) {
        $courses[] = [
            "id" => $row['id'],
            "nama" => $row['nama'],
            "kategori" => $row['kategori'],
            "tarikh" => $row['tarikh'],
            "masa" => $row['masa'],
            "lokasi" => $row['lokasi'],
            "penceramah" => $row['penceramah'],
            "urusetia" => $row['urusetia'],
            "peserta" => (int)$row['peserta'],
            "maxPeserta" => (int)$row['max_peserta'],
            "yuran" => (float)$row['yuran'],
            "status" => $row['status'],
            "laporan" => $row['laporan_ringkasan'] ? [
                "ringkasan" => $row['laporan_ringkasan'],
                "feedback" => $row['laporan_feedback'],
                "cadangan" => $row['laporan_cadangan'],
                "tarikhLaporan" => $row['laporan_tarikh']
            ] : null
        ];
    }
    echo json_encode($courses);
    exit;
}

// 2. Add course
if ($action === 'add_course') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON payload"]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO courses (id, nama, kategori, tarikh, masa, lokasi, penceramah, urusetia, peserta, max_peserta, yuran, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssssiids", 
        $data['id'], $data['nama'], $data['kategori'], $data['tarikh'], $data['masa'], 
        $data['lokasi'], $data['penceramah'], $data['urusetia'], $data['peserta'], 
        $data['maxPeserta'], $data['yuran'], $data['status']
    );
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 3. Update course (including status and laporan ulasan)
if ($action === 'update_course') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$id || !$data) {
        http_response_code(400);
        echo json_encode(["error" => "Missing id or payload"]);
        exit;
    }
    
    $ringkasan = isset($data['laporan']['ringkasan']) ? $data['laporan']['ringkasan'] : null;
    $feedback = isset($data['laporan']['feedback']) ? $data['laporan']['feedback'] : null;
    $cadangan = isset($data['laporan']['cadangan']) ? $data['laporan']['cadangan'] : null;
    $tarikhLaporan = isset($data['laporan']['tarikhLaporan']) ? $data['laporan']['tarikhLaporan'] : null;

    $stmt = $conn->prepare("UPDATE courses SET nama=?, kategori=?, tarikh=?, masa=?, lokasi=?, penceramah=?, urusetia=?, max_peserta=?, status=?, laporan_ringkasan=?, laporan_feedback=?, laporan_cadangan=?, laporan_tarikh=? WHERE id=?");
    $stmt->bind_param("sssssssissssss", 
        $data['nama'], $data['kategori'], $data['tarikh'], $data['masa'], $data['lokasi'], 
        $data['penceramah'], $data['urusetia'], $data['maxPeserta'], $data['status'],
        $ringkasan, $feedback, $cadangan, $tarikhLaporan, $id
    );
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 4. Delete course
if ($action === 'delete_course') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing id"]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM courses WHERE id=?");
    $stmt->bind_param("s", $id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 5. Get all registrations
if ($action === 'get_registrations') {
    $result = $conn->query("SELECT r.*, c.nama as courseName FROM registrations r JOIN courses c ON r.course_id = c.id");
    $registrations = [];
    while ($row = $result->fetch_assoc()) {
        $registrations[] = [
            "id" => $row['id'],
            "courseId" => $row['course_id'],
            "courseName" => $row['courseName'],
            "nama" => $row['nama'],
            "ic" => $row['ic'],
            "tel" => $row['tel'],
            "emel" => $row['emel'],
            "bank" => $row['bank'],
            "receiptName" => $row['receipt_name'],
            "receiptData" => $row['receipt_data'],
            "tarikhDaftar" => $row['tarikh_daftar']
        ];
    }
    echo json_encode($registrations);
    exit;
}

// 6. Add registration (updates capacity too)
if ($action === 'add_registration') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON payload"]);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO registrations (id, course_id, nama, ic, tel, emel, bank, receipt_name, receipt_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssss", 
            $data['id'], $data['courseId'], $data['nama'], $data['ic'], $data['tel'], 
            $data['emel'], $data['bank'], $data['receiptName'], $data['receiptData']
        );
        $stmt->execute();
        $stmt->close();
        
        $stmtUpdate = $conn->prepare("UPDATE courses SET peserta = peserta + 1 WHERE id = ?");
        $stmtUpdate->bind_param("s", $data['courseId']);
        $stmtUpdate->execute();
        $stmtUpdate->close();
        
        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 7. Delete registration (decrements capacity too)
if ($action === 'delete_registration') {
    $id = isset($_GET['id']) ? $_GET['id'] : '';
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing id"]);
        exit;
    }
    
    $conn->begin_transaction();
    try {
        $stmtSelect = $conn->prepare("SELECT course_id FROM registrations WHERE id = ?");
        $stmtSelect->bind_param("s", $id);
        $stmtSelect->execute();
        $res = $stmtSelect->get_result();
        if ($res->num_rows === 0) {
            throw new Exception("Registration not found");
        }
        $row = $res->fetch_assoc();
        $courseId = $row['course_id'];
        $stmtSelect->close();
        
        $stmtDelete = $conn->prepare("DELETE FROM registrations WHERE id = ?");
        $stmtDelete->bind_param("s", $id);
        $stmtDelete->execute();
        $stmtDelete->close();
        
        $stmtUpdate = $conn->prepare("UPDATE courses SET peserta = GREATEST(0, peserta - 1) WHERE id = ?");
        $stmtUpdate->bind_param("s", $courseId);
        $stmtUpdate->execute();
        $stmtUpdate->close();
        
        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 8. Reset system database
if ($action === 'reset_database') {
    $conn->begin_transaction();
    try {
        $conn->query("DELETE FROM registrations");
        $conn->query("DELETE FROM courses");
        
        $seedSql = "
            INSERT INTO courses (id, nama, kategori, tarikh, masa, lokasi, penceramah, urusetia, peserta, max_peserta) VALUES 
            ('MAT-01', 'Kursus Analisis Data dengan Excel & Statistik Asas', 'Matematik', '2026-07-11', '09:00 AM - 04:00 PM', 'Makmal Simulasi Matematik (Bilik 204)', 'Dr. Hasmadi bin Abdul Rahman', 'Puan Noor Asma binti Harun', 0, 30),
            ('MAT-02', 'Kursus Pengiraan Cukai Pendapatan & Kewangan Peribadi', 'Matematik', '2026-07-18', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 1', 'Puan Salmah binti Kassim', 'Encik Khairul Anuar bin Salim', 0, 40),
            ('SCI-01', 'Kursus Bioteknologi Rumah: Pembuatan Sabun Organik', 'Sains', '2026-07-25', '08:30 AM - 04:30 PM', 'Makmal Kimia Gunaan (Makmal 1)', 'Dr. Fiona binti Gunting', 'Cik Nur Hidayah binti Razali', 0, 20),
            ('SCI-02', 'Kursus Asas Sistem Penapis Air Mesra Alam', 'Sains', '2026-08-01', '09:00 AM - 01:00 PM', 'Makmal Fizik JMSK (Bilik 102)', 'Encik Elvin bin Mojikon', 'Puan Suzana binti Mat Isa', 0, 25),
            ('COMP-01', 'Kursus Asas Pembangunan Laman Web HTML/CSS', 'Komputer', '2026-08-08', '09:00 AM - 05:00 PM', 'Makmal Komputer Teknologi (Makmal 4)', 'Encik Mohd Azlan bin Awang', 'Encik Ahmad Firdaus bin Zulkifli', 0, 30),
            ('COMP-02', 'Kursus Keselamatan Siber & Perlindungan Data Peribadi', 'Komputer', '2026-08-15', '09:00 AM - 01:00 PM', 'Dewan Kuliah JMSK 2', 'Puan Dayang Nurul binti Mohd', 'Cik Siti Aminah binti Osman', 0, 50)
        ";
        
        $conn->query($seedSql);
        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
    exit;
}

// 9. Register User
if ($action === 'register_user') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['ic']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }

    // Check if user exists
    $stmtCheck = $conn->prepare("SELECT ic FROM users WHERE ic = ?");
    $stmtCheck->bind_param("s", $data['ic']);
    $stmtCheck->execute();
    $res = $stmtCheck->get_result();
    if ($res->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Ralat: Pengguna dengan No. Kad Pengenalan ini sudah wujud!"]);
        $stmtCheck->close();
        exit;
    }
    $stmtCheck->close();

    // Insert user
    $stmt = $conn->prepare("INSERT INTO users (ic, nama, tel, emel, password) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $data['ic'], $data['nama'], $data['tel'], $data['emel'], $data['password']);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 10. Login User
if ($action === 'login_user') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['ic']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT ic, nama, tel, emel FROM users WHERE ic = ? AND password = ?");
    $stmt->bind_param("ss", $data['ic'], $data['password']);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 1) {
        $row = $res->fetch_assoc();
        echo json_encode(["success" => true, "user" => $row]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "No. Kad Pengenalan atau kata laluan tidak sah!"]);
    }
    $stmt->close();
    exit;
// 11. Verify User for Password Reset
if ($action === 'verify_reset_user') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['ic']) || !isset($data['tel']) || !isset($data['emel'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }

    $stmtVerify = $conn->prepare("SELECT ic FROM users WHERE ic = ? AND tel = ? AND emel = ?");
    $stmtVerify->bind_param("sss", $data['ic'], $data['tel'], $data['emel']);
    $stmtVerify->execute();
    $res = $stmtVerify->get_result();
    if ($res->num_rows === 1) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Ralat: Maklumat pengesahan diri (No. KP / Telefon / Emel) tidak sepadan dengan rekod kami!"]);
    }
    $stmtVerify->close();
    exit;
}

// 12. Reset Password
if ($action === 'reset_password') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['ic']) || !isset($data['tel']) || !isset($data['emel']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }

    // Verify user credentials match
    $stmtVerify = $conn->prepare("SELECT ic FROM users WHERE ic = ? AND tel = ? AND emel = ?");
    $stmtVerify->bind_param("sss", $data['ic'], $data['tel'], $data['emel']);
    $stmtVerify->execute();
    $res = $stmtVerify->get_result();
    if ($res->num_rows === 0) {
        http_response_code(400);
        echo json_encode(["error" => "Ralat: Maklumat pengesahan diri (No. KP / Telefon / Emel) tidak sepadan dengan rekod kami!"]);
        $stmtVerify->close();
        exit;
    }
    $stmtVerify->close();

    // Update password
    $stmtUpdate = $conn->prepare("UPDATE users SET password = ? WHERE ic = ?");
    $stmtUpdate->bind_param("ss", $data['password'], $data['ic']);
    if ($stmtUpdate->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmtUpdate->error]);
    }
    $stmtUpdate->close();
    exit;
}

// 13. Add Course Evaluation
if ($action === 'add_evaluation') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['id']) || !isset($data['registrationId']) || !isset($data['courseId']) || !isset($data['ic'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO evaluations (id, registration_id, course_id, ic, rating_speaker, rating_content, rating_facilities, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssiiis", 
        $data['id'], 
        $data['registrationId'], 
        $data['courseId'], 
        $data['ic'], 
        $data['ratingSpeaker'], 
        $data['ratingContent'], 
        $data['ratingFacilities'], 
        $data['feedback']
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// 14. Get All Course Evaluations
if ($action === 'get_evaluations') {
    $res = $conn->query("SELECT * FROM evaluations ORDER BY created_at DESC");
    $list = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $list[] = [
                'id' => $row['id'],
                'registrationId' => $row['registration_id'],
                'courseId' => $row['course_id'],
                'ic' => $row['ic'],
                'ratingSpeaker' => (int)$row['rating_speaker'],
                'ratingContent' => (int)$row['rating_content'],
                'ratingFacilities' => (int)$row['rating_facilities'],
                'feedback' => $row['feedback'],
                'createdAt' => $row['created_at']
            ];
        }
    }
    echo json_encode($list);
    exit;
}

http_response_code(400);
echo json_encode(["error" => "Invalid action requested"]);
?>
