"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartPoint } from "@/types/domain";

type MetricLineChartProps = {
  data: ChartPoint[];
  dataKey: "weight" | "bodyFat";
  suffix: string;
};

export function MetricLineChart({ data, dataKey, suffix }: MetricLineChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -24, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.24} />
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#A3A3A3", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#A3A3A3", fontSize: 12 }}
            tickFormatter={(value) => `${value}${suffix}`}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.24)" }}
            contentStyle={{
              background: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff"
            }}
            formatter={(value) => [
              `${Number(value).toFixed(dataKey === "weight" ? 2 : 1)}${suffix}`,
              dataKey === "weight" ? "Weight" : "Body Fat"
            ]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#FFFFFF"
            strokeWidth={2}
            fill={`url(#fill-${dataKey})`}
            activeDot={{ r: 5, fill: "#FFFFFF", stroke: "#000000" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
