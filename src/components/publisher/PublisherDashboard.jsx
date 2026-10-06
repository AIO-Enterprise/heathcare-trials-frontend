/**
 * M14: Publisher Dashboard
 * Owner: Frontend Dev 2
 * Dependencies: adsAPI, analyticsAPI
 *
 * Tabs (URL-driven):
 *   /publisher           → Overview   — approve, generate creatives/website, publish
 *   /publisher/deploy    → Deploy     — push generated websites to Vercel/Netlify/Render/GitHub Pages/custom domain
 *   /publisher/distribute→ Distribute — post ad creatives to Meta/YouTube/LinkedIn/Twitter/TikTok/etc
 *   /publisher/analytics → Analytics  — optimizer + performance
 */

import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageWithSidebar, MetricSummaryCard, SectionCard } from "../shared/Layout";
import { adsAPI, analyticsAPI, platformConnectionsAPI } from "../../services/api";
import {
  Globe,
  BarChart3,
  Rocket,
  Share2,
  Zap,
  Eye,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import ManageTab from "./ManageTab";
import ManageGoogleAdsTab from "./ManageGoogleAdsTab";
import PublisherAnalytics from "./PublisherAnalytics";
import AdPreviewModal from "./AdPreviewModal";
import MetaPlatformSettings from "./MetaPlatformSettings";
import GoogleAdsPlatformSettings from "./GoogleAdsPlatformSettings";
import OverviewTab from "./overview/OverviewTab";
import DeployTab from "./deploy/DeployTab";
import DistributeTab, { SOCIAL_PLATFORMS } from "./distribute/DistributeTab";

// ─── Tab ↔ Path maps ──────────────────────────────────────────────────────────
export const PATH_TO_TAB = {
  "/publisher/deploy": "deploy",
  "/publisher/distribute": "distribute",
  "/publisher/manage": "manage",
  "/publisher/analytics": "analytics",
  "/publisher/settings": "settings",
};
export const TAB_TO_PATH = {
  overview: "/publisher",
  deploy: "/publisher/deploy",
  distribute: "/publisher/distribute",
  manage: "/publisher/manage",
  analytics: "/publisher/analytics",
  settings: "/publisher/settings",
};

export const TABS = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "deploy", label: "Publish Website", icon: Rocket },
  { key: "distribute", label: "Upload Ads", icon: Share2 },
  { key: "manage", label: "Manage Ads", icon: TrendingUp },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SlidersHorizontal },
];

