import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Cloud, Wifi, Droplet, Sprout, Globe } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Project — AgroSense" }] }),
  component: AboutPage,
});

const FEATURES = [
  { icon: Droplet, title: "Automatic Irrigation", desc: "Soil moisture sensor triggers the pump without manual input." },
  { icon: Sprout, title: "Real-Time Monitoring", desc: "Live temperature, humidity, and soil data from the field." },
  { icon: Cloud, title: "Cloud Data Storage", desc: "Firebase Realtime Database stores history for analysis." },
  { icon: Globe, title: "Remote Access Dashboard", desc: "Access from any device, anywhere." },
  { icon: Leaf, title: "Water Conservation", desc: "Water only when crops need it — no waste." },
  { icon: Wifi, title: "Smart Agriculture", desc: "End-to-end IoT pipeline built with ESP32 + React." },
];

function AboutPage() {
  return (
    <div className="space-y-6 pt-2">
      <section className="gradient-hero rounded-2xl p-8 text-primary-foreground shadow-glow">
        <p className="text-sm opacity-90">B.Tech Research Project</p>
        <h1 className="text-3xl font-bold mt-1">Smart Agriculture Monitoring and Automatic Irrigation System using IoT</h1>
        <p className="mt-3 max-w-2xl opacity-90">
          Objective: To automate irrigation using soil moisture sensing and provide real-time crop monitoring through IoT technology.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-5">
            <div className="size-11 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-lg">Technology Stack</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {["ESP32", "DHT11 / DHT22", "Soil Moisture Sensor", "Relay + Water Pump", "Firebase Realtime DB", "React.js", "Tailwind CSS", "Recharts"].map((t) => (
            <span key={t} className="px-3 py-1 rounded-full bg-accent text-accent-foreground">{t}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
