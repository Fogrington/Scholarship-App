import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import type { Application, Business, Complaint, ActivityEntry } from "../types";

interface AdminDataContextValue {
  applications: Application[];
  complaints: Complaint[];
  businesses: Business[];
  activity: ActivityEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateChecklist: (id: number, key: keyof Application["checklist"], value: boolean) => Promise<void>;
  approveApplication: (id: number, notes: string) => Promise<void>;
  rejectApplication: (id: number, notes: string, reason: string) => Promise<void>;
  resolveComplaint: (id: number, notes: string, resolution: string) => Promise<void>;
  dismissComplaint: (id: number, notes: string, resolution: string) => Promise<void>;
  createBusinessAccount: (businessId: number, email: string, password: string, name: string) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  // Activity is a session-only log of what this admin has done — the backend
  // doesn't have an audit-log endpoint yet, so this resets on refresh.
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount((n) => n + 1), []);

  const logActivity = useCallback((type: ActivityEntry["type"], text: string) => {
    setActivity((prev) => [{ id: `a-${Date.now()}`, type, text, time: "just now" }, ...prev]);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setApplications([]);
      setComplaints([]);
      setBusinesses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<Application[]>("/applications", token),
      api.get<Complaint[]>("/complaints", token),
      api.get<Business[]>("/businesses/admin", token),
    ])
      .then(([apps, comps, bizs]) => {
        if (cancelled) return;
        setApplications(apps);
        setComplaints(comps);
        setBusinesses(bizs);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load admin data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, refreshCount]);

  const updateChecklist = useCallback(
    async (id: number, key: keyof Application["checklist"], value: boolean) => {
      const updated = await api.patch<Application>(`/applications/${id}/checklist`, { key, value }, token);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    },
    [token]
  );

  const approveApplication = useCallback(
    async (id: number, notes: string) => {
      const updated = await api.patch<Application>(`/applications/${id}/approve`, { notes }, token);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      logActivity("approved", `<b>${updated.businessName}</b> application approved`);
      refresh(); // the approval created a new business row server-side — pull the fresh list
    },
    [token, logActivity, refresh]
  );

  const rejectApplication = useCallback(
    async (id: number, notes: string, reason: string) => {
      const updated = await api.patch<Application>(`/applications/${id}/reject`, { notes, reason }, token);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      logActivity("rejected", `<b>${updated.businessName}</b> application rejected`);
    },
    [token, logActivity]
  );

  const resolveComplaint = useCallback(
    async (id: number, notes: string, resolution: string) => {
      const updated = await api.patch<Complaint>(`/complaints/${id}/resolve`, { notes, resolution }, token);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      logActivity("resolved", `Complaint from <b>${updated.complainant}</b> about ${updated.businessName} resolved`);
      refresh(); // open-complaint counts on the Businesses page need to catch up
    },
    [token, logActivity, refresh]
  );

  const dismissComplaint = useCallback(
    async (id: number, notes: string, resolution: string) => {
      const updated = await api.patch<Complaint>(`/complaints/${id}/dismiss`, { notes, resolution }, token);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      logActivity("dismissed", `Complaint from <b>${updated.complainant}</b> about ${updated.businessName} dismissed`);
      refresh();
    },
    [token, logActivity, refresh]
  );

  const createBusinessAccount = useCallback(
    async (businessId: number, email: string, password: string, name: string) => {
      const created = await api.post<{ email: string; businessName: string }>(
        `/businesses/${businessId}/account`,
        { email, password, name },
        token
      );
      setBusinesses((prev) =>
        prev.map((b) => (b.id === businessId ? { ...b, accountEmail: created.email } : b))
      );
      logActivity("created", `Business login created for <b>${created.businessName}</b>`);
    },
    [token, logActivity]
  );

  return (
    <AdminDataContext.Provider
      value={{
        applications,
        complaints,
        businesses,
        activity,
        loading,
        error,
        refresh,
        updateChecklist,
        approveApplication,
        rejectApplication,
        resolveComplaint,
        dismissComplaint,
        createBusinessAccount,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within an AdminDataProvider");
  return ctx;
}
