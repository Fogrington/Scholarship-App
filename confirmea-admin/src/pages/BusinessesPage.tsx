import { useAdminData } from "../context/AdminDataContext";
import EmptyState from "../components/EmptyState";
import Pill from "../components/Pill";
import { formatDateTime } from "../utils/formatDateTime";

export default function BusinessesPage() {
  const { businesses, loading, error } = useAdminData();

  return (
    <>
      <div className="topbar">
        <h1>Businesses</h1>
        <p>Everything currently live and bookable in Confirmea.</p>
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
            businesses.map((b) => {
              const openCount = b.openComplaints ?? 0;
              return (
                <div key={b.id} className="row">
                  <div className="row-main">
                    <div className="row-title">{b.name}</div>
                    <div className="row-sub">
                      {b.category} · {b.address}
                    </div>
                  </div>
                  <div className="row-meta">
                    {openCount > 0 ? (
                      <Pill status="open" label={`${openCount} open complaint${openCount > 1 ? "s" : ""}`} />
                    ) : (
                      <Pill status="approved" label="clear" />
                    )}
                    <div style={{ marginTop: 6 }}>Approved {formatDateTime(b.approvedAt)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
