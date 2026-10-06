import React, { useState, useEffect, useRef, useCallback } from "react";
import { SectionCard } from "../shared/Layout";
import { smsAPI } from "../../services/api";
import {
  MessageSquare,
  Send,
  Upload,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Info,
  History,
} from "lucide-react";

function ActionButton({ onClick, loading, disabled, variant = "accent", icon, children }) {
  const cls =
    variant === "ghost" ? "btn--ghost" : variant === "primary" ? "btn--primary" : "btn--accent";
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cls}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      {children}
    </button>
  );
}

const STATUS_COLORS = {
  running: "#22c55e",
  queued: "#f59e0b",
  paused: "#f59e0b",
  done: "#3b82f6",
  cancelled: "#6b7280",
  failed: "#ef4444",
  sent: "#22c55e",
  pending: "#6b7280",
};

function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: "0.72rem",
        fontWeight: 600,
        textTransform: "capitalize",
        color,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  width: "100%",
  border: "1px solid var(--color-card-border)",
  backgroundColor: "var(--color-input-bg)",
  color: "var(--color-input-text)",
  fontSize: "0.82rem",
  outline: "none",
};
const labelStyle = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-sidebar-text)",
  marginBottom: 6,
};
const errorBox = {
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 7,
  fontSize: "0.78rem",
  color: "#ef4444",
  backgroundColor: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.2)",
};

