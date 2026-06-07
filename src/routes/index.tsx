import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import {
  Thermometer,
  Droplets,
  Sprout,
  Power,
  Clock,
  Droplet,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  Camera,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { SensorCard } from "@/components/SensorCard";
import { SensorChart } from "@/components/SensorChart";
import { AlertsPanel } from "@/components/AlertsPanel";
import { useLiveSensor, useHistory, useSettings, useStats } from "@/lib/sensorData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgroSense IoT" },
      {
        name: "description",
        content:
          "Live ESP32 sensor monitoring and smart irrigation control powered by Firebase Realtime Database.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { reading, online, status, lastUpdate } = useLiveSensor();
  const { history, historyLoaded, totalRecords } = useHistory();
  const [settings] = useSettings();
  const { lastIrrigation, irrigationsToday } = useStats();
  const captureRef = useRef<HTMLDivElement>(null);

  const takeScreenshot = async () => {
    if (!captureRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(captureRef.current, {
      backgroundColor: null,
    });
    const link = document.createElement("a");
    link.download = `agrosense-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Dashboard screenshot saved");
  };

  return (
    <div ref={captureRef} className="space-y-6 pt-2">
      {/* Hero */}
      <section className="gradient-hero rounded-2xl p-6 sm:p-8 text-primary-foreground shadow-glow relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm opacity-90">Smart Agriculture Monitoring</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              AgroSense — Live Field Dashboard
            </h1>
            <p className="text-sm opacity-85 mt-2 max-w-xl">
              Real-time crop monitoring and automatic irrigation powered by ESP32
              + Firebase Realtime Database.
            </p>
          </div>
          <button
            onClick={takeScreenshot}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md px-4 py-2 text-sm font-medium transition-colors"
          >
            <Camera className="size-4" /> Screenshot
          </button>
        </div>
      </section>

      {/* Connection / waiting banner — shown when no ESP32 data yet */}
      {status !== "live" && <WaitingBanner status={status} />}

      {/* Sensor Cards — show "—" until real data arrives */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SensorCard
          label="Temperature"
          value={reading ? reading.temperature.toFixed(1) : "—"}
          unit={reading ? "°C" : undefined}
          icon={Thermometer}
          accent="rose"
          hint={reading ? undefined : "Waiting for ESP32…"}
        />
        <SensorCard
          label="Humidity"
          value={reading ? reading.humidity.toFixed(0) : "—"}
          unit={reading ? "%" : undefined}
          icon={Droplets}
          accent="blue"
          hint={reading ? undefined : "Waiting for ESP32…"}
        />
        <SensorCard
          label="Soil Moisture"
          value={reading ? reading.soilMoisture.toFixed(0) : "—"}
          unit={undefined}
          icon={Sprout}
          accent="primary"
          hint={
            reading
              ? `Condition: ${reading.soilCondition} · Raw ADC`
              : "Waiting for ESP32…"
          }
        />
        <SensorCard
          label="Water Pump"
          value={reading ? (reading.pumpStatus ? "ON" : "OFF") : "—"}
          icon={Power}
          accent="amber"
          hint={
            reading
              ? reading.pumpStatus
                ? "Irrigating now"
                : "Idle"
              : "Waiting for ESP32…"
          }
        />
      </section>

      {/* Alerts + Connection Status */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Irrigation quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Droplet className="size-4" /> Soil Condition
              </div>
              {reading ? (
                <p
                  className={`mt-2 text-2xl font-bold ${
                    reading.soilCondition === "Dry"
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {reading.soilCondition}
                </p>
              ) : (
                <p className="mt-2 text-lg font-semibold text-muted-foreground">
                  —
                </p>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="size-4" /> Last Irrigation
              </div>
              <p className="mt-2 text-lg font-semibold">
                {lastIrrigation
                  ? new Date(lastIrrigation).toLocaleTimeString()
                  : "—"}
              </p>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Power className="size-4" /> Irrigations Today
              </div>
              <p className="mt-2 text-2xl font-bold">
                {irrigationsToday > 0 ? irrigationsToday : "—"}
              </p>
            </div>
          </div>

          {/* Alerts panel — only shown when real data exists */}
          {reading && (
            <AlertsPanel
              reading={reading}
              online={online}
              settings={settings}
            />
          )}
        </div>

        {/* ESP32 / Firebase Connection Status Panel */}
        <ConnectionStatusPanel
          status={status}
          lastUpdate={lastUpdate}
          reading={reading}
        />
      </section>

      {/* Charts — only rendered when real Firebase history data exists */}
      {historyLoaded && history.length > 0 ? (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SensorChart
            title="Temperature History"
            data={history}
            dataKey="temperature"
            color="var(--chart-4)"
            unit="°C"
          />
          <SensorChart
            title="Humidity History"
            data={history}
            dataKey="humidity"
            color="var(--chart-2)"
            unit="%"
          />
          <SensorChart
            title="Soil Moisture History"
            data={history}
            dataKey="soilMoisture"
            color="var(--chart-1)"
            unit="%"
          />
        </section>
      ) : (
        historyLoaded && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <NoChartData title="Temperature History" />
            <NoChartData title="Humidity History" />
            <NoChartData title="Soil Moisture History" />
          </section>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waiting Banner — shown when ESP32 has not sent any data yet
// ---------------------------------------------------------------------------
function WaitingBanner({
  status,
}: {
  status: "connecting" | "waiting_data" | "stale" | "error" | "live";
}) {
  if (status === "live") return null;

  const configs = {
    connecting: {
      icon: Loader2,
      spin: true,
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300",
      title: "Connecting to Firebase…",
      message:
        "Establishing connection to the Firebase Realtime Database. Please wait.",
    },
    waiting_data: {
      icon: Wifi,
      spin: false,
      bg: "bg-warning/10 border-warning/30 text-warning-foreground",
      title: "Waiting for ESP32 Sensor Data",
      message:
        "Firebase is connected. No sensor data received yet. Make sure your ESP32 is powered on and connected to WiFi, and that it is writing to /SensorData in Firebase.",
    },
    stale: {
      icon: WifiOff,
      spin: false,
      bg: "bg-destructive/10 border-destructive/30 text-destructive",
      title: "ESP32 Connection Lost",
      message:
        "No new sensor data has been received for more than 15 seconds. Check your ESP32 device and WiFi connection.",
    },
    error: {
      icon: AlertCircle,
      spin: false,
      bg: "bg-destructive/10 border-destructive/30 text-destructive",
      title: "Firebase Connection Error",
      message:
        "Unable to connect to Firebase Realtime Database. Check your network connection and Firebase project settings.",
    },
  };

  const cfg = configs[status];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.bg}`}>
      <Icon
        className={`size-5 mt-0.5 shrink-0 ${cfg.spin ? "animate-spin" : ""}`}
      />
      <div>
        <p className="font-semibold text-sm">{cfg.title}</p>
        <p className="text-xs opacity-80 mt-1">{cfg.message}</p>
        <p className="text-xs opacity-60 mt-1">
          Firebase URL: https://smartagriculture-590e6-default-rtdb.firebaseio.com
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection Status Panel — replaces the fake "weather" card
// ---------------------------------------------------------------------------
function ConnectionStatusPanel({
  status,
  lastUpdate,
  reading,
}: {
  status: string;
  lastUpdate: number | null;
  reading: ReturnType<typeof useLiveSensor>["reading"];
}) {
  const isLive = status === "live";
  const isStale = status === "stale";

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Activity className="size-4" /> Connection Status
      </div>

      {/* Firebase status */}
      <div className="flex items-center gap-3">
        <span className="size-2.5 rounded-full bg-success shadow-[0_0_8px_var(--success)]" />
        <div>
          <p className="text-xs text-muted-foreground">Firebase Database</p>
          <p className="text-sm font-semibold">Connected</p>
        </div>
      </div>

      {/* ESP32 status */}
      <div className="flex items-center gap-3">
        <span
          className={`size-2.5 rounded-full ${
            isLive
              ? "bg-success shadow-[0_0_8px_var(--success)]"
              : isStale
                ? "bg-destructive"
                : "bg-warning"
          }`}
        />
        <div>
          <p className="text-xs text-muted-foreground">ESP32 Device</p>
          <p className="text-sm font-semibold">
            {isLive ? "Online — Sending Data" : isStale ? "Offline / Timeout" : "Waiting…"}
          </p>
        </div>
      </div>

      {/* Last update */}
      <div className="border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Last Data Received</p>
        <p className="text-sm font-semibold mt-0.5">
          {lastUpdate
            ? new Date(lastUpdate).toLocaleTimeString()
            : "No data yet"}
        </p>
      </div>

      {/* Timestamp from ESP32 */}
      {reading?.timestamp && (
        <div>
          <p className="text-xs text-muted-foreground">ESP32 Timestamp</p>
          <p className="text-sm font-semibold mt-0.5">
            {new Date(reading.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xs text-muted-foreground break-all">
          smartagriculture-590e6-default-rtdb.firebaseio.com
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// No Chart Data placeholder
// ---------------------------------------------------------------------------
function NoChartData({ title }: { title: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Activity className="size-8 opacity-30" />
        <p className="text-sm font-medium">No Data Available</p>
        <p className="text-xs text-center opacity-70">
          Chart will appear once ESP32 starts sending data to Firebase.
        </p>
      </div>
    </div>
  );
}
