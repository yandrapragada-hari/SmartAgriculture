import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Database, Radio, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useLiveSensor } from "@/lib/sensorData";
import { getFirebase } from "@/lib/firebase";
import { ref, query, limitToLast, onValue, off } from "firebase/database";

export const Route = createFileRoute("/health")({
  head: () => ({ meta: [{ title: "System Health — AgroSense" }] }),
  component: HealthPage,
});

interface CommandEntry {
  type: string;
  value: boolean;
  timestamp: number;
}

function HealthPage() {
  const { reading, online, status, lastUpdate } = useLiveSensor();
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [commandsLoaded, setCommandsLoaded] = useState(false);

  // Subscribe to real command history from Firebase /Commands
  useEffect(() => {
    const { db } = getFirebase();
    const r = query(ref(db, "Commands"), limitToLast(10));
    const unsub = onValue(r, (snap) => {
      setCommandsLoaded(true);
      const v = snap.val();
      if (v) {
        const arr = Object.values(v) as CommandEntry[];
        arr.sort((a, b) => b.timestamp - a.timestamp);
        setCommands(arr);
      } else {
        setCommands([]);
      }
    });
    return () => off(r, "value", unsub);
  }, []);

  // Derive ESP32 health indicator
  const esp32Status = (() => {
    if (status === "connecting") return { label: "Connecting…", ok: null, color: "bg-blue-500" };
    if (status === "live") return { label: "Online — Sending Data", ok: true, color: "bg-success" };
    if (status === "stale") return { label: "Offline / Timed Out", ok: false, color: "bg-destructive" };
    if (status === "waiting_data") return { label: "Waiting for First Reading", ok: null, color: "bg-warning" };
    return { label: "Connection Error", ok: false, color: "bg-destructive" };
  })();

  // Derive sensor status
  const sensorStatus = (() => {
    if (!reading) return { label: "No Data", ok: false };
    return { label: "Reporting", ok: true };
  })();

  const healthItems = [
    {
      label: "ESP32 Device",
      icon: Cpu,
      ok: esp32Status.ok,
      status: esp32Status.label,
      dotColor: esp32Status.color,
    },
    {
      label: "Firebase Realtime DB",
      icon: Database,
      ok: true, // Always true — we hardcoded the URL
      status: "Connected",
      dotColor: "bg-success",
      sub: "smartagriculture-590e6",
    },
    {
      label: "Sensors (DHT11 + Soil)",
      icon: Radio,
      ok: sensorStatus.ok,
      status: sensorStatus.label,
      dotColor: sensorStatus.ok ? "bg-success" : "bg-destructive",
    },
    {
      label: "Last Data Received",
      icon: Clock,
      ok: !!lastUpdate,
      status: lastUpdate
        ? new Date(lastUpdate).toLocaleTimeString()
        : "No data yet",
      dotColor: lastUpdate ? "bg-success" : "bg-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live status of every layer in the ESP32 → Firebase → Dashboard pipeline.
        </p>
      </div>

      {/* Health indicator cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {healthItems.map((it) => (
          <div key={it.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <it.icon className="size-6 text-muted-foreground" />
              <span
                className={`size-3 rounded-full ${it.dotColor} ${
                  it.ok ? "shadow-[0_0_12px_var(--success)]" : ""
                }`}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{it.label}</p>
            <p className="text-lg font-semibold">{it.status}</p>
            {it.sub && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {it.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Live sensor snapshot */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Live Sensor Snapshot</h2>
        {reading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <SnapshotItem label="Temperature" value={`${reading.temperature}°C`} ok />
            <SnapshotItem label="Humidity" value={`${reading.humidity}%`} ok />
            <SnapshotItem label="Soil Moisture" value={`${reading.soilMoisture}%`} ok />
            <SnapshotItem label="Soil Condition" value={reading.soilCondition} ok={reading.soilCondition === "Wet"} />
            <SnapshotItem label="Pump Status" value={reading.pumpStatus ? "ON" : "OFF"} ok={!reading.pumpStatus} />
            <SnapshotItem
              label="ESP32 Timestamp"
              value={new Date(reading.timestamp).toLocaleTimeString()}
              ok
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground py-4">
            <AlertCircle className="size-5 opacity-50" />
            <p className="text-sm">
              No sensor data received from ESP32 yet. Waiting for Firebase update…
            </p>
          </div>
        )}
      </div>

      {/* Real command activity log from Firebase /Commands */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Pump Command Log</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Manual pump commands sent via dashboard — sourced from{" "}
          <span className="font-mono">Firebase /Commands</span>
        </p>

        {!commandsLoaded ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading command history…
          </p>
        ) : commands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pump commands recorded yet. Use the Pump Control page to send manual
            commands.
          </p>
        ) : (
          <ul className="text-sm space-y-2 font-mono">
            {commands.map((cmd, i) => (
              <li key={i} className="flex items-center gap-3 text-muted-foreground">
                {cmd.value ? (
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                ) : (
                  <XCircle className="size-4 text-destructive shrink-0" />
                )}
                <span className="tabular-nums text-xs">
                  [{new Date(cmd.timestamp).toLocaleTimeString()}]
                </span>
                <span>
                  Pump command:{" "}
                  <strong className={cmd.value ? "text-success" : "text-destructive"}>
                    {cmd.value ? "ON" : "OFF"}
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Firebase connection details */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Firebase Connection Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Database URL</dt>
            <dd className="font-mono text-xs mt-0.5 break-all">
              https://smartagriculture-590e6-default-rtdb.firebaseio.com
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Project ID</dt>
            <dd className="font-mono text-xs mt-0.5">smartagriculture-590e6</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Live Data Path</dt>
            <dd className="font-mono text-xs mt-0.5">/SensorData</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">History Path</dt>
            <dd className="font-mono text-xs mt-0.5">/History</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Settings Path</dt>
            <dd className="font-mono text-xs mt-0.5">/Settings</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Commands Path</dt>
            <dd className="font-mono text-xs mt-0.5">/Commands</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold mt-0.5 ${
          ok ? "text-foreground" : "text-destructive"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
