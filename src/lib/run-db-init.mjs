import { initDb } from './db-init.js';

console.log("Running database initialization...");
try {
  initDb();
  console.log("Database initialized successfully!");
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}
