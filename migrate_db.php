<?php
$conn = mysqli_connect('localhost', 'npivfupq_fleet_admin', 'M1n3@zy2026', 'npivfupq_fleet');
if (!$conn) { die('Connection failed: ' . mysqli_connect_error()); }

$results = [];

$q1 = "ALTER TABLE fuel_requisitions ADD COLUMN submittedBy VARCHAR(100) DEFAULT NULL AFTER redeemedActualCost";
if (mysqli_query($conn, $q1)) {
  $results[] = 'added submittedBy';
} else {
  $results[] = 'submittedBy: ' . (strpos(mysqli_error($conn), 'Duplicate') !== false ? 'already exists' : mysqli_error($conn));
}

$q2 = "ALTER TABLE fuel_requisitions ADD COLUMN submittedById VARCHAR(50) DEFAULT NULL AFTER submittedBy";
if (mysqli_query($conn, $q2)) {
  $results[] = 'added submittedById';
} else {
  $results[] = 'submittedById: ' . (strpos(mysqli_error($conn), 'Duplicate') !== false ? 'already exists' : mysqli_error($conn));
}

mysqli_close($conn);

// Self-delete after execution
unlink(__FILE__);

header('Content-Type: application/json');
echo json_encode(['ok' => true, 'results' => $results]);
