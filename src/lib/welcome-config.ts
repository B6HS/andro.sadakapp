/** Configuration d’accueil (borne installée PWA / APK WebView) — sadaq.app/android */

import { STORAGE_PREFIX } from "./brand";

export const WELCOME_DONE_KEY = `${STORAGE_PREFIX}_onboarding_done`;
export const WELCOME_CONFIG_KEY = `${STORAGE_PREFIX}_welcome_config`;

export type WelcomeConfig = {
  orgName: string;
  headline: string;
  body: string;
};

export function getWelcomeConfig(): WelcomeConfig | null {
  try {
    const raw = localStorage.getItem(WELCOME_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WelcomeConfig;
  } catch {
    return null;
  }
}

export function saveWelcomeConfig(config: WelcomeConfig): void {
  localStorage.setItem(WELCOME_CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(WELCOME_DONE_KEY, "1");
}

export function isWelcomeDone(): boolean {
  return localStorage.getItem(WELCOME_DONE_KEY) === "1";
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mq || ios;
}

/** WebView APK Android (interface native myPOS `Android`) */
export function isAndroidKioskWebView(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as { Android?: unknown }).Android;
}
