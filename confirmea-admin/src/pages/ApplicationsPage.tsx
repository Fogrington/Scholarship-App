import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import ApplicationDrawer from "./ApplicationDrawer";
import { formatDateTime } from "../utils/formatDateTime";
import type { ApplicationStatus } from "../types";

const TABS: ApplicationStatus[] = ["pending", "approved", "rejected"];

export default function ApplicationsPage() {
  const { applications, loading, error } = useAdminData();
  const [tab, setTab] = useState<ApplicationStatus>("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = applications.find((a) => a.id === selectedId) ?? null;

  const filtered = applications.filter((a) => a.status === tab);

  return (
    <>
      <div className="topbar">
        <h1>Applications</h1>
        <p>Review new business sign-ups before they go live in the app.</p>
      </div>
      <div className="view">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="panel">
          <div className="panel-head">
            <h3>Applications</h3>
            <div className="tabs">
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`tab-btn${tab === t ? " active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <EmptyState message="Loading applications…" />
          ) : filtered.length === 0 ? (
            <EmptyState message={`No ${tab} applications right now.`} />
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="row clickable" onClick={() => setSelectedId(a.id)}>
                <div className="row-main">
                  <div className="row-title">{a.businessName}</div>
                  <div className="row-sub">
                    {a.category} · ABN {a.abn}
                  </div>
                </div>
                <div className="row-meta">
                  <Pill status={a.status} />
                  <div style={{ marginTop: 6 }}>{formatDateTime(a.submittedAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && <ApplicationDrawer application={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
