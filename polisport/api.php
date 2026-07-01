<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = "127.0.0.1";
$user = "root";
$pass = "";
$dbname = "psh_sukan_db";

// Establish Database Connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    // If database connection fails, return offline status
    if (isset($_GET['action']) && $_GET['action'] === 'status') {
        echo json_encode(["status" => "offline", "message" => $e->getMessage()]);
        exit;
    }
    http_response_code(500);
    echo json_encode(["error" => "Koneksi pangkalan data gagal: " . $e->getMessage()]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'status':
        echo json_encode(["status" => "online"]);
        break;

    case 'login':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['ic']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(["error" => "Data tidak lengkap."]);
            break;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE ic = ? AND password = ?");
        $stmt->execute([$data['ic'], $data['password']]);
        $userRecord = $stmt->fetch();

        if ($userRecord) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "ic" => $userRecord['ic'],
                    "name" => $userRecord['name'],
                    "role" => $userRecord['role']
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "No. KP atau Kata Laluan salah."]);
        }
        break;

    case 'get_data':
        $facStmt = $pdo->query("SELECT * FROM facilities");
        $facilities = $facStmt->fetchAll();

        $eqpStmt = $pdo->query("SELECT * FROM equipment");
        $equipment = $eqpStmt->fetchAll();

        $bkStmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
        $bookings = $bkStmt->fetchAll();

        echo json_encode([
            "facilities" => $facilities,
            "equipment" => $equipment,
            "bookings" => $bookings
        ]);
        break;

    case 'add_booking':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Data kosong."]);
            break;
        }

        // Validate double-booking for facilities
        if ($data['item_type'] === 'facility') {
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE item_id = ? AND booking_date = ? AND session = ? AND status IN ('Menunggu', 'Lulus')");
            $checkStmt->execute([$data['item_id'], $data['booking_date'], $data['session']]);
            if ($checkStmt->fetchColumn() > 0) {
                echo json_encode(["success" => false, "message" => "Kemudahan sudah ditempah pada tarikh dan sesi tersebut."]);
                break;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO bookings (id, user_ic, user_name, item_id, item_name, item_type, quantity, booking_date, session, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'],
            $data['user_ic'],
            $data['user_name'],
            $data['item_id'],
            $data['item_name'],
            $data['item_type'],
            $data['quantity'],
            $data['booking_date'],
            $data['session'],
            'Menunggu',
            $data['notes']
        ]);

        echo json_encode(["success" => true]);
        break;

    case 'update_booking':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "Data tidak lengkap."]);
            break;
        }

        $pdo->beginTransaction();
        try {
            // Get current booking info
            $bkStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
            $bkStmt->execute([$data['id']]);
            $booking = $bkStmt->fetch();

            if (!$booking) {
                echo json_encode(["success" => false, "message" => "Tempahan tidak ditemui."]);
                $pdo->rollBack();
                break;
            }

            // Update status
            $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $data['id']]);

            // Adjust equipment quantities if status is Lulus or Selesai
            if ($booking['item_type'] === 'equipment') {
                if ($data['status'] === 'Lulus' && $booking['status'] !== 'Lulus') {
                    // Reduce inventory quantity / increase borrowed count
                    $upEqp = $pdo->prepare("UPDATE equipment SET borrowed = borrowed + ? WHERE id = ?");
                    $upEqp->execute([$booking['quantity'], $booking['item_id']]);
                } else if ($data['status'] === 'Selesai' && $booking['status'] === 'Lulus') {
                    // Return equipment - decrease borrowed count
                    $upEqp = $pdo->prepare("UPDATE equipment SET borrowed = GREATEST(0, borrowed - ?) WHERE id = ?");
                    $upEqp->execute([$booking['quantity'], $booking['item_id']]);
                } else if ($data['status'] === 'Tolak' && $booking['status'] === 'Lulus') {
                    // If rejected after being approved - return equipment
                    $upEqp = $pdo->prepare("UPDATE equipment SET borrowed = GREATEST(0, borrowed - ?) WHERE id = ?");
                    $upEqp->execute([$booking['quantity'], $booking['item_id']]);
                }
            }

            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'update_equipment':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id']) || !isset($data['quantity'])) {
            http_response_code(400);
            echo json_encode(["error" => "Data tidak lengkap."]);
            break;
        }

        $stmt = $pdo->prepare("UPDATE equipment SET quantity = ?, description = ? WHERE id = ?");
        $stmt->execute([$data['quantity'], $data['description'], $data['id']]);
        echo json_encode(["success" => true]);
        break;

    case 'forgot_verify':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['ic']) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(["error" => "Data tidak lengkap."]);
            break;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE ic = ? AND name LIKE ?");
        $stmt->execute([$data['ic'], '%' . $data['name'] . '%']);
        $userRecord = $stmt->fetch();

        if ($userRecord) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Maklumat diri tidak ditemui dalam rekod JSKK."]);
        }
        break;

    case 'forgot_reset':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['ic']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(["error" => "Data tidak lengkap."]);
            break;
        }

        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE ic = ?");
        $stmt->execute([$data['password'], $data['ic']]);
        echo json_encode(["success" => true]);
        break;

    case 'reset_database':
        try {
            $sql = file_get_contents('database.sql');
            $pdo->exec($sql);
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["error" => "Gagal set semula: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Aksi tidak dikenali."]);
        break;
}
?>
