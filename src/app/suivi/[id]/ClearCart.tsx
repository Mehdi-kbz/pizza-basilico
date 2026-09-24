"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/** Après un paiement avec redirection (le panier n'a pas pu être vidé sur place). */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
