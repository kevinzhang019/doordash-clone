import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase } from './seed';

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/doordash.db';
    const absolutePath = path.resolve(process.cwd(), dbPath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(absolutePath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cuisine TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      rating REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      delivery_min INTEGER NOT NULL,
      delivery_max INTEGER NOT NULL,
      address TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      is_available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(user_id, menu_item_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      status TEXT NOT NULL DEFAULT 'placed',
      delivery_address TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      placed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL
    );
  `);

  // Seed if empty
  const count = (db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number }).count;
  if (count === 0) {
    seedDatabase(db);
  }
}

export default getDb;
