import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import ApplicationDrawer from "./ApplicationDrawer";
import type { Application } from "../data/mockData";

export default function OverviewPage() {
  const { applications, complaints, businesses, activity } = useAdminData();
  const [selected, setSelected] = useState<Application | null>(null);

  const pendingApps = applications.filter((a) => a.status === "pending");
  const openComplaints = complaints.filter((c) => c.status === "open");
  const approvedAllTime = applications.filter((a) => a.status === "approved").length + businesses.length;

  return (
    <>
      <div className="topbar">
        <h1>Overview</h1>
        <p>A snapshot of what needs attention today.</p>
      </div>
      <div className="view">
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
            <div className="num">{approvedAllTime}</div>
            <div className="label">Approved all-time</div>
          </div>
        </div>

        <div className="two-col">
          <div className="panel">
            <div className="panel-head">
              <h3>Needs review</h3>
            </div>
            {pendingApps.length === 0 ? (
              <EmptyState message="All caught up — no pending applications." />
            ) : (
              pendingApps.map((a) => (
                <div key={a.id} className="row clickable" onClick={() => setSelected(a)}>
                  <div className="row-main">
                    <div className="row-title">{a.businessName}</div>
                    <div className="row-sub">
                      {a.category} · ABN {a.abn}
                    </div>
                  </div>
                  <div className="row-meta">
                    <Pill status={a.status} />
                    <div style={{ marginTop: 6 }}>{a.submitted}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Recent activity</h3>
            </div>
            {activity.slice(0, 6).map((entry) => (
              <div key={entry.id} className="activity-item">
                <div className={`activity-dot ${entry.type}`} />
                <div>
                  <div className="activity-text" dangerouslySetInnerHTML={{ __html: entry.text }} />
                  <div className="activity-time">{entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && <ApplicationDrawer application={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