export default function SmsPanel({ ad, adId, canEdit }) {
  // ── Provider status (dev vs live) ────────────────────────────────────────────
  const [status, setStatus] = useState(null);

  // ── Single send ────────────────────────────────────────────────────────────
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("");
  const [asWhatsapp, setAsWhatsapp] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendDone, setSendDone] = useState(false);

  // ── Activity log ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);

  // ── Campaign create ──────────────────────────────────────────────────────────
  const [cName, setCName] = useState("");
  const [cBody, setCBody] = useState("Hi {name}, ...");
  const [cPerMin, setCPerMin] = useState(60);
  const [cFile, setCFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);

  // ── Campaign list ──────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [recordsMap, setRecordsMap] = useState({});

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await smsAPI.listCampaigns(adId);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch {
      /* keep previous list on transient failures */
    } finally {
      setListLoading(false);
    }
  }, [adId]);

  const loadMessages = useCallback(async () => {
    try {
      const data = await smsAPI.listMessages(adId, 50);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      /* keep previous on transient failures */
    } finally {
      setMsgLoading(false);
    }
  }, [adId]);

  // Load provider status once.
  useEffect(() => {
    smsAPI
      .status()
      .then(setStatus)
      .catch(() => {});
  }, []);

  // Poll campaigns + activity log every 10s.
  useEffect(() => {
    loadCampaigns();
    loadMessages();
    const id = setInterval(() => {
      loadCampaigns();
      loadMessages();
    }, 10000);
    return () => clearInterval(id);
  }, [loadCampaigns, loadMessages]);

  const handleSend = async () => {
    setSendLoading(true);
    setSendError(null);
    setSendDone(false);
    try {
      await smsAPI.sendOne({ to: to.trim(), body: msg, as_whatsapp: asWhatsapp });
      setSendDone(true);
      setMsg("");
      loadMessages();
    } catch (e) {
      setSendError(e.message);
    }
    setSendLoading(false);
  };

  const handleUpload = async () => {
    if (!cFile || !cName.trim() || !cBody.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("name", cName.trim());
      fd.append("body_template", cBody);
      fd.append("per_minute", String(cPerMin));
      if (adId) fd.append("advertisement_id", adId);
      fd.append("file", cFile);
      const data = await smsAPI.createCampaign(fd);
      setCampaigns((prev) => [data.campaign, ...prev]);
      setCName("");
      setCFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setUploadError(e.message || "Upload failed.");
    }
    setUploading(false);
  };

  const patchStatus = (id, status) =>
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

  const handleStart = async (id) => {
    try {
      await smsAPI.startCampaign(id);
      patchStatus(id, "running");
    } catch (e) {
      alert(e.message);
    }
  };
  const handlePause = async (id) => {
    try {
      await smsAPI.pauseCampaign(id);
      patchStatus(id, "paused");
    } catch (e) {
      alert(e.message);
    }
  };
  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this campaign? Pending messages will not be sent.")) return;
    try {
      await smsAPI.cancelCampaign(id);
      patchStatus(id, "cancelled");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (recordsMap[id]) return;
    try {
      const data = await smsAPI.getCampaign(id);
      setRecordsMap((prev) => ({ ...prev, [id]: data?.records || [] }));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Provider status badge ────────────────────────────────────────────── */}
      {status && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: status.configured ? "#22c55e" : "#f59e0b",
            backgroundColor: status.configured ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
            border: `1px solid ${status.configured ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: status.configured ? "#22c55e" : "#f59e0b",
            }}
          />
          {status.configured
            ? `Live — sending from ${status.from_number}`
            : "Dev mode — messages logged to server console (configure Twilio to send for real)"}
        </div>
      )}

      {/* ── Automatic SMS notice ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 8,
          backgroundColor: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.18)",
        }}
      >
        <Info size={15} style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--color-sidebar-text)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          <strong style={{ color: "var(--color-input-text)" }}>Booking confirmations</strong> and{" "}
          <strong style={{ color: "var(--color-input-text)" }}>appointment reminders</strong> are
          sent automatically for this campaign's appointments
          {status ? ` (reminders go out ~${status.reminder_hours_before}h before each slot)` : ""}.
          Use the tools below for one-off messages and bulk outreach.
        </p>
      </div>

      {/* ── Single send ──────────────────────────────────────────────────────── */}
      {canEdit && (
        <SectionCard title="Send a Message" subtitle="Send a single SMS to one recipient">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>To (E.164)</label>
              <input
                type="tel"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+15551234567"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Your message…"
                style={inputStyle}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <ActionButton
              onClick={handleSend}
              loading={sendLoading}
              disabled={!to.trim() || !msg.trim()}
              icon={<Send size={14} />}
            >
              {sendLoading ? "Sending…" : asWhatsapp ? "Send WhatsApp" : "Send SMS"}
            </ActionButton>
            {status?.whatsapp_configured && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.78rem",
                  color: "var(--color-sidebar-text)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={asWhatsapp}
                  onChange={(e) => setAsWhatsapp(e.target.checked)}
                />
                Send as WhatsApp
              </label>
            )}
            {sendDone && (
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={13} /> {status?.configured ? "Sent" : "Logged (dev mode)"}
              </span>
            )}
          </div>
          {sendError && <div style={errorBox}>{sendError}</div>}
        </SectionCard>
      )}

      {/* ── Bulk campaign create ─────────────────────────────────────────────── */}
      {canEdit && (
        <SectionCard
          title="New Bulk SMS Campaign"
          subtitle="Upload a CSV/XLSX with a 'phone' column (E.164). Add a 'name' column to personalise with {name}."
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Campaign Name</label>
              <input
                type="text"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="e.g. Screening reminder blast"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Messages / minute</label>
              <input
                type="number"
                min={1}
                max={120}
                value={cPerMin}
                onChange={(e) => setCPerMin(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Message Template</label>
              <textarea
                value={cBody}
                onChange={(e) => setCBody(e.target.value)}
                rows={3}
                placeholder="Hi {name}, ..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
              <p style={{ fontSize: "0.7rem", color: "var(--color-sidebar-text)", marginTop: 4 }}>
                <code>{"{name}"}</code> is replaced with each recipient's name (or "there" if
                absent).
              </p>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Recipients File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setCFile(e.target.files?.[0] || null)}
                style={{ ...inputStyle, padding: "7px 10px" }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <ActionButton
              onClick={handleUpload}
              loading={uploading}
              disabled={!cFile || !cName.trim() || !cBody.trim()}
              icon={<Upload size={14} />}
            >
              {uploading ? "Creating…" : "Create Campaign"}
            </ActionButton>
          </div>
          {uploadError && <div style={errorBox}>{uploadError}</div>}
        </SectionCard>
      )}

      {/* ── Campaign list ────────────────────────────────────────────────────── */}
      <SectionCard title="SMS Campaigns" subtitle="Bulk message campaigns for this study">
        {listLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-sidebar-text)",
              fontSize: "0.82rem",
            }}
          >
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <MessageSquare
              size={28}
              style={{ color: "var(--color-card-border)", margin: "0 auto 10px" }}
            />
            <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem" }}>
              No SMS campaigns yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campaigns.map((c) => {
              const isOpen = expandedId === c.id;
              const total = c.total || 0;
              const done = (c.completed || 0) + (c.failed_count || 0);
              const pct = total ? Math.round((done / total) * 100) : 0;
              const records = recordsMap[c.id];
              return (
                <div
                  key={c.id}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${isOpen ? "var(--color-accent)" : "var(--color-card-border)"}`,
                    backgroundColor: "var(--color-card-bg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--color-input-text)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.name}
                        </p>
                        <StatusPill status={c.status} />
                      </div>
                      {/* Progress bar */}
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "var(--color-page-bg)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: c.failed_count ? "#f59e0b" : "#22c55e",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-sidebar-text)",
                            flexShrink: 0,
                          }}
                        >
                          {c.completed || 0}/{total} sent
                          {c.failed_count ? ` · ${c.failed_count} failed` : ""}
                        </span>
                      </div>
                    </div>
                    {/* Controls */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {canEdit && (c.status === "queued" || c.status === "paused") && (
                        <button
                          onClick={() => handleStart(c.id)}
                          className="btn--ghost"
                          title="Start"
                          style={{ padding: "6px 8px" }}
                        >
                          <Play size={14} />
                        </button>
                      )}
                      {canEdit && c.status === "running" && (
                        <button
                          onClick={() => handlePause(c.id)}
                          className="btn--ghost"
                          title="Pause"
                          style={{ padding: "6px 8px" }}
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      {canEdit && !["done", "cancelled", "failed"].includes(c.status) && (
                        <button
                          onClick={() => handleCancel(c.id)}
                          className="btn--ghost"
                          title="Cancel"
                          style={{ padding: "6px 8px", color: "#ef4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleExpand(c.id)}
                        className="btn--ghost"
                        title="Details"
                        style={{ padding: "6px 8px" }}
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div
                      style={{
                        borderTop: "1px solid var(--color-card-border)",
                        backgroundColor: "var(--color-page-bg)",
                        padding: "12px 14px",
                      }}
                    >
                      {!records ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "var(--color-sidebar-text)",
                            fontSize: "0.78rem",
                          }}
                        >
                          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />{" "}
                          Loading recipients…
                        </div>
                      ) : records.length === 0 ? (
                        <p style={{ fontSize: "0.78rem", color: "var(--color-sidebar-text)" }}>
                          No recipients.
                        </p>
                      ) : (
                        <div
                          style={{
                            maxHeight: 280,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {records.map((r, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                fontSize: "0.76rem",
                                padding: "4px 0",
                                borderBottom: "1px solid var(--color-card-border)",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "ui-monospace, monospace",
                                  color: "var(--color-input-text)",
                                  minWidth: 130,
                                }}
                              >
                                {r.phone}
                              </span>
                              <span
                                style={{
                                  color: "var(--color-sidebar-text)",
                                  flex: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {r.name || "—"}
                              </span>
                              <StatusPill status={r.status} />
                              {r.error && (
                                <span
                                  style={{ color: "#ef4444", fontSize: "0.7rem" }}
                                  title={r.error}
                                >
                                  !
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            onClick={loadCampaigns}
            className="btn--ghost"
            style={{ fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </SectionCard>

      {/* ── Recent message activity ──────────────────────────────────────────── */}
      <SectionCard
        title="Recent Messages"
        subtitle="Confirmations, reminders, cancellations and manual sends for this campaign"
      >
        {msgLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--color-sidebar-text)",
              fontSize: "0.82rem",
            }}
          >
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <History
              size={26}
              style={{ color: "var(--color-card-border)", margin: "0 auto 10px" }}
            />
            <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem" }}>
              No messages sent yet. Booking confirmations and reminders will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 360,
              overflowY: "auto",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-card-border)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    padding: "2px 8px",
                    borderRadius: 5,
                    flexShrink: 0,
                    minWidth: 92,
                    textAlign: "center",
                    color: "var(--color-accent)",
                    backgroundColor:
                      "rgba(var(--color-accent-r),var(--color-accent-g),var(--color-accent-b),0.08)",
                  }}
                >
                  {m.kind}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-input-text)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={m.body}
                  >
                    {m.body}
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-sidebar-text)",
                      margin: "2px 0 0",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {m.to}
                    {m.created_at ? ` · ${new Date(m.created_at).toLocaleString()}` : ""}
                  </p>
                </div>
                <StatusPill status={m.status} />
                {m.error && (
                  <span style={{ color: "#ef4444", fontSize: "0.7rem" }} title={m.error}>
                    !
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button
            onClick={loadMessages}
            className="btn--ghost"
            style={{ fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
