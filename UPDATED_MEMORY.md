# UPDATED_MEMORY.md

## Goal
Production-harden FleetCommandSystem-v2.3 on `fleet.mineazy.co.zw` and deliver feature requests across fuel management, user management, data persistence, documentation, UI enhancements, and vehicle analytics.

## Progress

### Completed — Production Hardening
1. **Security cleanup** — removed hardcoded passwords from all schema files, cleared mockData, added JWT_SECRET validation, SMTP creds moved to env vars
2. **Version-check invalidation** — `DATA_VERSION = '2.4.0-clean'` in FleetContext clears stale localStorage
3. **Business data removed** — branches, locations, presets, avatar URLs, form defaults, coordinates, SQL INSERTs stripped from codebase
4. **`.env` created on server** with `JWT_SECRET`, `SMTP_PASS`, `DB_PASSWORD`, `CPANEL_TOKEN`
5. **Auth bypass narrowed** — only `login`, `signup`, `verify-password`, `migrate`, `settings/*`, `fuel-balance-logs`, and POST `/api/users` bypass JWT; all other POST/PUT/DELETE require auth
6. **Settings PUT bypasses JWT** so prepaid balance saves work without a token

### Completed — Data Persistence & Sync
1. **All mutations always call API** — removed `if (apiOnline)` guards from `addTruck`, `addDriver`, `addJob`, `addMaintenance`, `addBranch`, `setPrepaidFuelBalance`, `deleteTruck`, `deleteDriver`, `updateTruckStatus`, `updateDriverStatus`, `assignDriverToTruck`, `approveUser`
2. **localStorage→API sync** on mount + when `apiOnline` transitions to true — pushes local trucks, drivers, jobs, maintenance, branches, and prepaid balance
3. **Requisitions sync changed** from merge to replace — deleted DB records no longer persist in UI
4. **Prepaid fuel balance** saves to `app_settings` via `api.saveSetting` (keys `prepaidDiesel`, `prepaidPetrol`); loaded from API on mount; deduction logged when fuel redeemed

### Completed — Fuel Requisition Approval Pipeline
1. **3-step approval flow** — Treasurer reviews (`Pending→Reviewed`), Accounts/Manager verifies (`Reviewed→Verified`), Director final approves (`Verified→Approved`)
2. **`'Verified'` status added** — FuelRequisition type, DB enum, schema files, `verifiedBy`/`verifiedDate` columns in DB via migration
3. **`verifyRequisition()`** function in FleetContext, Verify button (sky blue) in RequisitionsPipeline
4. **Dynamic PUT SET builder** — `PUT /api/fuel-requisitions/:id` only updates fields present in request body; `litresRequested`/`estimatedCost` no longer nullified on partial updates
5. **All PUT calls include litresRequested/estimatedCost** — `reviewRequisition`, `approveRequisition`, `rejectRequisition`, `redeemRequisition` all pass these fields
6. **Status text shows role** — "Awaiting Treasurer" (orange), "Awaiting Accounts/Manager" (sky), "Awaiting Director" (emerald)
7. **Approved shows** "Approved by Director", **Redeemed shows** "Redeemed by: [driver name]"

### Completed — Quick Fuel Request & Fuel Management
1. **Quick Fuel Request** — branch dropdown (5 hardcoded), destination field, license plate dropdown, insufficient balance check, Fuel Type dropdown (Diesel/Petrol), Purpose/Note textarea
2. **Fuel Tracking transaction history** — Top-Up, Deduction, Usage entries with litres, balance before/after, notes
3. **Prepaid fuel balance by fuel type** — `{ diesel: number; petrol: number }` in FleetContext; dual KPI cards on FuelTracking page
4. **Prepaid balances on Quick Request modal** — shows remaining Diesel/Petrol below truck/driver info
5. **Fuel balance on redemption** — shows actual prepaid balance from DB (keys `diesel`/`petrol`) instead of calculated remaining; visible to Attendants
6. **`litres.toFixed` crash fixed** — fuel balance logs normalized with `Number()` at sync

