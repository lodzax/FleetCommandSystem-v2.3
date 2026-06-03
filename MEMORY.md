# FleetCommandSystem v2.3 — MEMORY.md

## Overview
FleetCommandSystem v2.3 is a fleet management web application for Zimbabwe mining and heavy haul corridors. Deployed at **https://fleet.mineazy.co.zw** on cPanel with MySQL backend.

---

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, HashRouter
- **Backend**: Express.js, MySQL2, Passenger (via cPanel Node.js App)
- **Libraries**: Leaflet (maps), Recharts (charts), jsPDF (reports), QRCode, Nodemailer
- **Hosting**: cPanel, LiteSpeed, **CloudLinux Node.js Selector** (NOT standard Passenger), Node.js 20

---

## User Roles & Permissions

| Role | Dashboard | Dispatch | Jobs | Drivers | Fleet | Maint. | Fuel | Requisitions | Redemption | Reports | Settings | User Mgmt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Approve | ✓ | ✓ | ✓ | ✓ |
| Director | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Approve | ✓ | ✓ | ✓ | - |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Review | - | ✓ | - | - |
| Accounts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Review | - | ✓ | - | - |
| Treasurer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Approve | - | ✓ | - | - |
| Driver | ✓ | - | - | ✓ | ✓ | ✓ | - | Submit* | - | - | - | - |
| Attendant | - | - | - | - | - | - | - | - | ✓ | - | - | - |

*Drivers see requisitions where `submittedById === activeUser.id` OR `driverName === activeUser.name`.

---

## Requisitions Approval Flow
```
Pending → Reviewed → Approved → Redeemed
                    ↘ Rejected (with reason)
```
- **Review**: Manager, Accounts
- **Approve**: Administrator, Director, Treasurer
- **No user can both review AND approve**

---

## Key Features

