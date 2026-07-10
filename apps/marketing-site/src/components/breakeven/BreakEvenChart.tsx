"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

interface BreakEvenChartProps {
  chartData: any[];
  businessModel: "single" | "multi-mix" | "retail-margin";
  t: any;
  activeBreakEvenRevenue: number;
  activeBreakEvenUnits: number;
  chartCurrencyFormat: (val: number) => string;
  formatCurrency: (val: number) => string;
}

export default function BreakEvenChart({
  chartData,
  businessModel,
  t,
  activeBreakEvenRevenue,
  activeBreakEvenUnits,
  chartCurrencyFormat,
  formatCurrency,
}: BreakEvenChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="units"
          tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
          tickLine={false}
          axisLine={{ stroke: "#cbd5e1" }}
          interval="preserveStartEnd"
          tickFormatter={(val) =>
            businessModel === "retail-margin" ? chartCurrencyFormat(val) : `${val}`
          }
          label={{
            value: businessModel === "retail-margin" ? t.storeTurnover : t.unitsSold,
            position: "insideBottom",
            offset: -10,
            style: { fontSize: 11, fill: "#94a3b8", fontWeight: 700 },
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
          tickLine={false}
          axisLine={false}
          width={55}
          tickFormatter={chartCurrencyFormat}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          labelFormatter={(label) =>
            `${businessModel === "retail-margin" ? t.storeTurnover : t.unitsSold}: ${
              businessModel === "retail-margin" ? formatCurrency(Number(label)) : label
            }`
          }
          contentStyle={{
            background: "#1E293B",
            border: "1px solid #475569",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            padding: "10px 14px",
          }}
          labelStyle={{ color: "#F8FAFC", fontWeight: 800, fontSize: "12px", marginBottom: "4px" }}
          itemStyle={{ color: "#38BDF8", fontWeight: 700, fontSize: "12px" }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "11px", paddingTop: "20px", fontWeight: 600 }}
        />

        {/* Fixed Cost Line (flat) */}
        <Line
          type="monotone"
          dataKey="FixedCosts"
          name={t.fixedCostsLine}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="8 4"
          dot={false}
          activeDot={false}
        />

        {/* Total Cost Line (slopes up) */}
        <Line
          type="monotone"
          dataKey="TotalCosts"
          name={t.totalCostsLine}
          stroke="#f43f5e"
          strokeWidth={2.5}
          dot={false}
        />

        {/* Revenue Line (slopes up faster) */}
        <Line
          type="monotone"
          dataKey="Revenue"
          name={t.revenueLine}
          stroke="#10b981"
          strokeWidth={3}
          dot={false}
        />

        {/* Break-Even Intersection Dot */}
        <ReferenceDot
          x={businessModel === "retail-margin" ? activeBreakEvenRevenue : activeBreakEvenUnits}
          y={activeBreakEvenRevenue}
          r={6}
          fill={
            businessModel === "retail-margin"
              ? "#10b981"
              : businessModel === "multi-mix"
              ? "#d97706"
              : "#4f46e5"
          }
          stroke="#ffffff"
          strokeWidth={2.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
