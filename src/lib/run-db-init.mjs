import { initDb } from './db-init.js';
import db from './database.js';

console.log("Running database initialization...");
try {
  initDb(db);
  console.log("Database initialized successfully!");
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}
