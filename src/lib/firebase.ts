// Firebase configuration — AgroSense Smart Agriculture IoT Dashboard
// Project: smartagriculture-590e6
// Database: https://smartagriculture-590e6-default-rtdb.firebaseio.com
//
// Data Source: ESP32 → Firebase Realtime Database → Dashboard
// All sensor values originate exclusively from the ESP32 hardware.
// No simulation, no fallback data, no mock values.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyDmDpOGAFZqFeHhegkZ6__s2U1VykGtLTQ",
  authDomain: "smartagriculture-590e6.firebaseapp.com",
  databaseURL: "https://smartagriculture-590e6-default-rtdb.firebaseio.com",
  projectId: "smartagriculture-590e6",
  storageBucket: "smartagriculture-590e6.firebasestorage.app",
  messagingSenderId: "422110088150",
  appId: "1:422110088150:web:386d6c4b8c91b3d8817277",
};

// Always true — real credentials are hardcoded above.
export const isFirebaseConfigured = true;

let _app: FirebaseApp | null = null;
let _db: Database | null = null;

export function getFirebase(): { app: FirebaseApp; db: Database } {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
    _db = getDatabase(_app);
  }
  return { app: _app!, db: _db! };
}
