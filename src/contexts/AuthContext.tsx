import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
<<<<<<< Updated upstream

interface SessionUser {
  email: string;
  firstName: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  createAccount: (firstName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_KEY = "easy-health-user";
const ACCOUNTS_KEY = "easy-health-accounts";

const CHAD_ACCOUNT = {
  email: "chad@example.com",
  password: "chad123",
  firstName: "Chad",
};

interface StoredAccount {
  email: string;
  password: string;
  firstName: string;
}

const readAccounts = (): StoredAccount[] => {
  if (typeof window === "undefined") {
    return [CHAD_ACCOUNT];
  }

  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    return [CHAD_ACCOUNT];
  }

  try {
    const parsed = JSON.parse(raw) as StoredAccount[];
    const hasChad = parsed.some((account) => account.email.toLowerCase() === CHAD_ACCOUNT.email);
    return hasChad ? parsed : [CHAD_ACCOUNT, ...parsed];
  } catch {
    return [CHAD_ACCOUNT];
  }
};

const writeAccounts = (accounts: StoredAccount[]) => {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as SessionUser);
      } catch {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }

    const accounts = readAccounts();
    writeAccounts(accounts);
    setLoading(false);
  }, []);

  const persistSession = (sessionUser: SessionUser | null) => {
=======
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
>>>>>>> Stashed changes
    if (typeof window === "undefined") {
      return;
    }

<<<<<<< Updated upstream
    if (!sessionUser) {
=======
    if (!nextUser) {
>>>>>>> Stashed changes
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }

<<<<<<< Updated upstream
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = readAccounts().find((entry) => entry.email.toLowerCase() === normalizedEmail);

    if (!account || account.password !== password) {
      throw new Error("Invalid email or password.");
    }

    const sessionUser = {
      email: account.email,
      firstName: account.firstName,
    };

    setUser(sessionUser);
    persistSession(sessionUser);
  };

  const createAccount = async (firstName: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedFirstName = firstName.trim();
    const accounts = readAccounts();

    if (accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
      throw new Error("An account with that email already exists.");
    }

    const nextAccount = {
      email: normalizedEmail,
      password,
      firstName: trimmedFirstName,
    };

    const nextAccounts = [...accounts, nextAccount];
    writeAccounts(nextAccounts);

    const sessionUser = {
      email: nextAccount.email,
      firstName: nextAccount.firstName,
    };

    setUser(sessionUser);
    persistSession(sessionUser);
=======
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
>>>>>>> Stashed changes
  };

  const logout = () => {
    setUser(null);
    persistSession(null);
  };

  const value = useMemo(
<<<<<<< Updated upstream
    () => ({ user, loading, login, createAccount, logout }),
    [loading, user],
=======
    () => ({ user, initializing, login, register, logout }),
    [initializing, user],
>>>>>>> Stashed changes
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
