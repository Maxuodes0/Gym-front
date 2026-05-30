"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, BarChart3, HeartPulse, Scale } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

const cards = [
  {
    href: "/weight",
    title: "Weight Tracking",
    description: "Log weight and body fat, edit past entries, and watch the trend move.",
    icon: Scale
  },
  {
    href: "/workouts",
    title: "Workout Tracking",
    description: "Start today's split, record every set, compare with the last session, or mark recovery.",
    icon: Activity
  },
  {
    href: "/cardio",
    title: "Cardio Tracking",
    description: "Log the cardio machine and duration with a clean automatic timeline.",
    icon: HeartPulse
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="min-h-[calc(100dvh-9rem)] py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <Badge>TURA</Badge>
            <h1 className="mt-5 font-heading text-6xl leading-none text-white sm:text-7xl md:text-8xl">TURA</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Private training intelligence for body metrics, progressive overload, and recovery discipline.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: index * 0.14, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.01 }}
              >
                <Link
                  href={card.href}
                  className="group flex min-h-[19rem] flex-col justify-between rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-premium transition duration-500 hover:border-white/25 hover:bg-white/[0.075]"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-14 w-14 place-items-center rounded-md bg-white text-black">
                      <Icon className="h-7 w-7" />
                    </div>
                    <ArrowRight className="h-6 w-6 text-white/50 transition group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-normal text-white">{card.title}</h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-muted">{card.description}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
