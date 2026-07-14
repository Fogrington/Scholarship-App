import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  type Application,
  type Business,
  type Complaint,
  type ActivityEntry,
  initialApplications,
  initialBusinesses,
  initialComplaints,
  initialActivity,
} from "../data/mockData";

interface AdminDataContextValue {
  applications: Application[];
  complaints: Complaint[];
  businesses: Business[];
  activity: ActivityEntry[];
  updateChecklist: (id: string, key: keyof Application["checklist"], value: boolean) => void;
  approveApplication: (id: string, notes: string) => void;
  rejectApplication: (id: string, notes: string, reason: string) => void;
  resolveComplaint: (id: string, notes: string, resolution: string) => void;
  dismissComplaint: (id: string, notes: string, resolution: string) => void;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity);

  const logActivity = useCallback((type: ActivityEntry["type"], text: string) => {
    setActivity((prev) => [{ id: `a-${Date.now()}`, type, text, time: "just now" }, ...prev]);
  }, []);

  const updateChecklist = useCallback((id: string, key: keyof Application["checklist"], value: boolean) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checklist: { ...a.checklist, [key]: value } } : a))
    );
  }, []);

  const approveApplication = useCallback(
    (id: string, notes: string) => {
      setApplications((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) {
          setBusinesses((biz) => [
            ...biz,
            {
              id: `biz-${Date.now()}`,
              name: target.businessName,
              category: target.category,
              address: target.address,
              approvedDate: "just now",
            },
          ]);
          logActivity("approved", `<b>${target.businessName}</b> application approved`);
        }
        return prev.map((a) => (a.id === id ? { ...a, status: "approved", notes } : a));
      });
    },
    [logActivity]
  );

  const rejectApplication = useCallback(
    (id: string, notes: string, reason: string) => {
      setApplications((prev) => {
        const target = prev.find((a) => a.id === id);
        if (target) {
          logActivity("rejected", `<b>${target.businessName}</b> application rejected`);
        }
        return prev.map((a) => (a.id === id ? { ...a, status: "rejected", notes, decisionReason: reason } : a));
      });
    },
    [logActivity]
  );

  const resolveComplaint = useCallback(
    (id: string, notes: string, resolution: string) => {
      setComplaints((prev) => {
        const target = prev.find((c) => c.id === id);
        if (target) {
          logActivity("resolved", `Complaint from <b>${target.complainant}</b> about ${target.businessName} resolved`);
        }
        return prev.map((c) => (c.id === id ? { ...c, status: "resolved", notes, resolution } : c));
      });
    },
    [logActivity]
  );

  const dismissComplaint = useCallback(
    (id: string, notes: string, resolution: string) => {
      setComplaints((prev) => {
        const target = prev.find((c) => c.id === id);
        if (target) {
          logActivity("dismissed", `Complaint from <b>${target.complainant}</b> about ${target.businessName} dismissed`);
        }
        return prev.map((c) => (c.id === id ? { ...c, status: "dismissed", notes, resolution } : c));
      });
    },
    [logActivity]
  );

  return (
    <AdminDataContext.Provider
      value={{
        applications,
        complaints,
        businesses,
        activity,
        updateChecklist,
        approveApplication,
        rejectApplication,
        resolveComplaint,
        dismissComplaint,
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
