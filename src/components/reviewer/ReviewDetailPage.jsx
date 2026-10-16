/**
 * M12b: Reviewer Campaign Detail Page
 * Owner: Frontend Dev 3
 * Dependencies: adsAPI, shared/Layout
 *
 * Route: /reviewer/campaign/:id
 *
 * Mirrors CampaignDetailPage (M11) but scoped to reviewer actions:
 *   - View strategy (read-only StrategyViewer)
 *   - Submit a verdict review (approve / revision / reject) — existing flow
 *   - Minor Edit   — inline field edit → auto audit-trail system message
 *   - AI Re-Strategy — reviewer writes instructions → full AI rewrite
 *
 * Styles: index.css classes only, no raw Tailwind color utilities.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageWithSidebar, SectionCard, CampaignStatusBadge } from "../shared/Layout";
import { adsAPI, surveyAPI } from "../../services/api";
import CreativesViewer from "../admin/campaign/CreativesViewer";
import {
  ArrowLeft,
  Image,
  Loader2,
  AlertCircle,
  ChevronDown,
  Users,
  Layers,
  RefreshCw,
  CheckCircle2,
  FileText,
  Eye,
  History,
  ClipboardCheck,
  Phone,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";


// --- extracted sub-components --------------------------------------------
import { ActionTabs, AdTypeChip, PageTabBar, StatusTimeline, statusIndex } from "./review/primitives";

import EditableStrategyViewer from "./review/EditableStrategyViewer";
import AIReStrategyPanel from "./review/AIReStrategyPanel";
import VerdictPanel from "./review/VerdictPanel";
import QuestionnaireViewer from "./review/QuestionnaireViewer";
import DocPreviewModal from "./review/DocPreviewModal";
import ReviewCard from "./review/ReviewCard";
import { BudgetDonut } from "./review/charts";
import RecreatePanel from "./review/RecreatePanel";
function needsQuestionnaire(ad) {
  return !!ad;
}

// ─── Main exported component ───────────────────────────────────────────────────

export default function ReviewerCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [ad, setAd] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [protoDocs, setProtoDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageTab, setPageTab] = useState("overview");
  const [actionTab, setActionTab] = useState("verdict");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [syncingTranscripts, setSyncingTranscripts] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [backgroundJob, setBackgroundJob] = useState(null);

  useEffect(() => {
    if (!ad) return;

    if (ad.status === "optimizing" || ad.status === "generating") {
      setBackgroundJob((current) =>
        current?.state === "error"
          ? current
          : current || { label: "Campaign update in progress…", state: "running" }
      );
      return;
    }

    setBackgroundJob((current) => {
      if (!current) return null;
      if (current.state === "running") return { label: current.label, state: "done" };
      return current;
    });
  }, [ad]);

  const load = useCallback(async () => {
    try {
      const [adData, reviewsData, docsData] = await Promise.all([
        adsAPI.get(id),
        adsAPI.listReviews(id),
        adsAPI.listDocuments(id).catch(() => []),
      ]);
      setAd(adData);
      setReviews(reviewsData);
      setProtoDocs(docsData ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (pageTab !== "participants" || !id) return;
    setParticipantsLoading(true);
    surveyAPI
      .list(id)
      .then((data) => setParticipants(data || []))
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  }, [pageTab, id]);

  const handleActionDone = async () => {
    await load();
  };

  const startBackgroundPoll = (beforeAt, label) => {
    setBackgroundJob({ label, state: "running" });
    const deadline = Date.now() + 180000;

    (async () => {
      try {
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 4000));
          const latest = await adsAPI.get(id);
          const processing = latest.status === "optimizing" || latest.status === "generating";
          if (latest.updated_at !== beforeAt && !processing) {
            setAd(latest);
            const reviewsData = await adsAPI.listReviews(id);
            setReviews(reviewsData);
            setBackgroundJob({ label, state: "done" });
            return;
          }
        }
        setBackgroundJob({ label, state: "error", message: "Timed out waiting for update. Please refresh." });
      } catch (err) {
        setBackgroundJob({
          label,
          state: "error",
          message: err.message || "Background update failed. Please refresh.",
        });
      }
    })();
  };

  const handleRecreateStrategy = async (instructions) => {
    const triggered = await adsAPI.rewriteStrategy(id, { instructions });
    startBackgroundPoll(triggered.updated_at, "Strategy re-create in progress…");
  };

  const handleRecreateCreatives = async (instructions) => {
    const triggered = await adsAPI.rewriteCreatives(id, { instructions });
    startBackgroundPoll(triggered.updated_at, "Creative re-create in progress…");
  };

  const handleRecreateQuestionnaire = async (instructions) => {
    const triggered = await adsAPI.rewriteQuestionnaire(id, { instructions });
    startBackgroundPoll(triggered.updated_at, "Questionnaire re-create in progress…");
  };

  const handleSyncTranscripts = async () => {
    setSyncingTranscripts(true);
    setSyncResult(null);
    try {
      const result = await surveyAPI.syncTranscripts(id);
      setSyncResult(result);
      const data = await surveyAPI.list(id);
      setParticipants(data || []);
      if (selectedParticipant) {
        const refreshed = (data || []).find((p) => p.id === selectedParticipant.id);
        if (refreshed) setSelectedParticipant(refreshed);
      }
    } catch (err) {
      setSyncResult({ error: err.message || "Sync failed" });
    } finally {
      setSyncingTranscripts(false);
    }
  };

  if (loading)
    return (
      <PageWithSidebar>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "60px 0",
            color: "var(--color-sidebar-text)",
          }}
        >
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          <p>Loading campaign…</p>
        </div>
      </PageWithSidebar>
    );

  if (error || !ad)
    return (
      <PageWithSidebar>
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--color-input-text)", fontWeight: 600 }}>Campaign not found</p>
          <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem", marginTop: 4 }}>
            {error}
          </p>
          <button onClick={() => navigate(-1)} className="btn--ghost" style={{ marginTop: 16 }}>
            Go back
          </button>
        </div>
      </PageWithSidebar>
    );

  const hasStrategy = statusIndex(ad.status) >= statusIndex("strategy_created");
  const canAct = ["under_review", "strategy_created", "ethics_review"].includes(ad.status);
  const qualifies = needsQuestionnaire(ad);
  const questEmpty = !(ad.questionnaire?.questions?.length > 0);
  const showQDot = qualifies && questEmpty;

  return (
    <>
      <PageWithSidebar>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
            padding: "6px 12px",
            border: "1px solid var(--color-card-border)",
            borderRadius: 8,
            background: "transparent",
            cursor: "pointer",
            fontSize: "0.8rem",
            color: "var(--color-sidebar-text)",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* ── Hero card ── */}
        {backgroundJob && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 10,
              border:
                backgroundJob.state === "error"
                  ? "1px solid rgba(239,68,68,0.25)"
                  : "1px solid rgba(59,130,246,0.2)",
              background:
                backgroundJob.state === "error"
                  ? "rgba(239,68,68,0.06)"
                  : backgroundJob.state === "done"
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(59,130,246,0.06)",
            }}
          >
            <p
              style={{
                fontSize: "0.84rem",
                fontWeight: 600,
                color:
                  backgroundJob.state === "error"
                    ? "#ef4444"
                    : backgroundJob.state === "done"
                      ? "#16a34a"
                      : "var(--color-input-text)",
                margin: 0,
              }}
            >
              {backgroundJob.state === "done"
                ? "Update finished."
                : backgroundJob.state === "error"
                  ? backgroundJob.message
                  : backgroundJob.label}
            </p>
            {backgroundJob.state === "running" && (
              <p style={{ fontSize: "0.76rem", color: "var(--color-sidebar-text)", margin: "4px 0 0" }}>
                You can keep working on other tabs and pages while this runs.
              </p>
            )}
          </div>
        )}

        <div
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f2027 100%)",
            padding: "32px 36px",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative blobs */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: 120,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background:
                "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.05)",
              pointerEvents: "none",
            }}
          />

          {/* title row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 20,
              position: "relative",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Campaign Review
              </p>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {ad.title}
              </h1>
            </div>
            <CampaignStatusBadge status={ad.status} />
          </div>

          {/* stats row */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", position: "relative" }}>
            {ad.budget && (
              <div>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Budget
                </p>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                  ${ad.budget?.toLocaleString()}
                </p>
              </div>
            )}
            {ad.duration && (
              <div>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Duration
                </p>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{ad.duration}</p>
              </div>
            )}
            {ad.platforms?.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Platforms
                </p>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                  {ad.platforms.join(" · ")}
                </p>
              </div>
            )}
            {ad.ad_type?.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Type
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ad.ad_type.map((t) => (
                    <AdTypeChip key={t} type={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Page tab navigation ── */}
        <PageTabBar active={pageTab} onChange={setPageTab} showQuestionnaireDot={showQDot} />

        {/* ── Tab content ── */}

        {/* OVERVIEW */}
        {pageTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <SectionCard title="Campaign Progress">
              <StatusTimeline status={ad.status} />
            </SectionCard>

            {(() => {
              const hasBudget = !!(
                ad.strategy_json?.budget_allocation &&
                Object.keys(ad.strategy_json.budget_allocation).length > 0
              );
              const hasDocs = protoDocs.length > 0;
              if (!hasDocs && !hasBudget) return null;
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: hasDocs && hasBudget ? "1fr 1fr" : "1fr",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  {hasDocs && (
                    <SectionCard
                      title="Protocol Documents"
                      subtitle={`${protoDocs.length} document${protoDocs.length !== 1 ? "s" : ""} attached`}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {protoDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => doc.file_path && setPreviewDoc(doc)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "10px 14px",
                              borderRadius: 8,
                              border: "1px solid var(--color-card-border)",
                              backgroundColor: "var(--color-card-bg)",
                              cursor: doc.file_path ? "pointer" : "default",
                              transition: "border-color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (doc.file_path)
                                e.currentTarget.style.borderColor = "var(--color-accent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--color-card-border)";
                            }}
                          >
                            <FileText
                              size={14}
                              style={{ color: "var(--color-accent)", flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: "0.83rem",
                                  fontWeight: 600,
                                  color: "var(--color-input-text)",
                                  margin: 0,
                                }}
                              >
                                {doc.title}
                              </p>
                              {doc.doc_type && (
                                <p
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--color-sidebar-text)",
                                    marginTop: 2,
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {doc.doc_type.replace(/_/g, " ")}
                                  {doc.file_path && ` · ${doc.file_path.split("/").pop()}`}
                                </p>
                              )}
                            </div>
                            {doc.file_path && (
                              <Eye
                                size={13}
                                style={{ color: "var(--color-sidebar-text)", flexShrink: 0 }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                  {hasBudget && (
                    <SectionCard title="Budget Distribution">
                      <BudgetDonut strategy={ad.strategy_json} />
                    </SectionCard>
                  )}
                </div>
              );
            })()}

            {qualifies && (
              <div
                onClick={() => setPageTab("questionnaire")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 22px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: questEmpty
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid var(--color-card-border)",
                  backgroundColor: questEmpty ? "rgba(245,158,11,0.05)" : "var(--color-card-bg)",
                  transition: "border-color 0.15s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: questEmpty
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.1)",
                  }}
                >
                  <ClipboardList
                    size={18}
                    style={{ color: questEmpty ? "#f59e0b" : "var(--color-accent)" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "var(--color-input-text)",
                      margin: 0,
                    }}
                  >
                    Eligibility Questionnaire
                    {questEmpty && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#f59e0b",
                        }}
                      >
                        · Needs setup
                      </span>
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-sidebar-text)",
                      marginTop: 3,
                    }}
                  >
                    {questEmpty
                      ? "No questions generated yet — click to set up"
                      : `${ad.questionnaire.questions.length} question${ad.questionnaire.questions.length !== 1 ? "s" : ""} ready`}
                  </p>
                </div>
                <ArrowLeft
                  size={14}
                  style={{ color: "var(--color-sidebar-text)", transform: "rotate(180deg)" }}
                />
              </div>
            )}

            <SectionCard
              title={role === "ethics_manager" ? "Ethics Workflow" : "Review Workflow"}
              subtitle={
                role === "ethics_manager"
                  ? "Make changes only if needed, then accept or reject the campaign."
                  : "Make changes only if needed, then accept or reject before ethics review."
              }
            >
              {!canAct ? (
                <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
                  <ClipboardCheck
                    size={28}
                    style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                  />
                  <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                    Campaign is <strong style={{ color: "var(--color-input-text)" }}>{ad.status}</strong>
                    {" "}— no action required right now.
                  </p>
                </div>
              ) : (
                <div style={{ maxWidth: 720 }}>
                  <ActionTabs active={actionTab} onChange={setActionTab} />

                  {actionTab === "verdict" && (
                    <VerdictPanel
                      adId={id}
                      stage={role === "ethics_manager" ? "ethics" : "strategy"}
                      onSubmitted={handleActionDone}
                    />
                  )}
                  {actionTab === "restrategy" &&
                    (hasStrategy ? (
                      <AIReStrategyPanel adId={id} onRewritten={handleActionDone} />
                    ) : (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-sidebar-text)" }}>
                        Strategy must be generated before triggering a re-write.
                      </p>
                    ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* STRATEGY */}
        {pageTab === "strategy" && (
          <div>
            {canAct && (
              <RecreatePanel
                label="Strategy review instruction"
                placeholder="Describe exactly what should change in the strategy..."
                onRun={handleRecreateStrategy}
              />
            )}
            {hasStrategy ? (
              <EditableStrategyViewer
                strategy={ad.strategy_json}
                adId={id}
                onSaved={handleActionDone}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Layers
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  Strategy not yet generated for this campaign.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CREATIVES */}
        {pageTab === "creatives" && (
          <div>
            {canAct && (
              <RecreatePanel
                label="Creative review instruction"
                placeholder="Describe exactly what should change in the creatives..."
                onRun={handleRecreateCreatives}
              />
            )}
            {ad.output_files?.length ? (
              <CreativesViewer creatives={ad.output_files} />
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Image
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  No creatives generated yet for this campaign.
                </p>
              </div>
            )}
          </div>
        )}

        {/* QUESTIONNAIRE */}
        {pageTab === "questionnaire" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-input-text)",
                  margin: 0,
                }}
              >
                Eligibility Questionnaire
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)", marginTop: 4 }}>
                {ad.questionnaire?.questions?.length
                  ? `${ad.questionnaire.questions.length} question${ad.questionnaire.questions.length !== 1 ? "s" : ""} · edit wording or regenerate below`
                  : "No questions yet — generate to get started"}
              </p>
            </div>
            {canAct && (
              <RecreatePanel
                label="Questionnaire review instruction"
                placeholder="Describe exactly what should change in the questionnaire..."
                onRun={handleRecreateQuestionnaire}
              />
            )}
            <QuestionnaireViewer
              questionnaire={ad.questionnaire}
              adId={id}
              onGenerated={handleActionDone}
              role={role}
            />
          </div>
        )}

        {/* PARTICIPANTS */}
        {pageTab === "participants" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {selectedParticipant ? (
              <SectionCard
                title={selectedParticipant.full_name}
                subtitle={`Submitted ${new Date(selectedParticipant.created_at).toLocaleString()}`}
              >
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="btn--ghost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8rem",
                    marginBottom: 20,
                  }}
                >
                  <ArrowLeft size={13} /> Back to list
                </button>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {[
                    { label: "Full Name", value: selectedParticipant.full_name },
                    { label: "Age", value: selectedParticipant.age },
                    { label: "Sex", value: selectedParticipant.sex.replace(/_/g, " ") },
                    { label: "Phone", value: selectedParticipant.phone },
                    {
                      label: "Eligibility",
                      value:
                        selectedParticipant.is_eligible === true
                          ? "Eligible"
                          : selectedParticipant.is_eligible === false
                            ? "Not Eligible"
                            : "Unknown",
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
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: "var(--color-input-text)",
                          textTransform: "capitalize",
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                {/* Voice call transcript */}
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
                      Voice Call Transcript
                    </p>
                    {selectedParticipant.voice_sessions.map((vs) => (
                      <div
                        key={vs.id}
                        style={{
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 10,
                          overflow: "hidden",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 16px",
                            backgroundColor: "var(--color-page-bg)",
                            borderBottom:
                              vs.transcripts?.length > 0
                                ? "1px solid var(--color-card-border)"
                                : "none",
                          }}
                        >
                          <Phone
                            size={14}
                            style={{ color: "var(--color-accent)", flexShrink: 0 }}
                          />
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              color: "var(--color-input-text)",
                            }}
                          >
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
                                vs.status === "ended"
                                  ? "#16a34a"
                                  : vs.status === "failed"
                                    ? "#dc2626"
                                    : "#b45309",
                            }}
                          >
                            {vs.status}
                          </span>
                          {vs.duration_seconds != null && (
                            <span
                              style={{ fontSize: "0.72rem", color: "var(--color-sidebar-text)" }}
                            >
                              {Math.floor(vs.duration_seconds / 60)}m {vs.duration_seconds % 60}s
                            </span>
                          )}
                          <span style={{ fontSize: "0.72rem", color: "var(--color-sidebar-text)" }}>
                            {new Date(vs.started_at).toLocaleString()}
                          </span>
                        </div>
                        {vs.transcripts?.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0,
                              maxHeight: 360,
                              overflowY: "auto",
                              padding: "12px 16px",
                            }}
                          >
                            {[...vs.transcripts]
                              .sort((a, b) => (a.turn_index ?? 0) - (b.turn_index ?? 0))
                              .map((turn, ti) => (
                                <div
                                  key={ti}
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
                                          ? "rgba(16,185,129,0.07)"
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
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-sidebar-text)",
                              padding: "12px 16px",
                            }}
                          >
                            No transcript available yet.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
              <SectionCard
                title="Participants"
                subtitle="People who completed the survey and submitted their details"
              >
                {ad.ad_type?.includes("voicebot") && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
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
                      style={{ animation: "spin 1s linear infinite", color: "var(--color-accent)" }}
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
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid var(--color-card-border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 32px",
                        padding: "10px 16px",
                        backgroundColor: "var(--color-page-bg)",
                        borderBottom: "1px solid var(--color-card-border)",
                      }}
                    >
                      {["Name", "Age", "Sex", "Phone", "Eligibility", ""].map((h) => (
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
                    {participants.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedParticipant(p)}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 32px",
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom:
                            idx < participants.length - 1
                              ? "1px solid var(--color-card-border)"
                              : "none",
                          backgroundColor: "var(--color-card-bg)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "var(--color-page-bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "var(--color-card-bg)")
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
                          {p.full_name}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                          {p.age}
                        </span>
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--color-input-text)",
                            textTransform: "capitalize",
                          }}
                        >
                          {p.sex.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                          {p.phone}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color:
                              p.is_eligible === true
                                ? "#16a34a"
                                : p.is_eligible === false
                                  ? "#dc2626"
                                  : "var(--color-sidebar-text)",
                          }}
                        >
                          {p.is_eligible === true && <CheckCircle2 size={12} />}
                          {p.is_eligible === false && <AlertCircle size={12} />}
                          {p.is_eligible === true
                            ? "Eligible"
                            : p.is_eligible === false
                              ? "Not Eligible"
                              : "Unknown"}
                        </span>
                        <ChevronDown
                          size={14}
                          style={{
                            color: "var(--color-sidebar-text)",
                            transform: "rotate(-90deg)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* HISTORY */}
        {pageTab === "history" && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <History
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  No review history yet.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-sidebar-text)",
                    marginBottom: 4,
                  }}
                >
                  {reviews.length} entr{reviews.length !== 1 ? "ies" : "y"}
                </p>
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer refresh ── */}
        <div style={{ paddingTop: 32, paddingBottom: 24 }}>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="btn--ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </PageWithSidebar>

      {previewDoc && (
        <DocPreviewModal doc={previewDoc} adId={id} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
}
