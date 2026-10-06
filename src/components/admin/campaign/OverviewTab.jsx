import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Globe,
} from "lucide-react";
import { SectionCard } from "../../shared/Layout";
import { adsAPI } from "../../../services/api";
import { VOICE_CATALOGUE } from "../VoicebotPanel";
import { StatusTimeline, AdTypeChip, BudgetDonut } from "./StrategyViewer";
import TrialLocationsCard from "./TrialLocationsCard";
import AdPreviewTabs from "./AdPreviewTabs";
export default function OverviewTab({
  ad,
  setAd,
  id,
  companyLocations,
  protoDocs,
  questEmpty,
  qualifies,
  isStudyCoordinator,
  setPageTab,
  setPreviewDoc,
}) {
  return (
    <>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <SectionCard title="Campaign Progress">
              <StatusTimeline status={ad.status} />
            </SectionCard>

            <SectionCard title="Campaign Details">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "20px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-sidebar-text)",
                      marginBottom: "6px",
                    }}
                  >
                    Campaign Type
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {ad.ad_type?.map((t) => (
                      <AdTypeChip key={t} type={t} />
                    ))}
                  </div>
                </div>
                {(ad.campaign_category || qualifies) && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-sidebar-text)",
                        marginBottom: "6px",
                      }}
                    >
                      Category
                    </p>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        border: "1px solid var(--color-card-border)",
                        backgroundColor: "var(--color-card-bg)",
                        color: "var(--color-input-text)",
                        textTransform: "capitalize",
                      }}
                    >
                      <ClipboardList size={11} style={{ color: "var(--color-accent)" }} />
                      {ad.campaign_category
                        ? ad.campaign_category.replace("_", " ")
                        : "hiring / recruitment"}
                    </span>
                  </div>
                )}
                {ad.target_audience && Object.values(ad.target_audience).some(Boolean) && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-sidebar-text)",
                        marginBottom: "6px",
                      }}
                    >
                      Target Audience
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {ad.target_audience.age_range && (
                        <p style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                          Age: {ad.target_audience.age_range}
                        </p>
                      )}
                      {ad.target_audience.gender && (
                        <p style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                          Gender: {ad.target_audience.gender}
                        </p>
                      )}
                      {ad.target_audience.interests && (
                        <p style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                          Interests: {ad.target_audience.interests}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {ad.patients_required && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-sidebar-text)",
                        marginBottom: "6px",
                      }}
                    >
                      Patients Required
                    </p>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--color-input-text)",
                        fontWeight: 600,
                      }}
                    >
                      {ad.patients_required.toLocaleString()} patients
                    </p>
                  </div>
                )}
                {(ad.trial_start_date || ad.trial_end_date) && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-sidebar-text)",
                        marginBottom: "6px",
                      }}
                    >
                      Trial Period
                    </p>
                    {ad.trial_start_date && (
                      <p style={{ fontSize: "0.8rem", color: "var(--color-input-text)" }}>
                        <span style={{ fontWeight: 600 }}>Start:</span>{" "}
                        {new Date(ad.trial_start_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {ad.trial_end_date && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-input-text)",
                          marginTop: "2px",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>End:</span>{" "}
                        {new Date(ad.trial_end_date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {ad.duration && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-sidebar-text)",
                          marginTop: "4px",
                        }}
                      >
                        {ad.duration.split("(")[0].trim()}
                      </p>
                    )}
                  </div>
                )}
                {ad.trial_location?.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--color-sidebar-text)",
                        marginBottom: "6px",
                      }}
                    >
                      Trial Locations
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {ad.trial_location.map((loc, i) => (
                        <p
                          key={i}
                          style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}
                        >
                          {[loc.city, loc.country].filter(Boolean).join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Voicebot Info — read-only, voicebot campaigns only */}
            {ad.ad_type?.includes("voicebot") &&
              (() => {
                const cfg = ad.bot_config || {};
                const isProvisioned = !!cfg.elevenlabs_agent_id;
                const voiceName =
                  VOICE_CATALOGUE.find((v) => v.id === cfg.voice_id)?.name || cfg.voice_id || "—";
                const convStyleLabel = cfg.conversation_style
                  ? cfg.conversation_style.charAt(0).toUpperCase() + cfg.conversation_style.slice(1)
                  : "—";
                return (
                  <SectionCard
                    title="Voice Agent"
                    subtitle="Voicebot configuration for this campaign"
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {[
                        {
                          label: "Agent Status",
                          value: isProvisioned ? "Provisioned" : "Not provisioned",
                          accent: isProvisioned,
                        },
                        { label: "Agent Name", value: cfg.bot_name || "—" },
                        { label: "Voice", value: voiceName },
                        { label: "Conversation Style", value: convStyleLabel },
                        { label: "Language", value: cfg.language || "en" },
                        { label: "Phone Number", value: cfg.voice_phone_number || "—" },
                      ].map(({ label, value, accent }) => (
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
                              color: accent ? "#22c55e" : "var(--color-input-text)",
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {cfg.first_message && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: "10px 14px",
                          borderRadius: 8,
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
                          Opening Message
                        </p>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-input-text)",
                            fontStyle: "italic",
                          }}
                        >
                          &ldquo;{cfg.first_message}&rdquo;
                        </p>
                      </div>
                    )}
                  </SectionCard>
                );
              })()}

            {/* Trial Locations — study_coordinator (and Super User owner) only */}
            {isStudyCoordinator && (
              <TrialLocationsCard
                ad={ad}
                companyLocations={companyLocations}
                onSave={(updated) => setAd(updated)}
              />
            )}

            {/* Protocol Docs + Budget Distribution — 2-col when both exist */}
            {(() => {
              const hasBudget = !!(
                ad.strategy_json?.budget_allocation &&
                Object.keys(ad.strategy_json.budget_allocation).length > 0
              );
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: hasBudget ? "1fr 1fr" : "1fr",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <SectionCard
                    title="Protocol Documents"
                    subtitle={
                      protoDocs.length === 0
                        ? "No documents attached"
                        : `${protoDocs.length} document${protoDocs.length > 1 ? "s" : ""} attached`
                    }
                  >
                    {protoDocs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <FileText
                          size={28}
                          style={{
                            color: "var(--color-sidebar-text)",
                            margin: "0 auto 8px",
                            opacity: 0.5,
                          }}
                        />
                        <p style={{ fontSize: "0.82rem", color: "var(--color-sidebar-text)" }}>
                          No protocol documents were uploaded for this campaign.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {protoDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => doc.file_path && setPreviewDoc(doc)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 14px",
                              borderRadius: "8px",
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
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                flexShrink: 0,
                                backgroundColor:
                                  "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <FileText size={14} style={{ color: "var(--color-accent)" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                  color: "var(--color-input-text)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {doc.title}
                              </p>
                              <p
                                style={{ fontSize: "0.72rem", color: "var(--color-sidebar-text)" }}
                              >
                                {doc.doc_type?.replace(/_/g, " ")}
                                {doc.file_path && ` · ${doc.file_path.split("/").pop()}`}
                              </p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexShrink: 0,
                              }}
                            >
                              {doc.priority && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    backgroundColor:
                                      "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.1)",
                                    color: "var(--color-accent)",
                                    border:
                                      "1px solid rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.2)",
                                  }}
                                >
                                  Priority {doc.priority}
                                </span>
                              )}
                              {doc.file_path && (
                                <Eye size={13} style={{ color: "var(--color-sidebar-text)" }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                  {hasBudget && (
                    <SectionCard title="Budget Distribution">
                      <BudgetDonut strategy={ad.strategy_json} />
                    </SectionCard>
                  )}
                </div>
              );
            })()}

            {/* Questionnaire callout */}
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
                      ? "No questions yet — click to set up"
                      : `${ad.questionnaire.questions.length} question${ad.questionnaire.questions.length !== 1 ? "s" : ""} ready`}
                  </p>
                </div>
                <ArrowLeft
                  size={14}
                  style={{ color: "var(--color-sidebar-text)", transform: "rotate(180deg)" }}
                />
              </div>
            )}

            {/* Generated Assets preview — shown to all roles whenever content exists */}
            {(ad.output_url || ad.output_files?.length > 0) && (
              <SectionCard
                title="Generated Assets"
                subtitle="Preview content produced for this campaign"
              >
                {ad.output_url && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      marginBottom: ad.output_files?.length > 0 ? "16px" : 0,
                      border: "1px solid rgba(16,185,129,0.3)",
                      backgroundColor: "rgba(16,185,129,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Globe size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
                      <div>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--color-input-text)",
                          }}
                        >
                          Landing Page
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
                        href={adsAPI.websitePreviewUrl(id)}
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
                        href={adsAPI.websiteDownloadUrl(id)}
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
                    </div>
                  </div>
                )}
                {(ad.output_files?.length > 0 || ad.shorts_files?.length > 0) && (
                  <AdPreviewTabs ad={ad} />
                )}
              </SectionCard>
            )}
          </div>
    </>
  );
}
