import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initDb } from './db-init.js';

// Ensure the data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'diabit.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Automatically initialize schema when database connection is created
try {
  initDb(db);
} catch (e) {
  console.error("Failed to self-initialize database schema", e);
}

export default db;

/**
 * Run a transaction
 */
export function transaction(fn) {
  return db.transaction(fn);
}
