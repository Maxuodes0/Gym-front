import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "min-h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 text-base text-white outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
