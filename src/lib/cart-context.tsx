"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartLine = { productId: string; variantId?: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  addItem: (productId: string, quantity?: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sellersplace:cart";

/** Two lines are the same cart entry when product AND variant match. */
function sameLine(line: CartLine, productId: string, variantId?: string) {
  return line.productId === productId && (line.variantId ?? null) === (variantId ?? null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Pre-variant carts parse fine: variantId is simply undefined.
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Persist on every change.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  function addItem(productId: string, quantity = 1, variantId?: string) {
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, productId, variantId));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, productId, variantId) ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { productId, variantId, quantity }];
    });
  }

  function removeItem(productId: string, variantId?: string) {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, variantId)));
  }

  function setQuantity(productId: string, quantity: number, variantId?: string) {
    if (quantity <= 0) return removeItem(productId, variantId);
    setLines((prev) =>
      prev.map((l) => (sameLine(l, productId, variantId) ? { ...l, quantity } : l))
    );
  }

  function clear() {
    setLines([]);
  }

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, setQuantity, clear, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
