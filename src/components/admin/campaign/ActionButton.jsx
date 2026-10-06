import { Loader2 } from "lucide-react";
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
        gap: "8px",
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      {children}
    </button>
  );
}

export default ActionButton;
