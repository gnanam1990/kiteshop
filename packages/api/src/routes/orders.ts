import { Hono } from "hono";
import crypto from "node:crypto";
import { db } from "../lib/db";
import { requireWriteAuth } from "../lib/auth";
import { pathForKey } from "../lib/storage";
import { verifyPayment } from "../lib/verify-payment";
import { createReadStream, statSync } from "node:fs";
import { Readable } from "node:stream";

const orders = new Hono();

interface ProductRow {
  id: string;
  seller_address: string;
  price_wei: string;
  token_address: string;
  network: "mainnet" | "testnet";
  file_key: string;
  file_name: string;
}

orders.post("/", requireWriteAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "invalid body" }, 400);
  const { product_id, buyer_address, payment_tx } = body as Record<string, string>;
  if (!product_id || !buyer_address || !payment_tx) {
    return c.json({ error: "product_id, buyer_address, payment_tx required" }, 400);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(buyer_address)) {
    return c.json({ error: "invalid buyer_address" }, 400);
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(payment_tx)) {
    return c.json({ error: "invalid payment_tx" }, 400);
  }

  const product = db
    .prepare("SELECT id, seller_address, price_wei, token_address, network, file_key, file_name FROM products WHERE id = ? AND listed = 1")
    .get(product_id) as ProductRow | undefined;
  if (!product) return c.json({ error: "product not found" }, 404);

  const normalizedPaymentTx = payment_tx.toLowerCase();
  const reused = db
    .prepare("SELECT id FROM orders WHERE payment_tx = ?")
    .get(normalizedPaymentTx) as { id: string } | undefined;
  if (reused) {
    return c.json({ error: "payment_tx_already_used" }, 409);
  }

  const verification = await verifyPayment({
    txHash: normalizedPaymentTx as `0x${string}`,
    expectedToken: product.token_address as `0x${string}`,
    expectedTo: product.seller_address as `0x${string}`,
    expectedFrom: buyer_address as `0x${string}`,
    expectedValueWei: BigInt(product.price_wei),
    network: product.network,
  });

  if (!verification.ok) {
    return c.json({ error: "payment_not_verified", reason: verification.reason }, 402);
  }

  const downloadToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const id = crypto.randomUUID();

  try {
    db.prepare(
      `INSERT INTO orders (id, product_id, buyer_address, payment_tx, status, download_token, download_expires_at)
       VALUES (?, ?, ?, ?, 'delivered', ?, ?)`
    ).run(id, product_id, buyer_address.toLowerCase(), normalizedPaymentTx, downloadToken, expiresAt);
  } catch (err) {
    if (err instanceof Error && /unique/i.test(err.message)) {
      return c.json({ error: "payment_tx_already_used" }, 409);
    }
    throw err;
  }

  return c.json({
    order_id: id,
    download_url: `/orders/download/${downloadToken}`,
    expires_at: new Date(expiresAt).toISOString(),
    file_name: product.file_name,
  });
});

orders.get("/download/:token", (c) => {
  const order = db
    .prepare("SELECT * FROM orders WHERE download_token = ?")
    .get(c.req.param("token")) as { product_id: string; download_expires_at: number } | undefined;
  if (!order) return c.json({ error: "invalid token" }, 404);
  if (order.download_expires_at < Date.now()) {
    return c.json({ error: "download expired" }, 410);
  }
  const product = db
    .prepare("SELECT file_key, file_name FROM products WHERE id = ?")
    .get(order.product_id) as { file_key: string; file_name: string } | undefined;
  if (!product) return c.json({ error: "product gone" }, 404);

  let path: string;
  let size: number;
  try {
    path = pathForKey(product.file_key);
    size = statSync(path).size;
  } catch {
    return c.json({ error: "file unavailable" }, 404);
  }
  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${product.file_name.replace(/"/g, "")}"`,
      "Content-Length": String(size),
    },
  });
});

export default orders;
