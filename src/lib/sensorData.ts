/**
 * sensorData.ts — AgroSense IoT Data Layer
 *
 * SINGLE SOURCE OF TRUTH: Firebase Realtime Database
 * URL: https://smartagriculture-590e6-default-rtdb.firebaseio.com
 *
 * ALL data displayed on the dashboard originates exclusively from:
 *   ESP32 Hardware → Firebase Realtime DB → These hooks → Dashboard UI
 *
 * Firebase structure (as written by ESP32):
 *
 * SensorData/           ← latest reading, overwritten every cycle
 *   temperature         number (°C)
 *   humidity            number (%)
 *   soilMoisture        number (raw ADC, e.g. 1151)
 *   pumpStatus          "ON" | "OFF"  (string from ESP32)
 *   soilCondition       "WET" | "DRY" (string from ESP32, optional)
 *   timestamp           Unix epoch ms (optional)
 *
 * History/              ← append-only log, one push key per reading
 *   -OVxxx/
 *     temperature / humidity / soilMoisture / pumpStatus / soilCondition / timestamp
 */

import { useEffect, useState } from "react";
import { getFirebase } from "./firebase";
import {
  ref,
  onValue,
  set,
  push,
  query,
  limitToLast,
  off,
} from "firebase/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SensorReading {
  temperature: number;
  humidity: number;
  soilMoisture: number;    // raw ADC from ESP32 (e.g. 0–4095), NOT a percentage
  pumpStatus: boolean;     // true = ON, false = OFF
  soilCondition: "Dry" | "Wet";
  timestamp: number;       // Unix epoch ms
}

export interface Settings {
  soilThreshold: number;
  tempThreshold: number;
  humidityThreshold: number;
}

export type ConnectionStatus =
  | "connecting"    // Firebase SDK initialising
  | "waiting_data"  // Firebase connected, listener active, no ESP32 data yet
  | "live"          // Real ESP32 data received and fresh (< 15 s old)
  | "stale"         // Last data > 15 s old — ESP32 may be offline
  | "error";        // Firebase listener returned a network/auth error

// ---------------------------------------------------------------------------
// Helpers — normalise ESP32 field formats
// ---------------------------------------------------------------------------

/**
 * ESP32 writes pumpStatus as the string "ON" or "OFF".
 * Normalise to boolean regardless of type (string, boolean, number).
 */
function parsePumpStatus(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toUpperCase() === "ON";
  if (typeof v === "number") return v !== 0;
  return false;
}

/**
 * ESP32 writes soilCondition as "WET" or "DRY" (uppercase).
 * Normalise to the internal "Wet" | "Dry" union.
 */
function parseSoilCondition(v: unknown): "Dry" | "Wet" {
  if (typeof v === "string") {
    return v.toUpperCase() === "DRY" ? "Dry" : "Wet";
  }
  return "Wet"; // safe default when field is missing
}

/**
 * Build a normalised SensorReading from a raw Firebase snapshot value.
 * Handles missing fields (e.g. soilCondition / timestamp not always present).
 */
function parseReading(v: Record<string, unknown>): SensorReading {
  return {
    temperature: Number(v.temperature) || 0,
    humidity: Number(v.humidity) || 0,
    soilMoisture: Number(v.soilMoisture) || 0,
    pumpStatus: parsePumpStatus(v.pumpStatus),
    soilCondition: parseSoilCondition(v.soilCondition),
    timestamp: Number(v.timestamp) || Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Default Settings (thresholds only — never sensor values)
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Settings = {
  soilThreshold: 35,
  tempThreshold: 40,
  humidityThreshold: 20,
};

// ---------------------------------------------------------------------------
// Settings — localStorage cache + Firebase sync
// ---------------------------------------------------------------------------

const SETTINGS_KEY = "sa-iot-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  const { db } = getFirebase();
  set(ref(db, "Settings"), s).catch(() => {});
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());

    const { db } = getFirebase();
    const r = ref(db, "Settings");
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (v) {
        const merged = { ...DEFAULT_SETTINGS, ...v };
        setSettings(merged);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      }
    });
    return () => off(r, "value", unsub);
  }, []);

  const update = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  return [settings, update] as const;
}

