/**
 * Campaign Detail Page
 * Owner: Frontend Dev 2
 * Dependencies: adsAPI
 *
 * Route: /admin/campaign/:id  (also accessible by reviewer, publisher, ethics_reviewer)
 *
 * Sections (conditionally shown by status):
 *   - Metadata          — always
 *   - Status timeline   — always
 *   - Protocol docs     — always
 *   - Strategy          — strategy_created and beyond
 *   - Review panel      — strategy_created / under_review (reviewer role)
 *   - Reviews           — under_review and beyond
 *   - Analytics         — published only
 *
 * Actions:
 *   - Generate Strategy  — draft (admin / publisher)
 *   - Submit for Review  — strategy_created (admin / publisher)
 *   - Publish            — approved (publisher / admin)
 */

import { useState, useEffect, useCallback } from "react";
import SmsPanel from "./SmsPanel";
import { useParams, useNavigate } from "react-router-dom";
import { PageWithSidebar, SectionCard, CampaignStatusBadge } from "../shared/Layout";
import {
  adsAPI,
  companyAPI,
  surveyAPI,
  appointmentsAPI,
  analysisAPI,
  participantsAPI,
} from "../../services/api";
import {
  ArrowLeft,
  Globe,
  AlertCircle,
  Loader2,
  Layers,
  Trash2,
  ClipboardCheck,
  History,
  X as XIcon,
  RefreshCw,
  Pencil,
} from "lucide-react";

// ─── Extracted sub-components ─────────────────────────────────────────────────
import { useGenerateProgress } from "./campaign/GenerateProgress";
import DocPreviewModal from "./campaign/DocPreviewModal";
import QuestionnaireSection from "./campaign/QuestionnaireSection";
import { AdTypeChip, GenericValue, statusIndex } from "./campaign/StrategyViewer";
import { ReviewPanel, ReviewCard } from "./campaign/ReviewComponents";
import PageTabBar from "./campaign/PageTabBar";
import OverviewTab from "./campaign/OverviewTab";
import ParticipantsTab from "./campaign/ParticipantsTab";
import BookingsTab from "./campaign/BookingsTab";
import PublishTab from "./campaign/PublishTab";
import StrategyTab from "./campaign/StrategyTab";

// ─── Campaign categories that require a questionnaire ─────────────────────────
const QUESTIONNAIRE_CATEGORIES = new Set([
  "recruitment",
  "hiring",
  "survey",
  "clinical_trial",
  "research",
]);

const QUESTIONNAIRE_KEYWORDS = [
  "hiring",
  "recruit",
  "survey",
  "clinical",
  "trial",
  "research study",
  "job posting",
  "job opening",
  "application",
  "vacancy",
  "vacancies",
  "applicant",
  "enroll",
  "enrolment",
  "participant",
  "respondent",
];

/** Check protocol doc titles first (strongest signal), fall back to campaign title. */
function needsQuestionnaire(ad, protoDocs) {
  if (!ad) return false;
  if (QUESTIONNAIRE_CATEGORIES.has(ad.campaign_category)) return true;
  const titles = [ad.title || "", ...(protoDocs || []).map((d) => d.title || "")]
    .join(" ")
    .toLowerCase();
  return QUESTIONNAIRE_KEYWORDS.some((kw) => titles.includes(kw));
}
// --- extracted components ---------------------------------------------------
import DetailErrorBoundary from "./campaign/DetailErrorBoundary";
export default function CampaignDetailPage() {
  return (
    <DetailErrorBoundary>
      <CampaignDetailPageInner />
    </DetailErrorBoundary>
  );
}

