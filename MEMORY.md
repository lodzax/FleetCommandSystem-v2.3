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
- **API Token**: set in `.env` as `CPANEL_TOKEN`
- **Auth header**: `Authorization: cpanel npivfupq:<token>`
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
- Password: set in `.env`
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
  -H "Authorization: cpanel npivfupq:$CPANEL_TOKEN" \
  -F "dir=/home/npivfupq/fleet.mineazy.co.zw/dist/assets" \
  -F "file-0=@dist\assets\filename.js"

# Update existing files (use save_file_content)
curl.exe -k -s -X POST "https://mineazy.co.zw:2083/execute/Fileman/save_file_content" \
  -H "Authorization: cpanel npivfupq:$CPANEL_TOKEN" \
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

## Security Hardening (June 2026)

### Changes: Removed all hardcoded passwords, seed / dummy data, and fallback secrets

| File | What changed |
|------|-------------|
| `server/schema.sql`, `schema.cpanel.sql`, `schema_fixed.sql` | Removed all `INSERT INTO users/trucks/drivers/…` seed statements. Kept only default `app_settings`. |
| `scripts/init-db.ts` | Stripped to schema-only init. Removed 7 seed users, trucks, drivers, requisitions, and all `console.log` of credentials. |
| `src/data/mockData.ts` | All export arrays set to `[]` (empty). Preserves imports, gives production a clean slate. |
| `src/context/FleetContext.tsx` | `resetAllData` no longer references mock data; uses `activeUser` directly. |
| `server/prod.cjs` | Removed fallback `JWT_SECRET`. Added startup crash if `JWT_SECRET` is not set. |
| `server/routes/auth.ts` | Removed fallback `'fallback-dev-secret'`. Added throw if `JWT_SECRET` not set. |
| `server/sendmail.cjs` | SMTP credentials (`notifications@mineazy.co.zw` / `M1n3@zy2026`) moved to env vars: `SMTP_HOST/PORT/USER/PASS/FROM_NAME/FROM_EMAIL`. |
| `deploy.sh` | Hardcoded `-p"M1n3@zy2026"` replaced with `-p"$DB_PASSWORD"`. |
| `server/migration_submitted_by.sql` | Password removed from comment. |
| `MEMORY.md` | Removed seed users table, API token, DB password, and embeded credentials from deploy commands. |
| `deploy_env.txt` | Replaced real values with empty placeholders (template only). |
| `test-passwords.cjs`, `init-db.cjs`, `init-db-alt.cjs`, `test-mysql.cjs` | Rewired to read from environment variables instead of hardcoded `password: ''`. |
| `scripts/mysql-reset-pw.sql` | SQL commented out (no-op reference only). |

### Updated `.env.example` — Added SMTP and CPANEL_TOKEN vars.
### Build verified: `npm run build` passes cleanly.
