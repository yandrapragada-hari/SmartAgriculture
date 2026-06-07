import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Power, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLiveSensor, sendPumpCommand } from "@/lib/sensorData";

export const Route = createFileRoute("/pump")({
  head: () => ({ meta: [{ title: "Pump Control — AgroSense" }] }),
  component: PumpPage,
});

function PumpPage() {
  const { reading } = useLiveSensor();
  const [confirming, setConfirming] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    if (confirming === null) return;
    setBusy(true);
    try {
      await sendPumpCommand(confirming);
      toast.success(`Pump turned ${confirming ? "ON" : "OFF"}`);
    } catch {
      toast.error("Failed to send command");
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-w-2xl">
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold">Manual Pump Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Override automatic irrigation when needed.</p>
      </div>
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className={`size-16 rounded-2xl flex items-center justify-center ${reading?.pumpStatus ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
            <Power className="size-8" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current status</p>
            <p className="text-2xl font-bold">{reading?.pumpStatus ? "Pump ON" : "Pump OFF"}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="rounded-xl gradient-primary text-primary-foreground py-3 font-medium shadow-glow disabled:opacity-50"
          >
            Pump ON
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-xl bg-destructive text-destructive-foreground py-3 font-medium disabled:opacity-50"
          >
            Pump OFF
          </button>
        </div>
      </div>

      {confirming !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => !busy && setConfirming(null)}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-6 text-warning shrink-0" />
              <div>
                <h3 className="font-semibold">Confirm pump command</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to turn the pump <strong>{confirming ? "ON" : "OFF"}</strong>? The command will be sent to your ESP32.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirming(null)} className="flex-1 rounded-xl border border-border py-2 text-sm">Cancel</button>
              <button onClick={onConfirm} disabled={busy} className="flex-1 rounded-xl gradient-primary text-primary-foreground py-2 text-sm font-medium">
                {busy ? "Sending…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
