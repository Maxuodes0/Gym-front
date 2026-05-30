"use client";

import { motion } from "framer-motion";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

export function MetricRing({
  label,
  value,
  detail,
  progress,
  accent = "#93B5CF"
}: {
  label: string;
  value: string;
  detail: string;
  progress: number;
  accent?: string;
}) {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(progress) / 100) * circumference;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      className="flex min-h-44 flex-col items-center justify-center px-1 py-3 sm:min-h-64 sm:px-4 sm:py-8"
    >
      <div className="relative grid h-24 w-24 place-items-center min-[390px]:h-28 min-[390px]:w-28 sm:h-48 sm:w-48 lg:h-60 lg:w-60">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="14" />
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold leading-none tracking-normal text-white min-[390px]:text-2xl sm:text-4xl lg:text-5xl">
            {value}
          </p>
        </div>
      </div>
      <div className="mt-3 min-h-10 text-center sm:mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:text-xs sm:tracking-[0.18em]">{label}</p>
        <p className="mt-1 text-[10px] font-medium leading-tight text-white/60 sm:text-sm">{detail}</p>
      </div>
    </motion.div>
  );
}

export { clamp };
