"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Dumbbell } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/logo";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!active) return;
        setUser(data.session?.user ?? null);

        if (!data.session && pathname !== "/login") router.replace("/login");
        if (data.session && pathname === "/login") router.replace("/");

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          if (!session && pathname !== "/login") router.replace("/login");
          if (session && pathname === "/login") router.replace("/");
        });

        return () => listener.subscription.unsubscribe();
      } catch {
        if (pathname !== "/login") router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    const cleanupPromise = loadSession();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
    };
  }, [pathname, router]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  const isLogin = pathname === "/login";

  if (loading && !isLogin) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <Logo className="text-5xl" />
          <Dumbbell className="h-6 w-6 animate-pulse text-white/60" />
          <p className="text-sm uppercase tracking-[0.28em] text-muted">Loading private dashboard</p>
        </div>
      </main>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
