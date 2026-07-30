import { useState } from "react";
import Drawer from "../components/Drawer";
import { useAdminData } from "../context/AdminDataContext";
import { CheckIcon } from "../components/Icons";
import { formatDateTime } from "../utils/formatDateTime";
import { ApiError } from "../api/client";
import type { Complaint } from "../types";

interface Props {
  complaint: Complaint;
  onClose: () => void;
}

export default function ComplaintDrawer({ complaint, onClose }: Props) {
  const { resolveComplaint, dismissComplaint } = useAdminData();
  const [notes, setNotes] = useState(complaint.notes);
  const [resolution, setResolution] = useState("");
  const [resolutionError, setResolutionError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isOpen = complaint.status === "open";

  async function handleAction(action: "resolve" | "dismiss") {
    if (!resolution.trim()) {
      setResolutionError(true);
      return;
    }
    setActionError(null);
    setSubmitting(true);
    try {
      if (action === "resolve") {
        await resolveComplaint(complaint.id, notes, resolution.trim());
      } else {
        await dismissComplaint(complaint.id, notes, resolution.trim());
      }
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer onClose={onClose}>
      <h2>{complaint.businessName}</h2>
      <div className="sub">
        {complaint.category} · reported by {complaint.complainant} · {formatDateTime(complaint.submittedAt)}
      </div>

      {actionError && (
        <div className="login-error" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      )}

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
            <button className="btn btn-outline" onClick={() => handleAction("dismiss")} disabled={submitting}>
              Dismiss
            </button>
            <button className="btn btn-neutral" onClick={() => handleAction("resolve")} disabled={submitting}>
              {submitting ? "Working…" : "Mark resolved"}
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
