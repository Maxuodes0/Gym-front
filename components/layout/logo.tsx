import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("font-heading text-white", className)} aria-label="TURA">
      {compact ? (
        <span className="block leading-[0.75]">
          TU
          <br />
          RA
        </span>
      ) : (
        <span className="tracking-normal">TURA</span>
      )}
    </div>
  );
}
