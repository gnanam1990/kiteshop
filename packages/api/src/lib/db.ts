import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.KITESHOP_DB ?? resolve(here, "../../shop.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    seller_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    price_wei TEXT NOT NULL,
    token_address TEXT NOT NULL,
    network TEXT NOT NULL DEFAULT 'testnet',
    listed INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    buyer_address TEXT NOT NULL,
    payment_tx TEXT,
    status TEXT NOT NULL DEFAULT 'awaiting_payment',
    download_token TEXT,
    download_expires_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
  CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_address);
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_address);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_tx_unique ON orders(payment_tx)
    WHERE payment_tx IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_download_token_unique ON orders(download_token)
    WHERE download_token IS NOT NULL;
`);
