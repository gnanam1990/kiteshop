import { useState } from "react";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { confirmOrder, type Product, formatTokenAmount } from "../lib/api";
import { PreviewBadge } from "./preview-badge";

interface Props {
  product: Product;
  onBack: () => void;
}

export function ProductDetail({ product, onBack }: Props) {
  const [buyerAddress, setBuyerAddress] = useState("");
  const [paymentTx, setPaymentTx] = useState("");
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<{ url: string; expires: string; file: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valid =
    /^0x[a-fA-F0-9]{40}$/.test(buyerAddress.trim()) &&
    /^0x[a-fA-F0-9]{64}$/.test(paymentTx.trim());

  const explorerBase =
    product.network === "mainnet" ? "https://kitescan.ai" : "https://testnet.kitescan.ai";

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await confirmOrder({
        product_id: product.id,
        buyer_address: buyerAddress.trim(),
        payment_tx: paymentTx.trim(),
      });
      if (res.error || !res.download_url) {
        setError(res.reason || res.error || "Order failed");
        return;
      }
      setDownload({
        url: res.download_url,
        expires: res.expires_at ?? "",
        file: res.file_name ?? product.file_name,
      });
    } catch {
      setError("Product API is not configured for this Vercel preview yet.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs font-semibold text-kite-fg/55 hover:text-kite-fg mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to listings
      </button>
      <div className="rounded-2xl border border-kite-border bg-kite-card p-6 sm:p-8 space-y-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-kite-primary">
            {product.network === "mainnet" ? "Mainnet · USDC.e" : "Testnet · Test USDT"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-kite-fg">{product.title}</h1>
        </div>

        {product.description && (
          <p className="text-sm text-kite-fg/75 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Price" value={`${formatTokenAmount(product.price_wei)} ${product.network === "mainnet" ? "USDC.e" : "tUSDT"}`} mono />
          <Info label="File" value={`${product.file_name} (${(product.file_size_bytes / 1024).toFixed(0)} KB)`} mono />
          <Info label="Token" value={product.token_address} mono />
          <Info label="Seller" value={product.seller_address} mono />
        </div>

        {download ? (
          <div className="rounded-md border border-kite-accent/40 bg-kite-accent/5 p-4 text-sm">
            <p className="flex items-center gap-2 text-kite-accent font-semibold mb-2">
              <Check className="w-4 h-4" /> Payment verified
            </p>
            <a
              href={download.url}
              className="inline-flex items-center gap-1 text-kite-primary hover:text-kite-fg font-semibold underline underline-offset-2"
            >
              Download {download.file} <ExternalLink className="w-3 h-3" />
            </a>
            {download.expires && (
              <p className="mt-2 text-xs font-mono text-kite-fg/55">
                Link valid until {new Date(download.expires).toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-kite-border bg-kite-bg p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-kite-fg/60">
              Confirm payment
              <PreviewBadge>Manual wallet flow</PreviewBadge>
            </p>
            <p className="text-xs text-kite-fg/65 leading-relaxed">
              Send <span className="font-mono">{formatTokenAmount(product.price_wei)}</span>{" "}
              {product.network === "mainnet" ? "USDC.e" : "tUSDT"} to the seller, then paste your
              address and tx hash. We verify the on-chain Transfer log and unlock the file.
            </p>
            <input
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="Your address (0x…)"
              className="w-full px-3 py-2 rounded-md border border-kite-border bg-kite-bg font-mono text-xs focus:outline-none focus:border-kite-primary"
            />
            <input
              value={paymentTx}
              onChange={(e) => setPaymentTx(e.target.value)}
              placeholder="Payment tx hash (0x…64 hex)"
              className="w-full px-3 py-2 rounded-md border border-kite-border bg-kite-bg font-mono text-xs focus:outline-none focus:border-kite-primary"
            />
            <button
              onClick={confirm}
              disabled={!valid || busy}
              className="h-10 px-5 rounded-md bg-kite-primary text-white text-sm font-medium hover:bg-[#8a755a] disabled:opacity-40 transition-colors"
            >
              {busy ? "Verifying…" : "Verify & unlock"}
            </button>
            {error && <p className="text-xs text-kite-destructive font-mono">{error}</p>}
            <a
              href={`${explorerBase}/address/${product.seller_address}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-kite-fg/55 hover:text-kite-fg inline-flex items-center gap-1"
            >
              Seller on KiteScan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-widest uppercase text-kite-fg/55 mb-0.5">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""} text-kite-fg break-all`}>{value}</div>
    </div>
  );
}
