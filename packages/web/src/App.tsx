import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { ProductCard } from "./components/product-card";
import { ProductDetail } from "./components/product-detail";
import { CreateProductForm } from "./components/create-product-form";
import { listProducts, type Product } from "./lib/api";

type Page = "browse" | "sell";

export default function App() {
  const [page, setPage] = useState<Page>("browse");
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      setProducts(await listProducts());
    } catch {
      setProducts([]);
      setApiError("Product API is not configured for this Vercel preview yet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        page={page}
        onNavigate={(p) => {
          setPage(p);
          setSelected(null);
        }}
      />

      <main className="flex-1">
        {page === "browse" && (
          <>
            <section className="kite-gradient border-b border-kite-border">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                <p className="text-xs font-bold tracking-widest uppercase text-kite-primary mb-3">
                  v0.1 · Testnet only
                </p>
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-kite-fg max-w-3xl">
                  Sell digital goods on Kite.
                </h1>
                <p className="mt-4 text-lg text-kite-fg/70 max-w-2xl">
                  PDFs, license keys, code archives — buyers pay in stablecoin, get a signed
                  24-hour download link the moment we verify the Transfer.
                </p>
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {selected ? (
                <ProductDetail product={selected} onBack={() => setSelected(null)} />
              ) : loading ? (
                <p className="text-sm font-mono text-kite-fg/55">Loading…</p>
              ) : apiError ? (
                <div className="rounded-2xl border border-kite-border bg-kite-card p-6 max-w-2xl">
                  <p className="text-sm font-semibold text-kite-fg">
                    Marketplace API not connected
                  </p>
                  <p className="mt-2 text-sm text-kite-fg/65 leading-relaxed">
                    The web storefront is deployed, but product listings, upload,
                    payment verification, and signed downloads need the Hono API
                    running on a persistent backend with database and file storage.
                  </p>
                  <p className="mt-3 text-xs font-mono text-kite-fg/55">
                    Next step: deploy the API package to Railway or another server host,
                    then set VITE_API to that URL.
                  </p>
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm font-mono text-kite-fg/55">
                  No products yet. <button className="underline" onClick={() => setPage("sell")}>List the first one</button>.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} onClick={() => setSelected(p)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {page === "sell" && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <CreateProductForm
              onCreated={() => {
                void refresh();
                setPage("browse");
              }}
            />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
