import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { analysisAPI } from "../../../services/api";
import { SectionCard } from "../../shared/Layout";
import VoiceSessionCard from "./VoiceSessionCard";
import ConversationAnalysis from "./ConversationAnalysis";
export default function ParticipantsTab({
  ad,
  id,
  participants,
  participantsLoading,
  participantAppointments,
  setParticipantAppointments,
  selectedParticipant,
  setSelectedParticipant,
  eligibilityFilter,
  setEligibilityFilter,
  analysisLoading,
  setAnalysisLoading,
  syncingTranscripts,
  syncResult,
  handleSyncTranscripts,
}) {
  return (
    <>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {selectedParticipant ? (
              /* ── Detail view ── */
              <SectionCard
                title={selectedParticipant.name}
                subtitle={`${selectedParticipant.source ? selectedParticipant.source.charAt(0).toUpperCase() + selectedParticipant.source.slice(1) + " · " : ""}${selectedParticipant.created_at ? new Date(selectedParticipant.created_at).toLocaleString() : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button
                    onClick={() => {
                      setSelectedParticipant(null);
                      setParticipantAppointments([]);
                    }}
                    className="btn--ghost"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.8rem",
                    }}
                  >
                    <ArrowLeft size={13} /> Back to list
                  </button>
                  {selectedParticipant.voice_sessions?.some((vs) => vs.transcripts?.length > 0) &&
                    selectedParticipant.source !== "chatbot" && (
                      <button
                        onClick={async () => {
                          const sessionsToAnalyze = selectedParticipant.voice_sessions.filter(
                            (vs) => vs.transcripts?.length > 0,
                          );
                          const loadingMap = {};
                          sessionsToAnalyze.forEach((vs) => {
                            loadingMap[vs.id] = true;
                          });
                          setAnalysisLoading((prev) => ({ ...prev, ...loadingMap }));
                          try {
                            const results = await analysisAPI.analyzeParticipant(
                              id,
                              selectedParticipant.id,
                            );
                            const analysisById = {};
                            (results.analyses || []).forEach((r) => {
                              if (r.analysis) analysisById[r.session_id] = r.analysis;
                            });
                            setSelectedParticipant((prev) => ({
                              ...prev,
                              voice_sessions: prev.voice_sessions.map((vs) =>
                                analysisById[vs.id]
                                  ? { ...vs, call_analysis: analysisById[vs.id] }
                                  : vs,
                              ),
                            }));
                          } catch (e) {
                            console.error("Bulk analysis failed", e);
                          } finally {
                            setAnalysisLoading((prev) => {
                              const next = { ...prev };
                              sessionsToAnalyze.forEach((vs) => {
                                delete next[vs.id];
                              });
                              return next;
                            });
                          }
                        }}
                        className="btn--ghost"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.78rem",
                        }}
                      >
                        <Sparkles size={12} /> Analyze All Calls
                      </button>
                    )}
                </div>

                {/* Personal details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  {[
                    { label: "Full Name", value: selectedParticipant.name },
                    { label: "Age", value: selectedParticipant.age ?? "—" },
                    {
                      label: "Sex",
                      value: selectedParticipant.sex
                        ? selectedParticipant.sex.replace(/_/g, " ")
                        : "—",
                    },
                    { label: "Phone", value: selectedParticipant.phone },
                    {
                      label: "Source",
                      value: selectedParticipant.source
                        ? selectedParticipant.source.charAt(0).toUpperCase() +
                          selectedParticipant.source.slice(1)
                        : "—",
                    },
                    {
                      label: "Eligibility",
                      value: (selectedParticipant.eligibility &&
                      selectedParticipant.eligibility !== "unknown"
                        ? selectedParticipant.eligibility
                        : "review_needed"
                      )
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase()),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--color-card-border)",
                        backgroundColor: "var(--color-page-bg)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "var(--color-sidebar-text)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--color-input-text)",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Voice call transcript + AI analysis */}
                {selectedParticipant.voice_sessions?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-sidebar-text)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 12,
                      }}
                    >
                      Voice Calls
                    </p>
                    {selectedParticipant.voice_sessions.map((vs) => (
                      <VoiceSessionCard
                        key={vs.id}
                        vs={vs}
                        campaignId={id}
                        analysisLoading={!!analysisLoading[vs.id]}
                        onReanalyze={
                          vs.transcripts?.length > 0
                            ? async () => {
                                setAnalysisLoading((prev) => ({ ...prev, [vs.id]: true }));
                                try {
                                  const result = await analysisAPI.analyzeVoiceSession(id, vs.id);
                                  setSelectedParticipant((prev) => ({
                                    ...prev,
                                    voice_sessions: prev.voice_sessions.map((s) =>
                                      s.id === vs.id ? { ...s, call_analysis: result } : s,
                                    ),
                                  }));
                                } catch (e) {
                                  console.error("Analysis failed", e);
                                } finally {
                                  setAnalysisLoading((prev) => ({ ...prev, [vs.id]: false }));
                                }
                              }
                            : null
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Chatbot conversation transcript */}
                {selectedParticipant.source === "chatbot" &&
                  selectedParticipant.chat_messages?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--color-sidebar-text)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 12,
                        }}
                      >
                        Chat Conversation
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0,
                          maxHeight: 340,
                          overflowY: "auto",
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 10,
                          padding: "12px 16px",
                        }}
                      >
                        {selectedParticipant.chat_messages
                          .filter((m) => m.role !== "system")
                          .map((m, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: 10,
                                marginBottom: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                style={{
                                  flexShrink: 0,
                                  width: 52,
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  textAlign: "right",
                                  paddingTop: 3,
                                  color:
                                    m.role === "assistant"
                                      ? "var(--color-accent)"
                                      : "var(--color-sidebar-text)",
                                  textTransform: "uppercase",
                                }}
                              >
                                {m.role === "assistant" ? "Bot" : "User"}
                              </span>
                              <div
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  fontSize: "0.83rem",
                                  lineHeight: 1.5,
                                  backgroundColor:
                                    m.role === "assistant"
                                      ? "rgba(var(--accent-rgb, 16,185,129), 0.07)"
                                      : "var(--color-page-bg)",
                                  border: "1px solid var(--color-card-border)",
                                  color: "var(--color-input-text)",
                                }}
                              >
                                {typeof m.content === "string"
                                  ? m.content
                                  : JSON.stringify(m.content)}
                              </div>
                            </div>
                          ))}
                      </div>
                      {/* AI analysis for chat session */}
                      {selectedParticipant.analysis && (
                        <div style={{ marginTop: 12 }}>
                          <ConversationAnalysis
                            analysis={selectedParticipant.analysis}
                            loading={false}
                            onReanalyze={null}
                          />
                        </div>
                      )}
                    </div>
                  )}

                {/* Appointment details */}
                {participantAppointments.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-sidebar-text)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 12,
                      }}
                    >
                      Appointments
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {participantAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: 12,
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: "1px solid var(--color-card-border)",
                            backgroundColor: "var(--color-page-bg)",
                          }}
                        >
                          {[
                            {
                              label: "Date",
                              value: new Date(appt.slot_datetime).toLocaleDateString(),
                            },
                            {
                              label: "Time",
                              value: new Date(appt.slot_datetime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                            },
                            { label: "Duration", value: `${appt.duration_minutes} min` },
                            {
                              label: "Status",
                              value: appt.status.charAt(0).toUpperCase() + appt.status.slice(1),
                            },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: "var(--color-sidebar-text)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  marginBottom: 3,
                                }}
                              >
                                {label}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: 600,
                                  color:
                                    appt.status === "confirmed" && label === "Status"
                                      ? "#16a34a"
                                      : appt.status === "cancelled" && label === "Status"
                                        ? "#dc2626"
                                        : "var(--color-input-text)",
                                }}
                              >
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Survey answers */}
                {selectedParticipant.answers?.length > 0 && (
                  <>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-sidebar-text)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 12,
                      }}
                    >
                      Survey Answers
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {selectedParticipant.answers.map((ans, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 16px",
                            borderRadius: 10,
                            border: "1px solid var(--color-card-border)",
                            backgroundColor: "var(--color-page-bg)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "var(--color-input-text)",
                              marginBottom: 6,
                            }}
                          >
                            Q{i + 1}. {ans.question_text}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                backgroundColor:
                                  ans.is_eligible === true
                                    ? "rgba(34,197,94,0.12)"
                                    : ans.is_eligible === false
                                      ? "rgba(239,68,68,0.1)"
                                      : "rgba(107,114,128,0.1)",
                                color:
                                  ans.is_eligible === true
                                    ? "#16a34a"
                                    : ans.is_eligible === false
                                      ? "#dc2626"
                                      : "var(--color-sidebar-text)",
                              }}
                            >
                              {ans.selected_option}
                            </span>
                            {ans.is_eligible === true && (
                              <CheckCircle2 size={13} style={{ color: "#16a34a" }} />
                            )}
                            {ans.is_eligible === false && (
                              <AlertCircle size={13} style={{ color: "#dc2626" }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            ) : (
              <>
                {/* ── List view ── */}
                <SectionCard
                  title="Participants"
                  subtitle="Everyone who engaged across survey, chatbot, and voicebot"
                >
                  {/* Sync transcripts button — only relevant for voicebot campaigns */}
                  {ad.ad_type?.includes("voicebot") && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}
                    >
                      <button
                        onClick={handleSyncTranscripts}
                        disabled={syncingTranscripts}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--color-card-border)",
                          backgroundColor: "var(--color-card-bg)",
                          cursor: syncingTranscripts ? "not-allowed" : "pointer",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--color-input-text)",
                          opacity: syncingTranscripts ? 0.6 : 1,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {syncingTranscripts ? (
                          <>
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />{" "}
                            Syncing…
                          </>
                        ) : (
                          <>
                            <RefreshCw size={13} /> Sync Transcripts
                          </>
                        )}
                      </button>
                      {syncResult && !syncResult.error && (
                        <span style={{ fontSize: "0.78rem", color: "#16a34a" }}>
                          ✓ {syncResult.synced} synced, {syncResult.skipped} already up-to-date
                        </span>
                      )}
                      {syncResult?.error && (
                        <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>
                          {syncResult.error}
                        </span>
                      )}
                    </div>
                  )}
                  {participantsLoading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "32px 0",
                        justifyContent: "center",
                      }}
                    >
                      <Loader2
                        size={18}
                        style={{
                          animation: "spin 1s linear infinite",
                          color: "var(--color-accent)",
                        }}
                      />
                      <p style={{ fontSize: "0.85rem", color: "var(--color-sidebar-text)" }}>
                        Loading participants…
                      </p>
                    </div>
                  ) : participants.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <Users
                        size={32}
                        style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                      />
                      <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                        No participants yet.
                      </p>
                      <p
                        style={{
                          color: "var(--color-sidebar-text)",
                          fontSize: "0.78rem",
                          marginTop: 4,
                        }}
                      >
                        Anyone who shares their name or phone via chatbot, voicebot, or survey will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    (() => {
                      // Eligibility is pre-computed by the backend for all source types
                      const getEligibility = (p) => p.eligibility || "unknown";

                      const FILTERS = [
                        { key: "all", label: "All" },
                        { key: "eligible", label: "Eligible" },
                        { key: "review_needed", label: "Review Needed" },
                        { key: "not_eligible", label: "Not Eligible" },
                      ];

                      const counts = { all: participants.length };
                      participants.forEach((p) => {
                        const e = getEligibility(p);
                        counts[e] = (counts[e] || 0) + 1;
                      });

                      const filtered = participants.filter(
                        (p) =>
                          eligibilityFilter === "all" || getEligibility(p) === eligibilityFilter,
                      );

                      const ELIG_STYLE = {
                        eligible: {
                          color: "#16a34a",
                          icon: <CheckCircle2 size={12} />,
                          label: "Eligible",
                        },
                        not_eligible: {
                          color: "#dc2626",
                          icon: <AlertCircle size={12} />,
                          label: "Not Eligible",
                        },
                        review_needed: {
                          color: "#d97706",
                          icon: <AlertCircle size={12} />,
                          label: "Review Needed",
                        },
                        unknown: {
                          color: "#d97706",
                          icon: <AlertCircle size={12} />,
                          label: "Review Needed",
                        },
                      };

                      const SOURCE_STYLE = {
                        survey: { color: "#2563eb", label: "Survey" },
                        chatbot: { color: "#7c3aed", label: "Chatbot" },
                        voicebot: { color: "#0891b2", label: "Voicebot" },
                      };

                      return (
                        <>
                          {/* Eligibility filter bar */}
                          <div
                            style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}
                          >
                            {FILTERS.map((f) => {
                              const active = eligibilityFilter === f.key;
                              const s = ELIG_STYLE[f.key] || {};
                              return (
                                <button
                                  key={f.key}
                                  onClick={() => setEligibilityFilter(f.key)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "4px 12px",
                                    borderRadius: 20,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    border: `1px solid ${active ? s.color || "var(--color-accent)" : "var(--color-card-border)"}`,
                                    backgroundColor: active
                                      ? `${s.color || "var(--color-accent)"}18`
                                      : "transparent",
                                    color: active
                                      ? s.color || "var(--color-accent)"
                                      : "var(--color-sidebar-text)",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {f.label}
                                  {counts[f.key] != null && (
                                    <span style={{ fontSize: "0.68rem", opacity: 0.8 }}>
                                      ({counts[f.key] || 0})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0,
                              borderRadius: 10,
                              border: "1px solid var(--color-card-border)",
                              overflow: "hidden",
                            }}
                          >
                            {/* Table header */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1fr 32px",
                                gap: 0,
                                padding: "10px 16px",
                                backgroundColor: "var(--color-page-bg)",
                                borderBottom: "1px solid var(--color-card-border)",
                              }}
                            >
                              {["Name", "Age", "Phone", "Eligibility", "Source", ""].map((h) => (
                                <span
                                  key={h}
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    color: "var(--color-sidebar-text)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                  }}
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                            {/* Rows */}
                            {filtered.length === 0 ? (
                              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                                <p
                                  style={{
                                    fontSize: "0.82rem",
                                    color: "var(--color-sidebar-text)",
                                  }}
                                >
                                  No participants match this filter.
                                </p>
                              </div>
                            ) : (
                              filtered.map((p, idx) => {
                                const elig = getEligibility(p);
                                const es = ELIG_STYLE[elig] || ELIG_STYLE.unknown;
                                const ss = SOURCE_STYLE[p.source] || {
                                  color: "var(--color-sidebar-text)",
                                  label: p.source,
                                };
                                return (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      setSelectedParticipant(p);
                                      setParticipantAppointments(
                                        p.appointment ? [p.appointment] : [],
                                      );
                                    }}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1fr 32px",
                                      gap: 0,
                                      padding: "12px 16px",
                                      cursor: "pointer",
                                      borderBottom:
                                        idx < filtered.length - 1
                                          ? "1px solid var(--color-card-border)"
                                          : "none",
                                      backgroundColor: "var(--color-card-bg)",
                                      transition: "background-color 0.1s",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "var(--color-page-bg)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "var(--color-card-bg)")
                                    }
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        color: "var(--color-input-text)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {p.name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.82rem",
                                        color: "var(--color-input-text)",
                                      }}
                                    >
                                      {p.age ?? "—"}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "0.82rem",
                                        color: "var(--color-input-text)",
                                      }}
                                    >
                                      {p.phone}
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: es.color,
                                      }}
                                    >
                                      {es.icon}
                                      {es.label}
                                    </span>
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        justifySelf: "start",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        backgroundColor: `${ss.color}18`,
                                        color: ss.color,
                                        border: `1px solid ${ss.color}40`,
                                      }}
                                    >
                                      {p.source === "voicebot" && <Phone size={11} />}
                                      {p.source === "chatbot" && <MessageSquare size={11} />}
                                      {ss.label}
                                    </span>
                                    <ChevronDown
                                      size={14}
                                      style={{
                                        color: "var(--color-sidebar-text)",
                                        transform: "rotate(-90deg)",
                                        justifySelf: "end",
                                        alignSelf: "center",
                                      }}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      );
                    })()
                  )}
                </SectionCard>
              </>
            )}
          </div>
    </>
  );
}
