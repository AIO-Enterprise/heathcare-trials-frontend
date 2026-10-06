import {
  AlertCircle,
  Layers,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { SectionCard } from "../../shared/Layout";
import ActionButton from "./ActionButton";
import { InlineProgress } from "./GenerateProgress";
import StrategyViewer from "./StrategyViewer";
export default function StrategyTab({
  ad,
  isStudyCoordinator,
  hasStrategy,
  genLoading,
  genError,
  genProgress,
  handleGenerateStrategy,
  handleRegenStrategy,
  canRegenerate,
  regenOpen,
  setRegenOpen,
  regenInstr,
  setRegenInstr,
  regenLoading,
  regenError,
  setRegenError,
  regenConfirmed,
  setRegenConfirmed,
  handleSubmitForReview,
  revLoading,
  revError,
}) {
  return (
    <>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Generate (draft) — Study Coordinator only */}
            {ad.status === "draft" && isStudyCoordinator && (
              <SectionCard
                title="Generate Marketing Strategy"
                subtitle="Analyses your company documents and campaign brief to create a tailored strategy"
              >
                {genError && (
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
                      {genError}
                    </p>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ActionButton
                    onClick={handleGenerateStrategy}
                    loading={genLoading}
                    icon={<Zap size={14} />}
                  >
                    {genLoading ? "Generating…" : "Generate Strategy"}
                  </ActionButton>
                  {genLoading ? (
                    <InlineProgress progress={genProgress.progress} />
                  ) : (
                    <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)" }}>
                      Uses your trained Curator skill · typical time: 15–30 s
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Strategy viewer */}
            {hasStrategy && (
              <SectionCard
                title="Marketing Strategy"
                subtitle="Generated from company and protocol documents"
              >
                {ad.strategy_json ? (
                  <StrategyViewer
                    strategy={ad.strategy_json}
                    ad={ad}
                    onRetry={isStudyCoordinator ? handleGenerateStrategy : undefined}
                  />
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "var(--color-sidebar-text)" }}>
                    Strategy is being generated…
                  </p>
                )}
              </SectionCard>
            )}

            {/* Regenerate — Project Manager and Ethics Manager only */}
            {hasStrategy && canRegenerate && (
              <SectionCard
                title="Regenerate Strategy"
                subtitle="Replace the current strategy using your instructions"
              >
                {!regenOpen ? (
                  <button
                    onClick={() => setRegenOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "none",
                      border: "1px solid var(--color-card-border)",
                      borderRadius: "8px",
                      padding: "7px 14px",
                      cursor: "pointer",
                      color: "var(--color-sidebar-text)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    <Sparkles size={13} style={{ color: "var(--color-accent)" }} />
                    Rewrite Strategy…
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(245,158,11,0.06)",
                        border: "1px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      <Sparkles
                        size={14}
                        style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }}
                      />
                      <p
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-sidebar-text)",
                          lineHeight: 1.5,
                        }}
                      >
                        This will{" "}
                        <strong style={{ color: "var(--color-input-text)" }}>
                          replace the entire strategy
                        </strong>{" "}
                        using your instructions as guidance. The current strategy will be
                        overwritten and the change will appear in the audit trail.
                      </p>
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--color-sidebar-text)",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        Your Instructions *
                      </label>
                      <textarea
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          border: "1px solid var(--color-card-border)",
                          backgroundColor: "var(--color-input-bg)",
                          color: "var(--color-input-text)",
                          outline: "none",
                          boxSizing: "border-box",
                          resize: "vertical",
                          minHeight: "110px",
                          fontFamily: "inherit",
                        }}
                        value={regenInstr}
                        onChange={(e) => setRegenInstr(e.target.value)}
                        placeholder="e.g. Shift focus from social media to B2B channels. Reduce influencer spend to under 10%. Keep the same target audience but adopt a more professional tone."
                      />
                    </div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={regenConfirmed}
                        onChange={(e) => setRegenConfirmed(e.target.checked)}
                        style={{
                          width: 15,
                          height: 15,
                          accentColor: "var(--color-accent)",
                          cursor: "pointer",
                        }}
                      />
                      <span style={{ fontSize: "0.82rem", color: "var(--color-input-text)" }}>
                        I understand the current strategy will be permanently replaced
                      </span>
                    </label>
                    {regenError && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }}
                      >
                        <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                        <p style={{ fontSize: "0.82rem", color: "#ef4444" }}>{regenError}</p>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <ActionButton
                        onClick={handleRegenStrategy}
                        loading={regenLoading}
                        disabled={!regenConfirmed}
                        icon={<Sparkles size={14} />}
                      >
                        {regenLoading ? "Re-writing… (15–30 s)" : "Trigger AI Re-Strategy"}
                      </ActionButton>
                      {regenLoading ? (
                        <InlineProgress progress={genProgress.progress} />
                      ) : (
                        <button
                          onClick={() => {
                            setRegenOpen(false);
                            setRegenError(null);
                            setRegenInstr("");
                            setRegenConfirmed(false);
                          }}
                          className="btn--ghost"
                          style={{ fontSize: "0.8rem" }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Submit for review — Study Coordinator only */}
            {ad.status === "strategy_created" && isStudyCoordinator && (
              <SectionCard
                title="Submit for Review"
                subtitle="The Reviewer AI will analyse the strategy and prepare website requirements and ad specifications"
              >
                {revError && (
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
                      {revError}
                    </p>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ActionButton
                    onClick={handleSubmitForReview}
                    loading={revLoading}
                    variant="primary"
                    icon={<Send size={14} />}
                  >
                    {revLoading ? "Processing…" : "Submit for AI Review"}
                  </ActionButton>
                  {revLoading && <InlineProgress progress={genProgress.progress} />}
                </div>
              </SectionCard>
            )}

            {/* Generating spinner — shown while background task is running */}
            {!hasStrategy && ad.status === "generating" && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: 32,
                    height: 32,
                    border: "3px solid var(--color-card-border)",
                    borderTopColor: "var(--color-accent)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginBottom: 12,
                  }}
                />
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.9rem" }}>
                  Generating strategy… this usually takes 1–2 minutes.
                </p>
              </div>
            )}

            {/* Empty state */}
            {!hasStrategy && ad.status !== "draft" && ad.status !== "generating" && (
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
    </>
  );
}
