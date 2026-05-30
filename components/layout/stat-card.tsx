import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, change }: { label: string; value: string; change?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tracking-normal text-white">{value}</p>
          {change ? <p className="pb-1 text-sm text-muted">{change}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
