/**
 * Campaign Phase Board
 *
 * Kanban-style view of every campaign grouped by its lifecycle phase. Shown on
 * the Super User dashboard via the Overview / Phase Board toggle. Read-only —
 * click a card to open the full campaign detail.
 *
 * Columns map onto Advertisement.status (AdStatus). Several transient/terminal
 * states are folded into a neighbouring column so the board stays six wide.
 */

import React from "react";
import { CampaignStatusBadge } from "../shared/Layout";

// Phase columns, left → right. Each owns one or more AdStatus values.
const PHASES = [
  { key: "draft", label: "Draft", statuses: ["draft"] },
  { key: "strategy", label: "Strategy", statuses: ["generating", "strategy_created"] },
  { key: "review", label: "Review", statuses: ["under_review"] },
  { key: "ethics", label: "Ethics", statuses: ["ethics_review"] },
  { key: "approved", label: "Approved", statuses: ["approved"] },
  { key: "published", label: "Published", statuses: ["published", "paused", "optimizing"] },
];

function formatBudget(budget) {
  if (budget == null) return null;
  if (budget >= 1000) return `$${Math.round(budget / 1000)}K`;
  return `$${budget.toLocaleString()}`;
}

function audienceLabel(ta) {
  if (!ta || typeof ta !== "object") return "General";
  return ta.age_range || ta.primary || ta.demographics || ta.description || "General";
}

function locationLabel(locs) {
  if (!Array.isArray(locs) || locs.length === 0) return null;
  if (locs.length === 1) {
    const l = locs[0] || {};
    return [l.city, l.country].filter(Boolean).join(", ") || l.name || l.region || "1 region";
  }
  return `${locs.length} regions`;
}

function cardSubtitle(ad) {
  return [audienceLabel(ad.target_audience), locationLabel(ad.trial_location)]
    .filter(Boolean)
    .join(" · ");
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function PhaseCard({ ad, onOpen }) {
  const budget = formatBudget(ad.budget);
  return (
    <button
      onClick={() => onOpen(ad)}
      style={{
        width: "100%",
        minWidth: 0,
        textAlign: "left",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 11,
        borderRadius: 10,
        font: "inherit",
        background: "var(--color-page-bg)",
        border: "1px solid var(--color-card-border)",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-card-border)";
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-input-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ad.title}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            color: "var(--color-sidebar-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cardSubtitle(ad)}
        </p>
      </div>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}
      >
        <CampaignStatusBadge status={ad.status} />
        {budget && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-input-text)",
              flexShrink: 0,
            }}
          >
            {budget}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function PhaseColumn({ label, count, children }) {
  return (
    <div
      style={{
        minWidth: 0,
        background: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: 12,
        padding: "12px 11px 14px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-input-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </h3>
        <span
          style={{
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 5,
            display: "inline-grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-sidebar-text)",
            background: "var(--color-page-bg)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        height: 58,
        borderRadius: 10,
        background: "var(--color-page-bg)",
        border: "1px solid var(--color-card-border)",
        opacity: 0.6,
      }}
    />
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function CampaignPhaseBoard({ ads = [], loading = false, onOpen }) {
  const columns = PHASES.map((p) => ({
    ...p,
    items: ads.filter((a) => p.statuses.includes(a.status)),
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 12,
        alignItems: "start",
      }}
    >
      {columns.map((col) => (
        <PhaseColumn key={col.key} label={col.label} count={loading ? "–" : col.items.length}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            col.items.map((ad) => <PhaseCard key={ad.id} ad={ad} onOpen={onOpen} />)
          )}
        </PhaseColumn>
      ))}
    </div>
  );
}
