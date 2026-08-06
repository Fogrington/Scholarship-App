import { useState, type CSSProperties } from "react";
import Drawer from "../components/Drawer";
import { useAdminData } from "../context/AdminDataContext";
import { CheckIcon } from "../components/Icons";
import type { Business } from "../types";

interface Props {
  business: Business;
  onClose: () => void;
}

const fieldInputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid var(--border)",
  fontSize: 13,
  fontFamily: "var(--body)",
  background: "var(--paper)",
};

export default function BusinessAccountDrawer({ business, onClose }: Props) {
  const { createBusinessAccount } = useAdminData();
  const [name, setName] = useState(business.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasAccount = Boolean(business.accountEmail);
  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6;

  async function handleCreate() {
    if (!canSubmit) {
      setError("Fill in a name, email, and a password of at least 6 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createBusinessAccount(business.id, email.trim(), password, name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create this account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer onClose={onClose}>
      <h2>{business.name}</h2>
      <div className="sub">
        {business.category} · {business.address}
      </div>

      <div className="detail-grid">
        <div className="detail-item full">
          <div className="k">Approved</div>
          <div className="v">{business.approvedAt}</div>
        </div>
      </div>

      {hasAccount ? (
        <div className="resolved-banner approved">
          <CheckIcon />
          <div>
            <div>
              This business already has a login: <b>{business.accountEmail}</b>
            </div>
            <div style={{ marginTop: 4 }}>
              They can use this to log into the mobile app's business dashboard.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="checklist-title" style={{ marginBottom: 12 }}>
            Create a business login
          </div>

          {error && (
            <div className="login-error" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <div className="field-block">
            <label htmlFor="biz-name">Contact name</label>
            <input
              id="biz-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={fieldInputStyle}
            />
          </div>

          <div className="field-block">
            <label htmlFor="biz-email">Login email</label>
            <input
              id="biz-email"
              type="email"
              placeholder="owner@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={fieldInputStyle}
            />
          </div>

          <div className="field-block">
            <label htmlFor="biz-password">Temporary password</label>
            <input
              id="biz-password"
              type="text"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={fieldInputStyle}
            />
            <p className="hint">Share this with the business directly — there's no reset flow yet.</p>
          </div>

          <div className="action-row">
            <button className="btn btn-neutral" onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating…" : "Create login"}
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
