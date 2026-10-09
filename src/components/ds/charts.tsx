import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useHydrated } from "@/components/theme/theme-provider";
import { ChartSkeleton } from "./states";

const palette = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const color = (i: number) => palette[i % palette.length] as string;

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: "12px",
    color: "var(--color-popover-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: "11px" },
};

function ChartFrame({ children, height }: { children: React.ReactElement; height: number }) {
  const hydrated = useHydrated();
  if (!hydrated) return <ChartSkeleton height={height} />;
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function TrendAreaChart({
  data,
  xKey,
  series,
  height = 280,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number | undefined;
}) {
  return (
    <ChartFrame height={height}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color(i)} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color(i)} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} width={56} />
        <Tooltip {...tooltipStyle} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={color(i)}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ChartFrame>
  );
}

export function GroupedBarChart({
  data,
  xKey,
  series,
  height = 280,
  stacked = false,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number | undefined;
  stacked?: boolean | undefined;
}) {
  return (
    <ChartFrame height={height}>
      <BarChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} width={56} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            {...(stacked ? { stackId: "a" } : {})}
            fill={color(i)}
            radius={[6, 6, 0, 0]}
            maxBarSize={38}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

export function DonutChart({
  data,
  height = 280,
}: {
  data: { name: string; value: number }[];
  height?: number | undefined;
}) {
  return (
    <ChartFrame height={height}>
      <PieChart>
        <Tooltip {...tooltipStyle} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
          stroke="var(--color-card)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={color(i)} />
          ))}
        </Pie>
      </PieChart>
    </ChartFrame>
  );
}

export function SparkLineChart({
  data,
  dataKey,
  height = 64,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  height?: number | undefined;
}) {
  return (
    <ChartFrame height={height}>
      <LineChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartFrame>
  );
}
