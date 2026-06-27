import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, setToken } from "../api";
import { User } from "../types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, identifier: string, password: string, role: string) => Promise<OtpChallenge>;
  verifyOtp: (identifier: string, otp: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
};

type OtpChallenge = {
  identifier: string;
  channel: "email" | "sms";
  message: string;
  dev_otp?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  // AuthProvider owns the current user and exposes login/register/logout helpers
  // to every screen through useAuth().
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const current = await apiFetch<User>("/auth/me");
    setUser(current);
  }

  useEffect(() => {
    // On app launch, restore the saved JWT and validate it with /auth/me.
    getToken()
      .then(async (token) => {
        if (token) {
          await refreshMe();
        }
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    // Identifier can be email or phone; backend decides how to look it up.
    const data = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
    await setToken(data.access_token);
    setUser(data.user);
  }

  async function verifyOtp(identifier: string, otp: string) {
    // Registration completes after OTP verification and then stores the JWT.
    const data = await apiFetch<{ access_token: string; user: User }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ identifier, otp })
    });
    await setToken(data.access_token);
    setUser(data.user);
  }

  async function register(name: string, identifier: string, password: string, role: string) {
    // The backend accepts separate email/phone fields, while the UI has one
    // identifier input for a simpler prototype experience.
    const isEmail = identifier.includes("@");
    return apiFetch<OtpChallenge>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email: isEmail ? identifier : null,
        phone: isEmail ? null : identifier,
        password,
        role
      })
    });
  }

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, verifyOtp, refreshMe, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  // Guard against calling auth helpers outside the provider tree.
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
