import { Link } from "react-router-dom";
import {
  AlertCircle,
  Copy,
  Download,
  Eye,
  Globe,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { SectionCard } from "../../shared/Layout";
import ActionButton from "./ActionButton";
import AdPreviewTabs from "./AdPreviewTabs";
import { InlineProgress } from "./GenerateProgress";

const hasWebsiteAsset = (ad) => Boolean(ad?.hosted_url || ad?.output_url || ad?.website_download_url);

export default function PublishTab({
  ad,
  id,
  isPublisher,
  isStudyCoordinator,
  isPublished,
  genProgress,
  handlePublish,
  pubLoading,
  pubError,
  handleGenerateCreatives,
  creativeLoading,
  creativeError,
  canRegenerate,
  handleGenerateWebsite,
  websiteLoading,
  websiteError,
  handleHostPage,
  hostLoading,
  hostError,
}) {
  return (
    <>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Generate Ad Creatives */}
            {(canRegenerate ? ad.status !== "draft" : !!ad.output_files?.length) && (
              <SectionCard
                title="Ad Creatives"
                subtitle="Campaign copy and visuals produced from your strategy"
              >
                {creativeError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      marginBottom: "16px",
                    }}
                  >
                    <AlertCircle
                      size={14}
                      style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
                    />
                    <p style={{ fontSize: "0.82rem", color: "#ef4444", lineHeight: 1.5 }}>
                      {creativeError}
                    </p>
                  </div>
                )}
                {canRegenerate && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: ad.output_files?.length ? "24px" : 0,
                    }}
                  >
                    <ActionButton
                      onClick={handleGenerateCreatives}
                      loading={creativeLoading}
                      icon={<Sparkles size={14} />}
                    >
                      {creativeLoading
                        ? "Generating…"
                        : ad.output_files?.length
                          ? "Regenerate Creatives"
                          : "Generate Ad Creatives"}
                    </ActionButton>
                    {creativeLoading ? (
                      <InlineProgress progress={genProgress.progress} />
                    ) : (
                      !ad.output_files?.length && (
                        <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)" }}>
                          Generates copy + images for all ad formats using AI
                        </p>
                      )
                    )}
                  </div>
                )}
                {(ad.output_files?.length > 0 || ad.shorts_files?.length > 0) && (
                  <AdPreviewTabs ad={ad} />
                )}
              </SectionCard>
            )}

            {/* Generate Website */}
            {ad.ad_type?.includes("website") &&
              (canRegenerate ? ad.status !== "draft" : hasWebsiteAsset(ad)) && (
                <SectionCard
                  title="Landing Page"
                  subtitle="Brand-styled HTML page generated from your strategy and website requirements"
                >
                  {websiteError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        marginBottom: "16px",
                      }}
                    >
                      <AlertCircle
                        size={14}
                        style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
                      />
                      <p style={{ fontSize: "0.82rem", color: "#ef4444", lineHeight: 1.5 }}>
                        {websiteError}
                      </p>
                    </div>
                  )}
                  {canRegenerate && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: hasWebsiteAsset(ad) ? "20px" : 0,
                      }}
                    >
                      <ActionButton
                        onClick={handleGenerateWebsite}
                        loading={websiteLoading}
                        icon={<Globe size={14} />}
                      >
                        {websiteLoading
                          ? "Generating…"
                          : hasWebsiteAsset(ad)
                            ? "Regenerate Website"
                            : "Generate Website"}
                      </ActionButton>
                      {websiteLoading ? (
                        <InlineProgress progress={genProgress.progress} />
                      ) : (
                        !hasWebsiteAsset(ad) && (
                          <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)" }}>
                            Generates a self-contained HTML page · uses brand kit + strategy
                          </p>
                        )
                      )}
                    </div>
                  )}
                  {hasWebsiteAsset(ad) && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "10px",
                          border: "1px solid rgba(16,185,129,0.3)",
                          backgroundColor: "rgba(16,185,129,0.06)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Globe
                            size={16}
                            style={{ color: "var(--color-accent)", flexShrink: 0 }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "var(--color-input-text)",
                              }}
                            >
                              Landing page ready
                            </p>
                            <p
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-sidebar-text)",
                                marginTop: "2px",
                              }}
                            >
                              Self-contained HTML · brand-styled · responsive
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <a
                            href={ad.hosted_url || ad.output_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              backgroundColor: "var(--color-accent)",
                              color: "#fff",
                              textDecoration: "none",
                              border: "none",
                            }}
                          >
                            <Eye size={13} /> Preview
                          </a>
                          <a
                            href={ad.website_download_url || ad.hosted_url || ad.output_url}
                            download="landing-page.html"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 14px",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              border: "1px solid var(--color-card-border)",
                              backgroundColor: "var(--color-card-bg)",
                              color: "var(--color-input-text)",
                              textDecoration: "none",
                            }}
                          >
                            <Download size={13} /> Download
                          </a>
                          {isPublisher && (
                            <ActionButton
                              onClick={handleHostPage}
                              loading={hostLoading}
                              icon={<Globe size={13} />}
                            >
                              {hostLoading ? "Hosting…" : ad.hosted_url ? "Re-host" : "Host"}
                            </ActionButton>
                          )}
                        </div>
                      </div>
                      {isPublisher && hostError && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            marginTop: "12px",
                          }}
                        >
                          <AlertCircle
                            size={14}
                            style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
                          />
                          <p style={{ fontSize: "0.82rem", color: "#ef4444", lineHeight: 1.5 }}>
                            {hostError}
                          </p>
                        </div>
                      )}
                      {isPublisher && ad.hosted_url && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginTop: "12px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(34,197,94,0.06)",
                            border: "1px solid rgba(34,197,94,0.2)",
                          }}
                        >
                          <Globe size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-sidebar-text)",
                                marginBottom: "2px",
                              }}
                            >
                              Hosted at
                            </p>
                            <a
                              href={ad.hosted_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--color-accent)",
                                wordBreak: "break-all",
                                textDecoration: "none",
                                fontWeight: 500,
                              }}
                            >
                              {ad.hosted_url}
                            </a>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(ad.hosted_url)}
                            title="Copy URL"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-sidebar-text)",
                              padding: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </SectionCard>
              )}

            {/* Publish — Publisher only */}
            {ad.status === "approved" && isPublisher && (
              <SectionCard
                title="Publish Campaign"
                subtitle="Campaign has been approved — ready to go live"
              >
                {pubError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      marginBottom: "16px",
                    }}
                  >
                    <AlertCircle
                      size={14}
                      style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }}
                    />
                    <p style={{ fontSize: "0.82rem", color: "#ef4444", lineHeight: 1.5 }}>
                      {pubError}
                    </p>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ActionButton
                    onClick={handlePublish}
                    loading={pubLoading}
                    icon={<Zap size={14} />}
                  >
                    {pubLoading ? "Publishing…" : "Publish Campaign"}
                  </ActionButton>
                  {pubLoading && <InlineProgress progress={genProgress.progress} />}
                </div>
              </SectionCard>
            )}

            {/* Analytics */}
            {isPublished && (
              <SectionCard title="Analytics" subtitle="Campaign is live — view performance data">
                <Link
                  to="/study-coordinator/analytics"
                  className="btn--accent"
                  style={{ display: "inline-flex" }}
                >
                  View Analytics
                </Link>
              </SectionCard>
            )}

            {/* Empty states */}
            {isPublisher && ad.status !== "approved" && ad.status !== "published" && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Zap
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  Campaign must be{" "}
                  <strong style={{ color: "var(--color-input-text)" }}>approved</strong> before
                  publishing.
                </p>
              </div>
            )}
            {isStudyCoordinator && ad.status === "draft" && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Zap
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  Generate a <strong style={{ color: "var(--color-input-text)" }}>strategy</strong>{" "}
                  first to unlock preview.
                </p>
              </div>
            )}
            {isStudyCoordinator &&
              ad.status !== "draft" &&
              !ad.output_files?.length &&
               !hasWebsiteAsset(ad) && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <Eye
                    size={32}
                    style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                  />
                  <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                    No preview content yet. Ad creatives and the landing page will appear here once
                    generated.
                  </p>
                </div>
              )}
            {canRegenerate && ad.status === "draft" && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Layers
                  size={32}
                  style={{ color: "var(--color-card-border)", margin: "0 auto 12px" }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  A <strong style={{ color: "var(--color-input-text)" }}>strategy</strong> must be
                  generated before creatives can be produced.
                </p>
              </div>
            )}
          </div>
    </>
  );
}