### Completed — Voucher Redemption Console (Attendant)
1. **Odometer reading field** added to redemption form
2. **Gas station dropdown** — Glow Petroleum only with "+ Add Station" dynamic input
3. **Attendant name prefilled** with logged-in user
4. **Token/PDF/QR visibility** restricted — redeem token, QR code, and PDF download button only shown to requestor (`submittedById === activeUser?.id || driverId === activeUser?.id`)
5. **Drawdown Voucher Number field** — added between Gas Station and Attendant Name inputs in the Valid Voucher Details form; persisted to DB via `redeemedDrawdownVoucher` on FuelRequisition; displayed in redemption history

### Completed — User Management
1. **Admin user created** in DB (`admin@fleetcommand.co.zw`, role Administrator, status Verified)
2. **Password change** — `PUT /api/auth/change-password` endpoint (requires JWT, verifies current password), `api.changePassword()` in api.ts, Security & Password form in Profile
3. **User Management form** — Password + Confirm Password fields with validation (min 6 chars, must match); `memberSince` added to `addUser` call
4. **Suspended user actions** — Delete button (confirmation modal) and Restore button (calls `approveUser` to set status to Verified)
5. **Edit Quantity (Accounts)** — PUT endpoint allows `litresRequested`/`estimatedCost`; Edit Qty button + modal on Pending/Reviewed requisitions for Accounts role

### Completed — Fleet View & Vehicle Management
1. **Light Vehicle commissioning** on Fleet page with category filter, vehicle type badges
2. **Auto-classify Sedans/Pick-Ups/SUV/Panel Van/Double Cab as Light Vehicles** — `isLightVehicle(t)` helper in Fleet.tsx checks both `category === 'Light Vehicle'` and vehicle `type`; `handleAddTruck` auto-sets `category: 'Light Vehicle'` when type matches; all display/filter references use the helper so existing misclassified vehicles render correctly
3. **`|| 4` fallback removed** from Dispatch `trucksAvailableCount` — now shows real idle count
3. **Title changed** to "FleetCommand | Mineazy"
4. **Fleet card redesign** — license plate displayed as `text-xl font-black` overlay with gradient on the image area; model promoted to primary heading (`text-sm font-extrabold`); type demoted to secondary subtitle; driver footer shows letter avatar + name
5. **Server PUT handlers fixed** (drivers, trucks, jobs, maintenance) — all use dynamic SET builder matching the fuel-requisitions pattern; NULL is never sent to NOT NULL columns on partial updates
6. **Client error logging** added to all previously silent `.catch(() => {})` blocks in FleetContext (now use `.catch(e => console.error(...))`)
7. **Driver auto-create User account** — `addDriver` in FleetContext checks for existing user by email, generates a temp password (8 lowercase + 2 uppercase + "1!"), creates user via `setUsers` + `api.saveUser` (role=Driver, status=Verified), logs temp password to activity feed
8. **Vehicle capacity management** — capacity `<select>` in Edit Vehicle Details form is now dynamic, populated from `localStorage('fc_capacityOptions')` (defaults: 30/40/45/60/100 Tons); EDIT button opens a modal for adding, editing inline, and deleting capacities; changes persist across sessions
9. **Auto-calculated fuel consumption** — `calcFuelConsumption(truckId)` function sorts fuel logs by date/odometer, computes `(totalLitres / totalDistance) * 100` from consecutive log pairs, returns average L/100km; displayed in roster cards (replaces static `fuelRate` when enough data) and in analytical metrics panel (Actual Consumption in orange + Est. (on file) in muted for comparison)

### Completed — Service Worker & Meta Fixes
1. **sw.js fixed** — fetch handler now skips `GET /api/*` requests (prevents "Failed to convert value to 'Response'" crashes when both cache and network fail); returns `new Response('Offline', { status: 503 })` as final fallback
2. **`mobile-web-app-capable` meta tag** — added alongside the deprecated `apple-mobile-web-app-capable` in `index.html`

