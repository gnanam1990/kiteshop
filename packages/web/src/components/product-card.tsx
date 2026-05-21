import { FileText } from "lucide-react";
import { type Product, formatTokenAmount } from "../lib/api";

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-kite-border bg-kite-card p-5 hover:border-kite-primary transition-colors flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-kite-primary">
          <FileText className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {product.network === "mainnet" ? "USDC.e" : "Test USDT"}
          </span>
        </div>
        <span className="text-xs font-mono text-kite-fg/45">
          {(product.file_size_bytes / 1024).toFixed(0)} KB
        </span>
      </div>
      <h3 className="text-base font-semibold text-kite-fg leading-snug">{product.title}</h3>
      {product.description && (
        <p className="text-sm text-kite-fg/65 leading-relaxed line-clamp-3">{product.description}</p>
      )}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-lg font-mono font-bold text-kite-fg">
          {formatTokenAmount(product.price_wei)} {product.network === "mainnet" ? "USDC.e" : "tUSDT"}
        </span>
        <span className="text-[10px] font-mono text-kite-fg/45 truncate max-w-[8rem]">
          by {product.seller_address.slice(0, 6)}…{product.seller_address.slice(-4)}
        </span>
      </div>
    </button>
  );
}
