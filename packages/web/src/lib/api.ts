const API_UNAVAILABLE = "Product API is not configured for this Vercel preview yet.";
const CONFIGURED_BASE = (import.meta.env.VITE_API as string | undefined)?.trim();
const BASE = CONFIGURED_BASE ? CONFIGURED_BASE.replace(/\/$/, "") : null;

function apiUrl(path: string): string {
  if (!BASE) throw new Error(API_UNAVAILABLE);
  return `${BASE}${path}`;
}

export interface Product {
  id: string;
  seller_address: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size_bytes: number;
  price_wei: string;
  token_address: string;
  network: "mainnet" | "testnet";
  created_at: number;
}

export async function listProducts(): Promise<Product[]> {
  const r = await fetch(apiUrl("/products"));
  const data = (await r.json()) as { products: Product[] };
  return data.products ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const r = await fetch(apiUrl(`/products/${id}`));
  if (!r.ok) return null;
  const data = (await r.json()) as { product: Product };
  return data.product;
}

export async function createProduct(form: FormData) {
  const r = await fetch(apiUrl("/products"), { method: "POST", body: form });
  return r.json() as Promise<{ product?: { id: string; title: string }; error?: string }>;
}

export interface ConfirmOrderInput {
  product_id: string;
  buyer_address: string;
  payment_tx: string;
}

export async function confirmOrder(input: ConfirmOrderInput) {
  const r = await fetch(apiUrl("/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return r.json() as Promise<{
    order_id?: string;
    download_url?: string;
    expires_at?: string;
    file_name?: string;
    error?: string;
    reason?: string;
  }>;
}

export function formatTokenAmount(wei: string, decimals = 18): string {
  try {
    const w = BigInt(wei);
    const whole = w / 10n ** BigInt(decimals);
    const frac = w % 10n ** BigInt(decimals);
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return wei;
  }
}