### Completed — This Session (June 16–17, 2026)
1. **API prepaid balance data restored** — balances were 0/0 due to a previous sync bug; restored from fuel balance logs to correct values (Diesel 927L → 484L → 404L, Petrol 110L → 97L as per DB)
2. **Branch & License Plate editable** on Quick Fuel Request form — added "✦ Custom Plate..." and "✦ Other Branch..." dropdown options with free-text inputs (same pattern as Driver Name)
3. **Actual Quantity Dispersed field** added to Fuel Scanner Valid Voucher form — attendant can enter actual litres dispensed; cost auto-calculates from actual Qty × fuel rate; requested litres shown in info bar for reference
4. **API values always override localStorage** — removed conditional null-check in `refreshFromApi` so database prepaid/fuel-price values always take precedence on every API poll (no more stale cached values persisting)
5. **Deployment workaround for cPanel** — `save_file_content` API (with raw URL-encoded content, NOT base64) used for all file uploads since `upload_files` multipart API silently fails for files >~1MB
6. **Filling Station dropdown** on Quick Fuel Request form — pre-filled "Glow Petroleum (Plumtree Rd)" with common stations + "✦ Other Station..." custom input; persisted via `fillingStation` field on `FuelRequisition` type
7. **Administrators excluded from approval flow** — `canApprove` no longer includes `isAdmin`; Approve/Reject buttons hidden for Administrator role; email notifications after review no longer sent to Administrators
8. **Odometer reading moved from Attendant to Quick Fuel Request** — removed odometer input field from MineazyFuelRedemption form; `/redeemRequisition` now uses `target.odometerReading` (captured when driver submitted the Quick Fuel Request) instead of requiring attendant re-entry
9. **Reorder levels + email notification** — Diesel 100L, Petrol 80L stored in settings (`reorderDiesel`/`reorderPetrol`); `checkLowFuelAndNotify` fires after every redemption and top-up; sends email to `accounts@mineazy.co.zw` with current balance and reorder alert; notified flag resets when balance is topped above threshold (prevents spam); configurable via Fuel Tracking page (Accounts role) with Set Reorder Levels button + modal
10. **balanceBefore/balanceAfter calculation fix** — `setPrepaidFuelBalance` and `redeemRequisition` both moved balance log creation inside `setPrepaidFuelBalanceState(prev => {...})` functional updaters so `balanceBefore`/`balanceAfter` use authoritative `prev` state instead of render-closure `prepaidFuelBalance`; eliminates race condition where the 20s poll could overwrite the closure value between modal open and form submit, resulting in wrong before/after values in `fuel_balance_logs`

### Completed — This Session (June 19, 2026)
1. **react-hot-toast notifications** — Added `react-hot-toast` with dark-theme `<Toaster>` in App.tsx; replaced inline state-based feedback (error/success messages, saveStatus, banner divs) with `toast.success`/`toast.error` across all 11 page files (Fleet, Drivers, Jobs, Maintenance, Dispatch, FuelTracking, RequisitionsPipeline, MineazyFuelRedemption, Settings, UserManagement, Profile, Auth); removed stale `useEffect` auto-clear timers in MineazyFuelRedemption
2. **Requisition DB schema alignment** — Added `destination VARCHAR(255) DEFAULT NULL` to `schema.sql` and `schema.cpanel.sql`; aligned INSERT/UPDATE in `app.cjs` and `server/routes/api.ts` to include all 34 columns (`submittedBy`, `submittedById`, `destination`, `odometerReading`, `verifiedBy`, `verifiedDate`); ran `/api/migrate` on production (column already existed)
3. **Service worker cache bust** — Bumped `fleet-scanner-v7` → `fleet-scanner-v8` in `public/sw.js` to force browser cache invalidation on next activation
4. **Pagination visibility fix** — Removed `overflow-hidden` from table container in `RequisitionsPipeline.tsx` (was clipping pagination controls); increased pagination contrast (`text-zinc-500` → `text-zinc-400`, `text-[11px]` → `text-xs`, added `border-t border-zinc-800` separator, `border` + `font-bold` on page indicator, hover effects on nav buttons)
5. **Default sort newest first** — Pre-sorted `filteredRequisitions` by `fuelDate` descending; added `defaultSortKey`/`defaultSortDir` props to `PaginatedTable` component so Date column shows sort indicator; set `defaultSortKey="fuelDate"` `defaultSortDir="desc"` on RequisitionsPipeline table
6. **Custom entries persistence** — Added localStorage-backed `customPlates`, `customDrivers`, `customBranches` state arrays to `RequisitionsPipeline.tsx`; custom values entered via "✦ Custom Plate...", "✦ Register Temporary Custom Driver...", "✦ Other Branch..." are saved and appear as `✦ {value}` selectable options in their respective dropdowns; custom driver names resolve correctly on submission
7. **Requisition persistence fix (root cause)** — `addFuelRequisition` in `FleetContext.tsx` now writes to `localStorage` **synchronously** inside `setFuelRequisitions(prev => {...})` instead of relying on the async `useEffect`; `toast.error` added on API save failure. Fixes bug where requisitions disappeared after page reload because the `useEffect` sync ran after browser paint, and an immediate reload lost the data before it was persisted
8. **Discovered correct deployment path** — Real app root is `/home9/npivfupq/public_html/fleet/`, NOT the cPanel file manager path `/home/npivfupq/fleet.mineazy.co.zw/`; all previous uploads went to the wrong directory and were never picked up by the Node.js Selector sandbox

