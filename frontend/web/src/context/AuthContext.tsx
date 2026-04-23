"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/lib/types";
import { mockUser, mockOwnedProductIds } from "@/lib/mock-data";

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  ownedProductIds: string[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "kjl_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Simulate async API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Accept any credentials — mock auth
    const authedUser: User = { ...mockUser, email };
    setUser(authedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authedUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, displayName: name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: user !== null,
        ownedProductIds: user ? mockOwnedProductIds : [],
        isLoading,
        login,
        logout,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