### Authentication
- Sign-in page as default landing (no auto-login)
- Pending users see a "Pending Verification" page with auto-redirect once verified
- Unverified users cannot access system views
- **Password-protected role switcher** in sidebar header (requires current user's password to switch)

### Requisitions Pipeline
- Full CRUD for fuel requisitions with Date, Fuel Type, Branch fields
- Cost auto-calculated: **Diesel $2.18/L**, **Petrol $2.16/L**
- QR code generated on approval encoding verification URL
- PDF download for approved requisitions
- View modal for full requisition details and approval trail
- Email notifications via `notifications@mineazy.co.zw` (SMTP: mail.mineazy.co.zw:465)
- **`submittedBy`/`submittedById` fields track who created each requisition**

### Mineazy Fuel Redemption
- Voucher Redemption Console with 6-digit token verification
- KPI cards: Redeemed Vouchers, Total Fuel Volume, Balance Remaining
- Pump dispenser form with attendant signature

### Fuel Tracking
- Fuel fill logs with charts (daily costs, consumption by truck)
- KPI metrics: Cumulative Cost, Combustion Volume, Mean Fuel Price

### Reports (Landscape PDF)
- Dispatch, Orders, Driver Details, Fleet Details, Fleet Maintenance, Fuel Reconciliation, Requisitions
- Auto-scaling columns for landscape (7pt headers, 6pt data)

### User Management (Administrator only)
- Standalone view showing pending users at top with Verify button
- Registered users with role dropdown and Suspend button
- Add User modal

### QR Verification
- Standalone page (no sidebar) at `/verify`
- Reads params directly from `window.location.hash`
- Validates requisition ID + redeem token match
- Shows PASSED/EXPIRED/FAILED status with full details

### Mobile Responsive
- Collapsible sidebar with hamburger menu
- Overlay when sidebar open on mobile
- Responsive header and padding

---

## Deployment Notes

### CRITICAL: CloudLinux Node.js Selector
This app uses **CloudLinux Node.js Selector**, NOT standard cPanel Passenger. Key differences:
- The selector creates a **sandboxed copy** of the application in a virtual environment
- **File changes on disk do NOT take effect** until you click **"Deploy"** (or "Re-deploy") in the Node.js Selector interface
- The `node_modules` directory is managed as a **symlink** by CloudLinux — do NOT manually create `node_modules/`
- `npm install` is run through the Node.js Selector interface, not via SSH or API
- **Restarting** the app (without Deploy) uses the cached sandboxed copy

### Server Paths
- Home: `/home9/npivfupq/`
- App root: `/home9/npivfupq/fleet.mineazy.co.zw/`
- Startup file: `server/prod.cjs` (set in cPanel Node.js Selector)
- cPanel API: `https://mineazy.co.zw:2083/`
- cPanel username: `npivfupq`

### cPanel API Access
- **API Token**: `NCNPUNZDOTUYNOZYQ4T2AZ49BNACMMRO`
- **Auth header**: `Authorization: cpanel npivfupq:NCNPUNZDOTUYNOZYQ4T2AZ49BNACMMRO`
- **Must use `curl.exe` on Windows** (PowerShell's Invoke-RestMethod has TLS issues with this server)
- Working endpoints:
  - `Fileman::upload_files` — uploads NEW files only (fails if file already exists)
  - `Fileman::save_file_content` — creates/overwrites files (use for updates)
  - `Fileman::get_file_content` — reads file contents
  - `Fileman::list_files` — lists directories
- Non-working endpoints:
  - `Mysql::query` — blocked on shared hosting
  - `PassengerApps::*` — module not available
  - `Cron::*` — module not available
  - `Fileman::set_permissions` — not available
  - `Fileman::create_directory` — not available

### Database
- Name: `npivfupq_fleet`
- User: `npivfupq_fleet_admin`
- Password: `M1n3@zy2026`
- Host: `localhost`
- Version: MariaDB 10.11.16
- Schema: `server/schema.sql` (11 tables + seed data)
- **Migration file**: `server/migration_submitted_by.sql` (adds `submittedBy` and `submittedById` to `fuel_requisitions`)
- Migration must be run via phpMyAdmin or SSH — API cannot execute SQL

### Email (Nodemailer)
- SMTP: `mail.mineazy.co.zw:465` (SSL)
- From: `notifications@mineazy.co.zw`
- Sends on: Review, Approve, Reject events

---

## Deployment Procedure (Working Method)

### Step 1: Build locally
```bash
npm run lint     # TypeScript check
npm run build    # Builds to dist/
```

### Step 2: Upload files via cPanel API
```bash
# Upload new files (use upload_files - works for NEW files only)
curl.exe -k -s -X POST "https://mineazy.co.zw:2083/execute/Fileman/upload_files" \
  -H "Authorization: cpanel npivfupq:NCNPUNZDOTUYNOZYQ4T2AZ49BNACMMRO" \
  -F "dir=/home/npivfupq/fleet.mineazy.co.zw/dist/assets" \
  -F "file-0=@dist\assets\filename.js"

# Update existing files (use save_file_content)
curl.exe -k -s -X POST "https://mineazy.co.zw:2083/execute/Fileman/save_file_content" \
  -H "Authorization: cpanel npivfupq:NCNPUNZDOTUYNOZYQ4T2AZ49BNACMMRO" \
  -d "dir=/home/npivfupq/fleet.mineazy.co.zw/server&file=prod.cjs&content=..."
```

### Step 3: Run DB migration (if schema changed)
Via phpMyAdmin: paste contents of `server/migration_submitted_by.sql` into SQL tab.
The migration is idempotent — safe to re-run.

### Step 4: Deploy on CloudLinux Selector
1. Go to **cPanel » Node.js Selector**
2. Find the fleet app
3. Click **"Deploy"** (this copies disk files into the sandboxed environment)
4. If Deploy doesn't exist, try **"Re-deploy"** or restart the application

### Step 5: Run the in-app migration
```bash
curl.exe -k -s -X POST "https://fleet.mineazy.co.zw/api/migrate"
```
This runs `ALTER TABLE` to add `submittedBy`/`submittedById` if they don't exist.

---

## Seed Users (password: `password`)
| Name | Role | Email |
|---|---|---|
| Tadiwa Magora | Administrator | tadiwamagora45x@gmail.com |
| Alfred Moyo | Director | alfred.moyo@fleetcommand.co.zw |
| John Mandaza | Manager | john.mandaza@fleetcommand.co.zw |
| Sarah Gumbo | Manager | s.gumbo@fleetcommand.co.zw |
| Grace Sibanda | Accounts | grace.sibanda@fleetcommand.co.zw |
| Taurai Chigumbura | Treasurer | taurai.c@fleetcommand.co.zw |
| Simba Chikosi | Driver | simba.c@fleetcommand.co.zw |
| Cleophas Sithole | Attendant | cleo.sithole@fleetcommand.co.zw |

---

## Dev Commands
```bash
npm run dev        # Frontend dev server (port 3000)
npm run build      # Build frontend
npm run server     # API server (port 3001)
npm run dev:all    # Both concurrently
npm run lint       # TypeScript check
```

---

## Current Session Changes Summary

### Bug Fixed: Driver requisitions not appearing in ledger
**Root cause**: The production server (`server/prod.cjs`) INSERT statement was missing `submittedBy`/`submittedById` columns. The frontend sent submitter info but the backend silently dropped it. On next API fetch, `submittedById` returned as `null`, so the driver filter never matched.

### Files changed:

**`src/types.ts`** — Added `submittedBy?: string` and `submittedById?: string` to `FuelRequisition` interface.

**`src/context/FleetContext.tsx`**:
- `addFuelRequisition` (line ~514): Sets `submittedBy: activeUser?.name` and `submittedById: activeUser?.id` on new requisitions.
- `loadFromApi` (lines ~135-155): Merges API data instead of replacing. API data is the base, locally-created items not yet in the API are preserved.
- **MySQL DECIMAL normalization**: All numeric fields from API responses are converted via `Number()` to handle MySQL strings (`"763.00"` → `763`). Applied to: `fuelRequisitions` (litresRequested, estimatedCost, redeemedActual*), `fuelLogs` (litres, cost), `maintenance` (cost), `trucks` (fuelRate, mileage), `drivers` (rating, tripsCompleted), `jobs` (weight, fuelAllocated, income, estimatedHours).

**`src/pages/RequisitionsPipeline.tsx`** (line ~71-73):
```typescript
const filteredRequisitions = isDriver 
  ? fuelRequisitions.filter(r => r.submittedById === activeUser?.id || r.driverName === activeUser?.name)
  : fuelRequisitions;
```
Driver filter now matches by `submittedById` (who created it) OR `driverName` (who it's for).

**`src/components/NavigationSidebar.tsx`**:
- Added password-protected role switcher. Clicking a different user opens a password modal.
- Requires current user's password before switching identities.
- Uses `save_file_content` API pattern for file updates.
- Added `Lock` icon and `User` type import (renamed icon to `UserIcon` to avoid conflict).

**`server/prod.cjs`**:
- Line 59: INSERT now includes `submittedBy, submittedById` columns (30 params, up from 28).
- Lines 79-90: Added `POST /api/migrate` endpoint that runs `ALTER TABLE` to add `submittedBy`/`submittedById` columns (idempotent — catches `ER_DUP_FIELDNAME`).
- Lines 92-95: Serves static frontend from `dist/` directory.
- **CRITICAL**: This file's changes will only take effect after "Deploy" in the CloudLinux Node.js Selector.

**`server/migration_submitted_by.sql`** — Idempotent migration using `INFORMATION_SCHEMA` to check if columns exist before adding.

**`server/schema.sql` + `schema_fixed.sql`** — Added `submittedBy VARCHAR(100)` and `submittedById VARCHAR(50)` columns to `fuel_requisitions` table.

**`app.js`** (root) — Thin startup file: `require('./server/prod.cjs');`. Created but **not used** — the CloudLinux Node.js Selector is configured to use `server/prod.cjs` directly.

### CURRENT STATE (as of session end):
- ✅ All frontend and server code changes are committed to the local repo
- ✅ Built `dist/` files are on the server (via `upload_files` API)
- ✅ Updated `server/prod.cjs` is on the server disk (via `save_file_content` API)
- ✅ DB columns `submittedBy`/`submittedById` EXIST in the production database
- ❌ **The CloudLinux Node.js Selector needs "Deploy" action** to sync the sandboxed environment with the updated disk files
- ❌ `/api/migrate` endpoint returns 404 — the running process is using the OLD cached code
- ❌ All existing requisitions have `submittedBy: null, submittedById: null` — the old INSERT still running
- ❌ Driver requisitions still not appearing for their creators

### NEXT STEPS (for anyone resuming this work):
1. Go to **cPanel » Node.js Selector** and click **"Deploy"** on the fleet app
2. After deploy, run `POST https://fleet.mineazy.co.zw/api/migrate` to ensure DB columns exist
3. Verify by creating a new requisition as a Driver — it should appear in their ledger
4. If the CloudLinux selector has no "Deploy" button, the entire app needs to be re-registered or the selector needs to be disabled in favor of standard cPanel Passenger
