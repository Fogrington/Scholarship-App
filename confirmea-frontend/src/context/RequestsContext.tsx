import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { ServiceRequest, PendingOffer } from "../types";

type RequestsContextValue = {
  myRequest: ServiceRequest | null;
  pendingOffer: PendingOffer | null;
  loading: boolean;
  error: string | null;
  createRequest: (category: string, note: string) => Promise<void>;
  withdrawRequest: (requestId: number) => Promise<void>;
  respondToOffer: (bookingId: number, accept: boolean, keepRequestOpen?: boolean) => Promise<void>;
  refresh: () => void;
};

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);

export function RequestsProvider({ children }: { children: React.ReactNode }) {
  const { token, role, isLoggedIn } = useAuth();
  const [myRequest, setMyRequest] = useState<ServiceRequest | null>(null);
  const [pendingOffer, setPendingOffer] = useState<PendingOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  useEffect(() => {
    if (!isLoggedIn || !token || role !== "customer") {
      setMyRequest(null);
      setPendingOffer(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ServiceRequest | null>("/requests/mine", token),
      api.get<PendingOffer | null>("/bookings/pending-offer", token),
    ])
      .then(([requestData, offerData]) => {
        if (cancelled) return;
        setMyRequest(requestData);
        setPendingOffer(offerData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your request.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token, role, refreshCount]);

  const createRequest = useCallback(
    async (category: string, note: string) => {
      const created = await api.post<ServiceRequest>("/requests", { category, note }, token);
      setMyRequest(created);
    },
    [token]
  );

  const withdrawRequest = useCallback(
    async (requestId: number) => {
      await api.patch(`/requests/${requestId}/withdraw`, {}, token);
      setMyRequest(null);
    },
    [token]
  );

  const respondToOffer = useCallback(
    async (bookingId: number, accept: boolean, keepRequestOpen?: boolean) => {
      await api.post(`/bookings/${bookingId}/respond`, { accept, keepRequestOpen }, token);
      setPendingOffer(null);
      refresh(); // pulls the request's post-response state (matched, reopened, or withdrawn)
    },
    [token, refresh]
  );

  return (
    <RequestsContext.Provider
      value={{ myRequest, pendingOffer, loading, error, createRequest, withdrawRequest, respondToOffer, refresh }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error("useRequests must be used within a RequestsProvider");
  return ctx;
}
