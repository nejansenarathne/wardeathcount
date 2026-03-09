// firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Central Firebase service — import this anywhere you need live war data.
//
// Usage in any component:
//   import { subscribeToLatest } from './firebase';
//
//   useEffect(() => {
//     const unsub = subscribeToLatest((data) => setData(data));
//     return () => unsub();   // cleanup on unmount
//   }, []);
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }                  from "firebase/app";
import { getFirestore, doc, onSnapshot }  from "firebase/firestore";

// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyCU--3AYEMw2_eNLqBd_FQ6ur0SyhPgicI",
  authDomain:        "war-tracker-53841.firebaseapp.com",
  projectId:         "war-tracker-53841",
  storageBucket:     "war-tracker-53841.firebasestorage.app",
  messagingSenderId: "576287800786",
  appId:             "1:576287800786:web:77cb28364ae5b27e491c0b",
  measurementId:     "G-F1XQTCJVMG",
};

// ── Init (singleton — safe to import from multiple files) ─────────────────────
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── subscribeToLatest ─────────────────────────────────────────────────────────
/**
 * Subscribe to /war_tracker/latest in real-time.
 * Calls onData(data) immediately and whenever the scraper pushes new data.
 * Returns an unsubscribe function — always call it in useEffect cleanup.
 *
 * @param {(data: object) => void} onData
 * @param {(err: Error) => void}   onError  (optional)
 * @returns {() => void} unsubscribe
 */
export function subscribeToLatest(onData, onError) {
  const ref = doc(db, "war_tracker", "latest");
  return onSnapshot(
    ref,
    (snap) => { if (snap.exists()) onData(snap.data()); },
    (err)  => {
      console.error("[Firebase] snapshot error:", err);
      onError?.(err);
    }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format ISO string → "Mar 9, 2026, 11:47 AM GMT+5:30" */
export function formatUpdatedTime(iso) {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

/** "2m ago" / "1h ago" relative label */
export function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
