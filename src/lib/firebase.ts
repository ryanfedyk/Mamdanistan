import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

/**
 * Firebase bootstrap for Mamdanistan.
 *
 * Note: a Firebase *web* config is not a secret — it ships to the browser by
 * design and only identifies the project. Real security lives in Firebase
 * Security Rules + App Check, and (optionally) an API-key referrer restriction
 * in the Google Cloud console. We still read from NEXT_PUBLIC_* env vars so the
 * project is configurable per environment, falling back to the known values.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyB6jx3F_uEfgUtm0O2hW7RBzMKVuRRsEI4",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "mamdanistan.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "mamdanistan",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "mamdanistan.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "508063519816",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:508063519816:web:70e64beb3526ec4ec6747d",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-9JDCKSLG1C",
};

/**
 * Idempotent init — Next.js fast-refresh and multiple imports must not
 * re-initialize the app (Firebase throws on duplicate default apps).
 */
export const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

/**
 * Analytics is browser-only and requires a supported environment (it needs
 * cookies/IndexedDB and a measurementId). Returns null on the server or where
 * unsupported, so callers can `await` it safely from anywhere.
 */
export async function getAnalyticsClient(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}
