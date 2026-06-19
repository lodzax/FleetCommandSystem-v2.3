-- FleetCommand v2.3 — Migration: Add submittedBy / submittedById to fuel_requisitions
-- Run this on the production database via cPanel » phpMyAdmin or SSH:
--   mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < server/migration_submitted_by.sql
-- Safe to re-run — skips if columns already exist.

SET @db = 'npivfupq_fleet';

SET @sql1 = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fuel_requisitions' AND COLUMN_NAME = 'submittedBy') = 0,
  'ALTER TABLE fuel_requisitions ADD COLUMN submittedBy VARCHAR(100) DEFAULT NULL AFTER redeemedActualCost',
  'SELECT "submittedBy column already exists — skipping" AS result'
);
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @sql2 = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'fuel_requisitions' AND COLUMN_NAME = 'submittedById') = 0,
  'ALTER TABLE fuel_requisitions ADD COLUMN submittedById VARCHAR(50) DEFAULT NULL AFTER submittedBy',
  'SELECT "submittedById column already exists — skipping" AS result'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