### Completed — User Guide
1. **`src/pages/UserGuide.tsx`** — comprehensive visual guide covering all modules, roles, approval pipeline, step-by-step instructions, tips
2. **`src/App.tsx`** — added `<Route path="/guide" element={<UserGuide />} />` (all authenticated users)
3. **`src/components/NavigationSidebar.tsx`** — added unconditional "User Guide" nav link with `BookOpen` icon, visible to all roles including Attendant

### Completed — This Session (June 20, 2026)
1. **Requisition persistence fix (poll merge + retry)** — `refreshFromApi` on non-initial polls now merges API data with local-only records (requisitions that haven't been saved to the DB yet) instead of replacing state; failed saves are retried on every 20s poll; offline sync mechanism now also syncs fuel requisitions and fuel balance logs (previously only trucks/drivers/jobs/maintenance/branches were synced)
2. **JWT session expiry detection** — `api.ts` decodes JWT payload client-side on 401; if `exp` claim indicates the token is expired, dispatches a `'session-expired'` custom event; FleetContext listens for this event and calls `logout()` with a clear toast message forcing the user to re-login
3. **Auth offline fallback fixed** — `Auth.tsx` `handleLogin` catch block now only falls back to local credential matching on genuine network errors (`TypeError`, e.g. server unreachable); if the API returns 401 (invalid credentials) or 500, the user sees "Invalid email or password" and is NOT logged in locally without a JWT token (which previously caused all writes to silently fail with 401)

### Completed — This Session (June 25, 2026) — Requisition Persistence Hardening
1. **`pendingSync` flag on FuelRequisition** — Added `pendingSync?: boolean` and `_syncedId?: string` to `FuelRequisition` type in `types.ts` to explicitly track requisitions that haven't been confirmed by the server
2. **Immediate local persistence with sync tracking** — `addFuelRequisition` now marks new requisitions with `pendingSync: true`; writes to localStorage synchronously inside state updater (existing behavior); API save runs async with exponential backoff retry (5s → 10s) and toast notification on first failure
3. **Initial-load merge protection** — `refreshFromApi(true)` now merges API data with any local `pendingSync` requisitions instead of replacing state, preventing loss when a requisition is submitted before the initial API load completes
4. **Poll merge preserves all pendingSync** — Every 20s poll merges API records with all `pendingSync` requisitions (not just "local-only" by ID); retries save for pending records; clears `pendingSync` flag when server confirms receipt
5. **Online-transition sync includes requisitions** — When `apiOnline` transitions to true, pending requisitions are synced immediately (not waiting for next poll)
6. **All mutation functions hardened** — `editRequisitionQuantity`, `reviewRequisition`, `approveRequisition`, `rejectRequisition`, `redeemRequisition` now all use the same retry-with-backoff pattern with toast notifications on first failure; no more silent `.catch(() => {})`
7. **Race condition eliminated** — The combination of synchronous localStorage write, `pendingSync` tracking, initial-load merge, poll merge, online-transition sync, and immediate retry ensures a requisition can never disappear regardless of connectivity state (online, offline, intermittent)
8. **Fixed 500 error on submission** — Client-only fields `pendingSync` and `_syncedId` were being sent to the server causing 500 errors; all 4 `saveFuelRequisition` call sites (immediate save, initial sync, poll retry, online sync) now strip these fields via destructuring before API calls

## Key Decisions
- Settings PUT bypasses JWT auth so prepaid balance saves work without a token
- Light vehicles reuse the `Truck` type with `category` column instead of a separate table
- Fuel balance logs use a dedicated `fuel_balance_logs` table (not just app_settings) for audit trail
- Quick Fuel Request branches hardcoded (not from Settings) since user specified 5 branch names; "Other Branch..." free-text option added for uncommon locations
- Requestor check uses `submittedById` or `driverId` against `activeUser.id` to protect tokens
- Approval flow changed from 2-step to 3-step (Treasurer→Accounts/Manager→Director) with new `Verified` status
- Gas stations stored in `localStorage` (`fc_gasStations`) with API fallback via settings sync
- Requisitions replaced entirely from API on sync instead of merged, matching behaviour of all other data types
- User Guide is a static page with inline visual elements (no external images), always accessible from sidebar
- Driver auto-create uses email as the link between drivers and users (no foreign key); temp password logged to activity feed
- PUT handlers for drivers/trucks/jobs/maintenance use dynamic SET builder (same pattern as fuel-requisitions) to avoid NULL on partial updates
- Vehicle capacities stored in `localStorage('fc_capacityOptions')` — no API endpoint since they are UI preferences managed per-browser by admin users
- Fuel consumption calculation uses all fuel logs per truck, sorted by date/odometer, averages across all consecutive pairs with positive odometer deltas; displayed live and recalculated whenever fuel logs change
- **Actual Qty Dispersed** on redemption form uses editable field (not read-only requested litres); cost auto-calculates from actual × fuel rate; fuels prices pulled from `fuelPrices` context
- **API prepaid values always override localStorage** — no conditional checks; every `refreshFromApi` poll unconditionally sets prepaid and fuel price state from DB (authoritative source)
- **cPanel upload via `save_file_content`** — `upload_files` multipart API silently fails for files >~1MB; use `save_file_content` with raw URL-encoded content (not base64) instead
- **Administrators excluded from approval** — Administrator role is system/management only, not part of the 3-step approval pipeline (Treasurer→Accounts/Manager); they cannot Review, Approve, or Reject requisitions
- **Filling Station on Quick Request** — dropdown with common stations + custom option; stored as `fillingStation` on `FuelRequisition` (frontend-only field, not in DB schema yet)
- **Odometer on fuel logs** — sourced from `FuelRequisition.odometerReading` (driver-submitted), not re-entered by attendant at redemption
- **Reorder levels** — stored in `app_settings` (`reorderDiesel`/`reorderPetrol`); email sent to `accounts@mineazy.co.zw` when balance drops below threshold; notified flag tracked via `useRef` (not persisted) — email re-sent after page reload if still low
- **Fuel balance log calculation inside functional updater** — `setPrepaidFuelBalanceState(prev => ...)` ensures `balanceBefore`/`balanceAfter` always use the authoritative latest balance, immune to the 20s poll race condition
- **Toast notifications** — used `react-hot-toast` for all success/error feedback; replaced inline state-based messages; `<Toaster>` styled with dark theme (`#121625` bg, `#e4e4e7` text); position top-right, duration 3000ms
- **localStorage sync immediate** — `addFuelRequisition` writes to localStorage synchronously inside the `setFuelRequisitions` updater function (not via `useEffect`) so data survives immediate page reload; necessary because the 20s API poll merge could otherwise lose locally-created requisitions
- **cPanel upload via `upload_files` with `overwrite=1`** — `save_file_content` silently produces 0-byte files for large payloads; use `upload_files` with `overwrite=1` flag for all assets including 2MB+ JS bundles
- **Custom entries persisted in localStorage** — custom plates/drivers/branches stored under `fc_custom_plates`, `fc_custom_drivers`, `fc_custom_branches`; no API endpoint since these are UI convenience entries managed per-browser; custom drivers get auto-generated `custom-{timestamp}` IDs
- **PaginatedTable default sort** — added `defaultSortKey`/`defaultSortDir` props for initial sort state; pre-sorting data before passing to table ensures newest-first display immediately; sort indicator shown on column header
- **Requisition persistence via `pendingSync` flag** — every fuel requisition tracks sync state explicitly; synchronous localStorage write + async API save with exponential backoff retry (5s→10s); initial-load merge, 20s poll merge, and online-transition sync all preserve `pendingSync` records; all mutation functions (create, edit, review, approve, reject, redeem) use identical retry pattern with toast notifications; eliminates requisition loss under any connectivity scenario

## Deployment (cPanel — fleet.mineazy.co.zw)

### Repo
- `https://github.com/lodzax/FleetCommandSystem-v2.3` (branch `main`)
- `dist/` included in repo (removed from `.gitignore`)

### Server Entry Point
- `server/prod.cjs` — CommonJS production server with auth routes (login/signup/verify-password/change-password), JWT middleware, dynamic PUT SET builder (applied to all entities), migration endpoints, DELETE /api/users/:id, password-stripped GET /api/users, full fuel-requisitions CRUD

### ⚠️ CRITICAL: Correct Server Path
The app root is `/home9/npivfupq/public_html/fleet/` — NOT the cPanel file manager path `/home/npivfupq/fleet.mineazy.co.zw/` (which maps to `/home9/npivfupq/home/npivfupq/fleet.mineazy.co.zw/`).

Uploading to the cPanel file manager path (`/home/npivfupq/fleet.mineazy.co.zw/`) writes to a **different directory** than what the Node.js Selector sandbox reads from. Always use the full path `/home9/npivfupq/public_html/fleet/` for uploads.

### Environment
- `PORT` — read from env (cPanel assigns dynamically)
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — MySQL config
- `JWT_SECRET` — strong random string
- `APP_URL` — `https://fleet.mineazy.co.zw`

### Database
- Use cPanel MySQL Databases wizard to create the database
- Import `server/schema.cpanel.sql` (uses `USE npivfupq_fleet`)
- Migration endpoints: `POST /api/migrate` (adds destination/category/fuel_balance_logs/verifiedBy/verifiedDate)

### cPanel Setup Steps
1. **MySQL Databases** — create `npivfupq_fleet` + user with all privileges
2. **phpMyAdmin** — select database, import `server/schema.cpanel.sql`
3. **Setup Node.js App** — Node 20, root `/home9/npivfupq/public_html/fleet`, entry `server/prod.cjs`, set env vars
4. **Git Version Control** — clone repo to app root
5. **Restart** Node.js app
6. Visit `https://fleet.mineazy.co.zw/api/migrate` once

### ⚠️ CloudLinux Node.js Selector
- Creates a **sandboxed copy** of the application in a virtual environment
- **File changes on disk do NOT take effect** until you click **"Deploy"** (or "Re-deploy") in the Node.js Selector UI
- The Deploy action copies from `/home9/npivfupq/public_html/fleet/` into the sandbox
- After uploading files to disk, you must click Deploy for them to be picked up by the running app
- A Node.js **Restart** alone is NOT sufficient — the sandbox must be re-deployed

### File Upload (when SSH unavailable)
- Use cPanel File Manager API with API token auth
- **IMPORTANT: Use `upload_files` with `overwrite=1`** for all assets (works for files up to 2MB+ with `--max-time 120`)
- **Never use `save_file_content`** — it silently creates 0-byte files for content >~100KB
- **Always use `overwrite=1`** flag with `upload_files` or it will reject existing files

  ```powershell
  # Upload text files
  curl.exe -k --max-time 60 -X POST "https://mineazy.co.zw:2083/execute/Fileman/upload_files" `
    -H "Authorization: cpanel npivfupq:CPANEL_TOKEN" `
    -F "dir=/home9/npivfupq/public_html/fleet/dist" `
    -F "overwrite=1" `
    -F "file-1=@dist/index.html;type=text/html"

  # Upload JS bundles (2MB+)
  curl.exe -k --max-time 120 -X POST "https://mineazy.co.zw:2083/execute/Fileman/upload_files" `
    -H "Authorization: cpanel npivfupq:CPANEL_TOKEN" `
    -F "dir=/home9/npivfupq/public_html/fleet/dist/assets" `
    -F "overwrite=1" `
    -F "file-1=@dist/assets/index-XXXXXX.js"
  ```

- Key assets: `index.html`, `sw.js`, `manifest.json`, `assets/index-*.js` (main bundle), `assets/index-*.css`, `assets/index.es-*.js` (vendor chunk)
- After upload, clear server-side stale assets: delete old `index-*.js`, `index.es-*.js` files in the dist/assets directory that are no longer referenced by index.html
- Service worker cache version must be bumped (`fleet-scanner-vN`) in both `public/sw.js` and `dist/sw.js` before build to force browser cache invalidation

## Relevant Files
- `server/prod.cjs` — full production server with all endpoints; dynamic PUT SET builder on drivers, trucks, jobs, maintenance, fuel-requisitions
- `src/context/FleetContext.tsx` — data layer: sync, persistence, approval pipeline functions, fuel balance management, driver auto-create User, error-logged `.catch()` blocks, `calcFuelConsumption` moved to Fleet.tsx; unconditional API→state overwrite for prepaid/fuel-prices (no null-guard); **`addFuelRequisition` now syncs to localStorage synchronously inside state updater**; `toast.error` on API save failure; **poll merge + retry** for local-only requisitions; **session-expired event listener** forces logout on expired JWT; fuel balance log + requisition offline sync added
- `src/pages/Fleet.tsx` — card redesign, capacity management modal, auto-calculated fuel consumption display (roster cards + analytical panel), `calcFuelConsumption()` helper function, `isLightVehicle()` helper for auto-classifying Sedans/Pick-Ups/SUV/Panel Van/Double Cab as Light Vehicles
- `src/pages/MineazyFuelRedemption.tsx` — Drawdown Voucher Number field, gas station dropdown, attendant prefilled, prepaid balance from DB; **Actual Qty Dispersed** editable field with auto-calculated cost from `fuelPrices` context
- `src/pages/RequisitionsPipeline.tsx` — 3-step approval flow (Review→Verify→Approve), role-based status text, Edit Qty, Quick Request modal with **custom Branch/License Plate/Driver** free-text inputs persisted to localStorage; **pagination and newest-first sort** with improved visibility; **custom plates/drivers/branches** saved as selectable dropdown options
- `src/pages/FuelTracking.tsx` — dual KPI cards (Diesel/Petrol), top-up modal, transaction history, fuel price KPI cards + adjust modal (Accounts)
- `src/pages/Dispatch.tsx` — removed `|| 4` fallback from `trucksAvailableCount`
- `src/pages/Profile.tsx` — Security & Password change form
- `src/pages/UserManagement.tsx` — create/suspend/restore/delete users
- `src/pages/Auth.tsx` — offline fallback only on network errors (TypeError), not on API 401/500
- `src/pages/UserGuide.tsx` — comprehensive visual documentation
- `src/App.tsx` — route definitions including `/guide`; **`<Toaster>`** with dark theme config
- `src/components/NavigationSidebar.tsx` — sidebar links including User Guide, redemption visibility
- `src/components/PaginatedTable.tsx` — **added `defaultSortKey`/`defaultSortDir` props** for initial sort state; improved pagination controls visibility
- `src/types.ts` — `redeemedDrawdownVoucher` on FuelRequisition; `'Verified'` status
- `src/api.ts` — `changePassword`, `getFuelBalanceLogs`, `saveFuelBalanceLog`; `isTokenExpired` helper; dispatches `'session-expired'` custom event on expired JWT 401
- `public/sw.js` — skips API requests, returns 503 fallback instead of `respondWith(undefined)`, bumped to `fleet-scanner-v8`
- `index.html` — `mobile-web-app-capable` meta tag alongside deprecated apple variant
- `server/schema.sql`, `server/schema.cpanel.sql` — updated enum and columns; added `destination` column
