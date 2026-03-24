import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { hashPassword, normalizeEmail } from "@/lib/auth";

type AppUser = Tables<"users">;

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: AppUser | null;
  initializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const SESSION_KEY = "easy-health-session";
const DEMO_EMAIL = "chad@example.com";
const DEMO_PASSWORD = "chad123";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredUserId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedUserId = readStoredUserId();

      if (!storedUserId) {
        setInitializing(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", storedUserId)
        .maybeSingle();

      if (error || !data) {
        window.localStorage.removeItem(SESSION_KEY);
        setUser(null);
      } else {
        setUser(data);
      }

      setInitializing(false);
    };

    bootstrap();
  }, []);

  const persistSession = (nextUser: AppUser | null) => {
    if (typeof window === "undefined") {
      return;
    }

    if (!nextUser) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_KEY, String(nextUser.user_id));
  };

  const login = async ({ email, password }: LoginInput) => {
    const normalizedEmail = normalizeEmail(email);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("No account found for that email.");
    }

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setUser(data);
      persistSession(data);
      return;
    }

    const passwordHash = await hashPassword(password);

    if (data.password_hash !== passwordHash) {
      throw new Error("Incorrect email or password.");
    }

    setUser(data);
    persistSession(data);
  };

  const register = async ({ email, password, firstName, lastName }: RegisterInput) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    const { data: existingUser, error: lookupError } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (existingUser) {
      throw new Error("An account with that email already exists.");
    }

    const passwordHash = await hashPassword(password);
    const { data, error } = await supabase
      .from("users")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        health_profile: "",
        total_balance_due: 0,
        total_copay_amounts: 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setUser(data);
    persistSession(data);
  };

  const logout = () => {
    setUser(null);
    persistSession(null);
  };

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [initializing, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
