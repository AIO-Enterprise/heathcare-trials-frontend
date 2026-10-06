import React, { useEffect, useRef } from "react";
import {
  Bot,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Globe,
  History,
  Image,
  LayoutDashboard,
  Layers,
  Megaphone,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "strategy_created", label: "Strategy Ready" },
  { key: "under_review", label: "Under Review" },
  { key: "ethics_review", label: "Ethics Review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
];

function statusIndex(s) {
  const i = STATUS_STEPS.findIndex((x) => x.key === s);
  return i === -1 ? 0 : i;
}

function StatusTimeline({ status }) {
  const current = statusIndex(status);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}
    >
      {STATUS_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.key}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: done
                    ? "var(--color-accent)"
                    : active
                      ? "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.15)"
                      : "var(--color-card-bg)",
                  border: `2px solid ${done || active ? "var(--color-accent)" : "var(--color-card-border)"}`,
                  transition: "all 0.2s",
                }}
              >
                {done ? (
                  <CheckCircle2 size={13} style={{ color: "#fff" }} />
                ) : (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: active ? "var(--color-accent)" : "var(--color-card-border)",
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                  color: done || active ? "var(--color-input-text)" : "var(--color-sidebar-text)",
                }}
              >
                {step.label}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: 20,
                  backgroundColor: i < current ? "var(--color-accent)" : "var(--color-card-border)",
                  marginBottom: 20,
                  transition: "background-color 0.2s",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const TYPE_ICON = { website: Globe, ads: Image, voicebot: Bot, chatbot: MessageSquare };
function AdTypeChip({ type }) {
  const Icon = TYPE_ICON[type] ?? Megaphone;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 500,
        border: "1px solid var(--color-card-border)",
        backgroundColor: "var(--color-card-bg)",
        color: "var(--color-input-text)",
      }}
    >
      <Icon size={12} style={{ color: "var(--color-accent)" }} />
      {type}
    </span>
  );
}

function Tag({ children }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "var(--color-primary-light, #dcfce7)",
        color: "var(--color-primary, #166534)",
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 500,
        marginRight: 4,
        marginBottom: 4,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 160,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

// ─── Collapsible strategy section (same as ReviewerDashboard) ─────────────────

function StrategySection({ icon: Icon, title, children, isOpen, onToggle }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border, #e5e7eb)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "var(--color-card-bg, #f9fafb)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon size={15} style={{ color: "var(--color-primary, #166534)", flexShrink: 0 }} />
        <span
          style={{ fontSize: 13, fontWeight: 600, color: "var(--color-input-text, #111)", flex: 1 }}
        >
          {title}
        </span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isOpen && (
        <div
          style={{ padding: "14px 16px", background: "var(--color-surface, #fff)", fontSize: 13 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
/** Safely reads a dot-path like "messaging.core_message" from an object */
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, k) => (acc != null ? acc[k] : undefined), obj) ?? "";
}
// ─── Inline editable text field (transparent-border, auto-resize) ──────────────

function InlineField({ value, onChange, multiline = true, placeholder = "", extraStyle = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !multiline) return;
    ref.current.style.height = "auto";
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [value, multiline]);

  const base = {
    width: "100%",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    padding: "3px 6px",
    outline: "none",
    color: "var(--color-input-text)",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.7,
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    ...extraStyle,
  };

  const onFocus = (e) => {
    e.target.style.borderColor = "var(--color-accent)";
  };
  const onBlur = (e) => {
    e.target.style.borderColor = "transparent";
  };

  if (!multiline)
    return (
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={base}
      />
    );

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ ...base, resize: "none", overflow: "hidden" }}
    />
  );
}
// ─── Tab bar used inside the action column ─────────────────────────────────────

const ACTION_TABS = [
  { key: "verdict", label: "Verdict", icon: CheckCircle },
  { key: "restrategy", label: "Re-Strategy", icon: Sparkles },
];

function ActionTabs({ active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--color-card-border)",
        marginBottom: 20,
      }}
    >
      {ACTION_TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: active === key ? 700 : 500,
            color: active === key ? "var(--color-accent)" : "var(--color-sidebar-text)",
            borderBottom:
              active === key ? "2px solid var(--color-accent)" : "2px solid transparent",
            marginBottom: -1,
            transition: "color 0.15s",
          }}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Page-level tab bar ────────────────────────────────────────────────────────

const PAGE_TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "strategy", label: "Strategy", icon: Layers },
  { key: "creatives", label: "Creatives", icon: Image },
  { key: "questionnaire", label: "Questionnaire", icon: ClipboardList },
  { key: "participants", label: "Participants", icon: Users },
  { key: "review", label: "Review", icon: ClipboardCheck },
  { key: "history", label: "History", icon: History },
];

function PageTabBar({ active, onChange, showQuestionnaireDot }) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--color-card-border)",
        marginBottom: 28,
        gap: 0,
        overflowX: "auto",
      }}
    >
      {PAGE_TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        const hasDot = key === "questionnaire" && showQuestionnaireDot;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              position: "relative",
              padding: "11px 18px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "var(--color-accent)" : "var(--color-sidebar-text)",
              borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              marginBottom: -1,
              transition: "color 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Icon size={14} />
            {label}
            {hasDot && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  display: "inline-block",
                  marginLeft: 2,
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
export { STATUS_STEPS, statusIndex, StatusTimeline, TYPE_ICON, AdTypeChip, Tag, StrategySection, getNestedValue, InlineField, ACTION_TABS, ActionTabs, PAGE_TABS, PageTabBar };
