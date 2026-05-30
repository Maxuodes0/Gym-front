"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, HeartPulse, Home, LogOut, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/cardio", label: "Cardio", icon: HeartPulse },
  { href: "/workouts", label: "Workout", icon: Activity }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh pb-24 text-white md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo compact className="text-xl" />
            <span className="hidden text-xs uppercase tracking-[0.28em] text-muted sm:block">Private Tracker</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm text-muted transition hover:bg-white/[0.06] hover:text-white",
                    active && "bg-white text-black hover:bg-white hover:text-black"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10"
      >
        {children}
      </motion.main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium text-muted transition",
                  active && "bg-white text-black"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
