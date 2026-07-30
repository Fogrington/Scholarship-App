import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import ApplicationDrawer from "./ApplicationDrawer";
import { formatDateTime } from "../utils/formatDateTime";

export default function OverviewPage() {
  const { applications, complaints, businesses, activity, loading, error } = useAdminData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = applications.find((a) => a.id === selectedId) ?? null;

  const pendingApps = applications.filter((a) => a.status === "pending");
  const openComplaints = complaints.filter((c) => c.status === "open");

  return (
    <>
      <div className="topbar">
        <h1>Overview</h1>
        <p>A snapshot of what needs attention today.</p>
      </div>
      <div className="view">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="num">{pendingApps.length}</div>
            <div className="label">Pending applications</div>
          </div>
          <div className="stat-card">
            <div className="num">{openComplaints.length}</div>
            <div className="label">Open complaints</div>
          </div>
          <div className="stat-card">
            <div className="num">{businesses.length}</div>
            <div className="label">Active businesses</div>
          </div>
          <div className="stat-card">
            {/* businesses.length already covers every approval, both seeded directly
                and created via an approved application, so it doubles as "all-time". */}
            <div className="num">{businesses.length}</div>
            <div className="label">Approved all-time</div>
          </div>
        </div>

        <div className="two-col">
          <div className="panel">
            <div className="panel-head">
              <h3>Needs review</h3>
            </div>
            {loading ? (
              <EmptyState message="Loading…" />
            ) : pendingApps.length === 0 ? (
              <EmptyState message="All caught up — no pending applications." />
            ) : (
              pendingApps.map((a) => (
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

          <div className="panel">
            <div className="panel-head">
              <h3>Recent activity</h3>
            </div>
            {activity.length === 0 ? (
              <EmptyState message="Nothing done this session yet." />
            ) : (
              activity.slice(0, 6).map((entry) => (
                <div key={entry.id} className="activity-item">
                  <div className={`activity-dot ${entry.type}`} />
                  <div>
                    <div className="activity-text" dangerouslySetInnerHTML={{ __html: entry.text }} />
                    <div className="activity-time">{entry.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selected && <ApplicationDrawer application={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