// ---------------------------------------------------------------------------
// Live Sensor Hook — reads /SensorData (latest reading from ESP32)
// ---------------------------------------------------------------------------

export function useLiveSensor() {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const { db } = getFirebase();
    const r = ref(db, "SensorData");

    setStatus("connecting");

    const unsub = onValue(
      r,
      (snap) => {
        const v = snap.val();
        // Accept any object that has at least a numeric temperature field
        if (v && (typeof v.temperature === "number" || typeof v.temperature === "string")) {
          const parsed = parseReading(v as Record<string, unknown>);
          setReading(parsed);
          setLastUpdate(Date.now());
          setStatus("live");
        } else {
          // Firebase responded but no valid ESP32 data is present yet
          setStatus("waiting_data");
        }
      },
      () => {
        setStatus("error");
      },
    );

    return () => off(r, "value", unsub);
  }, []);

  // Mark as stale if no update received for > 30 seconds
  // (ESP32 writes every 10 s — 30 s gives 2 missed cycles before alerting)
  useEffect(() => {
    if (lastUpdate === null) return;
    const interval = setInterval(() => {
      if (Date.now() - lastUpdate > 30_000) {
        setStatus((prev) => (prev === "live" ? "stale" : prev));
      }
    }, 5_000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const online = status === "live";

  return { reading, online, status, lastUpdate };
}

// ---------------------------------------------------------------------------
// History Hook — reads /History (all push-key records from ESP32)
//
// ESP32 writes: POST /History.json  → creates -OVxxxxx push keys
// Dashboard reads: onValue("/History") → all records, sorted by timestamp
// ---------------------------------------------------------------------------

export function useHistory() {
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const { db } = getFirebase();
    // Read directly from /History — this is where ESP32 POSTs each reading
    // limitToLast(500) keeps the query fast while covering ~83 minutes of 10-s readings
    const r = query(ref(db, "History"), limitToLast(500));

    const unsub = onValue(r, (snap) => {
      setHistoryLoaded(true);
      const v = snap.val();
      if (v) {
        const arr = Object.values(v as Record<string, Record<string, unknown>>).map(parseReading);
        arr.sort((a, b) => a.timestamp - b.timestamp);
        setHistory(arr);
        setTotalRecords(arr.length);
      } else {
        setHistory([]);
        setTotalRecords(0);
      }
    });

    return () => off(r, "value", unsub);
  }, []);

  return { history, historyLoaded, totalRecords };
}

// ---------------------------------------------------------------------------
// Stats Hook — derived from Firebase History records
// ---------------------------------------------------------------------------

export function useStats() {
  const { history } = useHistory();

  const todayStr = new Date().toDateString();

  const pumpActivations = history.filter((r) => r.pumpStatus).length;

  const irrigationsToday = history.filter(
    (r) => r.pumpStatus && new Date(r.timestamp).toDateString() === todayStr,
  ).length;

  const irrigationRecords = history.filter((r) => r.pumpStatus);
  const lastIrrigation =
    irrigationRecords.length > 0
      ? irrigationRecords[irrigationRecords.length - 1].timestamp
      : null;

  return { pumpActivations, lastIrrigation, irrigationsToday };
}

// ---------------------------------------------------------------------------
// Pump Control — writes to Firebase; ESP32 polls SensorData/pumpStatus
// Writes "ON" / "OFF" strings to match the ESP32's expected format
// ---------------------------------------------------------------------------

export async function sendPumpCommand(on: boolean) {
  const { db } = getFirebase();

  // Write "ON" / "OFF" string — matches what ESP32 writes, so format stays consistent
  await set(ref(db, "SensorData/pumpStatus"), on ? "ON" : "OFF");

  // Audit log entry in /Commands
  await push(ref(db, "Commands"), {
    type: "pump",
    value: on ? "ON" : "OFF",
    timestamp: Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Re-export
// ---------------------------------------------------------------------------

export { isFirebaseConfigured } from "./firebase";
