"use client";

import { useEffect, useState } from "react";

export const CREDIT_BALANCE_UPDATED_EVENT = "crealy:credit-balance-updated";
export const CREDIT_BALANCE_REFRESH_EVENT = "crealy:credit-balance-refresh";

type CreditBalanceDetail = {
  availableCredits: number;
};

function isValidBalance(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function publishCreditBalance(availableCredits: number | null) {
  if (typeof window === "undefined" || !isValidBalance(availableCredits)) return;
  window.dispatchEvent(
    new CustomEvent<CreditBalanceDetail>(CREDIT_BALANCE_UPDATED_EVENT, {
      detail: { availableCredits },
    }),
  );
}

export function requestCreditBalanceRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CREDIT_BALANCE_REFRESH_EVENT));
}

export function useCreditBalance(initialCredits: number | null) {
  const [balance, setBalance] = useState({
    source: initialCredits,
    available: initialCredits,
  });
  if (balance.source !== initialCredits) {
    setBalance({ source: initialCredits, available: initialCredits });
  }

  useEffect(() => {
    function update(event: Event) {
      const next = (event as CustomEvent<CreditBalanceDetail>).detail
        ?.availableCredits;
      if (isValidBalance(next)) {
        setBalance((current) => ({ ...current, available: next }));
      }
    }

    window.addEventListener(CREDIT_BALANCE_UPDATED_EVENT, update);
    return () => window.removeEventListener(CREDIT_BALANCE_UPDATED_EVENT, update);
  }, []);

  return balance.available;
}
