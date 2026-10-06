import {
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { appointmentsAPI } from "../../../services/api";
import { SectionCard } from "../../shared/Layout";
export default function BookingsTab({
  id,
  isStudyCoordinator,
  appointments,
  setAppointments,
  appointmentsLoading,
  setAppointmentsLoading,
  bookingConfig,
  setBookingConfig,
  bcForm,
  setBcForm,
  bcEditing,
  setBcEditing,
  bcSaving,
  setBcSaving,
}) {
  return (
    <>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* ── Booking window config ── */}
            <SectionCard
              title="Booking Window Configuration"
              subtitle="Controls which dates/times participants can book and how many per slot"
            >
              {bookingConfig ? (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      { label: "Window Start", value: bookingConfig.window_start || "—" },
                      { label: "Window End", value: bookingConfig.window_end || "—" },
                      {
                        label: "Slot Duration",
                        value: `${bookingConfig.slot_duration_minutes} min`,
                      },
                      { label: "Max per Slot", value: bookingConfig.max_per_slot },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 8,
                          border: "1px solid var(--color-card-border)",
                          backgroundColor: "var(--color-bg)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "var(--color-sidebar-text)",
                            marginBottom: 4,
                          }}
                        >
                          {label}
                        </p>
                        <p
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: "var(--color-input-text)",
                          }}
                        >
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-sidebar-text)",
                      marginBottom: 14,
                    }}
                  >
                    Booking window dates follow the campaign's trial start/end. Update them in the{" "}
                    <strong>Overview</strong> tab.
                  </p>

                  {isStudyCoordinator && !bcEditing && (
                    <button
                      onClick={() => setBcEditing(true)}
                      className="btn--ghost"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.82rem",
                      }}
                    >
                      <Pencil size={13} /> Edit Slot Settings
                    </button>
                  )}

                  {isStudyCoordinator && bcEditing && (
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--color-sidebar-text)",
                              marginBottom: 4,
                            }}
                          >
                            Slot Duration (min)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="480"
                            value={bcForm.slot_duration_minutes}
                            onChange={(e) =>
                              setBcForm((f) => ({
                                ...f,
                                slot_duration_minutes: parseInt(e.target.value, 10) || 30,
                              }))
                            }
                            className="field-input"
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "var(--color-sidebar-text)",
                              marginBottom: 4,
                            }}
                          >
                            Max Bookings per Slot
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={bcForm.max_per_slot}
                            onChange={(e) =>
                              setBcForm((f) => ({
                                ...f,
                                max_per_slot: parseInt(e.target.value, 10) || 1,
                              }))
                            }
                            className="field-input"
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={async () => {
                            setBcSaving(true);
                            try {
                              const updated = await appointmentsAPI.updateBookingConfig(id, bcForm);
                              setBookingConfig(updated);
                              setBcEditing(false);
                            } catch (e) {
                              alert(e.message || "Failed to save booking config.");
                            } finally {
                              setBcSaving(false);
                            }
                          }}
                          disabled={bcSaving}
                          className="btn--accent"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.82rem",
                            padding: "7px 16px",
                            opacity: bcSaving ? 0.7 : 1,
                          }}
                        >
                          {bcSaving ? (
                            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                          ) : null}
                          Save
                        </button>
                        <button
                          onClick={() => setBcEditing(false)}
                          className="btn--ghost"
                          style={{ fontSize: "0.82rem", padding: "7px 14px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : appointmentsLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--color-sidebar-text)",
                    fontSize: "0.85rem",
                  }}
                >
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading…
                </div>
              ) : (
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem" }}>
                  Could not load booking config.
                </p>
              )}
            </SectionCard>

            {/* ── Appointments list ── */}
            <SectionCard
              title="Appointments"
              subtitle={
                appointments.length > 0
                  ? `${appointments.length} booking${appointments.length !== 1 ? "s" : ""} recorded`
                  : "No bookings yet"
              }
              actions={
                <button
                  onClick={() => {
                    setAppointmentsLoading(true);
                    appointmentsAPI
                      .list(id)
                      .then((a) => setAppointments(a || []))
                      .catch(() => {})
                      .finally(() => setAppointmentsLoading(false));
                  }}
                  className="btn--ghost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.78rem",
                  }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              }
            >
              {appointmentsLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--color-sidebar-text)",
                    fontSize: "0.85rem",
                  }}
                >
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading
                  appointments…
                </div>
              ) : appointments.length === 0 ? (
                <p style={{ color: "var(--color-sidebar-text)", fontSize: "0.85rem" }}>
                  No appointments have been booked for this campaign yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                        {[
                          "Patient",
                          "Phone",
                          "Date & Time",
                          "Duration",
                          "Status",
                          "Source",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "var(--color-sidebar-text)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appt) => {
                        const dt = new Date(appt.slot_datetime);
                        const dateStr = dt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        const timeStr = dt.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const source = appt.voice_session_id
                          ? "Voicebot"
                          : appt.survey_response_id
                            ? "Survey"
                            : "Chatbot/Direct";
                        const cancelled = appt.status === "cancelled";
                        return (
                          <tr
                            key={appt.id}
                            style={{
                              borderBottom: "1px solid var(--color-card-border)",
                              opacity: cancelled ? 0.5 : 1,
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 12px",
                                fontWeight: 600,
                                color: "var(--color-input-text)",
                              }}
                            >
                              {appt.patient_name}
                            </td>
                            <td
                              style={{ padding: "10px 12px", color: "var(--color-sidebar-text)" }}
                            >
                              {appt.patient_phone}
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: "var(--color-input-text)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {dateStr} · {timeStr}
                            </td>
                            <td
                              style={{ padding: "10px 12px", color: "var(--color-sidebar-text)" }}
                            >
                              {appt.duration_minutes} min
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  backgroundColor: cancelled
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(16,185,129,0.1)",
                                  color: cancelled ? "#ef4444" : "#10b981",
                                  border: `1px solid ${cancelled ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
                                }}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "10px 12px",
                                color: "var(--color-sidebar-text)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {source}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              {!cancelled && isStudyCoordinator && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Cancel ${appt.patient_name}'s appointment?`))
                                      return;
                                    try {
                                      const updated = await appointmentsAPI.cancel(id, appt.id);
                                      setAppointments((prev) =>
                                        prev.map((a) => (a.id === appt.id ? updated : a)),
                                      );
                                    } catch (e) {
                                      alert(e.message || "Failed to cancel appointment.");
                                    }
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#ef4444",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
    </>
  );
}
