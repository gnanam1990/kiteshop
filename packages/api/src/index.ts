import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import products from "./routes/products";
import orders from "./routes/orders";

const app = new Hono();
app.use("*", cors({ allowHeaders: ["Content-Type", "Authorization"] }));

app.get("/", (c) =>
  c.json({ ok: true, service: "kiteshop", version: "0.1.0" })
);

app.route("/products", products);
app.route("/orders", orders);

const port = Number(process.env.PORT ?? 8789);
serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`KiteShop API listening on http://localhost:${port}`);
});
