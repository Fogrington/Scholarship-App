import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import ComplaintDrawer from "./ComplaintDrawer";
import { formatDateTime } from "../utils/formatDateTime";
import type { ComplaintStatus, ComplaintType } from "../types";

const STATUS_TABS: ComplaintStatus[] = ["open", "resolved", "dismissed"];
const TYPE_FILTERS: { key: ComplaintType | "all"; label: string }[] = [
  { key: "all", label: "All types" },
  { key: "business", label: "Business complaints" },
  { key: "app", label: "App feedback" },
];

export default function ComplaintsPage() {
  const { complaints, loading, error } = useAdminData();
  const [tab, setTab] = useState<ComplaintStatus>("open");
  const [typeFilter, setTypeFilter] = useState<ComplaintType | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = complaints.find((c) => c.id === selectedId) ?? null;

  const filtered = complaints.filter((c) => c.status === tab && (typeFilter === "all" || c.type === typeFilter));

  return (
    <>
      <div className="topbar">
        <h1>Complaints</h1>
        <p>Business complaints and app feedback both land here.</p>
      </div>
      <div className="view">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="panel">
          <div className="panel-head">
            <h3>Complaints</h3>
            <div className="tabs">
              {STATUS_TABS.map((t) => (
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

          <div className="tabs" style={{ padding: "0 20px 12px" }}>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                className={`tab-btn${typeFilter === t.key ? " active" : ""}`}
                onClick={() => setTypeFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <EmptyState message="Loading complaints…" />
          ) : filtered.length === 0 ? (
            <EmptyState message={`No ${tab} ${typeFilter === "all" ? "items" : typeFilter === "app" ? "app feedback" : "complaints"}.`} />
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="row clickable" onClick={() => setSelectedId(c.id)}>
                <div className="row-main">
                  <div className="row-title">
                    {c.type === "app" ? "Confirmea App" : c.businessName}
                    {c.type === "app" && (
                      <span style={{ marginLeft: 8 }}>
                        <Pill status="pending" label="App" />
                      </span>
                    )}
                  </div>
                  <div className="row-sub">
                    {c.category} · {c.type === "app" ? "from" : "reported by"} {c.complainant}
                  </div>
                </div>
                <div className="row-meta">
                  <Pill status={c.status} />
                  <div style={{ marginTop: 6 }}>{formatDateTime(c.submittedAt)}</div>
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