// ─── Root component ───────────────────────────────────────────────────────────
export default function PublisherDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overview state
  const [publishing, setPublishing] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [hostingId, setHostingId] = useState(null);
  const [hostError, setHostError] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [previewAd, setPreviewAd] = useState(null);
  const autoExpandDone = useRef(false);

  // Deploy state
  const [deployExpanded, setDeployExpanded] = useState(null);
  const [deployForms, setDeployForms] = useState({});
  const [deployStatus, setDeployStatus] = useState({});

  // Distribute state
  const [distExpanded, setDistExpanded] = useState(null);
  const [distForms, setDistForms] = useState({});
  const [distStatus, setDistStatus] = useState({});

  // Platform connections (OAuth)
  const [metaConnection, setMetaConnection] = useState(null);
  const [metaAccounts, setMetaAccounts] = useState(null); // { ad_accounts, pages }
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [googleConnection, setGoogleConnection] = useState(null);
  const [googleAccounts, setGoogleAccounts] = useState(null); // { customers: [...] }
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [loadingGoogleAccounts, setLoadingGoogleAccounts] = useState(false);

  // Optimizer state — lifted here so results persist across tab switches
  const [optimizerSuggestions, setOptimizerSuggestions] = useState(null);
  const [optimizerRunning, setOptimizerRunning] = useState(false);
  const [optimizerStep, setOptimizerStep] = useState(0);

  const activeTab = PATH_TO_TAB[location.pathname] || "overview";

  useEffect(() => {
    adsAPI
      .list()
      .then((data) => {
        setAds(data);
        // Auto-expand the most recent campaign in Overview (runs once)
        if (!autoExpandDone.current && data.length > 0) {
          autoExpandDone.current = true;
          const first = data.find((a) => a.status === "approved" || a.status === "published");
          if (first) setExpandedId(first.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load stored platform connections on mount
  useEffect(() => {
    platformConnectionsAPI
      .list()
      .then((connections) => {
        setMetaConnection(connections.find((c) => c.platform === "meta") || null);
        setGoogleConnection(connections.find((c) => c.platform === "google_ads") || null);
      })
      .catch(console.error);
  }, []);

  const approved = ads.filter((a) => a.status === "approved");
  const published = ads.filter((a) => a.status === "published");

  // ── Overview handlers ────────────────────────────────────────────────────
  const handleUpdateAd = (updatedAd) => {
    setAds((p) => p.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
  };

  const handlePublish = async (adId) => {
    setPublishing(adId);
    setPublishError(null);
    try {
      const updated = await adsAPI.publish(adId);
      setAds((p) => p.map((a) => (a.id === adId ? updated : a)));
    } catch (err) {
      setPublishError(err.message || "Publish failed. Campaign must be approved first.");
      setTimeout(() => setPublishError(null), 6000);
    } finally {
      setPublishing(null);
    }
  };

  const handleHostPage = async (adId) => {
    setHostingId(adId);
    setHostError((p) => ({ ...p, [adId]: null }));
    try {
      const updated = await adsAPI.hostPage(adId);
      setAds((p) => p.map((a) => (a.id === adId ? updated : a)));
    } catch (err) {
      setHostError((p) => ({ ...p, [adId]: err.message || "Hosting failed." }));
    } finally {
      setHostingId(null);
    }
  };

  // ── Deploy handlers ──────────────────────────────────────────────────────
  const handleDeploySelect = (adId, platformId) => {
    const isOpen = deployExpanded?.adId === adId && deployExpanded?.platformId === platformId;
    setDeployExpanded(isOpen ? null : { adId, platformId });
  };

  const updateDeployForm = (adId, platformId, key, value) => {
    const fk = `${adId}_${platformId}`;
    setDeployForms((p) => ({ ...p, [fk]: { ...(p[fk] || {}), [key]: value } }));
  };

  const handleDeploy = async (adId, platform) => {
    const fk = `${adId}_${platform.id}`;
    setDeployStatus((p) => ({ ...p, [fk]: { status: "deploying" } }));
    try {
      const result = await adsAPI.deployWebsite(adId, {
        platform: platform.id,
        config: deployForms[fk] || {},
      });
      setDeployStatus((p) => ({ ...p, [fk]: { status: "deployed", url: result?.url } }));
    } catch (err) {
      setDeployStatus((p) => ({ ...p, [fk]: { status: "error", error: err.message } }));
    }
  };

  // ── Distribute handlers ──────────────────────────────────────────────────
  const handleDistSelect = (adId, platformId) => {
    // Block inactive platforms
    const entry = Object.entries(SOCIAL_PLATFORMS).find(([, cfg]) => cfg.id === platformId);
    if (!entry || !entry[1].active) return;

    const isOpen = distExpanded?.adId === adId && distExpanded?.platformId === platformId;
    if (!isOpen) {
      const ad = ads.find((a) => a.id === adId);
      const fk = `${adId}_${platformId}`;
      setDistForms((p) => {
        const existing = p[fk] || {};
        const seeds = {};

        const strategy = ad?.strategy_json || {};

        // Seed destination_url from hosted landing page — must be absolute for Meta
        if (!existing.destination_url && ad?.hosted_url) {
          seeds.destination_url = ad.hosted_url;
        }

        // AI-suggested daily budget: use strategy daily budget, or spread total over 30 days
        if (!existing.daily_budget) {
          const stratBudget =
            strategy.daily_budget_usd || strategy.daily_budget || strategy.recommended_daily_budget;
          const suggested = stratBudget
            ? parseFloat(stratBudget)
            : ad?.budget
              ? Math.max(5, Math.round((parseFloat(ad.budget) / 30) * 100) / 100)
              : 10;
          seeds.daily_budget = suggested.toFixed(2);
          seeds._budget_ai_suggested = true;
        }

        // Age targeting from strategy demographics (look for age_min/age_max or parse text)
        if (!existing.age_min && !existing.age_max) {
          const demo = strategy.target_audience?.demographics;
          let ageMin = 18,
            ageMax = 65,
            ageSuggested = false;
          if (demo) {
            const demoStr = typeof demo === "string" ? demo : JSON.stringify(demo);
            // Match patterns like "25–54", "25-54", "ages 30 to 60", "30+"
            const rangeMatch = demoStr.match(/(\d{2})\s*[-–to]+\s*(\d{2})/i);
            const plusMatch = demoStr.match(/ages?\s*(\d{2})\+/i) || demoStr.match(/(\d{2})\+/);
            if (rangeMatch) {
              ageMin = parseInt(rangeMatch[1], 10);
              ageMax = parseInt(rangeMatch[2], 10);
              ageSuggested = true;
            } else if (plusMatch) {
              ageMin = parseInt(plusMatch[1], 10);
              ageMax = 65;
              ageSuggested = true;
            }
          }
          // Also check explicit fields
          if (strategy.target_audience?.age_min) {
            ageMin = parseInt(strategy.target_audience.age_min, 10);
            ageSuggested = true;
          }
          if (strategy.target_audience?.age_max) {
            ageMax = parseInt(strategy.target_audience.age_max, 10);
            ageSuggested = true;
          }
          seeds.age_min = String(ageMin);
          seeds.age_max = String(ageMax);
          seeds._age_ai_suggested = ageSuggested;
        }

        // Launch window from social_content (pick the platform that matches, or first entry)
        if (!existing.start_time) {
          const platformKey =
            platformId === "meta" ? "Facebook" : platformId === "google_ads" ? "Google" : null;
          const socialContent = strategy.social_content || {};
          const platformEntry = platformKey
            ? socialContent[platformKey] ||
              socialContent[`${platformKey} Ads`] ||
              Object.values(socialContent)[0]
            : Object.values(socialContent)[0];
          const launchSched = platformEntry?.launch_schedule;
          if (launchSched?.recommended_window || launchSched?.best_time) {
            // Store the raw schedule text for display; actual start_time left blank for user to confirm
            seeds._launch_window_hint = [
              launchSched.recommended_window,
              launchSched.best_days && launchSched.best_time
                ? `${launchSched.best_days} · ${launchSched.best_time}`
                : launchSched.best_days || launchSched.best_time,
              launchSched.rationale,
            ]
              .filter(Boolean)
              .join(" — ");
          }
        }

        // Target countries from strategy channels or default to AU
        if (!existing.targeting_countries) {
          // Try to infer from strategy target_audience or just default
          const primary = (strategy.target_audience?.primary || "").toLowerCase();
          let suggestedCountries = "AU";
          if (
            primary.includes("united states") ||
            primary.includes("u.s.") ||
            primary.includes("american")
          )
            suggestedCountries = "US";
          else if (
            primary.includes("united kingdom") ||
            primary.includes("u.k.") ||
            primary.includes("british")
          )
            suggestedCountries = "GB";
          else if (primary.includes("canada") || primary.includes("canadian"))
            suggestedCountries = "CA";
          seeds.targeting_countries = suggestedCountries;
          seeds._countries_ai_suggested =
            suggestedCountries !== "AU" || primary.includes("australia");
        }

        // Default currency
        if (!existing.currency) {
          seeds.currency = "AUD";
        }

        // Default browser add-on to None; user can switch to WhatsApp/Phone manually
        if (!existing.addon_type) {
          seeds.addon_type = "";
          seeds._addon_ai_suggested = false;
        }

        return Object.keys(seeds).length ? { ...p, [fk]: { ...existing, ...seeds } } : p;
      });
    }
    setDistExpanded(isOpen ? null : { adId, platformId });
  };

  const updateDistForm = (adId, platformId, key, value) => {
    const fk = `${adId}_${platformId}`;
    setDistForms((p) => ({ ...p, [fk]: { ...(p[fk] || {}), [key]: value } }));
  };

  const handleDistribute = async (adId, platformConfig) => {
    const fk = `${adId}_${platformConfig.id}`;
    setDistStatus((p) => ({ ...p, [fk]: { status: "posting" } }));
    try {
      // Strip internal UI-only keys (_*) and convert datetime-local to ISO 8601
      const raw = distForms[fk] || {};
      const config = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
      if (config.start_time) {
        // datetime-local gives "2025-06-01T09:00" — append seconds + Z for UTC
        config.start_time = new Date(config.start_time).toISOString();
      }
      let result;
      if (platformConfig.id === "google_ads") {
        result = await adsAPI.distributeGoogleAds(adId, { config });
      } else {
        result = await adsAPI.distributeCreatives(adId, { platform: platformConfig.id, config });
      }
      setDistStatus((p) => ({ ...p, [fk]: { status: "posted", result } }));
    } catch (err) {
      setDistStatus((p) => ({ ...p, [fk]: { status: "error", error: err.message } }));
    }
  };

  // ── Meta OAuth connect ────────────────────────────────────────────────────
  const handleConnectMeta = async () => {
    setConnectingMeta(true);
    try {
      const { url } = await platformConnectionsAPI.getOAuthUrl("meta");
      const popup = window.open(
        url,
        "meta_oauth",
        "width=620,height=700,scrollbars=yes,resizable=yes",
      );

      const onMessage = async (event) => {
        if (!event.data || !["meta_oauth_success", "meta_oauth_error"].includes(event.data.type))
          return;
        window.removeEventListener("message", onMessage);
        clearInterval(pollClosed);

        if (event.data.type === "meta_oauth_success") {
          // Refresh connection and load account/page lists
          const connections = await platformConnectionsAPI.list();
          const meta = connections.find((c) => c.platform === "meta") || null;
          setMetaConnection(meta);
          if (meta) {
            setLoadingAccounts(true);
            try {
              const accounts = await platformConnectionsAPI.getMetaAccounts();
              setMetaAccounts(accounts);
            } catch (e) {
              console.error(e);
            } finally {
              setLoadingAccounts(false);
            }
          }
        } else {
          alert("Failed to connect Meta account. Please try again.");
        }
        setConnectingMeta(false);
      };

      window.addEventListener("message", onMessage);

      // Fallback: if popup closed without sending a message
      const pollClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(pollClosed);
          window.removeEventListener("message", onMessage);
          setConnectingMeta(false);
        }
      }, 600);
    } catch (err) {
      alert(err.message);
      setConnectingMeta(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!window.confirm("Disconnect your Meta account? Stored credentials will be removed."))
      return;
    await platformConnectionsAPI.disconnectMeta();
    setMetaConnection(null);
    setMetaAccounts(null);
  };

  const handleLoadMetaAccounts = async () => {
    if (metaAccounts) return; // already loaded
    setLoadingAccounts(true);
    try {
      const accounts = await platformConnectionsAPI.getMetaAccounts();
      setMetaAccounts(accounts);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSelectAdAccount = async (account) => {
    await platformConnectionsAPI.updateMeta({
      ad_account_id: account.id,
      ad_account_name: account.name,
    });
    setMetaConnection((p) => ({ ...p, ad_account_id: account.id, ad_account_name: account.name }));
  };

  const handleSelectPage = async (page) => {
    await platformConnectionsAPI.updateMeta({ page_id: page.id, page_name: page.name });
    setMetaConnection((p) => ({ ...p, page_id: page.id, page_name: page.name }));
  };

  // ── Google Ads OAuth connect ──────────────────────────────────────────────
  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const { url } = await platformConnectionsAPI.getOAuthUrl("google");
      const popup = window.open(
        url,
        "google_oauth",
        "width=620,height=700,scrollbars=yes,resizable=yes",
      );

      const onMessage = async (event) => {
        if (
          !event.data ||
          !["google_oauth_success", "google_oauth_error"].includes(event.data.type)
        )
          return;
        window.removeEventListener("message", onMessage);
        clearInterval(pollClosed);

        if (event.data.type === "google_oauth_success") {
          const connections = await platformConnectionsAPI.list();
          const google = connections.find((c) => c.platform === "google_ads") || null;
          setGoogleConnection(google);
          if (google) {
            setLoadingGoogleAccounts(true);
            try {
              const accounts = await platformConnectionsAPI.getGoogleAccounts();
              setGoogleAccounts(accounts);
            } catch (e) {
              console.error(e);
            } finally {
              setLoadingGoogleAccounts(false);
            }
          }
        } else {
          alert("Failed to connect Google Ads account. Please try again.");
        }
        setConnectingGoogle(false);
      };

      window.addEventListener("message", onMessage);

      const pollClosed = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(pollClosed);
          window.removeEventListener("message", onMessage);
          setConnectingGoogle(false);
        }
      }, 600);
    } catch (err) {
      alert(err.message);
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("Disconnect your Google Ads account? Stored credentials will be removed."))
      return;
    await platformConnectionsAPI.disconnectGoogle();
    setGoogleConnection(null);
    setGoogleAccounts(null);
  };

  const handleLoadGoogleAccounts = async () => {
    if (googleAccounts) return;
    setLoadingGoogleAccounts(true);
    try {
      const accounts = await platformConnectionsAPI.getGoogleAccounts();
      setGoogleAccounts(accounts);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingGoogleAccounts(false);
    }
  };

  const handleSelectGoogleCustomer = async (customer) => {
    await platformConnectionsAPI.updateGoogle({
      ad_account_id: customer.id,
      ad_account_name: customer.name,
    });
    setGoogleConnection((p) => ({
      ...p,
      ad_account_id: customer.id,
      ad_account_name: customer.name,
    }));
  };

  if (loading)
    return (
      <PageWithSidebar>
        <div className="flex items-center justify-center py-40">
          <div className="spinner--dark" />
        </div>
      </PageWithSidebar>
    );

  return (
    <PageWithSidebar>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className="page-header">
        <div>
          <h1 className="page-header__title">Publisher Dashboard</h1>
          <p className="page-header__subtitle">
            Launch campaigns, publish your website, and upload ads to social platforms
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricSummaryCard label="Ready to Publish" value={approved.length} icon={Rocket} />
        <MetricSummaryCard label="Published" value={published.length} icon={Globe} />
        <MetricSummaryCard label="Total Campaigns" value={ads.length} icon={BarChart3} />
        <MetricSummaryCard
          label="Active"
          value={published.filter((a) => a.status !== "paused").length}
          icon={Zap}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => navigate(TAB_TO_PATH[t.key])}
            className={`${activeTab === t.key ? "filter-tab--active" : "filter-tab"} flex items-center gap-1.5`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <OverviewTab
          approved={approved}
          published={published}
          publishing={publishing}
          publishError={publishError}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((p) => (p === id ? null : id))}
          onPublish={handlePublish}
          onUpdateAd={handleUpdateAd}
          onPreviewAd={setPreviewAd}
          onViewDetail={(id) => navigate(`/publisher/campaign/${id}`)}
          hostingId={hostingId}
          hostError={hostError}
          onHostPage={handleHostPage}
        />
      )}

      {/* ── Deploy ── */}
      {activeTab === "deploy" && (
        <DeployTab
          ads={ads}
          hostingId={hostingId}
          hostError={hostError}
          onHost={handleHostPage}
          onAdUpdated={(updated) =>
            setAds((p) => p.map((a) => (a.id === updated.id ? updated : a)))
          }
        />
      )}

      {/* ── Distribute ── */}
      {activeTab === "distribute" && (
        <DistributeTab
          ads={ads}
          distExpanded={distExpanded}
          distForms={distForms}
          distStatus={distStatus}
          onSelectPlatform={handleDistSelect}
          onUpdateForm={updateDistForm}
          onDistribute={handleDistribute}
          onPreviewAd={setPreviewAd}
          metaConnection={metaConnection}
          googleConnection={googleConnection}
        />
      )}

      {/* ── Manage Ads ── */}
      {activeTab === "manage" && (
        <ManageAdsTabsWrapper
          ads={ads}
          metaConnection={metaConnection}
          googleConnection={googleConnection}
        />
      )}

      {/* ── Analytics ── */}
      {activeTab === "analytics" && (
        <PublisherAnalytics
          ads={ads.filter(
            (a) => a.bot_config?.meta_campaign_id || a.bot_config?.google_campaign_id,
          )}
          suggestions={optimizerSuggestions}
          setSuggestions={setOptimizerSuggestions}
          optimizing={optimizerRunning}
          setOptimizing={setOptimizerRunning}
          optimizerStep={optimizerStep}
          setOptimizerStep={setOptimizerStep}
        />
      )}

      {/* ── Settings ── */}
      {activeTab === "settings" && (
        <SettingsTab
          metaConnection={metaConnection}
          metaAccounts={metaAccounts}
          connectingMeta={connectingMeta}
          loadingAccounts={loadingAccounts}
          onConnectMeta={handleConnectMeta}
          onDisconnectMeta={handleDisconnectMeta}
          onLoadMetaAccounts={handleLoadMetaAccounts}
          onSelectAdAccount={handleSelectAdAccount}
          onSelectPage={handleSelectPage}
          googleConnection={googleConnection}
          googleAccounts={googleAccounts}
          connectingGoogle={connectingGoogle}
          loadingGoogleAccounts={loadingGoogleAccounts}
          onConnectGoogle={handleConnectGoogle}
          onDisconnectGoogle={handleDisconnectGoogle}
          onLoadGoogleAccounts={handleLoadGoogleAccounts}
          onSelectGoogleCustomer={handleSelectGoogleCustomer}
        />
      )}

      {/* Ad Preview Modal */}
      {previewAd && <AdPreviewModal ad={previewAd} onClose={() => setPreviewAd(null)} />}
    </PageWithSidebar>
  );
}

