import React, { createContext, useCallback, useContext, useState } from "react";

type AuthContextValue = {
  isLoggedIn: boolean;
  displayName: string | null;
  login: (nameOrEmail: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function deriveDisplayName(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "there";
  // If it looks like an email, use the part before the @ as a friendly name.
  const namePart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const login = useCallback((nameOrEmail: string) => {
    setDisplayName(deriveDisplayName(nameOrEmail));
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setDisplayName(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, displayName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
