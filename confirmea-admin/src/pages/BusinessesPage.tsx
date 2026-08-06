import { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import BusinessAccountDrawer from "./BusinessAccountDrawer";
import { formatDateTime } from "../utils/formatDateTime";
import type { Business } from "../types";

export default function BusinessesPage() {
  const { businesses, loading, error } = useAdminData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = businesses.find((b) => b.id === selectedId) ?? null;

  return (
    <>
      <div className="topbar">
        <h1>Businesses</h1>
        <p>Everything currently live and bookable in Confirmea. Click one to manage its login.</p>
      </div>
      <div className="view">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="panel">
          <div className="panel-head">
            <h3>Live on Confirmea</h3>
          </div>
          {loading ? (
            <EmptyState message="Loading businesses…" />
          ) : businesses.length === 0 ? (
            <EmptyState message="No businesses yet." />
          ) : (
            businesses.map((b: Business) => {
              const openCount = b.openComplaints ?? 0;
              return (
                <div key={b.id} className="row clickable" onClick={() => setSelectedId(b.id)}>
                  <div className="row-main">
                    <div className="row-title">{b.name}</div>
                    <div className="row-sub">
                      {b.category} · {b.address}
                    </div>
                  </div>
                  <div className="row-meta">
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {openCount > 0 ? (
                        <Pill status="open" label={`${openCount} open complaint${openCount > 1 ? "s" : ""}`} />
                      ) : (
                        <Pill status="approved" label="clear" />
                      )}
                      {b.accountEmail ? (
                        <Pill status="approved" label="has login" />
                      ) : (
                        <Pill status="pending" label="no login" />
                      )}
                    </div>
                    <div style={{ marginTop: 6 }}>Approved {formatDateTime(b.approvedAt)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selected && <BusinessAccountDrawer business={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
