"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/currency";
import { storeConfig, whatsappLink } from "@/config/store";

export type PanelVariant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
  sku: string | null;
};

export type PanelProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  purchaseMode: "PAY_ONLINE" | "CONTACT_SELLER" | "BOTH";
  offeringType: "PRODUCT" | "SERVICE";
  priceType: "FIXED" | "FROM" | "QUOTE";
};

/**
 * Client-side purchase area of the product page: variant selection drives the
 * displayed price/stock, and the available actions follow the product's
 * purchase mode (online payment, chat with the seller, or both).
 */
export default function ProductPurchasePanel({
  product,
  variants,
}: {
  product: PanelProduct;
  variants: PanelVariant[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  );
  const [added, setAdded] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) || null;
  const needsVariant = variants.length > 0 && !selected;

  const isService = product.offeringType === "SERVICE";
  const quoted = product.priceType === "QUOTE";

  const price = selected?.price ?? product.price;
  // Services aren't stock-limited; treat them as always available.
  const stock = isService ? Infinity : selected ? selected.stock : product.stock;
  const sku = selected?.sku ?? product.sku;
  const compareAt = quoted ? null : product.compareAtPrice;
  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  // Quoted offerings have no chargeable price — contact is the only path.
  const canPayOnline = !quoted && product.purchaseMode !== "CONTACT_SELLER";
  const canContact =
    (quoted || product.purchaseMode !== "PAY_ONLINE") &&
    (!!storeConfig.whatsappNumber || !!storeConfig.phone);
  const contactOnly = quoted || product.purchaseMode === "CONTACT_SELLER";

  const productUrl =
    typeof window !== "undefined" ? window.location.href : `/products/${product.slug}`;
  const chatHref = whatsappLink(
    `Hi ${storeConfig.name}! I'm interested in "${product.name}"${selected ? ` (${selected.name})` : ""} — ${productUrl}`
  );

  function handleAdd(goToCart: boolean) {
    if (needsVariant || stock <= 0) return;
    addItem(product.id, 1, selected?.id);
    if (goToCart) {
      router.push("/cart");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold md:text-xl" style={{ color: "var(--brand)" }}>
            {quoted
              ? "Price on request"
              : `${product.priceType === "FROM" ? "From " : ""}${formatCurrency(price)}`}
          </span>
          {compareAt && compareAt > price && (
            <>
              <span className="text-sm text-muted line-through">{formatCurrency(compareAt)}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                -{discount}%
              </span>
            </>
          )}
        </div>
        {canPayOnline &&
          !isService &&
          (stock <= 0 ? (
            <span className="text-xs text-red-600">Out of stock</span>
          ) : stock <= 5 ? (
            <span className="text-xs text-muted">Only {stock} left</span>
          ) : null)}
        {sku && <span className="text-xs text-muted">SKU: {sku}</span>}
      </div>

      {variants.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted">Choose an option</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selectedId;
              const out = !isService && variant.stock <= 0 && canPayOnline;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={out}
                  onClick={() => setSelectedId(active ? null : variant.id)}
                  className="rounded-xl border px-3.5 py-2 text-sm transition-colors disabled:opacity-40"
                  style={{
                    borderColor: active ? "var(--brand)" : "var(--border)",
                    background: active ? "var(--brand-soft)" : "transparent",
                    color: active ? "var(--brand)" : "var(--foreground)",
                  }}
                >
                  {variant.name}
                  {variant.price != null && variant.price !== product.price && (
                    <span className="ml-1.5 text-xs text-muted">
                      {formatCurrency(variant.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {needsVariant && (
            <span className="text-xs text-muted">Select an option to continue.</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {canPayOnline && stock > 0 && (
          <div className="flex gap-2 md:max-w-md">
            {isService ? (
              <button
                onClick={() => handleAdd(true)}
                disabled={needsVariant}
                className="btn-primary flex-1"
              >
                Book now
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAdd(false)}
                  disabled={needsVariant}
                  className="btn-primary flex-1"
                >
                  {added ? "Added to cart" : "Add to Cart"}
                </button>
                <button
                  onClick={() => handleAdd(true)}
                  disabled={needsVariant}
                  className="btn-outline"
                >
                  Buy now
                </button>
              </>
            )}
          </div>
        )}

        {canContact && (
          <div className="flex gap-2 md:max-w-md">
            {chatHref && (
              <a
                href={chatHref}
                target="_blank"
                rel="noopener noreferrer"
                className={contactOnly ? "btn-primary flex-1" : "btn-outline flex-1"}
              >
                <MessageCircle className="h-4 w-4" /> Chat with seller
              </a>
            )}
            {storeConfig.phone && (
              <a href={`tel:${storeConfig.phone}`} className="btn-ghost" aria-label="Call seller">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
          </div>
        )}

        {contactOnly && !canContact && (
          <p className="card-surface p-3 text-xs text-muted">
            This {isService ? "service" : "item"} is arranged via direct contact with the
            seller. Contact details are not configured yet — please check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
