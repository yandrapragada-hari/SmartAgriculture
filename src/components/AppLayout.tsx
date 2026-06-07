import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  History,
  BarChart3,
  Settings as SettingsIcon,
  Power,
  Activity,
  Info,
  Leaf,
  Moon,
  Sun,
  Menu,
  X,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { useLiveSensor } from "@/lib/sensorData";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/pump", label: "Pump Control", icon: Power },
  { to: "/health", label: "System Health", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/about", label: "About Project", icon: Info },
] as const;

export function AppLayout() {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const { online, status } = useLiveSensor();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const dateLabel =
    now instanceof Date
      ? now.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : "\u00a0";
  const timeLabel =
    now instanceof Date ? now.toLocaleTimeString() : "\u00a0";

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  // Derive connection pill appearance from status
  const connectionPill = (() => {
    if (status === "connecting") {
      return {
        className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
        icon: Loader2,
        spin: true,
        label: "Connecting…",
      };
    }
    if (status === "live") {
      return {
        className: "bg-success/15 text-success",
        icon: Wifi,
        spin: false,
        label: "ESP32 Online",
      };
    }
    if (status === "waiting_data") {
      return {
        className: "bg-warning/15 text-warning-foreground",
        icon: Wifi,
        spin: false,
        label: "Waiting for ESP32",
      };
    }
    // stale or error
    return {
      className: "bg-destructive/15 text-destructive",
      icon: WifiOff,
      spin: false,
      label: "ESP32 Offline",
    };
  })();

  const PillIcon = connectionPill.icon;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full glass m-3 rounded-2xl p-5 flex flex-col">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="size-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Leaf className="size-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold leading-tight">AgroSense</p>
              <p className="text-xs text-muted-foreground">Smart IoT Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=active]:shadow-glow"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Firebase status badge — always shows real connection */}
          <div className="mt-4 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success shadow-[0_0_6px_var(--success)]" />
              <span className="font-medium text-foreground">Firebase Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  online ? "bg-success" : status === "waiting_data" ? "bg-warning" : "bg-destructive"
                }`}
              />
              <span>
                ESP32:{" "}
                {online
                  ? "Online"
                  : status === "waiting_data"
                    ? "Waiting…"
                    : "Offline"}
              </span>
            </div>
            <p className="opacity-60 font-mono text-[10px] leading-tight break-all">
              smartagriculture-590e6-default-rtdb
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 px-4 sm:px-6 py-3">
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>

            {/* Date/time */}
            <div className="hidden sm:block min-w-[140px]">
              <p className="text-sm font-semibold">{dateLabel}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {timeLabel}
              </p>
            </div>

            <div className="flex-1" />

            {/* ESP32 / connection status pill */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                connectionPill.className,
              )}
            >
              <PillIcon
                className={`size-3.5 ${connectionPill.spin ? "animate-spin" : ""}`}
              />
              {connectionPill.label}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((v) => !v)}
              className="p-2 rounded-lg hover:bg-muted"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
