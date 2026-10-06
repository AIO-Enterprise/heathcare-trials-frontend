import { useEffect, useState } from "react";
import { Loader2, Phone } from "lucide-react";
import { adsAPI } from "../../../services/api";
import ConversationAnalysis from "./ConversationAnalysis";

// ─── VoiceSessionCard ─────────────────────────────────────────────────────────
function VoiceSessionCard({ vs, campaignId, analysisLoading, onReanalyze }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);

  useEffect(() => {
    if (!vs.elevenlabs_conversation_id) return;
    let objectUrl;
    setAudioLoading(true);
    setAudioError(null);
    adsAPI
      .fetchVoiceRecording(vs.elevenlabs_conversation_id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
      })
      .catch(() => setAudioError("Recording not available"))
      .finally(() => setAudioLoading(false));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [vs.elevenlabs_conversation_id]);

  return (
    <div
      style={{
        border: "1px solid var(--color-card-border)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          backgroundColor: "var(--color-page-bg)",
          borderBottom: "1px solid var(--color-card-border)",
        }}
      >
        <Phone size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-input-text)" }}>
          {vs.phone || "Unknown number"}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor:
              vs.status === "ended"
                ? "rgba(34,197,94,0.12)"
                : vs.status === "failed"
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(245,158,11,0.12)",
            color:
              vs.status === "ended" ? "#16a34a" : vs.status === "failed" ? "#dc2626" : "#b45309",
          }}
        >
          {vs.status}
        </span>
        {vs.duration_seconds != null && (
          <span style={{ fontSize: "0.72rem", color: "var(--color-sidebar-text)" }}>
            {Math.floor(vs.duration_seconds / 60)}m {vs.duration_seconds % 60}s
          </span>
        )}
        {vs.started_at && (
          <span style={{ fontSize: "0.72rem", color: "var(--color-sidebar-text)" }}>
            {new Date(vs.started_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Audio player */}
      {vs.elevenlabs_conversation_id && (
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-card-border)",
            backgroundColor: "var(--color-card-bg)",
          }}
        >
          {audioLoading && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--color-sidebar-text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Loading
              recording…
            </p>
          )}
          {audioError && (
            <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)" }}>{audioError}</p>
          )}
          {audioUrl && <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />}
        </div>
      )}

      {/* AI Analysis */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: vs.transcripts?.length > 0 ? "1px solid var(--color-card-border)" : "none",
          backgroundColor: "var(--color-card-bg)",
        }}
      >
        <ConversationAnalysis
          analysis={vs.call_analysis}
          sessionId={vs.id}
          loading={analysisLoading}
          onReanalyze={onReanalyze}
        />
      </div>

      {/* Transcript */}
      {vs.transcripts?.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            maxHeight: 320,
            overflowY: "auto",
            padding: "12px 16px",
          }}
        >
          {[...vs.transcripts]
            .sort((a, b) => (a.turn_index ?? 0) - (b.turn_index ?? 0))
            .map((turn, ti) => (
              <div
                key={ti}
                style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 44,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textAlign: "right",
                    paddingTop: 3,
                    color:
                      turn.speaker === "agent"
                        ? "var(--color-accent)"
                        : "var(--color-sidebar-text)",
                    textTransform: "uppercase",
                  }}
                >
                  {turn.speaker === "agent" ? "Agent" : "User"}
                </span>
                <div
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                    backgroundColor:
                      turn.speaker === "agent"
                        ? "rgba(var(--accent-rgb, 16,185,129), 0.07)"
                        : "var(--color-page-bg)",
                    border: "1px solid var(--color-card-border)",
                    color: "var(--color-input-text)",
                  }}
                >
                  {turn.text}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p style={{ fontSize: "0.8rem", color: "var(--color-sidebar-text)", padding: "12px 16px" }}>
          No transcript available yet.
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default VoiceSessionCard;
