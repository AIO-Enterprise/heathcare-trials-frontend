import { DollarSign } from "lucide-react";
import { InlineField } from "./primitives";

// ─── Budget donut chart ────────────────────────────────────────────────────────

const DONUT_PALETTE = [
  "var(--color-accent)",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#0ea5e9",
];

// Detect KPI category from metric name → { label, color } or null
function detectKpiCategory(text) {
  const t = (text ?? "").toLowerCase();
  if (/ctr|click.through|click.rate/.test(t)) return { label: "CTR", color: "#6366f1" };
  if (/cpa|cost.per.acq|cost per acq/.test(t)) return { label: "CPA", color: "#f59e0b" };
  if (/roas|return.on.ad/.test(t)) return { label: "ROAS", color: "#14b8a6" };
  if (/impression|reach|awareness/.test(t)) return { label: "REACH", color: "#8b5cf6" };
  if (/conversion|convert/.test(t)) return { label: "CVR", color: "#ec4899" };
  if (/engag/.test(t)) return { label: "ENG", color: "#f97316" };
  if (/revenue|roi|return on invest/.test(t)) return { label: "ROI", color: "#0ea5e9" };
  if (/bounce/.test(t)) return { label: "BOUNCE", color: "#ef4444" };
  if (/open rate|email/.test(t)) return { label: "EMAIL", color: "#22c55e" };
  if (/lead/.test(t)) return { label: "LEADS", color: "#a78bfa" };
  if (/view|video|watch/.test(t)) return { label: "VIDEO", color: "#fb923c" };
  return null;
}

// Extract a raw numeric value from a target string — used to decide quant vs qual
// and to normalize bar heights. Handles %, $, ×/x, k/m suffixes.
function extractNumber(str) {
  if (!str) return null;
  const s = str.replace(/,/g, "");
  const m = s.match(/(\d+(?:\.\d+)?)\s*([km×x]?)/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const suf = m[2].toLowerCase();
  if (suf === "k") n *= 1000;
  else if (suf === "m") n *= 1_000_000;
  return n;
}

// ─── Bar chart for quantitative KPIs ──────────────────────────────────────────

function QuantKpiChart({ kpis, editable = false, onUpdate }) {
  const normalized = kpis.map((k) =>
    typeof k === "string" ? { metric: k, target: null, context: null } : k,
  );
  const nums = normalized.map((k) => extractNumber(k.target) ?? 0);
  const maxVal = Math.max(...nums, 1);
  const BAR_MAX = 88,
    BAR_MIN = 28;

  return (
    <div>
      {/* Bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          paddingBottom: 0,
          borderBottom: "2px solid var(--color-card-border)",
        }}
      >
        {normalized.map((k, i) => {
          const cat = detectKpiCategory(k.metric);
          const color = cat?.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length];
          const barH = nums[i] === 0 ? BAR_MIN : BAR_MIN + (nums[i] / maxVal) * (BAR_MAX - BAR_MIN);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* Target value above bar */}
              {editable ? (
                <InlineField
                  value={k.target ?? ""}
                  onChange={(v) => onUpdate(i, "target", v)}
                  multiline={false}
                  extraStyle={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color,
                    textAlign: "center",
                    maxWidth: "100%",
                  }}
                  placeholder="Target…"
                />
              ) : (
                <span
                  style={{ fontSize: "0.72rem", fontWeight: 800, color, letterSpacing: "0.02em" }}
                >
                  {k.target}
                </span>
              )}
              {/* Bar */}
              <div
                style={{
                  width: "100%",
                  height: barH,
                  borderRadius: "5px 5px 0 0",
                  background: `linear-gradient(180deg, ${color}dd 0%, ${color}55 100%)`,
                  transition: "height 0.45s ease",
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Metric labels + context below x-axis */}
      <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
        {normalized.map((k, i) => {
          const cat = detectKpiCategory(k.metric);
          const color = cat?.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length];
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              {editable ? (
                <InlineField
                  value={k.metric ?? ""}
                  onChange={(v) => onUpdate(i, "metric", v)}
                  multiline={false}
                  extraStyle={{ fontSize: "0.72rem", fontWeight: 700, color, textAlign: "center" }}
                  placeholder="Metric…"
                />
              ) : (
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color, margin: 0 }}>{k.metric}</p>
              )}
              {editable ? (
                <InlineField
                  value={k.context ?? ""}
                  onChange={(v) => onUpdate(i, "context", v)}
                  multiline={false}
                  extraStyle={{
                    fontSize: "0.6rem",
                    color: "var(--color-sidebar-text)",
                    textAlign: "center",
                  }}
                  placeholder="Context…"
                />
              ) : (
                k.context && (
                  <p
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--color-sidebar-text)",
                      margin: "2px 0 0",
                      lineHeight: 1.3,
                    }}
                  >
                    {k.context}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DonutChart({ slices, size = 150, thickness = 26 }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2,
    cy = size / 2;
  // Cumulative offsets without render-time mutation (react-hooks/immutability).
  const offsets = [];
  slices.reduce((total, s) => {
    offsets.push(total);
    return total + s.pct;
  }, 0);
  return (
    <svg width={size} height={size}>
      {/* track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-card-border)"
        strokeWidth={thickness}
      />
      {slices.map((slice, i) => {
        const arc = (slice.pct / 100) * circ;
        const offset = -(offsets[i] / 100) * circ;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={slice.color}
            strokeWidth={thickness}
            strokeDasharray={`${arc} ${circ}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.4s ease" }}
          />
        );
      })}
    </svg>
  );
}

function BudgetDonut({ strategy }) {
  if (!strategy?.budget_allocation) return null;
  const entries = Object.entries(strategy.budget_allocation);
  if (!entries.length) return null;

  const slices = entries.map(([label, val], i) => ({
    label,
    pct: parseFloat(String(val)) || 0,
    color: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "4px 0" }}>
      {/* Ring */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <DonutChart slices={slices} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <DollarSign size={16} style={{ color: "var(--color-accent)" }} />
        </div>
      </div>
      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: s.color,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                flex: 1,
                fontSize: "0.78rem",
                color: "var(--color-input-text)",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--color-input-text)",
                flexShrink: 0,
                margin: 0,
              }}
            >
              {s.pct}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
export { DONUT_PALETTE, detectKpiCategory, extractNumber, QuantKpiChart, DonutChart, BudgetDonut };
