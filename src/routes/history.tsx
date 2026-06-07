import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, FileText, Database } from "lucide-react";
import { toast } from "sonner";
import { useHistory } from "@/lib/sensorData";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Data History — AgroSense" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history, historyLoaded, totalRecords } = useHistory();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");

  const rows = useMemo(() => {
    return [...history].reverse().filter((r) => {
      const ts = new Date(r.timestamp);
      if (date && ts.toISOString().slice(0, 10) !== date) return false;
      if (q) {
        const text =
          `${r.temperature} ${r.humidity} ${r.soilMoisture} ${r.soilCondition} ${r.pumpStatus ? "on" : "off"}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [history, q, date]);

  const hasData = history.length > 0;
  const hasFilteredData = rows.length > 0;

  const exportCSV = () => {
    if (!hasData) return;
    const header =
      "Timestamp,Temperature(°C),Humidity(%),SoilMoisture(%),PumpStatus,SoilCondition";
    const body = rows
      .map((r) =>
        [
          new Date(r.timestamp).toISOString(),
          r.temperature,
          r.humidity,
          r.soilMoisture,
          r.pumpStatus ? "ON" : "OFF",
          r.soilCondition,
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agrosense-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exported — ${rows.length} records`);
  };

  const exportPDF = async () => {
    if (!hasData) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AgroSense — ESP32 Sensor Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Firebase DB: smartagriculture-590e6-default-rtdb.firebaseio.com`, 14, 32);
    doc.text(`Records exported: ${rows.length}`, 14, 38);
    let y = 48;
    doc.setFontSize(9);
    doc.text("Time", 14, y);
    doc.text("Temp", 70, y);
    doc.text("Hum", 90, y);
    doc.text("Soil", 110, y);
    doc.text("Pump", 130, y);
    doc.text("Cond", 155, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;
    rows.slice(0, 60).forEach((r) => {
      doc.text(new Date(r.timestamp).toLocaleTimeString(), 14, y);
      doc.text(`${r.temperature}°C`, 70, y);
      doc.text(`${r.humidity}%`, 90, y);
      doc.text(`${r.soilMoisture}`, 110, y);
      doc.text(r.pumpStatus ? "ON" : "OFF", 130, y);
      doc.text(r.soilCondition, 155, y);
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`agrosense-report-${Date.now()}.pdf`);
    toast.success("PDF report downloaded");
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="glass rounded-2xl p-5">
        <h1 className="text-2xl font-bold">Data History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hasData
            ? `${totalRecords} of up to 500 latest readings loaded from Firebase — browse, search and export.`
            : "ESP32 sensor history from Firebase Realtime Database."}
        </p>
        {hasData && (
          <p className="text-xs text-muted-foreground mt-1">
            📅 {new Date(history[0].timestamp).toLocaleString()} → {new Date(history[history.length - 1].timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {/* Loading state */}
      {!historyLoaded && (
        <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Database className="size-10 opacity-30 animate-pulse" />
          <p className="text-sm">Loading sensor history from Firebase…</p>
        </div>
      )}

      {/* Empty state — no records in Firebase yet */}
      {historyLoaded && !hasData && (
        <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
          <Database className="size-12 opacity-20" />
          <p className="text-lg font-semibold">No Sensor Data Recorded Yet</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your ESP32 sensor history will appear here once it starts logging
            readings to{" "}
            <span className="font-mono text-xs">/History/records</span> in
            Firebase. Connect your ESP32 and start monitoring.
          </p>
          <div className="mt-2 px-4 py-2 rounded-xl bg-muted text-xs font-mono text-muted-foreground">
            smartagriculture-590e6-default-rtdb.firebaseio.com/History/records
          </div>
        </div>
      )}

      {/* Data table — only shown when Firebase has records */}
      {historyLoaded && hasData && (
        <div className="glass rounded-2xl p-5">
          {/* Filters + Export toolbar */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search readings…"
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={exportCSV}
              disabled={!hasFilteredData}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-4" /> CSV ({rows.length})
            </button>
            <button
              onClick={exportPDF}
              disabled={!hasFilteredData}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="size-4" /> PDF Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 pr-4 font-medium">Timestamp</th>
                  <th className="py-2 pr-4 font-medium">Temp (°C)</th>
                  <th className="py-2 pr-4 font-medium">Humidity (%)</th>
                  <th className="py-2 pr-4 font-medium">Soil (%)</th>
                  <th className="py-2 pr-4 font-medium">Pump</th>
                  <th className="py-2 pr-4 font-medium">Condition</th>
                </tr>
              </thead>
              <tbody>
                {!hasFilteredData && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No records match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="py-2 pr-4 tabular-nums">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{r.temperature}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.humidity}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.soilMoisture}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          r.pumpStatus
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.pumpStatus ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          r.soilCondition === "Dry"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-success/15 text-success"
                        }`}
                      >
                        {r.soilCondition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
