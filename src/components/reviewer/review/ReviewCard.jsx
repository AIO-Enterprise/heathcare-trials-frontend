import { RefreshCw } from "lucide-react";

// ─── Review history card ───────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const isSystem = review.review_type === "system" || review.is_system;
  const statusColor =
    {
      approved: "var(--color-success)",
      rejected: "#ef4444",
      revision: "#f59e0b",
      pending: "var(--color-sidebar-text)",
    }[review.status] ?? "var(--color-sidebar-text)";

  if (isSystem) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px dashed var(--color-card-border)",
          backgroundColor: "var(--color-page-bg)",
        }}
      >
        <RefreshCw
          size={13}
          style={{ color: "var(--color-sidebar-text)", flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-sidebar-text)",
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {review.comments}
          </p>
          {review.created_at && (
            <p style={{ fontSize: "0.68rem", color: "var(--color-sidebar-text)", marginTop: 4 }}>
              {new Date(review.created_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid var(--color-card-border)",
        backgroundColor: "var(--color-card-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              textTransform: "capitalize",
              backgroundColor: statusColor + "22",
              color: statusColor,
              border: `1px solid ${statusColor}44`,
            }}
          >
            {review.status}
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--color-sidebar-text)",
              textTransform: "capitalize",
            }}
          >
            {review.review_type} review
          </span>
        </div>
        {review.created_at && (
          <span style={{ fontSize: "0.7rem", color: "var(--color-sidebar-text)" }}>
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        )}
      </div>
      {review.comments && (
        <p style={{ fontSize: "0.82rem", color: "var(--color-input-text)", lineHeight: 1.6 }}>
          {review.comments}
        </p>
      )}
      {review.suggestions?.text && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--color-sidebar-text)",
            marginTop: 6,
            fontStyle: "italic",
          }}
        >
          Suggestions: {review.suggestions.text}
        </p>
      )}
    </div>
  );
}

export default ReviewCard;
