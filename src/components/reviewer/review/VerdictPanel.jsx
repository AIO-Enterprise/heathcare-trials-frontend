import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Send } from "lucide-react";
import { adsAPI } from "../../../services/api";

// ─── Verdict review panel (existing behaviour, preserved) ─────────────────────

function VerdictPanel({ adId, onSubmitted }) {
  const INITIAL_FORM = {
    review_type: "strategy",
    status: "approved",
    comments: "",
    suggestions: "",
  };
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(null); // { status, review_type }

  const submit = async () => {
    if (form.status !== "approved" && !form.comments.trim()) {
      setError("Comments are required when requesting revision or rejecting.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        comments: form.comments.trim() || "Approved.",
        suggestions: form.suggestions.trim() ? { text: form.suggestions.trim() } : null,
      };
      await adsAPI.createReview(adId, payload);
      setSubmitted({ status: form.status, review_type: form.review_type });
      setForm(INITIAL_FORM);
      onSubmitted();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--color-sidebar-text)",
    display: "block",
    marginBottom: 6,
  };
  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: "0.85rem",
    border: "1px solid var(--color-card-border)",
    backgroundColor: "var(--color-input-bg)",
    color: "var(--color-input-text)",
    outline: "none",
    boxSizing: "border-box",
  };
  const textStyle = { ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Review Type</label>
          <select
            style={inputStyle}
            value={form.review_type}
            onChange={(e) => setForm((p) => ({ ...p, review_type: e.target.value }))}
          >
            <option value="strategy">Strategy Review</option>
            <option value="ethics">Ethics Review</option>
            <option value="performance">Performance Review</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Decision</label>
          <select
            style={inputStyle}
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="approved">Approve</option>
            <option value="revision">Request Revision</option>
            <option value="rejected">Reject</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Comments {form.status !== "approved" ? "*" : "(optional)"}</label>
        <textarea
          style={textStyle}
          placeholder="Provide your review comments..."
          value={form.comments}
          onChange={(e) => setForm((p) => ({ ...p, comments: e.target.value }))}
        />
      </div>
      <div>
        <label style={labelStyle}>Suggestions (optional)</label>
        <textarea
          style={{ ...textStyle, minHeight: 60 }}
          placeholder="Any specific suggestions for improvement..."
          value={form.suggestions}
          onChange={(e) => setForm((p) => ({ ...p, suggestions: e.target.value }))}
        />
      </div>

      {submitted &&
        (() => {
          const isApproved = submitted.status === "approved";
          const isRevision = submitted.status === "revision";
          const typeLabel =
            submitted.review_type === "strategy"
              ? "Strategy"
              : submitted.review_type === "ethics"
                ? "Ethics"
                : "Performance";
          const [bg, border, icon, text] = isApproved
            ? [
                "rgba(34,197,94,0.08)",
                "rgba(34,197,94,0.3)",
                <CheckCircle size={16} style={{ color: "#22c55e", flexShrink: 0 }} />,
                `${typeLabel} review submitted — campaign approved.`,
              ]
            : isRevision
              ? [
                  "rgba(251,191,36,0.08)",
                  "rgba(251,191,36,0.35)",
                  <AlertCircle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />,
                  `${typeLabel} review submitted — revision requested.`,
                ]
              : [
                  "rgba(239,68,68,0.08)",
                  "rgba(239,68,68,0.3)",
                  <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />,
                  `${typeLabel} review submitted — campaign rejected.`,
                ];
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 10,
                backgroundColor: bg,
                border: `1px solid ${border}`,
              }}
            >
              {icon}
              <div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  Review Submitted
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-sidebar-text)",
                    margin: "2px 0 0",
                  }}
                >
                  {text}
                </p>
              </div>
            </div>
          );
        })()}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
          <p style={{ fontSize: "0.82rem", color: "#ef4444" }}>{error}</p>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="btn--accent"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Send size={14} />
        )}
        Submit Review
      </button>
    </div>
  );
}

export default VerdictPanel;
