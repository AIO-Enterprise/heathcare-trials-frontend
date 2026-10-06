import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { adsAPI } from "../../../services/api";
import { InlineProgress, useGenerateProgress } from "./useGenerateProgress";

// ─── AI Re-Strategy panel ──────────────────────────────────────────────────────
//
// Reviewer writes freeform instructions / feedback.
// Calls adsAPI.rewriteStrategy(adId, { instructions }) → backend runs full AI rewrite.
// Backend should append a system audit message like:
//   "AI Re-Strategy triggered by reviewer: '<first 120 chars of instructions>…'"

function AIReStrategyPanel({ adId, onRewritten }) {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const reProgress = useGenerateProgress();

  const run = async () => {
    if (!instructions.trim()) {
      setError("Instructions are required.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you want to replace the current strategy.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    reProgress.start("Re-writing strategy…", 120000);

    try {
      const triggered = await adsAPI.rewriteStrategy(adId, {
        instructions: instructions.trim(),
      });

      const beforeAt = triggered.updated_at;
      const deadline = Date.now() + 180000;
      let done = false;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 4000));

        try {
          const latest = await adsAPI.get(adId);

          const processing = latest.status === "optimizing" || latest.status === "generating";

          const changed = latest.updated_at !== beforeAt;

          if (changed && !processing) {
            done = true;
            break;
          }
        } catch (_) {
          // swallow transient polling errors
        }
      }

      if (!done) {
        throw new Error("Timed out waiting for re-strategy to complete. Please refresh.");
      }
      reProgress.complete();
      setSuccess(true);
      setInstructions("");
      setConfirmed(false);
      onRewritten();
    } catch (err) {
      reProgress.fail();
      setError(err.message || "Re-strategy failed.");
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
  const textStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: "0.85rem",
    border: "1px solid var(--color-card-border)",
    backgroundColor: "var(--color-input-bg)",
    color: "var(--color-input-text)",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 130,
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Warning callout */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 8,
          backgroundColor: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        <Sparkles size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)", lineHeight: 1.5 }}>
          This will{" "}
          <strong style={{ color: "var(--color-input-text)" }}>
            replace the entire strategy from scratch
          </strong>{" "}
          using your instructions as guidance. The current strategy will be overwritten. This action
          is recorded in the audit trail.
        </p>
      </div>

      {/* Instructions textarea */}
      <div>
        <label style={labelStyle}>Your Instructions *</label>
        <textarea
          style={textStyle}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g. The current strategy over-indexes on social media. Refocus on B2B channels like LinkedIn and email with a thought-leadership angle. Reduce influencer budget to under 10%. Keep the same target audience but adjust messaging tone to be more professional."
        />
        <p style={{ fontSize: "0.7rem", color: "var(--color-sidebar-text)", marginTop: 4 }}>
          Be as specific as possible — the original campaign brief plus your instructions will be
          used to generate a new strategy.
        </p>
      </div>

      {/* Confirmation checkbox */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: "var(--color-accent)", cursor: "pointer" }}
        />
        <span style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
          I understand the current strategy will be permanently replaced
        </span>
      </label>

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
            AI is re-writing the strategy. Reload in a few seconds to see the result.
          </p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={run}
          disabled={loading || !confirmed}
          className="btn--accent"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: loading || !confirmed ? 0.6 : 1,
            cursor: loading || !confirmed ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Sparkles size={14} />
          )}
          {loading ? "Re-writing strategy… (1–2 min)" : "Trigger AI Re-Strategy"}
        </button>
        <InlineProgress progress={reProgress.progress} />
      </div>
    </div>
  );
}

export default AIReStrategyPanel;
