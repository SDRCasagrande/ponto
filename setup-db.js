const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new Database(dbPath);

// Create tables matching Prisma schema
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "active" BOOLEAN NOT NULL DEFAULT 1,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

  CREATE TABLE IF NOT EXISTS "Clock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 443,
    "protocol" TEXT NOT NULL DEFAULT 'https',
    "login" TEXT NOT NULL DEFAULT 'admin',
    "password" TEXT NOT NULL DEFAULT 'admin',
    "deviceName" TEXT NOT NULL DEFAULT '',
    "serial" TEXT NOT NULL DEFAULT '',
    "lastSyncAt" DATETIME,
    "lastSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncError" TEXT NOT NULL DEFAULT '',
    "syncEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "syncInterval" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pis" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "employeeId" TEXT NOT NULL DEFAULT '',
    "cargo" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "admissionDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT 1,
    "scheduleType" TEXT,
    "dailyHours" REAL,
    "saturdayHours" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "Employee_pis_key" ON "Employee"("pis");

  CREATE TABLE IF NOT EXISTS "Punch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nsr" TEXT NOT NULL DEFAULT '',
    "pis" TEXT NOT NULL,
    "punchTime" DATETIME NOT NULL,
    "clockId" TEXT,
    "employeeId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'sync',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("clockId") REFERENCES "Clock"("id") ON DELETE SET NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("pis") ON DELETE SET NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "Punch_pis_punchTime_key" ON "Punch"("pis", "punchTime");
  CREATE INDEX IF NOT EXISTS "Punch_pis_punchTime_idx" ON "Punch"("pis", "punchTime");
  CREATE INDEX IF NOT EXISTS "Punch_punchTime_idx" ON "Punch"("punchTime");

  -- Leave (Férias / Afastamentos)
  CREATE TABLE IF NOT EXISTS "Leave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("pis") ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS "Leave_employeeId_idx" ON "Leave"("employeeId");
  CREATE INDEX IF NOT EXISTS "Leave_dates_idx" ON "Leave"("startDate", "endDate");

  -- Notifications
  CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT 0,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
  CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

  CREATE TABLE IF NOT EXISTS "Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "companyName" TEXT NOT NULL DEFAULT '',
    "companyCnpj" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "companyCity" TEXT NOT NULL DEFAULT '',
    "companyState" TEXT NOT NULL DEFAULT '',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyLogo" TEXT NOT NULL DEFAULT '',
    "scheduleType" TEXT NOT NULL DEFAULT '6x1',
    "entryTime" TEXT NOT NULL DEFAULT '08:00',
    "exitTime" TEXT NOT NULL DEFAULT '18:00',
    "breakStart" TEXT NOT NULL DEFAULT '13:00',
    "breakEnd" TEXT NOT NULL DEFAULT '15:00',
    "breakDuration" INTEGER NOT NULL DEFAULT 120,
    "toleranceMinutes" INTEGER NOT NULL DEFAULT 10,
    "weeklyHours" REAL NOT NULL DEFAULT 44.0,
    "dailyHours" REAL NOT NULL DEFAULT 8.0,
    "saturdayHours" REAL NOT NULL DEFAULT 4.0,
    "workdays" TEXT NOT NULL DEFAULT '0,1,2,3,4,5',
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT 1,
    "syncIntervalMin" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clockId" TEXT NOT NULL,
    "clockName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "punchesFound" INTEGER NOT NULL DEFAULT 0,
    "punchesNew" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS "SyncLog_clockId_idx" ON "SyncLog"("clockId");
  CREATE INDEX IF NOT EXISTS "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");
`);

// Seed admin user with bcrypt hash
const adminHash = bcrypt.hashSync('admin', 10);
const existingAdmin = db.prepare('SELECT id FROM "User" WHERE email = ?').get('admin@bitconverter.com');
if (!existingAdmin) {
  db.prepare(`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "updatedAt")
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run('admin-001', 'admin@bitconverter.com', 'Administrador', adminHash, 'admin');
  
  // Also add "admin" shortcut user
  db.prepare(`
    INSERT INTO "User" ("id", "email", "name", "password", "role", "updatedAt")
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run('admin-002', 'admin', 'Admin', adminHash, 'admin');
  
  console.log('Admin user seeded (password: admin)');
}

console.log('Database tables created successfully!');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));
db.close();
