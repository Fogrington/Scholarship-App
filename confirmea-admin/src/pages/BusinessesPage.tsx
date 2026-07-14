import { useAdminData } from "../context/AdminDataContext";
import Pill from "../components/Pill";

export default function BusinessesPage() {
  const { businesses, complaints } = useAdminData();

  return (
    <>
      <div className="topbar">
        <h1>Businesses</h1>
        <p>Everything currently live and bookable in Confirmea.</p>
      </div>
      <div className="view">
        <div className="panel">
          <div className="panel-head">
            <h3>Live on Confirmea</h3>
          </div>
          {businesses.map((b) => {
            const openCount = complaints.filter((c) => c.businessId === b.id && c.status === "open").length;
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
                  <div style={{ marginTop: 6 }}>Approved {b.approvedDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
