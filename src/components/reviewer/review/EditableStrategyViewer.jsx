import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  CheckCircle2,
  Eye,
  List,
  Loader2,
  Megaphone,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { adsAPI } from "../../../services/api";
import { InlineField, StrategySection, Tag, getNestedValue } from "./primitives";
import { QuantKpiChart } from "./charts";

// ─── Editable strategy viewer (reviewer-only) ─────────────────────────────────
//
// Fields in executive_summary, target_audience, and messaging are editable inline.
// Each collapsible section has a "Save Changes" button that activates when its
// fields are dirty. Saving calls adsAPI.minorEditStrategy per changed field and
// logs each change to the audit trail.

function EditableStrategyViewer({ strategy, adId, onSaved }) {
  const [s, setS] = useState(strategy ?? {});
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState({});
  const [saveErr, setSaveErr] = useState({});
  const [saveOk, setSaveOk] = useState({});
  const [openSection, setOpenSection] = useState(null);
  const [expandedContentRow, setExpandedContentRow] = useState(null);
  const toggle = (key) => setOpenSection((prev) => (prev === key ? null : key));

  // NOTE: hooks must precede the early return below (react-hooks/rules-of-hooks).
  useEffect(() => {
    setS(strategy ?? {});
    setDirty({});
    setSaveOk({});
  }, [strategy]);

  if (strategy?.parse_error)
    return (
      <p style={{ fontSize: 13, color: "#ef4444" }}>
        AI generation failed — ask the Study Coordinator to retry generation.
      </p>
    );

  // Handles both old string KPIs (field=null) and new structured KPIs (field = "metric"|"target"|"context")
  const updateKpi = (index, fieldOrValue, value) => {
    const newKpis = [...(s.kpis ?? [])];
    if (value !== undefined) {
      // structured update: updateKpi(i, "metric", newVal)
      const cur = newKpis[index];
      newKpis[index] =
        typeof cur === "object" ? { ...cur, [fieldOrValue]: value } : { [fieldOrValue]: value };
    } else {
      // legacy string update: updateKpi(i, newVal)
      newKpis[index] = fieldOrValue;
    }
    setS((prev) => ({ ...prev, kpis: newKpis }));
    setDirty((prev) => ({
      ...prev,
      kpis: { kpis: { old: JSON.stringify(strategy?.kpis ?? []), new: JSON.stringify(newKpis) } },
    }));
    setSaveOk((prev) => ({ ...prev, kpis: false }));
  };

  const updateContentItem = (index, field, value) => {
    const newPlan = (s.content_plan ?? []).map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setS((prev) => ({ ...prev, content_plan: newPlan }));
    setDirty((prev) => ({
      ...prev,
      content: {
        content_plan: {
          old: JSON.stringify(strategy?.content_plan ?? []),
          new: JSON.stringify(newPlan),
        },
      },
    }));
    setSaveOk((prev) => ({ ...prev, content: false }));
  };

  const update = (path, value, sectionKey) => {
    setS((prev) => {
      const parts = path.split(".");
      if (parts.length === 1) return { ...prev, [parts[0]]: value };
      return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
    });
    setDirty((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] ?? {}),
        [path]: { old: String(getNestedValue(strategy, path)), new: value },
      },
    }));
    setSaveOk((prev) => ({ ...prev, [sectionKey]: false }));
  };

  const isSectionDirty = (sectionKey) => {
    const fields = dirty[sectionKey] ?? {};
    return Object.values(fields).some((v) => v.new !== v.old);
  };

  const saveSection = async (sectionKey) => {
    const fields = dirty[sectionKey] ?? {};
    const changed = Object.entries(fields).filter(([, v]) => v.new !== v.old);
    if (!changed.length) return;
    setSaving((p) => ({ ...p, [sectionKey]: true }));
    setSaveErr((p) => ({ ...p, [sectionKey]: null }));
    try {
      for (const [field, { old: oldVal, new: newVal }] of changed) {
        await adsAPI.minorEditStrategy(adId, { field, old_value: oldVal, new_value: newVal });
      }
      setDirty((p) => ({ ...p, [sectionKey]: {} }));
      setSaveOk((p) => ({ ...p, [sectionKey]: true }));
      if (onSaved) onSaved();
    } catch (err) {
      setSaveErr((p) => ({ ...p, [sectionKey]: err.message || "Failed to save." }));
    } finally {
      setSaving((p) => ({ ...p, [sectionKey]: false }));
    }
  };

  function SaveBar({ sectionKey }) {
    const isDirty = isSectionDirty(sectionKey);
    const isSaving = saving[sectionKey];
    const err = saveErr[sectionKey];
    const ok = saveOk[sectionKey];
    if (!isDirty && !err && !ok) return null;
    return (
      <div
        style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
      >
        {isDirty && (
          <button
            onClick={() => saveSection(sectionKey)}
            disabled={isSaving}
            className="btn--accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.78rem",
              padding: "6px 14px",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <CheckCircle2 size={12} />
            )}
            {isSaving ? "Saving…" : "Save Changes"}
          </button>
        )}
        {err && <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{err}</p>}
        {ok && !isDirty && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCircle size={12} /> Saved · recorded in audit trail
          </span>
        )}
      </div>
    );
  }

  if (!strategy)
    return (
      <p style={{ fontSize: 13, color: "var(--color-sidebar-text)" }}>No strategy generated yet.</p>
    );

  return (
    <div>
      {/* Subtle hint */}
      <p
        style={{
          fontSize: "0.72rem",
          color: "var(--color-sidebar-text)",
          marginBottom: 14,
          fontStyle: "italic",
        }}
      >
        Click any text to edit inline — a Save button appears when you make changes.
      </p>

      <StrategySection
        icon={Megaphone}
        title="Executive Summary"
        isOpen={openSection === "summary"}
        onToggle={() => toggle("summary")}
      >
        <InlineField
          value={s.executive_summary ?? ""}
          onChange={(v) => update("executive_summary", v, "summary")}
          placeholder="Executive summary…"
        />
        <SaveBar sectionKey="summary" />
      </StrategySection>

      {s.target_audience && (
        <StrategySection
          icon={Users}
          title="Target Audience"
          isOpen={openSection === "audience"}
          onToggle={() => toggle("audience")}
        >
          {[
            ["PRIMARY", "target_audience.primary"],
            ["SECONDARY", "target_audience.secondary"],
            ["DEMOGRAPHICS", "target_audience.demographics"],
          ]
            .filter(([, path]) => getNestedValue(s, path))
            .map(([label, path]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                    color: "var(--color-sidebar-text)",
                  }}
                >
                  {label}
                </p>
                <InlineField
                  value={String(getNestedValue(s, path))}
                  onChange={(v) => update(path, v, "audience")}
                />
              </div>
            ))}
          <SaveBar sectionKey="audience" />
        </StrategySection>
      )}

      {s.messaging && (
        <StrategySection
          icon={MessageSquare}
          title="Messaging"
          isOpen={openSection === "messaging"}
          onToggle={() => toggle("messaging")}
        >
          {s.messaging.core_message !== undefined && (
            <div
              style={{
                background: "var(--color-primary-light, #dcfce7)",
                borderLeft: "3px solid var(--color-primary, #166534)",
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 14,
              }}
            >
              <InlineField
                value={s.messaging.core_message ?? ""}
                onChange={(v) => update("messaging.core_message", v, "messaging")}
                placeholder="Core message…"
                extraStyle={{
                  fontStyle: "italic",
                  color: "var(--color-primary, #166534)",
                  fontWeight: 500,
                }}
              />
            </div>
          )}
          {s.messaging.tone !== undefined && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                  color: "var(--color-sidebar-text)",
                }}
              >
                TONE
              </p>
              <InlineField
                value={s.messaging.tone ?? ""}
                onChange={(v) => update("messaging.tone", v, "messaging")}
                multiline={false}
              />
            </div>
          )}
          {s.messaging.key_differentiators?.length > 0 && (
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                  color: "var(--color-sidebar-text)",
                }}
              >
                KEY DIFFERENTIATORS
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {s.messaging.key_differentiators.map((d, i) => (
                  <li key={i} style={{ color: "var(--color-input-text)", lineHeight: 1.6 }}>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SaveBar sectionKey="messaging" />
        </StrategySection>
      )}

      {s.content_plan?.length > 0 && (
        <StrategySection
          icon={List}
          title={`Content Plan (${s.content_plan.length} items)`}
          isOpen={openSection === "content"}
          onToggle={() => toggle("content")}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr>
                  {[
                    ["Channel", "22%"],
                    ["Format", "30%"],
                    ["Frequency", "22%"],
                    ["Example", "80px"],
                  ].map(([col, w]) => (
                    <th
                      key={col}
                      style={{
                        padding: "6px 12px",
                        textAlign: "left",
                        width: w,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--color-sidebar-text)",
                        borderBottom: "1px solid var(--color-card-border)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.content_plan.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? "transparent"
                            : "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.03)",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom:
                            expandedContentRow === i
                              ? "none"
                              : "1px solid var(--color-card-border)",
                          verticalAlign: "middle",
                        }}
                      >
                        <Tag>{item.channel}</Tag>
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom:
                            expandedContentRow === i
                              ? "none"
                              : "1px solid var(--color-card-border)",
                          verticalAlign: "middle",
                        }}
                      >
                        <InlineField
                          value={item.format ?? ""}
                          onChange={(v) => updateContentItem(i, "format", v)}
                          multiline={false}
                          placeholder="Format…"
                          extraStyle={{ fontSize: "0.78rem" }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom:
                            expandedContentRow === i
                              ? "none"
                              : "1px solid var(--color-card-border)",
                          verticalAlign: "middle",
                        }}
                      >
                        <InlineField
                          value={item.frequency ?? ""}
                          onChange={(v) => updateContentItem(i, "frequency", v)}
                          multiline={false}
                          placeholder="Frequency…"
                          extraStyle={{ fontSize: "0.78rem" }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          borderBottom:
                            expandedContentRow === i
                              ? "none"
                              : "1px solid var(--color-card-border)",
                          verticalAlign: "middle",
                        }}
                      >
                        {item.example !== undefined && (
                          <button
                            onClick={() =>
                              setExpandedContentRow(expandedContentRow === i ? null : i)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--color-accent)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            <Eye size={11} />
                            {expandedContentRow === i ? "Hide" : "Edit"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedContentRow === i && (
                      <tr
                        style={{
                          backgroundColor:
                            "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.04)",
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{
                            padding: "10px 14px 14px",
                            borderBottom: "1px solid var(--color-card-border)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "var(--color-sidebar-text)",
                              marginBottom: 6,
                            }}
                          >
                            Example
                          </p>
                          <InlineField
                            value={item.example ?? ""}
                            onChange={(v) => updateContentItem(i, "example", v)}
                            placeholder="Example content…"
                            extraStyle={{ fontSize: "0.82rem", lineHeight: 1.6 }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <SaveBar sectionKey="content" />
        </StrategySection>
      )}

      {s.kpis?.length > 0 && (
        <StrategySection
          icon={TrendingUp}
          title={`KPIs (${s.kpis.length})`}
          isOpen={openSection === "kpis"}
          onToggle={() => toggle("kpis")}
        >
          <QuantKpiChart
            kpis={s.kpis}
            editable
            onUpdate={(idx, field, value) => updateKpi(idx, field, value)}
          />
          <SaveBar sectionKey="kpis" />
        </StrategySection>
      )}
    </div>
  );
}

export default EditableStrategyViewer;
