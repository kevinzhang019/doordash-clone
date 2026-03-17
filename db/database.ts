import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDatabase, seedMenuItemOptions, seedReviews, seedAdditionalRestaurants, seedAdditionalReviews } from './seed';

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
  // --- Phase 1: Migrate users table to support multi-role (same email, different roles) ---
  const usersTableExists = !!(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get());
  const userIndexes = usersTableExists ? (db.prepare("PRAGMA index_list(users)").all() as { name: string }[]) : [];
  const hasEmailRoleIndex = userIndexes.some(idx => idx.name === 'users_email_role');
  if (usersTableExists && !hasEmailRoleIndex) {
    const userCols = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        phone TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    if (userCols.includes('role')) {
      const phoneSql = userCols.includes('phone')
        ? 'SELECT id, email, name, password_hash, role, phone, created_at FROM users'
        : "SELECT id, email, name, password_hash, role, NULL, created_at FROM users";
      db.exec(`INSERT INTO users_new ${phoneSql}`);
    } else {
      db.exec(`INSERT INTO users_new SELECT id, email, name, password_hash, 'customer', NULL, created_at FROM users`);
    }
    db.pragma('foreign_keys = OFF');
    db.exec(`DROP TABLE users`);
    db.exec(`ALTER TABLE users_new RENAME TO users`);
    db.pragma('foreign_keys = ON');
    db.exec(`CREATE UNIQUE INDEX users_email_role ON users(email, role)`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  // Create unique index separately (can't use IF NOT EXISTS in older SQLite for indexes inside CREATE TABLE)
  const userIndexes2 = (db.prepare("PRAGMA index_list(users)").all() as { name: string }[]);
  if (!userIndexes2.some(idx => idx.name === 'users_email_role')) {
    db.exec(`CREATE UNIQUE INDEX users_email_role ON users(email, role)`);
  }

  db.exec(`
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
      address TEXT NOT NULL,
      lat REAL,
      lng REAL
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
      special_requests TEXT
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

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      order_id INTEGER UNIQUE REFERENCES orders(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      reviewer_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guest_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- New tables for restaurant owners, hours, addons, driver sessions ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurant_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      UNIQUE(user_id, restaurant_id)
    );

    CREATE TABLE IF NOT EXISTS restaurant_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      open_time TEXT NOT NULL DEFAULT '09:00',
      close_time TEXT NOT NULL DEFAULT '21:00',
      is_closed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(restaurant_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS menu_item_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS driver_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      total_earnings REAL NOT NULL DEFAULT 0,
      deliveries_completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS driver_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES driver_sessions(id),
      order_id INTEGER REFERENCES orders(id),
      is_simulated INTEGER NOT NULL DEFAULT 1,
      restaurant_name TEXT NOT NULL,
      restaurant_address TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      pay_amount REAL NOT NULL DEFAULT 0,
      tip REAL NOT NULL DEFAULT 0,
      accepted_at TEXT DEFAULT (datetime('now')),
      delivered_at TEXT,
      status TEXT NOT NULL DEFAULT 'accepted'
    );
  `);

  // --- Idempotent column additions ---
  const menuItemCols = (db.prepare("PRAGMA table_info(menu_items)").all() as { name: string }[]).map(c => c.name);
  if (!menuItemCols.includes('allow_special_requests')) {
    db.exec('ALTER TABLE menu_items ADD COLUMN allow_special_requests INTEGER NOT NULL DEFAULT 0');
  }

  const cartItemCols = (db.prepare("PRAGMA table_info(cart_items)").all() as { name: string }[]).map(c => c.name);
  if (!cartItemCols.includes('special_requests')) {
    db.exec('ALTER TABLE cart_items ADD COLUMN special_requests TEXT');
  }

  const orderItemCols = (db.prepare("PRAGMA table_info(order_items)").all() as { name: string }[]).map(c => c.name);
  if (!orderItemCols.includes('special_requests')) {
    db.exec('ALTER TABLE order_items ADD COLUMN special_requests TEXT');
  }

  const deliveryCols = (db.prepare("PRAGMA table_info(driver_deliveries)").all() as { name: string }[]).map(c => c.name);
  if (!deliveryCols.includes('miles')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN miles REAL NOT NULL DEFAULT 0');
  if (!deliveryCols.includes('estimated_minutes')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN estimated_minutes INTEGER NOT NULL DEFAULT 0');
  if (!deliveryCols.includes('restaurant_lat')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN restaurant_lat REAL');
  if (!deliveryCols.includes('restaurant_lng')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN restaurant_lng REAL');
  if (!deliveryCols.includes('customer_lat')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN customer_lat REAL');
  if (!deliveryCols.includes('customer_lng')) db.exec('ALTER TABLE driver_deliveries ADD COLUMN customer_lng REAL');

  const userColsCheck = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
  if (!userColsCheck.includes('avatar_url')) {
    db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  }

  const orderCols = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map(c => c.name);
  if (!orderCols.includes('delivery_instructions')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivery_instructions TEXT');
  }
  if (!orderCols.includes('handoff_option')) {
    db.exec("ALTER TABLE orders ADD COLUMN handoff_option TEXT NOT NULL DEFAULT 'hand_off'");
  }
  if (!orderCols.includes('driver_user_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN driver_user_id INTEGER REFERENCES users(id)');
  }
  if (!orderCols.includes('tip')) {
    db.exec('ALTER TABLE orders ADD COLUMN tip REAL NOT NULL DEFAULT 0');
  }
  if (!orderCols.includes('dispatched_to')) {
    db.exec('ALTER TABLE orders ADD COLUMN dispatched_to INTEGER REFERENCES users(id)');
  }
  if (!orderCols.includes('dispatch_expires_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN dispatch_expires_at TEXT');
  }
  if (!orderCols.includes('declined_count')) {
    db.exec('ALTER TABLE orders ADD COLUMN declined_count INTEGER NOT NULL DEFAULT 0');
  }
  if (!orderCols.includes('estimated_delivery_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN estimated_delivery_at TEXT');
  }
  if (!orderCols.includes('delivery_lat')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivery_lat REAL');
  }
  if (!orderCols.includes('delivery_lng')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivery_lng REAL');
  }
  if (!orderCols.includes('delivered_at')) {
    db.exec('ALTER TABLE orders ADD COLUMN delivered_at TEXT');
  }
  if (!orderCols.includes('discount_saved')) {
    db.exec('ALTER TABLE orders ADD COLUMN discount_saved REAL NOT NULL DEFAULT 0');
  }
  if (!orderCols.includes('tax')) {
    db.exec('ALTER TABLE orders ADD COLUMN tax REAL NOT NULL DEFAULT 0');
  }


const restCols = (db.prepare("PRAGMA table_info(restaurants)").all() as { name: string }[]).map(c => c.name);
  if (!restCols.includes('is_accepting_orders')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN is_accepting_orders INTEGER NOT NULL DEFAULT 1');
  }

  const reviewCols = (db.prepare("PRAGMA table_info(reviews)").all() as { name: string }[]).map(c => c.name);
  if (!reviewCols.includes('owner_reply')) {
    db.exec('ALTER TABLE reviews ADD COLUMN owner_reply TEXT');
  }
  if (!reviewCols.includes('owner_reply_at')) {
    db.exec('ALTER TABLE reviews ADD COLUMN owner_reply_at TEXT');
  }

  // --- New tables for option groups and selections ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_item_option_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      max_selections INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES menu_item_option_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS order_item_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      option_id INTEGER,
      name TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0
    );
  `);

  // Rebuild cart_items to remove UNIQUE(user_id, menu_item_id) constraint
  // so the same item can appear multiple times with different selections
  const cartIndexes = db.prepare("PRAGMA index_list(cart_items)").all() as { name: string; unique: number; origin: string }[];
  const hasCartUniqueConstraint = cartIndexes.some(idx => idx.unique === 1 && idx.origin === 'u');
  if (hasCartUniqueConstraint) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE cart_items_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        special_requests TEXT
      );
      INSERT INTO cart_items_new (id, user_id, restaurant_id, menu_item_id, quantity, special_requests)
        SELECT id, user_id, restaurant_id, menu_item_id, quantity, special_requests FROM cart_items;
      DROP TABLE cart_items;
      ALTER TABLE cart_items_new RENAME TO cart_items;
    `);
    db.pragma('foreign_keys = ON');
  }

  // Create cart_item_selections (depends on cart_items existing without UNIQUE constraint)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart_item_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_item_id INTEGER NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
      option_id INTEGER REFERENCES menu_item_options(id),
      name TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0
    );
  `);

  // Seed restaurants if empty
  const count = (db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number }).count;
  if (count === 0) {
    seedDatabase(db);
  }

  // Add lat/lng columns if they don't exist yet (for existing DBs)
  const cols = (db.prepare("PRAGMA table_info(restaurants)").all() as { name: string }[]).map(c => c.name);
  if (!cols.includes('lat')) db.exec('ALTER TABLE restaurants ADD COLUMN lat REAL');
  if (!cols.includes('lng')) db.exec('ALTER TABLE restaurants ADD COLUMN lng REAL');

  // Null out lat/lng for restaurants 11-20 so they use virtual addressing like the original 10
  const hasHardcodedSFCoords = db.prepare(
    "SELECT COUNT(*) as count FROM restaurants WHERE id >= 11 AND lat IS NOT NULL"
  ).get() as { count: number };
  if (hasHardcodedSFCoords.count > 0) {
    db.exec('UPDATE restaurants SET lat = NULL, lng = NULL WHERE id >= 11');
  }

  // Seed reviews if empty
  const reviewCount = (db.prepare('SELECT COUNT(*) as count FROM reviews').get() as { count: number }).count;
  if (reviewCount === 0) {
    seedReviews(db);
  }

  // Seed additional restaurants (11-20) if needed
  const restaurantCount = (db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number }).count;
  if (restaurantCount < 20) {
    seedAdditionalRestaurants(db);
  }

  // Seed reviews for additional restaurants (11-20) if needed
  const additionalReviewCount = (db.prepare('SELECT COUNT(*) as count FROM reviews WHERE restaurant_id >= 11').get() as { count: number }).count;
  if (additionalReviewCount === 0) {
    seedAdditionalReviews(db);
  }

  // Update some seeded reviews to 3 stars so original restaurants also have 3-5 star range
  const threeStarCount = (db.prepare('SELECT COUNT(*) as count FROM reviews WHERE rating = 3 AND user_id IS NULL').get() as { count: number }).count;
  if (threeStarCount === 0) {
    db.prepare('UPDATE reviews SET rating = 3 WHERE id IN (3, 10, 15, 22, 27, 34, 39, 46, 51, 58) AND user_id IS NULL').run();
  }

  // Seed menu item option groups if not yet seeded
  const optionGroupCount = (db.prepare('SELECT COUNT(*) as count FROM menu_item_option_groups').get() as { count: number }).count;
  if (optionGroupCount === 0) {
    seedMenuItemOptions(db);
  }

  // Fix any negative price_modifier values — options should never discount the base price
  db.exec(`UPDATE menu_item_options SET price_modifier = 0 WHERE price_modifier < 0`);
  db.exec(`UPDATE order_item_selections SET price_modifier = 0 WHERE price_modifier < 0`);
  db.exec(`UPDATE cart_item_selections SET price_modifier = 0 WHERE price_modifier < 0`);

  // --- Deals table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      deal_type TEXT NOT NULL CHECK(deal_type IN ('percentage_off', 'bogo')),
      discount_value REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrate: enforce only one *active* deal per menu item
  db.exec(`DROP INDEX IF EXISTS idx_deals_menu_item_id`);
  // Deactivate older duplicates, keeping the most recent active deal per item
  db.exec(`
    UPDATE deals SET is_active = 0 WHERE is_active = 1 AND id NOT IN (
      SELECT MAX(id) FROM deals WHERE is_active = 1 GROUP BY menu_item_id
    )
  `);
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_active_menu_item ON deals(menu_item_id) WHERE is_active = 1`);

  // --- Promo codes ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'flat')),
      discount_value REAL NOT NULL,
      max_uses INTEGER,
      uses_count INTEGER NOT NULL DEFAULT 0,
      min_order_amount REAL NOT NULL DEFAULT 0,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promo_code_uses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_code_id INTEGER NOT NULL REFERENCES promo_codes(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      used_at TEXT DEFAULT (datetime('now')),
      UNIQUE(promo_code_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS driver_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_user_id INTEGER NOT NULL REFERENCES users(id),
      customer_user_id INTEGER NOT NULL REFERENCES users(id),
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed promo codes if empty
  const promoCount = (db.prepare('SELECT COUNT(*) as count FROM promo_codes').get() as { count: number }).count;
  if (promoCount === 0) {
    const insertPromo = db.prepare(`
      INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, min_order_amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertPromo.run('WELCOME10', 'percentage', 10, 100, 0);
    insertPromo.run('SAVE5', 'flat', 5, null, 20);
    insertPromo.run('DOORDASH25', 'percentage', 25, 50, 0);
  }

  // Add payment columns to orders if not present
  const orderColsCheck2 = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map(c => c.name);
  if (!orderColsCheck2.includes('payment_intent_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN payment_intent_id TEXT');
  }
  if (!orderColsCheck2.includes('payment_status')) {
    db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'");
  }
  if (!orderColsCheck2.includes('promo_code_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN promo_code_id INTEGER REFERENCES promo_codes(id)');
  }
  if (!orderColsCheck2.includes('promo_discount')) {
    db.exec('ALTER TABLE orders ADD COLUMN promo_discount REAL NOT NULL DEFAULT 0');
  }

  // --- New tables for dispatch queue, available jobs, and messaging ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS driver_job_declines (
      driver_user_id INTEGER NOT NULL REFERENCES users(id),
      order_id       INTEGER NOT NULL REFERENCES orders(id),
      declined_at    TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (driver_user_id, order_id)
    );

    CREATE TABLE IF NOT EXISTS driver_available_jobs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_user_id INTEGER NOT NULL REFERENCES users(id),
      order_id       INTEGER NOT NULL REFERENCES orders(id),
      added_at       TEXT DEFAULT (datetime('now')),
      UNIQUE(driver_user_id, order_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id       INTEGER NOT NULL REFERENCES orders(id),
      sender_user_id INTEGER NOT NULL REFERENCES users(id),
      sender_role    TEXT NOT NULL CHECK(sender_role IN ('customer','driver')),
      content        TEXT NOT NULL,
      sent_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
  `);

  // --- Payout transfer tracking columns on orders ---
  const orderColsPayout = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map(c => c.name);
  if (!orderColsPayout.includes('restaurant_transfer_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN restaurant_transfer_id TEXT');
  }
  if (!orderColsPayout.includes('driver_transfer_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN driver_transfer_id TEXT');
  }

  // --- Stripe Connect columns ---
  const restColsStripe = (db.prepare("PRAGMA table_info(restaurants)").all() as { name: string }[]).map(c => c.name);
  if (!restColsStripe.includes('stripe_account_id')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN stripe_account_id TEXT');
  }
  if (!restColsStripe.includes('stripe_onboarding_complete')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN stripe_onboarding_complete INTEGER NOT NULL DEFAULT 0');
  }

  const userColsStripe = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
  if (!userColsStripe.includes('stripe_account_id')) {
    db.exec('ALTER TABLE users ADD COLUMN stripe_account_id TEXT');
  }
  if (!userColsStripe.includes('stripe_onboarding_complete')) {
    db.exec('ALTER TABLE users ADD COLUMN stripe_onboarding_complete INTEGER NOT NULL DEFAULT 0');
  }

  // --- Add delivery preferences to user_addresses ---
  const userAddrCols = (db.prepare("PRAGMA table_info(user_addresses)").all() as { name: string }[]).map(c => c.name);
  if (!userAddrCols.includes('delivery_instructions')) {
    db.exec('ALTER TABLE user_addresses ADD COLUMN delivery_instructions TEXT');
  }
  if (!userAddrCols.includes('handoff_option')) {
    db.exec("ALTER TABLE user_addresses ADD COLUMN handoff_option TEXT");
  }

  // --- Add selection_type to option groups (quantity-based groups) ---
  const optGroupCols = (db.prepare("PRAGMA table_info(menu_item_option_groups)").all() as { name: string }[]).map(c => c.name);
  if (!optGroupCols.includes('selection_type')) {
    db.exec("ALTER TABLE menu_item_option_groups ADD COLUMN selection_type TEXT NOT NULL DEFAULT 'check'");
  }

  // --- Add quantity to cart_item_selections and order_item_selections ---
  const cartSelCols = (db.prepare("PRAGMA table_info(cart_item_selections)").all() as { name: string }[]).map(c => c.name);
  if (!cartSelCols.includes('quantity')) {
    db.exec('ALTER TABLE cart_item_selections ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1');
  }

  const orderSelCols = (db.prepare("PRAGMA table_info(order_item_selections)").all() as { name: string }[]).map(c => c.name);
  if (!orderSelCols.includes('quantity')) {
    db.exec('ALTER TABLE order_item_selections ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1');
  }

}

export default getDb;
