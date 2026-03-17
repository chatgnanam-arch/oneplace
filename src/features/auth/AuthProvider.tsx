import type { PropsWithChildren } from "react";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import type { AppUser } from "../../types/bookmarks";

interface AuthContextValue {
  authMessage: string | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  user: AppUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(user: User): AppUser {
  return {
    id: user.id,
    email: user.email ?? "unknown@oneplace.app",
    displayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : undefined
  };
}

function getMissingConfigMessage() {
  return "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env file to enable email login.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      startTransition(() => {
        setUser(null);
        setIsLoading(false);
      });
      return;
    }

    const supabaseClient = supabase;
    let mounted = true;

    async function hydrateSession() {
      const { data, error } = await supabaseClient.auth.getSession();

      if (!mounted) {
        return;
      }

      startTransition(() => {
        if (error) {
          setAuthMessage(error.message);
        }

        setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
        setIsLoading(false);
      });
    }

    void hydrateSession();

    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, session: Session | null) => {
      startTransition(() => {
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setIsLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithPassword(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setAuthMessage("Enter your email and password to sign in.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(getMissingConfigMessage());
      return;
    }

    setAuthMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Signed in successfully.");
  }

  async function signUpWithPassword(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setAuthMessage("Enter your email and password to create an account.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(getMissingConfigMessage());
      return;
    }

    setAuthMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/my-links`
      }
    });

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (data.session) {
      setAuthMessage("Account created. You're signed in.");
      return;
    }

    setAuthMessage(`Account created. Check ${normalizedEmail} to confirm your email.`);
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      setAuthMessage(getMissingConfigMessage());
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    startTransition(() => {
      setUser(null);
      setAuthMessage("Signed out.");
    });
  }

  return (
    <AuthContext.Provider
      value={{
        authMessage,
        isAuthenticated: Boolean(user),
        isConfigured: isSupabaseConfigured,
        isLoading,
        signInWithPassword,
        signOut,
        signUpWithPassword,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
