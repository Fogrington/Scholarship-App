import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, ApiError } from "../api/client";

export type UserRole = "customer" | "admin" | "business";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  businessId?: number;
  businessName?: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

type AuthContextValue = {
  isLoggedIn: boolean;
  initializing: boolean;
  role: UserRole | null;
  displayName: string | null;
  businessId: number | null;
  businessName: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "confirmea_token";
const USER_KEY = "confirmea_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // On launch, check for a saved session so the user doesn't have to log in every time.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (newToken: string, newUser: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: newToken, user: newUser } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      // Customers and businesses both use this app. Admin accounts belong in the
      // separate web admin panel, not here.
      if (newUser.role === "admin") {
        throw new ApiError(403, "That's an admin account — use the admin panel to log in instead.");
      }
      await persistSession(newToken, newUser);
    },
    [persistSession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      // The backend only ever creates customer accounts through public registration —
      // business accounts are created deliberately by an admin, not self-served.
      const { token: newToken, user: newUser } = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
        name,
      });
      await persistSession(newToken, newUser);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: token !== null && user !== null,
        initializing,
        role: user?.role ?? null,
        displayName: user?.name ?? null,
        businessId: user?.businessId ?? null,
        businessName: user?.businessName ?? null,
        token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
