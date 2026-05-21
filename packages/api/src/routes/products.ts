import { Hono } from "hono";
import crypto from "node:crypto";
import { db } from "../lib/db";
import { storeUpload } from "../lib/storage";

const products = new Hono();

products.get("/", (c) => {
  const list = db
    .prepare(`SELECT id, seller_address, title, description, file_name, file_size_bytes,
                     price_wei, token_address, network, created_at
              FROM products WHERE listed = 1 ORDER BY created_at DESC`)
    .all();
  return c.json({ products: list });
});

products.get("/:id", (c) => {
  const p = db
    .prepare(
      `SELECT id, seller_address, title, description, file_name, file_size_bytes,
              price_wei, token_address, network, created_at
       FROM products WHERE id = ?`
    )
    .get(c.req.param("id"));
  if (!p) return c.json({ error: "not found" }, 404);
  return c.json({ product: p });
});

products.post("/", async (c) => {
  const form = await c.req.parseBody();
  const seller = String(form.seller_address ?? "").trim();
  const title = String(form.title ?? "").trim();
  const description = String(form.description ?? "").trim();
  const priceWei = String(form.price_wei ?? "").trim();
  const tokenAddress = String(form.token_address ?? "").trim();
  const network = String(form.network ?? "testnet");
  const file = form.file;

  if (!seller || !/^0x[a-fA-F0-9]{40}$/.test(seller)) return c.json({ error: "invalid seller_address" }, 400);
  if (!title) return c.json({ error: "title required" }, 400);
  if (!/^\d+$/.test(priceWei)) return c.json({ error: "price_wei must be integer" }, 400);
  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return c.json({ error: "invalid token_address" }, 400);
  if (!(file instanceof File)) return c.json({ error: "file required (multipart)" }, 400);

  const buf = Buffer.from(await file.arrayBuffer());
  const stored = await storeUpload(buf, file.name);
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO products (id, seller_address, title, description, file_key, file_name,
                            file_size_bytes, price_wei, token_address, network)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    seller.toLowerCase(),
    title,
    description,
    stored.key,
    file.name,
    stored.size,
    priceWei,
    tokenAddress.toLowerCase(),
    network
  );

  const created = db.prepare("SELECT id, title, file_name FROM products WHERE id = ?").get(id);
  return c.json({ product: created }, 201);
});

export default products;
