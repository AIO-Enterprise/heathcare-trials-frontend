import React, { useState } from "react";
import { Eye, List, Megaphone, MessageSquare, TrendingUp, Users } from "lucide-react";
import { StrategySection } from "./primitives";
import { QuantKpiChart } from "./charts";

function StrategyViewer({ strategy }) {
  const [openSection, setOpenSection] = useState(null);
  const toggle = (key) => setOpenSection((prev) => (prev === key ? null : key));

  if (!strategy)
    return (
      <p style={{ fontSize: 13, color: "var(--color-sidebar-text)" }}>No strategy generated yet.</p>
    );
  if (strategy.parse_error)
    return (
      <p style={{ fontSize: 13, color: "#ef4444" }}>
        AI generation failed — ask the Study Coordinator to retry generation.
      </p>
    );
  const s = strategy;
  return (
    <div>
      <StrategySection
        icon={Megaphone}
        title="Executive Summary"
        isOpen={openSection === "summary"}
        onToggle={() => toggle("summary")}
      >
        <p style={{ color: "var(--color-input-text)", lineHeight: 1.7 }}>{s.executive_summary}</p>
      </StrategySection>

      {s.target_audience && (
        <StrategySection
          icon={Users}
          title="Target Audience"
          isOpen={openSection === "audience"}
          onToggle={() => toggle("audience")}
        >
          {[
            ["PRIMARY", s.target_audience.primary],
            ["SECONDARY", s.target_audience.secondary],
            ["DEMOGRAPHICS", s.target_audience.demographics],
          ]
            .filter(([, v]) => v)
            .map(([label, text]) => (
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
                <p style={{ color: "var(--color-input-text)", lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
        </StrategySection>
      )}

      {s.messaging && (
        <StrategySection
          icon={MessageSquare}
          title="Messaging"
          isOpen={openSection === "messaging"}
          onToggle={() => toggle("messaging")}
        >
          {s.messaging.core_message && (
            <div
              style={{
                background: "var(--color-primary-light, #dcfce7)",
                borderLeft: "3px solid var(--color-primary, #166534)",
                padding: "12px 16px",
                borderRadius: 6,
                marginBottom: 14,
                fontStyle: "italic",
                color: "var(--color-primary, #166534)",
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              "{s.messaging.core_message}"
            </div>
          )}
          {s.messaging.tone && (
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
              <p style={{ color: "var(--color-input-text)", lineHeight: 1.6 }}>
                {s.messaging.tone}
              </p>
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
        </StrategySection>
      )}

      {s.content_plan?.length > 0 && (
        <StrategySection
          icon={List}
          title={`Content Plan (${s.content_plan.length} items)`}
          isOpen={openSection === "content"}
          onToggle={() => toggle("content")}
        >
          <ContentPlanTable items={s.content_plan} />
        </StrategySection>
      )}

      {s.kpis?.length > 0 && (
        <StrategySection
          icon={TrendingUp}
          title={`KPIs (${s.kpis.length})`}
          isOpen={openSection === "kpis"}
          onToggle={() => toggle("kpis")}
        >
          <QuantKpiChart kpis={s.kpis} />
        </StrategySection>
      )}
    </div>
  );
}

// ─── Content plan table (mirrors admin StrategyViewer) ────────────────────────

function ContentPlanTable({ items }) {
  const rows = Array.isArray(items) ? items : Object.values(items);
  const [expandedRow, setExpandedRow] = useState(null);
  if (!rows.length) return null;

  const PREFERRED_ORDER = ["channel", "format", "frequency", "example"];
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const cols = [
    ...PREFERRED_ORDER.filter((k) => allKeys.includes(k)),
    ...allKeys.filter((k) => !PREFERRED_ORDER.includes(k)),
  ];
  const mainCols = cols.filter((k) => k !== "example");
  const COL_WIDTHS = { channel: "22%", format: "30%", frequency: "22%" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
        <thead>
          <tr>
            {mainCols.map((col) => (
              <th
                key={col}
                style={{
                  padding: "6px 12px",
                  textAlign: "left",
                  width: COL_WIDTHS[col],
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-sidebar-text)",
                  borderBottom: "1px solid var(--color-card-border)",
                  whiteSpace: "nowrap",
                }}
              >
                {col.replace(/_/g, " ")}
              </th>
            ))}
            {cols.includes("example") && (
              <th
                style={{
                  padding: "6px 12px",
                  textAlign: "left",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-sidebar-text)",
                  borderBottom: "1px solid var(--color-card-border)",
                  whiteSpace: "nowrap",
                  width: "80px",
                }}
              >
                Example
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              <tr
                style={{
                  backgroundColor:
                    i % 2 === 0
                      ? "transparent"
                      : "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.03)",
                }}
              >
                {mainCols.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: "8px 12px",
                      color: "var(--color-input-text)",
                      borderBottom:
                        expandedRow === i ? "none" : "1px solid var(--color-card-border)",
                      verticalAlign: "top",
                      lineHeight: 1.5,
                    }}
                  >
                    {String(row[col] ?? "")}
                  </td>
                ))}
                {cols.includes("example") && (
                  <td
                    style={{
                      padding: "8px 12px",
                      borderBottom:
                        expandedRow === i ? "none" : "1px solid var(--color-card-border)",
                      verticalAlign: "top",
                    }}
                  >
                    {row.example && (
                      <button
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--color-accent)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                        }}
                      >
                        <Eye size={11} />
                        {expandedRow === i ? "Hide" : "View"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
              {expandedRow === i && row.example && (
                <tr
                  style={{
                    backgroundColor:
                      "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.04)",
                  }}
                >
                  <td
                    colSpan={mainCols.length + 1}
                    style={{
                      padding: "10px 12px 12px",
                      borderBottom: "1px solid var(--color-card-border)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--color-sidebar-text)",
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      {row.example}
                    </p>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { StrategyViewer, ContentPlanTable };
export default StrategyViewer;
