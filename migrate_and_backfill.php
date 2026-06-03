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

$bf = "UPDATE fuel_requisitions
        SET submittedBy = driverName
        WHERE submittedBy IS NULL AND driverName IS NOT NULL";
if (mysqli_query($conn, $bf)) {
  $results[] = 'backfill submittedBy from driverName: ' . mysqli_affected_rows($conn) . ' rows';
} else {
  $results[] = 'backfill error: ' . mysqli_error($conn);
}

$bf2 = "UPDATE fuel_requisitions fr
         JOIN users u ON u.name = fr.submittedBy
         SET fr.submittedById = u.id
         WHERE fr.submittedById IS NULL AND fr.submittedBy IS NOT NULL";
if (mysqli_query($conn, $bf2)) {
  $results[] = 'backfill submittedById from users by name: ' . mysqli_affected_rows($conn) . ' rows';
} else {
  $results[] = 'backfill2 error: ' . mysqli_error($conn);
}

mysqli_close($conn);

header('Content-Type: application/json');
echo json_encode(['ok' => true, 'results' => $results]);
