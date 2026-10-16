/**
 * Auth Context
 * Owner: Frontend Dev 1
 *
 * Provides authentication state, role-based routing,
 * and company context to the entire application.
 *
 * Brand theming is applied here because every session entry point
 * (page refresh and explicit login) flows through this file.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, brandKitAPI, ensureFreshToken } from "../services/api";
import {
  applyBrandTheme,
  resetBrandTheme,
  isDefaultThemeOverrideActive,
  getCachedBrandTheme,
} from "../services/theme";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    console.info("[brandkit] AuthProvider:init", { hasStoredUser: !!stored });

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.info("[brandkit] AuthProvider:restore_user", parsed);
        setUser(parsed);

        // Proactively refresh the JWT if it's close to expiry (< 10 min).
        // Runs silently in the background — doesn't block the UI.
        ensureFreshToken().catch(() => {});

        if (!isDefaultThemeOverrideActive()) {
          // 1. Restore cached theme instantly — zero flash on refresh.
          const cached = getCachedBrandTheme();
          if (cached) applyBrandTheme(cached);

          // 2. Refresh from API in the background; update if anything changed.
          brandKitAPI
            .get()
            .then((brandKit) => {
              console.info("[brandkit] AuthProvider:init_fetch_success", brandKit);
              applyBrandTheme(brandKit);
            })
            .catch((err) => console.info("[brandkit] AuthProvider:init_fetch_failed", err?.message || err));
        }
      } catch {
        localStorage.removeItem("user");
      }
    } else {
      // No active session — reset to platform default for the login page.
      // This ensures a logged-out browser never shows a previous company's theme.
      resetBrandTheme();
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    console.info("[brandkit] AuthProvider:user_effect", {
      hasUser: !!user,
      user,
    });
    if (!user || isDefaultThemeOverrideActive()) return;
    brandKitAPI
      .get()
      .then((brandKit) => {
        console.info("[brandkit] AuthProvider:user_fetch_success", brandKit);
        applyBrandTheme(brandKit);
      })
      .catch((err) => console.info("[brandkit] AuthProvider:user_fetch_failed", err?.message || err));
  }, [user]);

  // Listen for auth:expired events dispatched by the token refresh helper
  // when a refresh call fails (e.g. token revoked server-side).
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("user");
      resetBrandTheme({ clearFlag: true });
      setUser(null);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const login = useCallback(async (email, password, company, role) => {
    const data = await authAPI.login(email, password, company, role);
    const userData = {
      id: data.user_id,
      role: data.role,
      companyId: data.company_id,
      companyName: data.company_name,
      companyIndustry: data.company_industry || null,
      fullName: data.full_name || "",
      email: data.email || "",
      onboarded: data.onboarded ?? false,
    };
    console.info("[brandkit] AuthProvider:login_success", userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // Used by OnboardingPage after registration + login to hydrate the context
  // without making a second network call.
  // Theme is applied by OnboardingPage directly (it already has the brand data),
  // so no brand fetch needed here.
  const hydrateUser = useCallback((userData) => {
    const profile = { ...userData };
    delete profile.token; // ponytail: Bearer-era leftover; remove when backend drops access_token
    localStorage.setItem("user", JSON.stringify(profile));
    setUser(profile);
  }, []);

  const updateFullName = useCallback((name) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, fullName: name };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update the role in context + localStorage after a self-upgrade (e.g. a Study
  // Coordinator elevating to Super User). The backend reads role from the DB on
  // every request, so the existing JWT keeps working; this just keeps the UI in sync.
  const updateRole = useCallback((role) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, role };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem("user");
    resetBrandTheme({ clearFlag: true });
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    hydrateUser,
    updateFullName,
    updateRole,
    isAuthenticated: !!user,
    role: user?.role,
    companyId: user?.companyId,
    companyName: user?.companyName,
    companyIndustry: user?.companyIndustry || null,
    fullName: user?.fullName || "",
    email: user?.email || "",
    onboarded: user?.onboarded ?? true, // default true for sessions predating this field
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
