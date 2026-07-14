import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  adminName: string | null;
  login: (nameOrEmail: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "confirmea_admin_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function deriveName(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "Admin";
  const namePart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminName, setAdminName] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const login = useCallback((nameOrEmail: string) => {
    const name = deriveName(nameOrEmail);
    localStorage.setItem(STORAGE_KEY, name);
    setAdminName(name);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAdminName(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: adminName !== null, adminName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
