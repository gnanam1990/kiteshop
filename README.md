# KiteShop

> A digital-goods marketplace where buyers pay in an ERC-20 stablecoin and the API delivers a signed, time-limited download only after verifying the payment on-chain.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

KiteShop is a small marketplace for selling digital files. Sellers list a product with a price denominated in an ERC-20 token; buyers pay the seller directly on-chain and submit the transaction hash. The API verifies that the on-chain `Transfer` event actually moved at least the listed amount from the buyer to the seller, and only then issues a signed 24-hour download link. The server price is authoritative — the buyer cannot under-pay or replay a transaction to obtain the file. It targets the Kite network (testnet and mainnet chain definitions are built in).

## Features

- Browse and view active product listings (title, description, price, file size, token, network).
- Seller upload flow: create a listing with a file via a write-protected multipart endpoint.
- On-chain payment verification: the API reads the transaction receipt with viem and matches an ERC-20 `Transfer(from, to, value)` log against the expected token, buyer, seller, and price.
- Signed, expiring downloads: a successful, verified order returns a one-time download token valid for 24 hours.
- Replay protection: each `payment_tx` can deliver at most one order, enforced by a unique index plus a pre-insert check.
- Write endpoints (create product / confirm order) are gated behind a bearer API key using a constant-time comparison.
- Path-traversal-safe file storage and streaming.

## Tech stack

- **API:** TypeScript, [Hono](https://hono.dev) (on `@hono/node-server`), [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), [viem](https://viem.sh).
- **Web:** TypeScript, [React 19](https://react.dev), [Vite 6](https://vite.dev), [Tailwind CSS v4](https://tailwindcss.com), lucide-react.
- **Tooling:** pnpm workspaces, TypeScript 5.

## Architecture

This is a pnpm monorepo with two packages:

```
packages/
  api/   Hono HTTP API: products & orders routes, SQLite (better-sqlite3),
         local-disk file storage, and viem-based on-chain payment verification.
  web/   Vite + React + Tailwind storefront: browse, sell, and buy flows;
         talks to the API over HTTP via VITE_API.
```

- `packages/api/src/index.ts` — server entry; mounts `/products` and `/orders`.
- `packages/api/src/routes/` — `products.ts` (list/detail/create) and `orders.ts` (confirm order, download).
- `packages/api/src/lib/` — `db.ts` (schema + connection), `storage.ts` (uploads), `auth.ts` (write-key middleware), `verify-payment.ts` (Transfer-log verifier and Kite chain definitions).
- `packages/web/src/lib/api.ts` — typed client for the API.

## Getting started

### Prerequisites

- Node.js 20+ (the API uses Node's native `node:` modules and `fetch`/`File`).
- pnpm 9 (`packageManager` is pinned to `pnpm@9.12.0`).
- Build tools for `better-sqlite3` native bindings (a working C/C++ toolchain).

### Installation

```bash
pnpm install
```

### Configuration

No `.env.example` is committed; the project reads the following environment variables (names only):

| Variable | Package | Purpose | Default |
|----------|---------|---------|---------|
| `KITESHOP_WRITE_API_KEY` | api | Bearer token required for write endpoints (`POST /products`, `POST /orders`). If unset, those endpoints return `503`. | _(unset → writes disabled)_ |
| `PORT` | api | Port the API listens on. | `8789` |
| `KITESHOP_DB` | api | Path to the SQLite database file. | `packages/api/shop.db` |
| `KITESHOP_UPLOADS` | api | Directory where uploaded files are stored. | `packages/api/uploads` |
| `VITE_API` | web | Base URL of the API the storefront calls. If unset, product/order calls surface an "API not configured" error. | _(unset)_ |

### Running

Run each package in its own terminal:

```bash
pnpm dev:api   # API on http://localhost:8789
pnpm dev:web   # Web on http://localhost:3000
```

(Equivalently, `pnpm --filter api dev` and `pnpm --filter web dev`.)

Build both packages:

```bash
pnpm build
```

## Usage

### API endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET`  | `/products` | — | List active listings. |
| `GET`  | `/products/:id` | — | Single product detail. |
| `POST` | `/products` | Bearer | Multipart form: `seller_address`, `title`, `description`, `price_wei`, `token_address`, `network`, `file`. |
| `POST` | `/orders` | Bearer | JSON: `product_id`, `buyer_address`, `payment_tx`. Verifies the on-chain payment and returns a signed download URL. |
| `GET`  | `/orders/download/:token` | — | Streams the file while the token is unexpired (404/410 otherwise). |

Write endpoints expect `Authorization: Bearer <KITESHOP_WRITE_API_KEY>`.

### Payment verification

`verifyPayment()` loads the transaction receipt via viem, confirms the tx succeeded, and scans its logs for an ERC-20 `Transfer(from, to, value)` event emitted by the expected token contract where `from == buyer`, `to == seller`, and `value >= price_wei`. A matching transfer below the price is reported as `value too low`; if no matching transfer is found, it reports `no matching Transfer log`. Kite Testnet (chain `2368`) and Kite Mainnet (chain `2366`) are defined in `verify-payment.ts`.

## Testing

No automated test suite is present. `pnpm lint` runs `tsc --noEmit` across both packages as a type-check.

## Status

Early MVP / preview. The API (product listing, write-key-gated uploads, on-chain payment verification, replay protection, and signed downloads) is implemented and type-checks. Files are stored on the local API-server disk, so the API must run on a host with persistent storage. The web storefront is implemented but degrades gracefully when `VITE_API` is unset. Not audited; treat as experimental and do not use with real funds without your own review.

## License

MIT — see [LICENSE](LICENSE).