function CampaignDetailPageInner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ad, setAd] = useState(null);
  const [protoDocs, setProtoDocs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Per-action loading & error
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [revLoading, setRevLoading] = useState(false);
  const [revError, setRevError] = useState(null);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubError, setPubError] = useState(null);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [creativeError, setCreativeError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState(null);
  const [hostLoading, setHostLoading] = useState(false);
  const [hostError, setHostError] = useState(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [regenInstr, setRegenInstr] = useState("");
  const [regenConfirmed, setRegenConfirmed] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const [pageTab, setPageTab] = useState("overview");
  const [companyLocations, setCompanyLocations] = useState([]); // [{ country, cities }]
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [eligibilityFilter, setEligibilityFilter] = useState("all"); // "all" | "eligible" | "not_eligible" | "review_needed"
  const [participantAppointments, setParticipantAppointments] = useState([]);
  const [syncingTranscripts, setSyncingTranscripts] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  // Voicebot conversation history (loaded in participants tab for voicebot campaigns)
  const [convHistory, setConvHistory] = useState([]);
  const [convHistoryLoading, setConvHistoryLoading] = useState(false);
  const [selectedConvHistory, setSelectedConvHistory] = useState(null);
  // Map of conversation_id → { loading, data, error, analysis, analysisLoading, analysisError }
  const [convTranscriptMap, setConvTranscriptMap] = useState({});
  // Conversation analysis: maps sessionId → loading bool; analysis lives in the participant object
  const [analysisLoading, setAnalysisLoading] = useState({});
  // Chat sessions for the chatbot channel
  const [chatSessions, setChatSessions] = useState([]);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(false);

  // Bookings tab
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [bookingConfig, setBookingConfig] = useState(null);
  const [bcEditing, setBcEditing] = useState(false);
  const [bcForm, setBcForm] = useState({ slot_duration_minutes: 30, max_per_slot: 3 });
  const [bcSaving, setBcSaving] = useState(false);

  const saveTitle = async () => {
    const trimmed = titleInput.trim();
    if (!trimmed || trimmed === ad.title) {
      setTitleEditing(false);
      return;
    }
    setTitleSaving(true);
    try {
      const updated = await adsAPI.update(id, { title: trimmed });
      setAd(updated);
      setTitleEditing(false);
    } catch (err) {
      alert(err.message || "Failed to save title.");
    } finally {
      setTitleSaving(false);
    }
  };

  const genProgress = useGenerateProgress();

  const role = JSON.parse(localStorage.getItem("user") || "{}").role;
  // Super User is the merged owner: it satisfies every capability gate on this page.
  const isSuper = role === "super_user";
  const isStudyCoordinator = role === "study_coordinator" || isSuper;
  const canRegenerate = ["project_manager", "ethics_manager"].includes(role) || isSuper;
  const canGenerate = isStudyCoordinator || canRegenerate;
  const isPublisher = role === "publisher" || isSuper;

  // Poll GET /{adId} until updated_at changes (background task committed).
  // Used after any endpoint that fires a BackgroundTask and returns immediately.
  //
  // Resilient to transient 5xx/network errors: during heavy generation the
  // backend can momentarily return 503 (ALB queue / SQLite lock) — swallow
  // those and keep polling until the deadline.
  const pollUntilUpdated = useCallback(async (adId, beforeUpdatedAt, timeoutMs = 300_000) => {
    const deadline = Date.now() + timeoutMs;
    let transientErrors = 0;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const latest = await adsAPI.get(adId);
        transientErrors = 0;
        if (latest.updated_at !== beforeUpdatedAt) return latest;
      } catch (err) {
        const msg = String(err?.message || "");
        const isTransient = /HTTP 5\d\d|503|502|504|Failed to fetch|NetworkError/i.test(msg);
        if (!isTransient) throw err;
        transientErrors += 1;
        if (transientErrors >= 10)
          throw new Error("Server is unavailable — please refresh the page.", { cause: err });
      }
    }
    throw new Error("Timed out waiting for generation to complete. Please refresh the page.");
  }, []);

  const load = useCallback(async () => {
    try {
      const [adData, docsData, reviewsData] = await Promise.all([
        adsAPI.get(id),
        adsAPI.listDocuments(id),
        adsAPI.listReviews(id),
      ]);
      setAd(adData);
      setProtoDocs(docsData);
      setReviews(reviewsData);
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
    companyAPI
      .getProfile()
      .then((p) => setCompanyLocations(p.locations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pageTab !== "bookings" || !id) return;
    setAppointmentsLoading(true);
    appointmentsAPI
      .list(id)
      .then((appts) => setAppointments(appts || []))
      .catch(() => {})
      .finally(() => setAppointmentsLoading(false));
    appointmentsAPI
      .getBookingConfig(id)
      .then((config) => {
        setBookingConfig(config);
        setBcForm({
          slot_duration_minutes: config.slot_duration_minutes,
          max_per_slot: config.max_per_slot,
        });
      })
      .catch(() => {});
  }, [pageTab, id]);

  useEffect(() => {
    if (pageTab !== "participants" || !id) return;
    setParticipantsLoading(true);
    participantsAPI
      .list(id)
      .then((data) => {
        setParticipants(data || []);
        // Fire background analysis pass — refreshes participants after it completes
        analysisAPI
          .autoAnalyze(id)
          .then(() => participantsAPI.list(id).then((d) => setParticipants(d || [])))
          .catch(() => {});
      })
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
    // Load voicebot conversation history alongside participants
    if (ad?.ad_type?.includes("voicebot")) {
      setConvHistoryLoading(true);
      adsAPI
        .listVoiceConversations(id)
        .then((r) => setConvHistory(r.conversations || []))
        .catch(() => setConvHistory([]))
        .finally(() => setConvHistoryLoading(false));
    }
    // Load chatbot sessions
    if (ad?.ad_type?.includes("chatbot") || ad?.ad_type?.includes("website")) {
      setChatSessionsLoading(true);
      analysisAPI
        .listChatSessions(id)
        .then((r) => setChatSessions(r.sessions || []))
        .catch(() => setChatSessions([]))
        .finally(() => setChatSessionsLoading(false));
    }
  }, [pageTab, id, ad?.ad_type]);

  const handleSelectConvHistory = async (conv) => {
    const cid = conv.conversation_id;
    if (selectedConvHistory?.conversation_id === cid) {
      setSelectedConvHistory(null);
      return;
    }
    setSelectedConvHistory(conv);
    if (!convTranscriptMap[cid]) {
      setConvTranscriptMap((prev) => ({
        ...prev,
        [cid]: {
          loading: true,
          data: null,
          error: null,
          analysis: null,
          analysisLoading: false,
          analysisError: null,
          audioUrl: null,
          audioLoading: true,
        },
      }));
      const [transcriptResult, audioResult] = await Promise.allSettled([
        adsAPI.getVoiceTranscript(cid),
        adsAPI.fetchVoiceRecording(cid).then((blob) => URL.createObjectURL(blob)),
      ]);
      setConvTranscriptMap((prev) => ({
        ...prev,
        [cid]: {
          ...prev[cid],
          loading: false,
          data: transcriptResult.status === "fulfilled" ? transcriptResult.value : null,
          error: transcriptResult.status === "rejected" ? transcriptResult.reason?.message : null,
          audioUrl: audioResult.status === "fulfilled" ? audioResult.value : null,
          audioLoading: false,
        },
      }));
    }
  };

  const handleAnalyzeConvHistory = async (conversationId) => {
    setConvTranscriptMap((prev) => ({
      ...prev,
      [conversationId]: { ...prev[conversationId], analysisLoading: true, analysisError: null },
    }));
    try {
      const analysis = await adsAPI.analyzeVoiceConversation(conversationId);
      setConvTranscriptMap((prev) => ({
        ...prev,
        [conversationId]: { ...prev[conversationId], analysisLoading: false, analysis },
      }));
    } catch (e) {
      setConvTranscriptMap((prev) => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          analysisLoading: false,
          analysisError: e.message,
        },
      }));
    }
  };

  const handleSyncTranscripts = async () => {
    setSyncingTranscripts(true);
    setSyncResult(null);
    try {
      const result = await surveyAPI.syncTranscripts(id);
      setSyncResult(result);
      // Reload participants to pick up newly linked transcripts
      const data = await participantsAPI.list(id);
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

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleGenerateStrategy = async () => {
    setGenLoading(true);
    setGenError(null);
    try {
      // Step 1 — strategy (returns immediately with status=generating; poll until done)
      genProgress.start("Generating strategy…", 25000);
      const triggered = await adsAPI.generateStrategy(id);
      setAd(triggered);
      const afterStrategy = await pollUntilUpdated(id, triggered.updated_at, 120_000);
      setAd(afterStrategy);
      if (afterStrategy.status === "draft") {
        throw new Error(
          "AI generation failed. This may be a network issue or a temporary API problem. Please try again.",
        );
      }
      genProgress.complete();

      const adTypes = afterStrategy.ad_type || [];
      const isWebsite = adTypes.includes("website");
      const hasNonWeb = adTypes.some((t) => t !== "website");

      // Step 2 — website (if campaign type includes website)
      if (isWebsite) {
        setWebsiteLoading(true);
        setWebsiteError(null);
        genProgress.start("Building landing page…", 120000);
        try {
          const triggeredWebsite = await adsAPI.generateWebsite(id);
          const afterWebsite = await pollUntilUpdated(id, triggeredWebsite.updated_at, 600_000);
          setAd(afterWebsite);
          genProgress.complete();
        } catch (err) {
          genProgress.fail();
          setWebsiteError(err.message || "Website generation failed.");
        } finally {
          setWebsiteLoading(false);
        }
      }

      // Step 3 — creatives (if campaign includes non-website ad types)
      if (hasNonWeb) {
        setCreativeLoading(true);
        setCreativeError(null);
        genProgress.start("Generating ad creatives + images…", 120000);
        try {
          const triggeredCreatives = await adsAPI.generateCreatives(id);
          const afterCreatives = await pollUntilUpdated(id, triggeredCreatives.updated_at);
          setAd(afterCreatives);
          genProgress.complete();
        } catch (err) {
          genProgress.fail();
          setCreativeError(err.message || "Creative generation failed.");
        } finally {
          setCreativeLoading(false);
        }
      }
    } catch (err) {
      genProgress.fail();
      setGenError(
        err.message ||
          "Strategy generation failed. Check that training has been run and API keys are configured.",
      );
    } finally {
      setGenLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setRevLoading(true);
    setRevError(null);
    genProgress.start("Running AI review…", 60000);
    try {
      const triggered = await adsAPI.submitForReview(id);
      const updated = await pollUntilUpdated(id, triggered.updated_at);
      setAd(updated);
      genProgress.complete();
    } catch (err) {
      genProgress.fail();
      setRevError(err.message || "Failed to submit for review.");
    } finally {
      setRevLoading(false);
    }
  };

  const handlePublish = async () => {
    setPubLoading(true);
    setPubError(null);
    genProgress.start("Publishing campaign…", 8000);
    try {
      const updated = await adsAPI.publish(id);
      setAd(updated);
      genProgress.complete();
    } catch (err) {
      genProgress.fail();
      setPubError(err.message || "Publish failed. Campaign must be approved first.");
    } finally {
      setPubLoading(false);
    }
  };

  const handleReviewSubmitted = async () => {
    await load();
  };

  const handleGenerateCreatives = async () => {
    setCreativeLoading(true);
    setCreativeError(null);
    genProgress.start("Generating ad creatives + images…", 120000);
    try {
      const triggered = await adsAPI.generateCreatives(id);
      // Backend returns immediately; poll until the background task commits
      const updated = await pollUntilUpdated(id, triggered.updated_at);
      setAd(updated);
      genProgress.complete();
    } catch (err) {
      genProgress.fail();
      setCreativeError(err.message || "Creative generation failed.");
    } finally {
      setCreativeLoading(false);
    }
  };

  const handleGenerateWebsite = async () => {
    setWebsiteLoading(true);
    setWebsiteError(null);
    genProgress.start("Building landing page…", 120000);
    try {
      const prevUrl = ad?.hosted_url || ad?.output_url || ad?.website_download_url;
      const triggered = await adsAPI.generateWebsite(id);
      // Backend returns immediately; poll until the background task commits.
      // Website gen is slower than creatives (Claude + image + EFS write) → 10 min.
      const updated = await pollUntilUpdated(id, triggered.updated_at, 600_000);
      // Detect silent failure: task touched updated_at but didn't produce a URL
      if (!updated.hosted_url && !updated.output_url && !updated.website_download_url && !prevUrl) {
        throw new Error(
          "Website generation failed on the server. Check the backend logs for the error.",
        );
      }
      setAd(updated);
      genProgress.complete();
    } catch (err) {
      genProgress.fail();
      setWebsiteError(err.message || "Website generation failed.");
    } finally {
      setWebsiteLoading(false);
    }
  };

  const handleHostPage = async () => {
    setHostLoading(true);
    setHostError(null);
    try {
      const updated = await adsAPI.hostPage(id);
      setAd(updated);
    } catch (err) {
      setHostError(err.message || "Hosting failed.");
    } finally {
      setHostLoading(false);
    }
  };

  const handleRegenStrategy = async () => {
    if (!regenInstr.trim()) {
      setRegenError("Instructions are required.");
      return;
    }
    if (!regenConfirmed) {
      setRegenError("Please confirm the current strategy will be replaced.");
      return;
    }
    setRegenLoading(true);
    setRegenError(null);
    genProgress.start("Re-writing strategy…", 25000);
    try {
      const updated = await adsAPI.rewriteStrategy(id, { instructions: regenInstr.trim() });
      setAd(updated);
      genProgress.complete();
      setRegenInstr("");
      setRegenConfirmed(false);
      setRegenOpen(false);
    } catch (err) {
      genProgress.fail();
      setRegenError(err.message || "Strategy regeneration failed.");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await adsAPI.delete(id);
      navigate("/study-coordinator");
    } catch (err) {
      setShowDeleteConfirm(false);
      setDeleteLoading(false);
      alert(err.message || "Failed to delete campaign.");
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────
  const currentStep = ad ? statusIndex(ad.status) : 0;
  const hasStrategy = ad && currentStep >= statusIndex("strategy_created");
  const hasReviews = ad && currentStep >= statusIndex("under_review");
  const isPublished = ad && ad.status === "published";
  const canReview =
    ad &&
    (ad.status === "under_review" ||
      ad.status === "strategy_created" ||
      ad.status === "ethics_review");
  const qualifies = ad && needsQuestionnaire(ad, protoDocs);
  const questEmpty = !(ad?.questionnaire?.questions?.length > 0);
  const showQDot = qualifies && questEmpty;

  if (loading)
    return (
      <PageWithSidebar>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "40px 0",
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
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
          <p style={{ color: "var(--color-input-text)", fontWeight: 600 }}>Campaign not found</p>
          <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem", marginTop: "4px" }}>
            {error}
          </p>
          <button onClick={() => navigate(-1)} className="btn--ghost" style={{ marginTop: "16px" }}>
            Go back
          </button>
        </div>
      </PageWithSidebar>
    );

  return (
    <>
      <PageWithSidebar>
        {/* CSS for spinner */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Delete confirmation — top banner */}
        {showDeleteConfirm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 240,
              right: 0,
              zIndex: 1000,
              background: "var(--color-card-bg)",
              borderBottom: "2px solid #ef4444",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              padding: "18px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              animation: "slideDown 0.2s ease",
            }}
          >
            <style>{`@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "var(--color-input-text)",
                  margin: "0 0 3px",
                }}
              >
                Delete Campaign?
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-sidebar-text)", margin: 0 }}>
                Permanently deletes{" "}
                <strong style={{ color: "var(--color-input-text)" }}>{ad.title}</strong> —
                documents, reviews, and analytics. Cannot be undone.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="btn--ghost"
                style={{ padding: "7px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "7px 18px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Trash2 size={14} />
                )}
                Delete Campaign
              </button>
            </div>
          </div>
        )}

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
                {role?.replace(/_/g, " ")} · Campaign
              </p>
              {titleEditing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") setTitleEditing(false);
                    }}
                    autoFocus
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.3,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 8,
                      padding: "2px 10px",
                      outline: "none",
                      minWidth: 0,
                      flex: 1,
                    }}
                  />
                  <button
                    onClick={saveTitle}
                    disabled={titleSaving}
                    style={{
                      background: "rgba(34,197,94,0.2)",
                      border: "1px solid rgba(34,197,94,0.4)",
                      borderRadius: 6,
                      cursor: "pointer",
                      padding: "4px 10px",
                      color: "#86efac",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {titleSaving ? "…" : "Save"}
                  </button>
                  <button
                    onClick={() => setTitleEditing(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.4)",
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  <button
                    onClick={() => {
                      setTitleInput(ad.title);
                      setTitleEditing(true);
                    }}
                    title="Rename campaign"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.35)",
                      padding: 4,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <CampaignStatusBadge status={ad.status} />
              {isStudyCoordinator && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    color: "#f87171",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* stats row */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", position: "relative" }}>
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
                Created
              </p>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                {new Date(ad.created_at).toLocaleDateString()}
              </p>
            </div>
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
                  ${ad.budget.toLocaleString()}
                </p>
              </div>
            )}
            {(ad.trial_start_date || ad.trial_end_date || ad.duration) && (
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
                {ad.trial_start_date && ad.trial_end_date ? (
                  <>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                      {new Date(ad.trial_start_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" – "}
                      {new Date(ad.trial_end_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {ad.duration && (
                      <p
                        style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}
                      >
                        {ad.duration.split("(")[0].trim()}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                    {ad.duration}
                  </p>
                )}
              </div>
            )}
            {ad.patients_required && (
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
                  Patients Required
                </p>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                  {ad.patients_required.toLocaleString()}
                </p>
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
        <PageTabBar
          active={pageTab}
          onChange={setPageTab}
          showQuestionnaireDot={showQDot}
          role={role}
          adTypes={ad?.ad_type}
        />

        {/* ══ OVERVIEW tab ══════════════════════════════════════════════════════ */}
        {pageTab === "overview" && (
        <OverviewTab
          ad={ad}
          setAd={setAd}
          id={id}
          companyLocations={companyLocations}
          protoDocs={protoDocs}
          questEmpty={questEmpty}
          qualifies={qualifies}
          isStudyCoordinator={isStudyCoordinator}
          setPageTab={setPageTab}
          setPreviewDoc={setPreviewDoc}
        />
        )}
        {/* ══ STRATEGY tab ══════════════════════════════════════════════════════ */}
        {pageTab === "strategy" && (
        <StrategyTab
          ad={ad}
          isStudyCoordinator={isStudyCoordinator}
          hasStrategy={hasStrategy}
          genLoading={genLoading}
          genError={genError}
          genProgress={genProgress}
          handleGenerateStrategy={handleGenerateStrategy}
          handleRegenStrategy={handleRegenStrategy}
          canRegenerate={canRegenerate}
          regenOpen={regenOpen}
          setRegenOpen={setRegenOpen}
          regenInstr={regenInstr}
          setRegenInstr={setRegenInstr}
          regenLoading={regenLoading}
          regenError={regenError}
          setRegenError={setRegenError}
          regenConfirmed={regenConfirmed}
          setRegenConfirmed={setRegenConfirmed}
          handleSubmitForReview={handleSubmitForReview}
          revLoading={revLoading}
          revError={revError}
        />
        )}

        {/* ══ QUESTIONNAIRE tab ═════════════════════════════════════════════════ */}
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
                {ad.campaign_category
                  ? ad.campaign_category.replace("_", " ") + " campaign"
                  : "Campaign"}{" "}
                — define the questions participants will answer
              </p>
            </div>
            <QuestionnaireSection
              adId={id}
              questionnaire={ad.questionnaire}
              readOnly={isPublisher && !isSuper}
              showAI={isStudyCoordinator}
              onSaved={load}
            />
          </div>
        )}

        {/* ══ HISTORY tab ═══════════════════════════════════════════════════════ */}
        {pageTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
              <SectionCard
                title="Review History"
                subtitle={`${reviews.length} entr${reviews.length !== 1 ? "ies" : "y"} on record`}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ══ PARTICIPANTS tab ══════════════════════════════════════════════════ */}
        {pageTab === "participants" && (
        <ParticipantsTab
          ad={ad}
          id={id}
          participants={participants}
          participantsLoading={participantsLoading}
          participantAppointments={participantAppointments}
          setParticipantAppointments={setParticipantAppointments}
          selectedParticipant={selectedParticipant}
          setSelectedParticipant={setSelectedParticipant}
          eligibilityFilter={eligibilityFilter}
          setEligibilityFilter={setEligibilityFilter}
          analysisLoading={analysisLoading}
          setAnalysisLoading={setAnalysisLoading}
          syncingTranscripts={syncingTranscripts}
          syncResult={syncResult}
          handleSyncTranscripts={handleSyncTranscripts}
        />
        )}

        {/* ══ BOOKINGS tab ══════════════════════════════════════════════════════ */}
        {pageTab === "bookings" && (
        <BookingsTab
          id={id}
          isStudyCoordinator={isStudyCoordinator}
          appointments={appointments}
          setAppointments={setAppointments}
          appointmentsLoading={appointmentsLoading}
          setAppointmentsLoading={setAppointmentsLoading}
          bookingConfig={bookingConfig}
          setBookingConfig={setBookingConfig}
          bcForm={bcForm}
          setBcForm={setBcForm}
          bcEditing={bcEditing}
          setBcEditing={setBcEditing}
          bcSaving={bcSaving}
          setBcSaving={setBcSaving}
        />
        )}

        {/* ══ PUBLISH tab ═══════════════════════════════════════════════════════ */}
        {pageTab === "publish" && (
        <PublishTab
          ad={ad}
          id={id}
          isPublisher={isPublisher}
          isStudyCoordinator={isStudyCoordinator}
          isPublished={isPublished}
          genProgress={genProgress}
          handlePublish={handlePublish}
          pubLoading={pubLoading}
          pubError={pubError}
          handleGenerateCreatives={handleGenerateCreatives}
          creativeLoading={creativeLoading}
          creativeError={creativeError}
          canRegenerate={canRegenerate}
          handleGenerateWebsite={handleGenerateWebsite}
          websiteLoading={websiteLoading}
          websiteError={websiteError}
          handleHostPage={handleHostPage}
          hostLoading={hostLoading}
          hostError={hostError}
        />
        )}

        {/* ══ SMS tab ═══════════════════════════════════════════════════════════ */}
        {pageTab === "sms" && (
          <SmsPanel ad={ad} adId={id} canEdit={isStudyCoordinator || isPublisher} />
        )}

        {/* ── Footer refresh ── */}
        <div style={{ paddingTop: 32, paddingBottom: 24 }}>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="btn--ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}
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

// ─── Ad Preview Tabs ──────────────────────────────────────────────────────────
// Segregates a campaign's generated assets into two tabs, shown in every phase:
