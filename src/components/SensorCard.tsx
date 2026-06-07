import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  accent?: "primary" | "blue" | "amber" | "rose";
  hint?: string;
}

const accentClasses: Record<string, string> = {
  primary: "from-primary/20 to-primary/5 text-primary",
  blue: "from-chart-2/25 to-chart-2/5 text-chart-2",
  amber: "from-chart-3/25 to-chart-3/5 text-chart-3",
  rose: "from-chart-4/25 to-chart-4/5 text-chart-4",
};

export function SensorCard({ label, value, unit, icon: Icon, accent = "primary", hint }: Props) {
  return (
    <div className="glass rounded-2xl p-5 transition-transform hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums">{value}</span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("size-12 rounded-xl bg-gradient-to-br flex items-center justify-center", accentClasses[accent])}>
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}
