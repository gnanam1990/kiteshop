import { useState } from "react";
import { createProduct } from "../lib/api";

const TESTNET_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";

export function CreateProductForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seller, setSeller] = useState("");
  const [priceUsdt, setPriceUsdt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const valid =
    title.trim() &&
    /^0x[a-fA-F0-9]{40}$/.test(seller.trim()) &&
    /^\d+(\.\d+)?$/.test(priceUsdt) &&
    file;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !file) return;
    setBusy(true);
    setError(null);
    const priceWei = (BigInt(Math.round(parseFloat(priceUsdt) * 100)) * 10n ** 16n).toString();
    const form = new FormData();
    form.append("seller_address", seller.trim());
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("price_wei", priceWei);
    form.append("token_address", TESTNET_USDT);
    form.append("network", "testnet");
    form.append("file", file);
    const res = await createProduct(form);
    setBusy(false);
    if (res.error || !res.product) {
      setError(res.error ?? "Failed to create product");
      return;
    }
    setTitle("");
    setDescription("");
    setPriceUsdt("");
    setFile(null);
    setOk(true);
    onCreated();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-kite-border bg-kite-card p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-kite-fg">List a digital good</h2>
      <p className="text-xs text-kite-fg/65">
        v0.1 is testnet-only and prices in Test USDT. Files are stored on the API server's local disk.
        Cloudflare R2 + USDC.e mainnet pricing in v0.2.
      </p>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input" />
      </Field>
      <Field label="Seller address (receives payment)">
        <input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="0x…" className="input font-mono" />
      </Field>
      <Field label="Price (Test USDT)">
        <input value={priceUsdt} onChange={(e) => setPriceUsdt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="5.00" className="input font-mono" />
      </Field>
      <Field label="File">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-kite-fg/80 file:mr-3 file:rounded-md file:border file:border-kite-border file:bg-kite-bg file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-kite-fg hover:file:bg-kite-muted"
        />
      </Field>

      <button
        type="submit"
        disabled={!valid || busy}
        className="h-11 px-6 rounded-md bg-kite-primary text-white font-medium hover:bg-[#8a755a] disabled:opacity-40"
      >
        {busy ? "Uploading…" : "Publish product"}
      </button>
      {error && <p className="text-xs text-kite-destructive font-mono">{error}</p>}
      {ok && <p className="text-xs text-kite-accent font-mono">Listed.</p>}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid var(--kite-border);
          background: var(--kite-bg);
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: var(--kite-primary); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold tracking-widest uppercase text-kite-fg/55 mb-1">{label}</span>
      {children}
    </label>
  );
}
