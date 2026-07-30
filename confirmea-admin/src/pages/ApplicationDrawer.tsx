import { useState } from "react";
import Drawer from "../components/Drawer";
import { useAdminData } from "../context/AdminDataContext";
import { CheckIcon } from "../components/Icons";
import { formatDateTime } from "../utils/formatDateTime";
import { ApiError } from "../api/client";
import type { Application } from "../types";

interface Props {
  application: Application;
  onClose: () => void;
}

export default function ApplicationDrawer({ application, onClose }: Props) {
  const { updateChecklist, approveApplication, rejectApplication } = useAdminData();
  const [notes, setNotes] = useState(application.notes);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isPending = application.status === "pending";
  const { abn, address, contact } = application.checklist;
  const allChecked = abn && address && contact;

  async function handleChecklistToggle(key: keyof Application["checklist"], value: boolean) {
    setActionError(null);
    try {
      await updateChecklist(application.id, key, value);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update the checklist.");
    }
  }

  async function handleApprove() {
    setActionError(null);
    setSubmitting(true);
    try {
      await approveApplication(application.id, notes);
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't approve this application.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError(true);
      return;
    }
    setActionError(null);
    setSubmitting(true);
    try {
      await rejectApplication(application.id, notes, rejectReason.trim());
      onClose();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't reject this application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer onClose={onClose}>
      <h2>{application.businessName}</h2>
      <div className="sub">
        {application.category} application · submitted {formatDateTime(application.submittedAt)}
      </div>

      {actionError && (
        <div className="login-error" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      {!isPending && (
        <div className={`resolved-banner ${application.status}`}>
          <CheckIcon />
          <div>
            <div>
              This application was <b>{application.status}</b>.
            </div>
            {application.decisionReason && <div style={{ marginTop: 4 }}>{application.decisionReason}</div>}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-item">
          <div className="k">ABN</div>
          <div className="v">{application.abn}</div>
        </div>
        <div className="detail-item">
          <div className="k">Category</div>
          <div className="v">{application.category}</div>
        </div>
        <div className="detail-item full">
          <div className="k">Registered address</div>
          <div className="v">{application.address}</div>
        </div>
        <div className="detail-item full">
          <div className="k">Contact</div>
          <div className="v">
            {application.contactName} · {application.contactEmail} · {application.contactPhone}
          </div>
        </div>
      </div>

      {isPending && (
        <div className="checklist">
          <div className="checklist-title">Review checklist</div>
          <div className="check-row">
            <input
              type="checkbox"
              id="chk-abn"
              checked={abn}
              onChange={(e) => handleChecklistToggle("abn", e.target.checked)}
            />
            <label htmlFor="chk-abn">ABN matches a registered business on the ABN Lookup register</label>
          </div>
          <div className="check-row">
            <input
              type="checkbox"
              id="chk-address"
              checked={address}
              onChange={(e) => handleChecklistToggle("address", e.target.checked)}
            />
            <label htmlFor="chk-address">Registered address matches the trading address supplied</label>
          </div>
          <div className="check-row">
            <input
              type="checkbox"
              id="chk-contact"
              checked={contact}
              onChange={(e) => handleChecklistToggle("contact", e.target.checked)}
            />
            <label htmlFor="chk-contact">Contact details verified (call or email reply received)</label>
          </div>
        </div>
      )}

      <div className="field-block">
        <label htmlFor="app-notes">Internal notes</label>
        <textarea
          id="app-notes"
          placeholder="Notes for the team — not shown to the business."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {isPending && (
        <>
          <div className="field-block">
            <label htmlFor="app-reject-reason">
              Rejection reason <span className="optional">(required to reject)</span>
            </label>
            <textarea
              id="app-reject-reason"
              className={rejectError ? "error" : ""}
              placeholder="Explain what needs to change before they can reapply."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(false);
              }}
            />
          </div>

          <div className="action-row">
            <button className="btn btn-reject" onClick={handleReject} disabled={submitting}>
              Reject application
            </button>
            <button className="btn btn-approve" onClick={handleApprove} disabled={!allChecked || submitting}>
              {submitting ? "Working…" : "Approve business"}
            </button>
          </div>
          {!allChecked && <p className="hint">Tick all three checklist items to enable approval.</p>}
        </>
      )}
    </Drawer>
  );
}
