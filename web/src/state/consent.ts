import { useSyncExternalStore } from 'react';

/** Consentimiento para guardar en el navegador lo que no es imprescindible (por ahora, la calculadora). */
export type Consent = 'accepted' | 'rejected' | null;

const CONSENT_KEY = 'vgc-tools-consent';
/** Claves que solo se guardan con consentimiento; se borran al rechazar. */
export const CALC_KEY = 'vgc-tools-calc';
const OPTIONAL_KEYS = [CALC_KEY];
const listeners = new Set<() => void>();

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent) {
  try {
    if (consent) localStorage.setItem(CONSENT_KEY, consent);
    else localStorage.removeItem(CONSENT_KEY);
    if (consent === 'rejected') OPTIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export const useConsent = () => useSyncExternalStore(subscribe, readConsent, () => null);
