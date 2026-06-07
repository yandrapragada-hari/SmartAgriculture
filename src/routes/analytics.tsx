import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Thermometer,
  Droplets,
  Sprout,
  Power,
  Activity,
  BarChart3,
} from "lucide-react";
import { useHistory, useStats } from "@/lib/sensorData";
import { SensorCard } from "@/components/SensorCard";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AgroSense" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { history, historyLoaded, totalRecords } = useHistory();
  const { pumpActivations, irrigationsToday } = useStats();

  // Averages computed strictly from real Firebase history records
  const stats = useMemo(() => {
    if (!history.length) return null; // null means no data — never show fake zeros
    const t = history.reduce((a, r) => a + r.temperature, 0) / history.length;
    const h = history.reduce((a, r) => a + r.humidity, 0) / history.length;
    const s = history.reduce((a, r) => a + r.soilMoisture, 0) / history.length;
    return { t, h, s };
  }, [history]);

  // Show loading state while Firebase query is in flight
  if (!historyLoaded) {
    return (
      <div className="space-y-6 pt-2">
        <div className="glass rounded-2xl p-5">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Loading analytics from Firebase…
          </p>
        </div>
        <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-muted-foreground">
          <BarChart3 className="size-10 opacity-30 animate-pulse" />
          <p className="text-sm">Fetching sensor history from Firebase…</p>
        </div>
      </div>
    );
  }

  // Show empty state when Firebase has no history records yet
  if (history.length === 0) {
    return (
      <div className="space-y-6 pt-2">
        <div className="glass rounded-2xl p-5">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Statistical averages and irrigation totals from ESP32 sensor history.
          </p>
        </div>
        <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <BarChart3 className="size-12 opacity-20" />
          <p className="text-lg font-semibold">No Data Available</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Analytics will appear once your ESP32 begins logging sensor readings
            to <span className="font-mono text-xs">/History/records</span> in
            Firebase. Connect your ESP32 and wait for data to arrive.
          </p>
        </div>
      </div>
    );
  }

  // Real analytics — all values derived from Firebase history
  return (
    <div className="space-y-6 pt-2">
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Averages and totals across {history.length} real sensor readings from
          Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <SensorCard
          label="Avg Temperature"
          value={stats ? stats.t.toFixed(1) : "—"}
          unit={stats ? "°C" : undefined}
          icon={Thermometer}
          accent="rose"
          hint="Average across all Firebase records"
        />
        <SensorCard
          label="Avg Humidity"
          value={stats ? stats.h.toFixed(0) : "—"}
          unit={stats ? "%" : undefined}
          icon={Droplets}
          accent="blue"
          hint="Average across all Firebase records"
        />
        <SensorCard
          label="Avg Soil Moisture"
          value={stats ? stats.s.toFixed(0) : "—"}
          unit={undefined}
          icon={Sprout}
          accent="primary"
          hint="Average raw ADC value across all records"
        />
        <SensorCard
          label="Pump Activations"
          value={pumpActivations}
          icon={Power}
          accent="amber"
          hint="Total records where pump was ON"
        />
        <SensorCard
          label="Sessions Today"
          value={irrigationsToday}
          icon={Activity}
          accent="primary"
          hint="Pump-ON records from today"
        />
      </div>

      {/* Record count summary */}
      <div className="glass rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalRecords}</span>{" "}
          sensor readings loaded from Firebase{" "}
          <span className="font-mono text-xs">/History</span>.{" "}
          {totalRecords === 500 && (
            <span>Showing latest 500 records (query limit). Older records stored in Firebase.</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          First record:{" "}
          {new Date(history[0].timestamp).toLocaleString()} — Last record:{" "}
          {new Date(history[history.length - 1].timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