// ─── Manage Ads Tabs Wrapper ──────────────────────────────────────────────────
function ManageAdsTabsWrapper({ ads, metaConnection, googleConnection }) {
  const [platform, setPlatform] = useState("meta");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          className={platform === "meta" ? "filter-tab--active" : "filter-tab"}
          onClick={() => setPlatform("meta")}
        >
          Meta Ads
        </button>
        <button
          className={platform === "google_ads" ? "filter-tab--active" : "filter-tab"}
          onClick={() => setPlatform("google_ads")}
        >
          Google Ads
        </button>
      </div>
      {platform === "meta" && <ManageTab ads={ads} metaConnection={metaConnection} />}
      {platform === "google_ads" && (
        <ManageGoogleAdsTab ads={ads} googleConnection={googleConnection} />
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({
  metaConnection,
  metaAccounts,
  connectingMeta,
  loadingAccounts,
  onConnectMeta,
  onDisconnectMeta,
  onLoadMetaAccounts,
  onSelectAdAccount,
  onSelectPage,
  googleConnection,
  googleAccounts,
  connectingGoogle,
  loadingGoogleAccounts,
  onConnectGoogle,
  onDisconnectGoogle,
  onLoadGoogleAccounts,
  onSelectGoogleCustomer,
}) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Platform Settings"
        subtitle="Connect your ad accounts once — credentials are stored securely and reused for every publish"
      >
        <div className="space-y-3">
          <MetaPlatformSettings
            connection={metaConnection}
            accounts={metaAccounts}
            connecting={connectingMeta}
            loadingAccounts={loadingAccounts}
            onConnect={onConnectMeta}
            onDisconnect={onDisconnectMeta}
            onLoadAccounts={onLoadMetaAccounts}
            onSelectAdAccount={onSelectAdAccount}
            onSelectPage={onSelectPage}
          />
          <GoogleAdsPlatformSettings
            connection={googleConnection}
            accounts={googleAccounts}
            connecting={connectingGoogle}
            loadingAccounts={loadingGoogleAccounts}
            onConnect={onConnectGoogle}
            onDisconnect={onDisconnectGoogle}
            onLoadAccounts={onLoadGoogleAccounts}
            onSelectCustomer={onSelectGoogleCustomer}
          />
        </div>
      </SectionCard>
    </div>
  );
}
