import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useTheme, type Theme } from "@/theme/ThemeProvider";
import type { Club, Profile, UserRole } from "@/types";

type SignUpParams = {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  clubName?: string;
  joinCode?: string;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  club: Club | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();

  const loadProfileData = useCallback(
    async (userId: string) => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      setProfile(prof ?? null);

      if (prof) {
        // follow the account's saved preferences
        if (prof.theme === "light" || prof.theme === "dark") {
          setTheme(prof.theme as Theme);
        }
        if (prof.locale && prof.locale !== i18n.language) {
          void i18n.changeLanguage(prof.locale);
        }

        const coachId = prof.role === "coach" ? prof.id : prof.coach_id;
        if (coachId) {
          const { data: clubRow } = await supabase
            .from("clubs")
            .select("*")
            .eq("coach_id", coachId)
            .maybeSingle();
          setClub(clubRow ?? null);
        } else {
          setClub(null);
        }
      } else {
        setClub(null);
      }
    },
    [setTheme, i18n],
  );

  const refresh = useCallback(async () => {
    if (session?.user) {
      await loadProfileData(session.user.id);
    }
  }, [session, loadProfileData]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await loadProfileData(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user) {
          await loadProfileData(newSession.user.id);
        } else {
          setProfile(null);
          setClub(null);
        }
      },
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(
    async (params: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName,
            role: params.role,
            club_name: params.clubName ?? params.fullName,
            locale: i18n.language,
            theme: localStorage.getItem("gym.theme") ?? "dark",
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        if (params.role === "trainee" && params.joinCode?.trim()) {
          await supabase.rpc("redeem_join_code", { p_code: params.joinCode });
        }
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    },
    [i18n.language],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setClub(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user) return;
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);
      if (error) throw error;
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      club,
      signIn,
      signUp,
      signOut,
      refresh,
      updateProfile,
    }),
    [loading, session, profile, club, signIn, signUp, signOut, refresh, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
