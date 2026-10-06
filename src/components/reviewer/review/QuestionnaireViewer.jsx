import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle, Loader2, Send, Sparkles } from "lucide-react";
import { adsAPI } from "../../../services/api";
import { InlineProgress, useGenerateProgress } from "./useGenerateProgress";

const QUESTION_TYPE_LABELS = {
  text: "Short Text",
  textarea: "Long Text",
  yes_no: "Yes / No",
  multiple_choice: "Multiple Choice",
  scale: "Scale (1–5)",
};
// ─── Questionnaire viewer (read-only) ─────────────────────────────────────────

function QuestionnaireViewer({ questionnaire, adId, onGenerated, role }) {
  const saved = questionnaire?.questions ?? [];
  const [questions, setQuestions] = useState(saved);
  const [dirty, setDirty] = useState(false);
  const qProgress = useGenerateProgress();
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [rewriteStates, setRewriteStates] = useState({});

  const isPM = role === "project_manager" || role === "super_user";

  useEffect(() => {
    setQuestions(questionnaire?.questions ?? []);
    setDirty(false);
  }, [questionnaire]);

  const updateText = (id, text) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));
    setDirty(true);
    setSaveOk(false);
  };

  const updateOption = (id, oi, val) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, options: q.options.map((o, i) => (i === oi ? val : o)) } : q,
      ),
    );
    setDirty(true);
    setSaveOk(false);
  };

  const setCorrectOption = (id, oi) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, correct_option: q.correct_option === oi ? null : oi } : q,
      ),
    );
    setDirty(true);
    setSaveOk(false);
  };

  const saveEdits = async () => {
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);
    try {
      await adsAPI.updateQuestionnaire(adId, { questions });
      setSaveOk(true);
      setDirty(false);
      if (onGenerated) onGenerated();
    } catch (err) {
      setSaveErr(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const generateWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    qProgress.start("Generating questions…", 15000);
    try {
      await adsAPI.generateQuestionnaire(adId);
      qProgress.complete();
      if (onGenerated) onGenerated();
    } catch (err) {
      qProgress.fail();
      setAiError(err.message || "AI generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleRewrite = (qId) =>
    setRewriteStates((prev) => ({
      ...prev,
      [qId]: {
        open: !prev[qId]?.open,
        prompt: prev[qId]?.prompt ?? "",
        loading: false,
        error: null,
      },
    }));

  const setRewritePrompt = (qId, val) =>
    setRewriteStates((prev) => ({ ...prev, [qId]: { ...prev[qId], prompt: val } }));

  const submitRewrite = async (q) => {
    const state = rewriteStates[q.id] ?? {};
    if (!state.prompt?.trim()) return;
    setRewriteStates((prev) => ({
      ...prev,
      [q.id]: { ...prev[q.id], loading: true, error: null },
    }));
    try {
      const res = await adsAPI.rewriteQuestion(adId, q, state.prompt.trim());
      const updated = res.question;
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...updated, id: q.id } : item)),
      );
      setRewriteStates((prev) => ({
        ...prev,
        [q.id]: { open: false, prompt: "", loading: false, error: null },
      }));
      setDirty(true);
    } catch (err) {
      setRewriteStates((prev) => ({
        ...prev,
        [q.id]: { ...prev[q.id], loading: false, error: err.message || "Rewrite failed." },
      }));
    }
  };

  const inputBase = {
    width: "100%",
    padding: "6px 10px",
    borderRadius: "7px",
    fontSize: "0.83rem",
    border: "1.5px solid var(--color-input-border)",
    backgroundColor: "var(--color-input-bg)",
    color: "var(--color-input-text)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Top action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* AI regenerate — PM only */}
        {isPM && (
          <button
            onClick={generateWithAI}
            disabled={aiLoading || saving}
            className="btn--accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              opacity: aiLoading || saving ? 0.7 : 1,
            }}
          >
            {aiLoading ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sparkles size={13} />
            )}
            {aiLoading
              ? "Generating…"
              : questions.length
                ? "Regenerate Questions"
                : "Generate Questions"}
          </button>
        )}
        {isPM && <InlineProgress progress={qProgress.progress} />}

        {dirty && (
          <button
            onClick={saveEdits}
            disabled={saving}
            className="btn--accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={13} />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        )}

        {saveOk && !dirty && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CheckCircle size={12} /> Saved
          </span>
        )}
      </div>

      {(aiError || saveErr) && (
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
          <p style={{ fontSize: "0.82rem", color: "#ef4444" }}>{aiError || saveErr}</p>
        </div>
      )}

      {!questions.length && !aiLoading && (
        <p style={{ fontSize: "0.82rem", color: "var(--color-sidebar-text)", fontStyle: "italic" }}>
          No questions yet{isPM ? ' — click "Generate Questions" above' : ""}.
        </p>
      )}

      {questions.map((q, qi) => {
        const rw = rewriteStates[q.id] ?? {};
        return (
          <div
            key={q.id ?? qi}
            style={{
              borderRadius: "10px",
              border: "1.5px solid var(--color-input-border)",
              backgroundColor: "var(--color-card-bg)",
              overflow: "hidden",
            }}
          >
            {/* Question header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 14px",
                borderBottom: "1px solid var(--color-card-border)",
                backgroundColor: "var(--color-page-bg)",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--color-sidebar-text)",
                  flexShrink: 0,
                }}
              >
                Q{qi + 1}
              </span>
              <input
                style={{
                  ...inputBase,
                  flex: 1,
                  fontWeight: 600,
                  backgroundColor: "transparent",
                  border: "1px solid transparent",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  transition: "border-color 0.15s",
                }}
                value={q.text}
                onChange={(e) => updateText(q.id, e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "transparent")}
                placeholder="Question text…"
              />
              {/* AI rewrite button — PM only */}
              {isPM && (
                <button
                  onClick={() => toggleRewrite(q.id)}
                  title="Rewrite this question with AI"
                  style={{
                    flexShrink: 0,
                    background: rw.open ? "var(--color-accent-subtle)" : "none",
                    border: `1.5px solid ${rw.open ? "var(--color-accent)" : "var(--color-card-border)"}`,
                    borderRadius: "7px",
                    padding: "5px 9px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: rw.open ? "var(--color-accent)" : "var(--color-sidebar-text)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <Sparkles
                    size={13}
                    style={{ color: rw.open ? "var(--color-accent)" : "#6b7280" }}
                  />
                </button>
              )}
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-sidebar-text)",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                {q.required && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
              </span>
            </div>

            {/* Per-question AI rewrite panel — PM only */}
            {isPM && rw.open && (
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--color-card-border)",
                  backgroundColor:
                    "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  Rewrite instruction
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ ...inputBase, flex: 1 }}
                    value={rw.prompt ?? ""}
                    onChange={(e) => setRewritePrompt(q.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !rw.loading && submitRewrite(q)}
                    placeholder="e.g. focus on age eligibility, make it about prior medical history…"
                    disabled={rw.loading}
                    autoFocus
                  />
                  <button
                    onClick={() => submitRewrite(q)}
                    disabled={rw.loading || !rw.prompt?.trim()}
                    className="btn--accent"
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 14px",
                      opacity: rw.loading || !rw.prompt?.trim() ? 0.6 : 1,
                    }}
                  >
                    {rw.loading ? (
                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {rw.loading ? "Rewriting…" : "Rewrite"}
                  </button>
                </div>
                {rw.error && (
                  <p style={{ fontSize: "0.75rem", color: "#ef4444", margin: 0 }}>{rw.error}</p>
                )}
              </div>
            )}

            {/* Answer area */}
            <div style={{ padding: "10px 14px" }}>
              {q.type === "multiple_choice" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {(q.options ?? []).map((opt, oi) => {
                    const isCorrect = q.correct_option === oi;
                    return (
                      <div key={oi} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Correct-option tick */}
                        <button
                          type="button"
                          title={
                            isCorrect ? "Correct answer (click to unset)" : "Mark as correct answer"
                          }
                          onClick={() => setCorrectOption(q.id, oi)}
                          style={{
                            flexShrink: 0,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `1.5px solid ${isCorrect ? "#22c55e" : "var(--color-card-border)"}`,
                            backgroundColor: isCorrect ? "rgba(34,197,94,0.15)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            padding: 0,
                          }}
                        >
                          {isCorrect && (
                            <Check size={11} strokeWidth={3} style={{ color: "#22c55e" }} />
                          )}
                        </button>
                        <input
                          style={{
                            ...inputBase,
                            flex: 1,
                            borderColor: isCorrect ? "rgba(34,197,94,0.3)" : undefined,
                          }}
                          value={opt}
                          onChange={(e) => updateOption(q.id, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {q.type === "text" && (
                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: "7px",
                    fontSize: "0.82rem",
                    border: "1px solid var(--color-card-border)",
                    backgroundColor: "var(--color-page-bg)",
                    color: "var(--color-sidebar-text)",
                    fontStyle: "italic",
                  }}
                >
                  Short text answer
                </div>
              )}
              {q.type === "textarea" && (
                <div
                  style={{
                    padding: "7px 10px",
                    borderRadius: "7px",
                    fontSize: "0.82rem",
                    border: "1px solid var(--color-card-border)",
                    backgroundColor: "var(--color-page-bg)",
                    color: "var(--color-sidebar-text)",
                    fontStyle: "italic",
                    minHeight: "52px",
                  }}
                >
                  Long text answer
                </div>
              )}
              {q.type === "yes_no" && (
                <div style={{ display: "flex", gap: "10px" }}>
                  {["Yes", "No"].map((opt) => (
                    <span
                      key={opt}
                      style={{
                        padding: "5px 16px",
                        borderRadius: "999px",
                        border: "1px solid var(--color-card-border)",
                        fontSize: "0.8rem",
                        color: "var(--color-sidebar-text)",
                      }}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}
              {q.type === "scale" && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "1px solid var(--color-card-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        color: "var(--color-sidebar-text)",
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { QUESTION_TYPE_LABELS };
export default QuestionnaireViewer;
