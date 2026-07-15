import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import ComplaintDrawer from "./ComplaintDrawer";
import type { ComplaintStatus } from "../data/mockData";

const TABS: ComplaintStatus[] = ["open", "resolved", "dismissed"];

export default function ComplaintsPage() {
  const { complaints } = useAdminData();
  const [tab, setTab] = useState<ComplaintStatus>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;

  const filtered = complaints.filter((c) => c.status === tab);

  return (
    <>
      <div className="topbar">
        <h1>Complaints</h1>
        <p>Track and resolve issues customers raise about a business.</p>
      </div>
      <div className="view">
        <div className="panel">
          <div className="panel-head">
            <h3>Complaints</h3>
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

          {filtered.length === 0 ? (
            <EmptyState message={`No ${tab} complaints.`} />
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="row clickable" onClick={() => setSelectedId(c.id)}>
                <div className="row-main">
                  <div className="row-title">{c.businessName}</div>
                  <div className="row-sub">
                    {c.category} · reported by {c.complainant}
                  </div>
                </div>
                <div className="row-meta">
                  <Pill status={c.status} />
                  <div style={{ marginTop: 6 }}>{c.submitted}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selected && <ComplaintDrawer complaint={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}