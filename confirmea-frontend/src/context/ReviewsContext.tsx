import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { PendingReview } from "../types";

type ReviewsContextValue = {
  pendingReviews: PendingReview[];
  submitReview: (bookingId: number, rating: number) => Promise<void>;
  skipForNow: () => void;
};

const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { token, role, isLoggedIn } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);

  useEffect(() => {
    if (!isLoggedIn || !token || role !== "customer") {
      setPendingReviews([]);
      return;
    }

    let cancelled = false;
    api
      .get<PendingReview[]>("/bookings/pending-review", token)
      .then((data) => {
        if (!cancelled) setPendingReviews(data);
      })
      .catch(() => {
        // Non-critical — if this fails, the customer just doesn't get prompted this
        // session. Not worth surfacing an error banner for.
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, token, role]);

  const submitReview = useCallback(
    async (bookingId: number, rating: number) => {
      await api.post(`/bookings/${bookingId}/review`, { rating }, token);
      setPendingReviews((prev) => prev.filter((r) => r.bookingId !== bookingId));
    },
    [token]
  );

  const skipForNow = useCallback(() => {
    // Session-only dismissal — no backend call, so it'll ask again next login.
    setPendingReviews([]);
  }, []);

  return (
    <ReviewsContext.Provider value={{ pendingReviews, submitReview, skipForNow }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error("useReviews must be used within a ReviewsProvider");
  return ctx;
}
