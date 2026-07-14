import { useState } from "react";
import Drawer from "../components/Drawer";
import { useAdminData } from "../context/AdminDataContext";
import { CheckIcon } from "../components/Icons";
import type { Complaint } from "../data/mockData";

interface Props {
  complaint: Complaint;
  onClose: () => void;
}

export default function ComplaintDrawer({ complaint, onClose }: Props) {
  const { resolveComplaint, dismissComplaint } = useAdminData();
  const [notes, setNotes] = useState(complaint.notes);
  const [resolution, setResolution] = useState("");
  const [resolutionError, setResolutionError] = useState(false);

  const isOpen = complaint.status === "open";

  function handleAction(action: "resolve" | "dismiss") {
    if (!resolution.trim()) {
      setResolutionError(true);
      return;
    }
    if (action === "resolve") {
      resolveComplaint(complaint.id, notes, resolution.trim());
    } else {
      dismissComplaint(complaint.id, notes, resolution.trim());
    }
    onClose();
  }

  return (
    <Drawer onClose={onClose}>
      <h2>{complaint.businessName}</h2>
      <div className="sub">
        {complaint.category} · reported by {complaint.complainant} · {complaint.submitted}
      </div>

      {!isOpen && (
        <div className={`resolved-banner ${complaint.status}`}>
          <CheckIcon />
          <div>
            <div>
              This complaint was <b>{complaint.status}</b>.
            </div>
            {complaint.resolution && <div style={{ marginTop: 4 }}>{complaint.resolution}</div>}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-item full">
          <div className="k">What was reported</div>
          <div className="v" style={{ fontWeight: 500 }}>
            {complaint.details}
          </div>
        </div>
      </div>

      <div className="field-block">
        <label htmlFor="complaint-notes">Internal notes</label>
        <textarea
          id="complaint-notes"
          placeholder="Investigation notes — not shown to the customer."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {isOpen && (
        <>
          <div className="field-block">
            <label htmlFor="complaint-resolution">
              Resolution / outcome <span className="optional">(required to close)</span>
            </label>
            <textarea
              id="complaint-resolution"
              className={resolutionError ? "error" : ""}
              placeholder="What was done about it, or why it's being dismissed."
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value);
                if (resolutionError) setResolutionError(false);
              }}
            />
          </div>
          <div className="action-row">
            <button className="btn btn-outline" onClick={() => handleAction("dismiss")}>
              Dismiss
            </button>
            <button className="btn btn-neutral" onClick={() => handleAction("resolve")}>
              Mark resolved
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
