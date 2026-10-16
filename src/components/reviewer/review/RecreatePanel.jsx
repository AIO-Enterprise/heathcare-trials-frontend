import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";

function RecreatePanel({
  label = "Review instruction",
  placeholder,
  buttonLabel = "Re-create",
  loadingLabel = "Re-creating…",
  onRun,
}) {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const run = async () => {
    if (!instructions.trim()) {
      setError("Instruction is required.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await onRun(instructions.trim());
      setSuccess(true);
      setInstructions("");
    } catch (err) {
      setError(err.message || "Re-create failed.");
    }
  };

  const busy = loading && !error && !success;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
      <div>
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-sidebar-text)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              minHeight: 44,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: "0.85rem",
              border: "1px solid var(--color-card-border)",
              backgroundColor: "var(--color-input-bg)",
              color: "var(--color-input-text)",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={run}
            disabled={busy}
            className="btn--accent"
            style={{
              minWidth: 124,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sparkles size={14} />
            )}
            {busy ? loadingLabel : buttonLabel}
          </button>
        </div>
      </div>

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

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            backgroundColor: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <CheckCircle size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
          <p style={{ fontSize: "0.82rem", color: "#22c55e" }}>
            Re-create started in the background. You can keep working on other pages while this updates.
          </p>
        </div>
      )}
    </div>
  );
}

export default RecreatePanel;
