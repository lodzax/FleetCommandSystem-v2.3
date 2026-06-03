#!/bin/bash
# FleetCommand v2.3 — Deployment Script for cPanel
# Run this after uploading the deploy.zip and extracting via File Manager

echo "[FleetCommand] Starting deployment..."

cd /home/npivfupq/fleet.mineazy.co.zw

# Install Node.js dependencies
echo "[1/4] Installing dependencies..."
npm install --production

# Import database schema
echo "[2/4] Importing database schema..."
mysql -u npivfupq_fleet_admin -p"M1n3@zy2026" npivfupq_fleet < server/schema.sql

# Verify dist files exist
if [ -d "dist" ]; then
  echo "[3/4] Build files found."
else
  echo "[3/4] WARNING: dist/ folder not found. Run 'npm run build' locally before deploying."
fi

# Start the production server
echo "[4/4] Starting FleetCommand server..."
node server/prod.cjs &

echo ""
echo "Deployment complete! App running on assigned Node.js port."
echo "Access: https://fleet.mineazy.co.zw"
