import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity } from "lucide-react";
import type { SensorReading } from "@/lib/sensorData";

interface Props {
  title: string;
  data: SensorReading[];
  dataKey: keyof SensorReading;
  color: string;
  unit?: string;
}

export function SensorChart({ title, data, dataKey, color, unit }: Props) {
  const gradId = `grad-${String(dataKey)}`;

  // Show "No Data Available" when Firebase history is empty
  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold mb-3">{title}</h3>
        <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Activity className="size-8 opacity-25" />
          <p className="text-sm font-medium">No Data Available</p>
          <p className="text-xs text-center opacity-60 max-w-[180px]">
            Chart will populate once ESP32 sends data to Firebase.
          </p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: d[dataKey] as number,
  }));

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground tabular-nums">
          {chartData[chartData.length - 1].value}
          {unit}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {data.length} readings from Firebase
      </p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              isAnimationActive
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
