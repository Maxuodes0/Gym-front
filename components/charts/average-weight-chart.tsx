"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type AverageWeightPoint = {
  label: string;
  weight: number;
};

export function AverageWeightChart({ data, average }: { data: AverageWeightPoint[]; average: number }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -24, right: 8, top: 18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#A3A3A3", fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#A3A3A3", fontSize: 12 }}
            tickFormatter={(value) => `${value}kg`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              background: "#0A0A0A",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff"
            }}
            formatter={(value) => [`${Number(value).toFixed(2)}kg`, "Weight"]}
          />
          <ReferenceLine
            y={average}
            stroke="#FFFFFF"
            strokeDasharray="6 6"
            label={{ value: `Avg ${average.toFixed(2)}kg`, fill: "#E5E5E5", fontSize: 12, position: "insideTopRight" }}
          />
          <Bar dataKey="weight" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
