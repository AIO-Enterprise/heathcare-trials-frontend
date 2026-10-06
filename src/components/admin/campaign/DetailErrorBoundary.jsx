import { Component } from "react";
import { AlertCircle } from "lucide-react";
import { PageWithSidebar } from "../../shared/Layout";

// ─── Error boundary ───────────────────────────────────────────────────────────
class DetailErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <PageWithSidebar>
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <AlertCircle size={36} style={{ color: "#ef4444", margin: "0 auto 14px" }} />
            <p style={{ color: "var(--color-input-text)", fontWeight: 700, fontSize: "1rem" }}>
              Something went wrong rendering this campaign
            </p>
            <p
              style={{
                color: "var(--color-sidebar-text)",
                fontSize: "0.82rem",
                marginTop: "6px",
                maxWidth: "420px",
                margin: "8px auto 0",
              }}
            >
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn--ghost"
              style={{ marginTop: "20px" }}
            >
              Reload page
            </button>
          </div>
        </PageWithSidebar>
      );
    }
    return this.props.children;
  }
}

export default DetailErrorBoundary;
