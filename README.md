# KiteShop

Digital goods marketplace on Kite. Buyers pay in stablecoin; the API verifies the on-chain `Transfer` log and delivers a signed 24-hour download link.

> v0.1 ships testnet-only, prices in **Test USDT** (`0x0fF53…7e63`, 18 decimals), and stores files on the local API server disk. Cloudflare R2 + USDC.e Mainnet support are v0.2.

## Architecture

```
packages/
  api/   Hono + better-sqlite3 + viem (Transfer-log verifier)
  web/   Vite + React + Tailwind v4 (browse, sell, buy)
```

## Quick start

```bash
pnpm install
pnpm --filter api dev   # http://localhost:8789
pnpm --filter web dev   # http://localhost:3000
```

## Deployment

- **Production:** https://kiteshop.vercel.app
- **Host:** Vercel project `kiteshop`
- **Status:** Web storefront build verified on 2026-05-23. Product listings, uploads, payment verification, and signed downloads require the Hono API on a persistent backend.
- **API config:** deploy `packages/api` to Railway or another server host, then set `VITE_API` in the Vercel web project to the API base URL.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET    | `/products` | List active listings |
| GET    | `/products/:id` | Single product detail |
| POST   | `/products` | Requires `Authorization: Bearer $KITESHOP_WRITE_API_KEY`; multipart upload: `seller_address`, `title`, `description`, `price_wei`, `token_address`, `network`, `file` |
| POST   | `/orders` | Requires `Authorization: Bearer $KITESHOP_WRITE_API_KEY`; body: `product_id`, `buyer_address`, `payment_tx` — verifies on-chain Transfer, returns signed download URL |
| GET    | `/orders/download/:token` | Streams the file if the token is unexpired |

## Payment verification

`verifyPayment()` fetches the receipt via viem and walks the logs looking for an ERC-20 `Transfer(from, to, value)` event on the expected token contract where:

- `from == buyer_address`
- `to == seller_address`
- `value >= price_wei`

Replay is blocked with a unique `payment_tx` index and a pre-insert duplicate check. A transaction hash can only create one delivered order.

## What's PREVIEW

- Cloudflare R2 / S3 storage (currently local disk)
- USDC.e Mainnet (currently Test USDT only)
- KiteAuth-gated seller dashboard with sales history
- Refund / dispute flow
- Agent-as-buyer with kpass session payments

## License

MIT
