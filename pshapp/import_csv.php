<?php
// PHP Script to parse senarai_pelajar_sabah.csv and import registrations into MySQL
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "psh_database";

$conn = @new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die("Ralat sambungan database: " . $conn->connect_error . "\n");
}

// Clear existing registrations to prevent duplicate key errors
$conn->query("DELETE FROM registrations");
$conn->query("DELETE FROM users");
$conn->query("UPDATE courses SET peserta = 0");

$csvFile = __DIR__ . "/../senarai_pelajar_sabah.csv";
if (!file_exists($csvFile)) {
    die("Fail CSV tidak dijumpai di laluan: " . $csvFile . "\n");
}

$file = fopen($csvFile, "r");
// Skip CSV header line
fgetcsv($file);

$courses = ['MAT-01', 'MAT-02', 'SCI-01', 'SCI-02', 'COMP-01', 'COMP-02'];
$courseCounts = array_fill_keys($courses, 0);
$banks = ['Maybank', 'CIMB Bank', 'Bank Islam', 'RHB Bank', 'Public Bank', 'AmBank'];
$dummyReceipt = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

$index = 0;
while (($row = fgetcsv($file)) !== FALSE) {
    if (count($row) < 2) continue;
    
    $nama = $row[0];
    $ic = $row[1];
    $gender = $row[2];
    $address = $row[3];
    
    // Distribute among courses
    $courseId = $courses[$index % count($courses)];
    $regId = "REG-" . (1719700000 + $index);
    $tel = "01" . (2 + ($index % 8)) . "-" . rand(1000000, 9999999);
    
    // Generate clean email
    $cleanName = strtolower(preg_replace('/[^a-zA-Z]/', '', explode(' ', $nama)[0]));
    $emel = $cleanName . rand(10, 99) . "@gmail.com";
    $bank = $banks[$index % count($banks)];
    $receiptName = "resit_yuran_" . strtolower($courseId) . "_" . $cleanName . ".png";
    
    $stmt = $conn->prepare("INSERT INTO registrations (id, course_id, nama, ic, tel, emel, bank, receipt_name, receipt_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssss", $regId, $courseId, $nama, $ic, $tel, $emel, $bank, $receiptName, $dummyReceipt);
    $stmt->execute();
    $stmt->close();
    
    // Also save as user login account
    $defaultPassword = "user123";
    $stmtUser = $conn->prepare("INSERT INTO users (ic, nama, tel, emel, password) VALUES (?, ?, ?, ?, ?)");
    $stmtUser->bind_param("sssss", $ic, $nama, $tel, $emel, $defaultPassword);
    $stmtUser->execute();
    $stmtUser->close();
    
    $courseCounts[$courseId]++;
    $index++;
}

fclose($file);

// Update course capacities
foreach ($courseCounts as $courseId => $count) {
    $stmt = $conn->prepare("UPDATE courses SET peserta = ? WHERE id = ?");
    $stmt->bind_param("is", $count, $courseId);
    $stmt->execute();
    $stmt->close();
}

echo "Berjaya mengimport $index peserta dari CSV ke pangkalan data MySQL!\n";
$conn->close();
?>
