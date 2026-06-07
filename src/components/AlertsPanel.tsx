import { AlertTriangle, CheckCircle2, ThermometerSun, Droplets, WifiOff } from "lucide-react";
import type { SensorReading, Settings } from "@/lib/sensorData";
import { cn } from "@/lib/utils";

interface Props {
  reading: SensorReading | null;
  online: boolean;
  settings: Settings;
}

interface Alert {
  level: "success" | "warning" | "danger";
  icon: typeof AlertTriangle;
  title: string;
  message: string;
}

export function AlertsPanel({ reading, online, settings }: Props) {
  const alerts: Alert[] = [];
  if (!online) {
    alerts.push({
      level: "danger",
      icon: WifiOff,
      title: "ESP32 Offline",
      message: "Lost connection to the device. Check power and Wi-Fi.",
    });
  }
  if (reading) {
    if (reading.soilCondition === "Dry") {
      alerts.push({
        level: "danger",
        icon: AlertTriangle,
        title: "Soil is Dry — Irrigation Activated",
        message: `Soil moisture ${reading.soilMoisture}% (threshold ${settings.soilThreshold}%).`,
      });
    } else {
      alerts.push({
        level: "success",
        icon: CheckCircle2,
        title: "Soil Moisture Sufficient",
        message: `Soil moisture ${reading.soilMoisture}% — crop is well watered.`,
      });
    }
    if (reading.temperature > settings.tempThreshold) {
      alerts.push({
        level: "warning",
        icon: ThermometerSun,
        title: "High Temperature",
        message: `Temperature ${reading.temperature}°C exceeds ${settings.tempThreshold}°C.`,
      });
    }
    if (reading.humidity < settings.humidityThreshold) {
      alerts.push({
        level: "warning",
        icon: Droplets,
        title: "Low Humidity",
        message: `Humidity ${reading.humidity}% below ${settings.humidityThreshold}%.`,
      });
    }
  }

  const styles: Record<Alert["level"], string> = {
    success: "bg-success/10 border-success/30 text-success",
    warning: "bg-warning/15 border-warning/40 text-warning-foreground",
    danger: "bg-destructive/10 border-destructive/30 text-destructive",
  };

  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <div key={i} className={cn("rounded-xl border p-4 flex gap-3 items-start", styles[a.level])}>
          <a.icon className="size-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-xs opacity-80 mt-0.5">{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
