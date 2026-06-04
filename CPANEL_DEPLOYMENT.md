# cPanel Deployment Guide — fleet.mineazy.co.zw

## Prerequisites
- Git repo: `https://github.com/lodzax/FleetCommandSystem-v2.3` (already pushed, `main` branch)
- cPanel access for `npivfupq`
- Document root: `/home9/npivfupq/public_html/fleet`

---

## Step 1: Create MySQL Database

1. In cPanel, go to **MySQL Databases**
2. Create a new database: `npivfupq_fleet`
3. Create a database user: `npivfupq_fleet_user` with a strong password
4. Add the user to the database with **ALL PRIVILEGES**
5. Note the credentials (host: `localhost`, database: `npivfupq_fleet`, user, password)

## Step 2: Import Schema

1. In cPanel **phpMyAdmin**, select the `npivfupq_fleet` database
2. Click **Import**, choose the `server/schema.sql` file from the repo, and run it
3. This creates all tables and default seed data

## Step 3: Set Up Node.js App

1. In cPanel, go to **Setup Node.js App** (under Software)
2. Click **Create Application**
   - **Node.js version**: 20
   - **Application mode**: Production
   - **Application root**: `/home9/npivfupq/public_html/fleet`
   - **Application URL**: `https://fleet.mineazy.co.zw`
   - **Application startup file**: `server/prod.cjs`
   - **Environment variables**: Add the variables from the `.env` file (see Step 4)
   - Leave **Application path** and **Passenger log file** as defaults
3. Click **Create**

## Step 4: Configure Environment

Set these environment variables in the Node.js app (or create a `.env` file in the app root):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=npivfupq_fleet_user
DB_PASSWORD=your_mysql_password
DB_NAME=npivfupq_fleet
JWT_SECRET=<generate-a-strong-random-string>
APP_URL=https://fleet.mineazy.co.zw
API_PORT=3001
```

## Step 5: Set Up Git Deployment

1. In cPanel, go to **Git Version Control**
2. Click **Create**
   - **Clone URL**: `https://github.com/lodzax/FleetCommandSystem-v2.3`
   - **Repository path**: `/home9/npivfupq/public_html/fleet`
   - **Branch**: `main`
3. Click **Create**
4. The repository will clone and deploy automatically
5. For future updates, push to the same repo and cPanel will auto-deploy

## Step 6: Restart & Verify

1. In cPanel **Setup Node.js App**, click **Restart** for the FleetCommand app
2. Visit `https://fleet.mineazy.co.zw` — you should see the login page

## Step 7: Run Migration (first time only)

After the app is running, visit:
`https://fleet.mineazy.co.zw/api/migrate`
This adds the `submittedBy` and `submittedById` columns to `fuel_requisitions` if missing.

## Troubleshooting

- **Blank page or 500 error**: Check the Node.js app logs in cPanel (Setup Node.js App → click the app name → view logs)
- **Database connection error**: Verify MySQL credentials and that the database exists
- **Cannot load data**: Run `GET https://fleet.mineazy.co.zw/api/migrate` once
- **Port issues**: cPanel Node.js apps typically get a random port; the app reads `PORT` from environment. The frontend is served by Express on the same port.
