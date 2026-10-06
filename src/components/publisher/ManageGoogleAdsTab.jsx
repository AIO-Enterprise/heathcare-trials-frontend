import React, { useState, useEffect } from "react";
import { SectionCard } from "../shared/Layout";
import { adsAPI } from "../../services/api";
import {
  Link2Off,
  TrendingUp,
  RefreshCw,
  Clock,
  Pause,
  ExternalLink,
  Pencil,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  CheckCircle2,
  X,
  Plus,
  Play,
  BarChart3,
} from "lucide-react";

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DATE_RANGE_OPTIONS = [
  { value: "LAST_7_DAYS", label: "Last 7 days" },
  { value: "LAST_14_DAYS", label: "Last 14 days" },
  { value: "LAST_30_DAYS", label: "Last 30 days" },
  { value: "LAST_90_DAYS", label: "Last 90 days" },
];

export default function ManageGoogleAdsTab({ ads: initialAds, googleConnection }) {
  const [ads, setAds] = useState(initialAds);
  useEffect(() => {
    setAds(initialAds);
  }, [initialAds]);

  const googleCampaigns = ads.filter(
    (a) => a.status === "published" || a.bot_config?.google_campaign_id,
  );

  const [googleAds, setGoogleAds] = useState({}); // { adId: { loading, ads, error } }
  const [toggling, setToggling] = useState({});
  const [deleting, setDeleting] = useState({});
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Pause schedule
  const [schedules, setSchedules] = useState({});
  const [pauseTarget, setPauseTarget] = useState(null);
  const [pauseWindows, setPauseWindows] = useState([]);
  const [pauseSaving, setPauseSaving] = useState(false);
  const [savedSchedules, setSavedSchedules] = useState({});

  // Analytics
  const [insights, setInsights] = useState({}); // { adId: { loading, rows, error } }
  const [insightRange, setInsightRange] = useState("LAST_30_DAYS");

  const loadGoogleAds = async (adId) => {
    setGoogleAds((p) => ({ ...p, [adId]: { loading: true, ads: [], error: null } }));
    try {
      const data = await adsAPI.listGoogleAds(adId);
      setGoogleAds((p) => ({
        ...p,
        [adId]: {
          loading: false,
          ads: data.ads || [],
          error: null,
          managerUrl: data.ads_manager_url,
        },
      }));
    } catch (err) {
      setGoogleAds((p) => ({ ...p, [adId]: { loading: false, ads: [], error: err.message } }));
    }
  };

  useEffect(() => {
    if (googleCampaigns.length > 0) loadGoogleAds(googleCampaigns[0].id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (adId, googleAdId, currentStatus) => {
    const newStatus = currentStatus === "ENABLED" ? "PAUSED" : "ENABLED";
    setToggling((p) => ({ ...p, [googleAdId]: true }));
    try {
      await adsAPI.updateGoogleAd(adId, googleAdId, { status: newStatus });
      setGoogleAds((p) => ({
        ...p,
        [adId]: {
          ...p[adId],
          ads: p[adId].ads.map((a) => (a.id === googleAdId ? { ...a, status: newStatus } : a)),
        },
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setToggling((p) => ({ ...p, [googleAdId]: false }));
    }
  };

  const handleDelete = async (adId, googleAdId) => {
    if (!window.confirm("Permanently remove this ad from Google Ads? This cannot be undone."))
      return;
    setDeleting((p) => ({ ...p, [googleAdId]: true }));
    try {
      await adsAPI.deleteGoogleAd(adId, googleAdId);
      setGoogleAds((p) => ({
        ...p,
        [adId]: { ...p[adId], ads: p[adId].ads.filter((a) => a.id !== googleAdId) },
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting((p) => ({ ...p, [googleAdId]: false }));
    }
  };

  const openEdit = (adId, googleAd) => {
    setEditTarget({ adId, googleAd });
    setEditForm({
      headline: googleAd.headline || "",
      description: googleAd.description || "",
      final_url: googleAd.final_url || "",
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await adsAPI.updateGoogleAd(editTarget.adId, editTarget.googleAd.id, editForm);
      await loadGoogleAds(editTarget.adId);
      setEditTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const loadInsights = async (adId) => {
    setInsights((p) => ({ ...p, [adId]: { loading: true, rows: [], error: null } }));
    try {
      const data = await adsAPI.fetchGoogleInsights(adId, insightRange);
      setInsights((p) => ({
        ...p,
        [adId]: { loading: false, rows: data.rows || [], error: null },
      }));
    } catch (err) {
      setInsights((p) => ({ ...p, [adId]: { loading: false, rows: [], error: err.message } }));
    }
  };

  const getWindowsForAd = (adId) => {
    if (savedSchedules[adId] !== undefined) return savedSchedules[adId];
    const ad = googleCampaigns.find((a) => a.id === adId);
    const existing = ad?.bot_config?.pause_schedule;
    if (!existing) return [];
    if (Array.isArray(existing)) return existing;
    return [
      {
        id: "legacy",
        days: existing.pause_days || [],
        timeFrom: (existing.pause_hours || "00:00-23:59").split("-")[0],
        timeTo: (existing.pause_hours || "00:00-23:59").split("-")[1],
      },
    ];
  };

  const openPauseModal = (adId) => {
    const existing = getWindowsForAd(adId);
    setPauseWindows(existing.map((w, i) => ({ ...w, id: w.id || String(i) })));
    setPauseTarget(adId);
  };

  const addWindow = () => {
    setPauseWindows((p) => [
      ...p,
      { id: Date.now().toString(), days: [], timeFrom: "00:00", timeTo: "23:59" },
    ]);
  };

  const removeWindow = (id) => setPauseWindows((p) => p.filter((w) => w.id !== id));

  const updateWindow = (id, field, value) =>
    setPauseWindows((p) => p.map((w) => (w.id === id ? { ...w, [field]: value } : w)));

  const toggleWindowDay = (id, day) =>
    setPauseWindows((p) =>
      p.map((w) =>
        w.id === id
          ? {
              ...w,
              days: w.days.includes(day) ? w.days.filter((d) => d !== day) : [...w.days, day],
            }
          : w,
      ),
    );

  const handlePauseSave = async () => {
    if (!pauseTarget) return;
    if (pauseWindows.some((w) => w.days.length === 0)) {
      alert("Each window must have at least one day selected.");
      return;
    }
    setPauseSaving(true);
    try {
      await adsAPI.updateBotConfig(pauseTarget, { pause_schedule: pauseWindows });
      setSavedSchedules((p) => ({ ...p, [pauseTarget]: pauseWindows }));
      setPauseTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setPauseSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "0.83rem",
    border: "1px solid var(--color-card-border)",
    backgroundColor: "var(--color-input-bg)",
    color: "var(--color-input-text)",
    outline: "none",
    fontFamily: "inherit",
  };

  if (!googleConnection) {
    return (
      <SectionCard title="Manage Google Ads" subtitle="Connect your Google Ads account first">
        <div className="flex flex-col items-center py-12 gap-3">
          <Link2Off size={36} style={{ color: "var(--color-sidebar-text)", opacity: 0.4 }} />
          <p className="text-sm" style={{ color: "var(--color-sidebar-text)" }}>
            Connect your Google Ads account in Platform Settings to manage ads here.
          </p>
        </div>
      </SectionCard>
    );
  }

  if (googleCampaigns.length === 0) {
    return (
      <SectionCard title="Manage Google Ads" subtitle="No published campaigns found">
        <div className="flex flex-col items-center py-12 gap-3">
          <TrendingUp size={36} style={{ color: "var(--color-sidebar-text)", opacity: 0.4 }} />
          <p className="text-sm" style={{ color: "var(--color-sidebar-text)" }}>
            Publish a campaign first, then upload it to Google Ads from the Upload Ads tab.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {googleCampaigns.map((ad) => {
        const state = googleAds[ad.id];
        const campaignId = ad.bot_config?.google_campaign_id;
        const managerUrl = state?.managerUrl || ad.bot_config?.google_ads_manager_url;
        const insight = insights[ad.id];

        return (
          <SectionCard
            key={ad.id}
            title={ad.title}
            subtitle={
              campaignId
                ? `Campaign ID: ${campaignId} · ${state?.ads?.length ?? "–"} ads`
                : "No campaign ID — distribute to Google Ads first"
            }
          >
            {/* Action bar */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                className="btn--inline-action--ghost"
                onClick={() => loadGoogleAds(ad.id)}
                disabled={state?.loading}
              >
                {state?.loading ? (
                  <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <RefreshCw size={12} />
                )}
                {state ? "Refresh Ads" : "Load Ads"}
              </button>

              <button
                className="btn--inline-action--ghost"
                onClick={() => openPauseModal(ad.id)}
                style={{ borderColor: "#f59e0b44", color: "#f59e0b" }}
              >
                <Pause size={12} /> Schedule Pause
              </button>

              <button
                className="btn--inline-action--ghost"
                onClick={() => loadInsights(ad.id)}
                disabled={insight?.loading}
                style={{ borderColor: "#3b82f644", color: "#3b82f6" }}
              >
                {insight?.loading ? (
                  <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <BarChart3 size={12} />
                )}
                Load Analytics
              </button>

              <select
                value={insightRange}
                onChange={(e) => setInsightRange(e.target.value)}
                style={{ ...inputStyle, width: "auto", padding: "4px 8px", fontSize: "0.78rem" }}
              >
                {DATE_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {managerUrl && (
                <a
                  href={managerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn--inline-action--ghost"
                  style={{
                    fontSize: "0.78rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <ExternalLink size={12} /> Google Ads Manager
                </a>
              )}
            </div>

            {/* Active pause windows */}
            {(() => {
              const windows = getWindowsForAd(ad.id);
              if (!windows.length) return null;
              return (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#b45309",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Pause size={11} style={{ color: "#f59e0b" }} /> {windows.length} pause window
                      {windows.length !== 1 ? "s" : ""} active
                    </span>
                    <button
                      onClick={() => openPauseModal(ad.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#b45309",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: 0,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {windows.map((w, i) => (
                      <div
                        key={w.id || i}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 7,
                          backgroundColor: "rgba(245,158,11,0.07)",
                          border: "1px solid rgba(245,158,11,0.22)",
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Clock size={10} style={{ color: "#f59e0b", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.75rem", color: "#92400e" }}>
                          Every <strong>{w.days.join(", ")}</strong> · {w.timeFrom}–{w.timeTo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Error */}
            {state?.error && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  marginBottom: "12px",
                }}
              >
                <p style={{ fontSize: "0.78rem", color: "#ef4444" }}>{state.error}</p>
              </div>
            )}

            {/* Ad table */}
            {state?.ads?.length > 0 && (
              <div style={{ overflowX: "auto", marginBottom: 16 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                      {["Headline", "Description", "Status", "Enable/Pause", "Edit", "Delete"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "6px 10px",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "var(--color-sidebar-text)",
                              fontSize: "0.72rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {state.ads.map((googleAd) => {
                      const isActive = googleAd.status === "ENABLED";
                      const isToggling = toggling[googleAd.id];
                      const isDeleting = deleting[googleAd.id];

                      return (
                        <tr
                          key={googleAd.id}
                          style={{ borderBottom: "1px solid var(--color-card-border)" }}
                        >
                          <td style={{ padding: "8px 10px", maxWidth: 200 }}>
                            <p
                              style={{
                                fontWeight: 600,
                                color: "var(--color-input-text)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {googleAd.headline || googleAd.name}
                            </p>
                          </td>
                          <td style={{ padding: "8px 10px", maxWidth: 240 }}>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--color-sidebar-text)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {googleAd.description || "—"}
                            </p>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 999,
                                backgroundColor: isActive
                                  ? "rgba(34,197,94,0.1)"
                                  : "rgba(234,179,8,0.1)",
                                color: isActive ? "#16a34a" : "#92400e",
                              }}
                            >
                              {isActive ? <Play size={9} /> : <Pause size={9} />}
                              {googleAd.status}
                            </span>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <button
                              onClick={() => handleToggle(ad.id, googleAd.id, googleAd.status)}
                              disabled={isToggling}
                              title={isActive ? "Pause ad" : "Enable ad"}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: isActive ? "#ca8a04" : "#16a34a",
                                padding: 4,
                              }}
                            >
                              {isToggling ? (
                                <Loader2
                                  size={18}
                                  style={{ animation: "spin 1s linear infinite" }}
                                />
                              ) : isActive ? (
                                <ToggleRight size={22} />
                              ) : (
                                <ToggleLeft size={22} />
                              )}
                            </button>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <button
                              onClick={() => openEdit(ad.id, googleAd)}
                              title="Edit headline / description"
                              className="btn--icon"
                            >
                              <Pencil size={14} />
                            </button>
                          </td>
                          <td style={{ padding: "8px 10px" }}>
                            <button
                              onClick={() => handleDelete(ad.id, googleAd.id)}
                              disabled={isDeleting}
                              title="Remove this ad"
                              className="btn--icon"
                              style={{ color: "#ef4444" }}
                            >
                              {isDeleting ? (
                                <Loader2
                                  size={14}
                                  style={{ animation: "spin 1s linear infinite" }}
                                />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Analytics panel */}
            {insight?.rows?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--color-input-text)",
                    marginBottom: 10,
                  }}
                >
                  Performance Metrics
                </p>
                {/* Summary row */}
                {(() => {
                  const totals = insight.rows.reduce(
                    (acc, r) => ({
                      impressions: acc.impressions + (r.impressions || 0),
                      clicks: acc.clicks + (r.clicks || 0),
                      spend: acc.spend + (r.spend || 0),
                      conversions: acc.conversions + (r.conversions || 0),
                    }),
                    { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
                  );
                  const avgCtr =
                    totals.impressions > 0
                      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
                      : "0.00";
                  const avgCpc =
                    totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : "0.00";
                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {[
                        { label: "Impressions", value: totals.impressions.toLocaleString() },
                        { label: "Clicks", value: totals.clicks.toLocaleString() },
                        { label: "CTR", value: `${avgCtr}%` },
                        { label: "Spend", value: `$${totals.spend.toFixed(2)}` },
                        { label: "Avg CPC", value: `$${avgCpc}` },
                        { label: "Conversions", value: totals.conversions.toLocaleString() },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            backgroundColor: "var(--color-input-bg)",
                            border: "1px solid var(--color-card-border)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.65rem",
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
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: "var(--color-input-text)",
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Daily table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                        {[
                          "Date",
                          "Impressions",
                          "Clicks",
                          "CTR",
                          "Spend",
                          "CPC",
                          "Conversions",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "5px 8px",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "var(--color-sidebar-text)",
                              fontSize: "0.68rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {insight.rows
                        .slice(-14)
                        .reverse()
                        .map((row, i) => (
                          <tr
                            key={i}
                            style={{ borderBottom: "1px solid var(--color-card-border)" }}
                          >
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              {row.date}
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              {(row.impressions || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              {(row.clicks || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              {row.click_rate?.toFixed(2) ?? "0.00"}%
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              ${(row.spend || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              ${(row.cpc || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: "5px 8px", color: "var(--color-input-text)" }}>
                              {(row.conversions || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {insight?.error && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  backgroundColor: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.22)",
                }}
              >
                <p style={{ fontSize: "0.78rem", color: "#ef4444" }}>{insight.error}</p>
              </div>
            )}
          </SectionCard>
        );
      })}

      {/* Schedule Pause modal */}
      {pauseTarget && (
        <div className="ad-preview-overlay" onClick={() => setPauseTarget(null)}>
          <div
            className="ad-preview-modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-preview-modal__header">
              <div>
                <h3 className="page-card__title">Schedule Pause Windows</h3>
                <p className="page-card__subtitle">
                  Recurring windows — ads pause and resume automatically
                </p>
              </div>
              <button className="btn--icon" onClick={() => setPauseTarget(null)}>
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {pauseWindows.length === 0 && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-sidebar-text)",
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No windows yet — click <strong>Add Window</strong> below.
                </p>
              )}
              {pauseWindows.map((win, idx) => (
                <div
                  key={win.id}
                  style={{
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 10,
                    padding: "14px",
                    backgroundColor: "rgba(245,158,11,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#b45309",
                        textTransform: "uppercase",
                      }}
                    >
                      Window {idx + 1}
                    </span>
                    <button
                      onClick={() => removeWindow(win.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: 2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {DAY_OPTIONS.map((day) => {
                      const active = win.days.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleWindowDay(win.id, day)}
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 999,
                            cursor: "pointer",
                            backgroundColor: active ? "#f59e0b" : "rgba(245,158,11,0.08)",
                            color: active ? "#fff" : "#b45309",
                            border: `1px solid ${active ? "#f59e0b" : "rgba(245,158,11,0.3)"}`,
                          }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--color-sidebar-text)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Pause from
                      </label>
                      <input
                        type="time"
                        style={inputStyle}
                        value={win.timeFrom}
                        onChange={(e) => updateWindow(win.id, "timeFrom", e.target.value)}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "var(--color-sidebar-text)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Resume at
                      </label>
                      <input
                        type="time"
                        style={inputStyle}
                        value={win.timeTo}
                        onChange={(e) => updateWindow(win.id, "timeTo", e.target.value)}
                      />
                    </div>
                  </div>
                  {win.days.length > 0 && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 7,
                        backgroundColor: "rgba(245,158,11,0.07)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        display: "flex",
                        gap: 7,
                        alignItems: "center",
                      }}
                    >
                      <Clock size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.75rem", color: "#92400e", margin: 0 }}>
                        Every <strong>{win.days.map((d) => d.slice(0, 3)).join(", ")}</strong> ·{" "}
                        {win.timeFrom} → {win.timeTo}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addWindow}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px",
                  borderRadius: 8,
                  border: "1.5px dashed rgba(245,158,11,0.5)",
                  background: "none",
                  cursor: "pointer",
                  color: "#b45309",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <Plus size={14} /> Add Window
              </button>
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", gap: "10px" }}>
              <button
                onClick={handlePauseSave}
                disabled={pauseSaving}
                className="btn--accent"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {pauseSaving ? (
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Pause size={14} />
                )}
                {pauseSaving ? "Saving…" : "Save Schedule"}
              </button>
              <button
                onClick={() => setPauseTarget(null)}
                className="btn--ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit creative modal */}
      {editTarget && (
        <div className="ad-preview-overlay" onClick={() => setEditTarget(null)}>
          <div
            className="ad-preview-modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-preview-modal__header">
              <div>
                <h3 className="page-card__title">Edit Google Ad Creative</h3>
                <p className="page-card__subtitle">{editTarget.googleAd.name}</p>
              </div>
              <button className="btn--icon" onClick={() => setEditTarget(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(234,179,8,0.07)",
                  border: "1px solid rgba(234,179,8,0.25)",
                }}
              >
                <p style={{ fontSize: "0.76rem", color: "#92400e" }}>
                  Updates headline, description, and/or destination URL on the live Google ad.
                </p>
              </div>
              {[
                { key: "headline", label: "Headline (max 30 chars)", multiline: false },
                { key: "description", label: "Description (max 90 chars)", multiline: true },
                { key: "final_url", label: "Destination URL", multiline: false },
              ].map(({ key, label, multiline }) => (
                <div key={key}>
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--color-sidebar-text)",
                      display: "block",
                      marginBottom: 5,
                    }}
                  >
                    {label}
                  </label>
                  {multiline ? (
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      value={editForm[key] || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type="text"
                      style={inputStyle}
                      value={editForm[key] || ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="btn--accent"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {editSaving ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  {editSaving ? "Saving to Google…" : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditTarget(null)}
                  className="btn--ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
