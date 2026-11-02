import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  is_banned: boolean;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** "owner" | "admin" | null — read from the roles table, never from storage. */
  role: "owner" | "admin" | null;
  /** True for owner or admin (staff). */
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isAdmin: false,
  isOwner: false,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<"owner" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (userId: string) => {
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, email, is_banned")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (prof && (prof as Profile).is_banned) {
      await supabase.auth.signOut();
      setProfile(null);
      setRole(null);
      return;
    }
    setProfile((prof as Profile) ?? null);
    const staffRole = (roles ?? []).some((r) => r.role === "owner")
      ? "owner"
      : (roles ?? []).some((r) => r.role === "admin")
        ? "admin"
        : null;
    setRole(staffRole);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        void loadExtras(newSession.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadExtras(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    role,
    isAdmin: role === "owner" || role === "admin",
    isOwner: role === "owner",
    loading,
    refreshProfile: async () => {
      if (session?.user) await loadExtras(session.user.id);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
