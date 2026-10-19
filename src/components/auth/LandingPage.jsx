import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { resetBrandTheme } from "../../services/theme";
import {
  LogIn,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Shield,
  BarChart3,
  Mic,
  Globe,
  Users,
  ClipboardCheck,
  Megaphone,
  CheckCircle2,
  X,
} from "lucide-react";

const ROLE_ROUTES = {
  super_user: "/study-coordinator",
  study_coordinator: "/study-coordinator",
  project_manager: "/project-manager",
  ethics_manager: "/ethics",
  publisher: "/publisher",
};

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("study_coordinator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password, company, role);
      navigate(ROLE_ROUTES[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "26rem",
          maxHeight: "min(92vh, 48rem)",
          backgroundColor: "#0d1117",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          overflow: "auto",
          animation: "slideUp 0.2s ease",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/alt1_trails_logo.svg" alt="ALT Trials" style={{ height: "28px" }} />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto" }}>
          <h2
            style={{ color: "#f9fafb", fontSize: "1.125rem", fontWeight: 700, marginBottom: "4px" }}
          >
            Sign in to your dashboard
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
            Enter your credentials to continue
          </p>

          {error && (
            <div
              style={{
                backgroundColor: "#1f0a0a",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "0.8125rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label style={labelStyle}>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company name"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { value: "super_user", label: "Super User" },
                  { value: "study_coordinator", label: "Study Coordinator" },
                  { value: "project_manager", label: "Project Manager" },
                  { value: "ethics_manager", label: "Ethics Manager" },
                  { value: "publisher", label: "Publisher" },
                ].map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        border: `1.5px solid ${active ? "#10b981" : "#1f2937"}`,
                        backgroundColor: active ? "rgba(16,185,129,0.1)" : "#111827",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: "13px",
                          height: "13px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          border: `2px solid ${active ? "#10b981" : "#374151"}`,
                          backgroundColor: active ? "#10b981" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {active && (
                          <div
                            style={{
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          color: active ? "#d1fae5" : "#9ca3af",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        {r.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !company || !email || !password}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#10b981",
                color: "white",
                fontWeight: 600,
                fontSize: "0.9375rem",
                opacity: loading || !company || !email || !password ? 0.5 : 1,
                transition: "background-color 0.15s",
                marginTop: "4px",
              }}
            >
              <LogIn size={17} />
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  color: "#9ca3af",
  fontSize: "0.8125rem",
  fontWeight: 500,
  marginBottom: "6px",
};
const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid #1f2937",
  backgroundColor: "#111827",
  color: "#f9fafb",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
};

// ─── Landing sections ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Sparkles size={22} />,
    title: "AI Strategy Generation",
    desc: "Claude Opus generates tailored recruitment strategies from your trial protocol and company documents.",
    color: "#10b981",
  },
  {
    icon: <Shield size={22} />,
    title: "Ethics Governance",
    desc: "8-criteria clinical compliance checklist with a dedicated ethics review gate before any ad goes live.",
    color: "#6366f1",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Real-time Analytics",
    desc: "Live Meta & Google Ads insights synced to your dashboard — impressions, CTR, spend, and KPI tracking.",
    color: "#f59e0b",
  },
  {
    icon: <Mic size={22} />,
    title: "Voice Recruitment",
    desc: "ElevenLabs AI voice agents handle outbound calls for participant qualification and appointment booking.",
    color: "#ec4899",
  },
  {
    icon: <Globe size={22} />,
    title: "Multi-Platform Publishing",
    desc: "Distribute creatives to Meta, Google Ads, and deploy landing pages to Vercel, Netlify, and more.",
    color: "#3b82f6",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Reinforcement Learning",
    desc: "Platform learns from every campaign — accepted suggestions and performance data refine future strategies.",
    color: "#14b8a6",
  },
];

const WORKFLOW = [
  {
    icon: <ClipboardCheck size={18} />,
    role: "Study Coordinator",
    step: "Create campaign, upload trial protocol, set budget and target audience.",
  },
  {
    icon: <Sparkles size={18} />,
    role: "Curator AI",
    step: "Generates marketing strategy, questionnaire, and ad copy using Claude Opus.",
  },
  {
    icon: <Users size={18} />,
    role: "Project Manager",
    step: "Reviews strategy, edits budget and platforms, sends AI suggestions.",
  },
  {
    icon: <Shield size={18} />,
    role: "Ethics Manager",
    step: "Applies compliance checklist, approves or requests revision.",
  },
  {
    icon: <Megaphone size={18} />,
    role: "Publisher",
    step: "Deploys landing pages, publishes ads, configures voice agents.",
  },
];

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    resetBrandTheme({ clearFlag: true });
  }, []);
  const { isAuthenticated, role } = useAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROLE_ROUTES[role] || "/study-coordinator", { replace: true });
    }
  }, [isAuthenticated]);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        backgroundColor: "#030712",
        color: "#f9fafb",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes float   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .landing-btn-primary:hover  { background-color: #059669 !important; }
        .landing-btn-ghost:hover    { background-color: #111827 !important; border-color: #374151 !important; }
        .feature-card:hover         { border-color: #374151 !important; transform: translateY(-2px); }
        .workflow-step:hover        { border-color: #374151 !important; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "rgba(3,7,18,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #0f1923",
          padding: "0 2rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <img src="/alt1_trails_logo.svg" alt="ALT Trials" style={{ height: "32px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={scrollToFeatures}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "0.875rem",
              cursor: "pointer",
              padding: "6px 12px",
            }}
          >
            Features
          </button>
          <button
            onClick={() => setShowLogin(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#10b981",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 1.5rem 4rem",
          background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.07) 0%, transparent 60%)
        `,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
          }}
        />

        <div style={{ position: "relative", maxWidth: "760px", animation: "slideUp 0.5s ease" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 14px",
              borderRadius: "100px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "#34d399",
              fontSize: "0.8125rem",
              fontWeight: 500,
              marginBottom: "2rem",
            }}
          >
            <Sparkles size={13} /> AI-Powered Clinical Trial Advertising
          </div>

          <h1
            style={{
              fontSize: "clamp(2.25rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
              color: "#f9fafb",
            }}
          >
            Recruit smarter.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #10b981, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Comply effortlessly.
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.1875rem)",
              color: "#6b7280",
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "0 auto 2.5rem",
            }}
          >
            End-to-end platform for healthcare trial teams — from AI strategy generation and ethics
            review to multi-platform advertising and voice-based participant outreach.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/onboarding")}
              className="landing-btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#10b981",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="landing-btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                borderRadius: "10px",
                border: "1px solid #1f2937",
                backgroundColor: "transparent",
                color: "#d1d5db",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <LogIn size={18} /> Login Now
            </button>
          </div>

          {/* Social proof strip */}
          <div
            style={{
              marginTop: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {["Meta Ads", "Google Ads", "ElevenLabs Voice", "AWS Bedrock AI"].map((badge) => (
              <span
                key={badge}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#4b5563",
                  fontSize: "0.8125rem",
                }}
              >
                <CheckCircle2 size={13} color="#10b981" /> {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <button
          onClick={scrollToFeatures}
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#374151",
            animation: "float 2s ease-in-out infinite",
          }}
        >
          <ChevronDown size={24} />
        </button>
      </section>

      {/* ── Features ── */}
      <section
        id="features"
        style={{
          padding: "6rem 1.5rem",
          background:
            "linear-gradient(180deg, transparent, rgba(16,185,129,0.03) 50%, transparent)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 800,
                color: "#f9fafb",
                marginBottom: "0.75rem",
              }}
            >
              Everything your trial team needs
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
              One platform covering strategy, compliance, publishing, and optimization.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
            }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #1a2130",
                  borderRadius: "14px",
                  padding: "1.5rem",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    backgroundColor: `${f.color}18`,
                    color: f.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    color: "#f9fafb",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ── */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 800,
                color: "#f9fafb",
                marginBottom: "0.75rem",
              }}
            >
              Human-in-the-loop governance
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1rem" }}>
              Every campaign flows through a structured review pipeline before reaching
              participants.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {WORKFLOW.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: "0", position: "relative" }}>
                {/* Timeline line */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginRight: "1.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      backgroundColor: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    {w.icon}
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div
                      style={{
                        width: "1px",
                        flex: 1,
                        backgroundColor: "#1a2130",
                        minHeight: "28px",
                      }}
                    />
                  )}
                </div>

                <div
                  className="workflow-step"
                  style={{
                    flex: 1,
                    backgroundColor: "#0d1117",
                    border: "1px solid #1a2130",
                    borderRadius: "12px",
                    padding: "1rem 1.25rem",
                    marginBottom: i < WORKFLOW.length - 1 ? "8px" : 0,
                    transition: "border-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      color: "#10b981",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "3px",
                    }}
                  >
                    {w.role}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "0.875rem", lineHeight: 1.55 }}>
                    {w.step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: "6rem 1.5rem",
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 800,
              color: "#f9fafb",
              marginBottom: "1rem",
            }}
          >
            Ready to launch your trial?
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            Set up your company in minutes and start generating AI-powered recruitment campaigns
            today.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/onboarding")}
              className="landing-btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 32px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#10b981",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="landing-btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 28px",
                borderRadius: "10px",
                border: "1px solid #1f2937",
                backgroundColor: "transparent",
                color: "#d1d5db",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Already have an account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid #0f1923",
          padding: "1.5rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <img
          src="/alt1_trails_logo.svg"
          alt="ALT Trials"
          style={{ height: "24px", opacity: 0.6 }}
        />
        <p style={{ color: "#374151", fontSize: "0.8125rem" }}>
          © 2026 ALT Trials. Clinical trial advertising platform.
        </p>
      </footer>

      {/* ── Login Modal ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
