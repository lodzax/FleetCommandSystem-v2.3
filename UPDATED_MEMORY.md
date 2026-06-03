# UPDATED_MEMORY.md

## Goal
Separate prepaid fuel balances by fuel type (Diesel / Petrol), show balances on Quick Request modal, make "My Fuel Requisitions" visible to all roles, restrict Fuel Redemption to Attendants, and show per-fuel-type breakdown on redemption KPI cards.

## Progress

### Completed this session

1. **Separated prepaid fuel balance by fuel type**
   - `src/context/FleetContext.tsx`: Changed `prepaidFuelBalance` type from `number` to `{ diesel: number; petrol: number }`
   - localStorage key `fc_prepaidFuel` now stores JSON `{ diesel, petrol }` instead of a plain number
   - `redeemRequisition` deducts from the correct fuel type based on requisition's `fuelType`
   - `setPrepaidFuelBalance` accepts an object `{ diesel, petrol }`
   - Reset function initializes both to 0

2. **Updated FuelTracking page for dual balances**
   - `src/pages/FuelTracking.tsx`: Replaced single "PREPAID FUEL BALANCE" KPI card with two separate cards:
     - "PREPAID DIESEL" (blue Droplet icon)
     - "PREPAID PETROL" (green Wallet icon)
   - Adjust modal now has two inputs (Diesel litres, Petrol litres)
   - Added "Adjust Prepaid Fuel" button below cards (Accounts role only)

3. **Showed prepaid balances on Quick Request modal**
   - `src/pages/RequisitionsPipeline.tsx`: Quick Request modal now displays remaining Diesel and Petrol balances below the truck/driver info section

4. **Made "My Fuel Requisitions" visible to all roles**
   - `src/pages/RequisitionsPipeline.tsx`: Removed `isDriverRole` guard from the "My Fuel Requisitions" summary card and Quick Request modal
   - `myRequisitions` filter now applies to all users (by `submittedById` or `driverName`), not just drivers
   - All authenticated users see the summary card with pending/approved/redeemed/total counts and the Quick Request button

5. **Restricted Mineazy Fuel Redemption to Attendant role only**
   - `src/App.tsx`: Changed `canAccessRedemption` from `!isPending && (isAdminOrDirector || role === 'Attendant')` to `!isPending && role === 'Attendant'`
   - `src/components/NavigationSidebar.tsx`: Same change for `showRedemption`

6. **Added per-fuel-type breakdown to redemption KPI cards**
   - `src/pages/MineazyFuelRedemption.tsx`: All three KPI cards (Redeemed Vouchers, Total Fuel Volume, Balance Remaining) now show a Diesel / Petrol breakdown below the totals with colored dot indicators (blue for Diesel, green for Petrol)

## Key Decisions
- Prepaid fuel stored as JSON in localStorage for backward compatibility (reads old plain-number format gracefully)
- Per-fuel-type deduction in `redeemRequisition` uses `target.fuelType` from the requisition
- Fuel type defaults to "Diesel" when `fuelType` is undefined/empty
- All references to `prepaidFuelBalance` across the codebase updated simultaneously to prevent type errors
- Redemption view restriction changed from admin/director/attendant to attendant-only to match role-based access requirements

## Relevant Files
- `src/context/FleetContext.tsx` — prepaidFuelBalance type/setter/deduction logic
- `src/pages/FuelTracking.tsx` — dual KPI cards + two-input adjust modal
- `src/pages/RequisitionsPipeline.tsx` — balances in quick modal, universal driver summary
- `src/pages/MineazyFuelRedemption.tsx` — per-fuel-type KPI breakdown
- `src/App.tsx` — redemption route guard (attendant-only)
- `src/components/NavigationSidebar.tsx` — redemption sidebar visibility (attendant-only)
