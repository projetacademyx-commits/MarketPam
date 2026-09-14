"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SafeUser } from "@/lib/auth";
import type { Address } from "@/db/schema";
import { AuthModal } from "@/components/auth-modal";

type AuthContextValue = {
  user: SafeUser | null;
  defaultAddress: Address | null;
  loading: boolean;
  refreshUser: () => Promise<SafeUser | null>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMessage: string;
  openAuthModal: (message?: string, onComplete?: () => void) => void;
  closeAuthModal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
        setDefaultAddress(data.defaultAddress ?? null);
        return data.user ?? null;
      } else {
        setUser(null);
        setDefaultAddress(null);
        return null;
      }
    } catch {
      setUser(null);
      setDefaultAddress(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setDefaultAddress(null);
      window.location.href = "/";
    }
  }, []);

  const openAuthModal = useCallback((message?: string, onComplete?: () => void) => {
    setAuthModalMessage(
      message || "Vous devez être connecté pour ajouter des articles à votre panier et commander.",
    );
    if (onComplete) {
      setPendingCallback(() => onComplete);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    refreshUser().then(() => {
      setIsAuthModalOpen(false);
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
    });
  }, [refreshUser, pendingCallback]);

  return (
    <AuthContext.Provider
      value={{
        user,
        defaultAddress,
        loading,
        refreshUser,
        logout,
        isAuthModalOpen,
        authModalMessage,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      {isAuthModalOpen ? (
        <AuthModal
          message={authModalMessage}
          onClose={closeAuthModal}
          onSuccess={handleAuthSuccess}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
