import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/sensorData";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — AgroSense" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, save] = useSettings();
  const [draft, setDraft] = useState(settings);

  const update = (k: keyof typeof draft, v: number) => setDraft({ ...draft, [k]: v });

  return (
    <div className="space-y-6 pt-2 max-w-2xl">
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure thresholds for alerts and automatic irrigation.</p>
      </div>
      <div className="glass rounded-2xl p-6 space-y-6">
        <Field label="Soil Moisture Threshold (%)" value={draft.soilThreshold} onChange={(v) => update("soilThreshold", v)} min={5} max={90} hint="Pump activates below this value." />
        <Field label="Temperature Alert (°C)" value={draft.tempThreshold} onChange={(v) => update("tempThreshold", v)} min={20} max={60} hint="Alert when temperature exceeds this value." />
        <Field label="Humidity Alert (%)" value={draft.humidityThreshold} onChange={(v) => update("humidityThreshold", v)} min={5} max={80} hint="Alert when humidity drops below this value." />
        <button
          onClick={() => { save(draft); toast.success("Settings saved"); }}
          className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow-glow"
        >
          <Save className="size-4" /> Save Settings
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; hint?: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span className="tabular-nums text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-primary"
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
