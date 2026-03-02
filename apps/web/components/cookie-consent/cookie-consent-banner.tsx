'use client';

import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { getCookieConsentConfig } from './cookie-consent-config';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  for (const cookie of document.cookie.split(';')) {
    const [rawKey, ...rest] = cookie.split('=');
    if (rawKey?.trim() === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  CookieConsent.run(getCookieConsentConfig());
}

export function CookieConsentBanner() {
  useEffect(() => {
    const region = getCookie('cookie_consent_region');

    // Only initialize cookie consent automatically for EU/EEA/UK visitors
    if (region !== 'eu') return;

    try {
      ensureInitialized();
    } catch (error) {
      console.error('Failed to initialize cookie consent banner:', error);
    }
  }, []);

  return null;
}

/**
 * Opens the cookie preferences modal.
 * Initializes the consent library on-demand if it hasn't been initialized yet
 * (e.g. when a non-EU user clicks "Cookie Settings" in the footer).
 */
export function showCookiePreferences() {
  try {
    ensureInitialized();
    CookieConsent.showPreferences();
  } catch (error) {
    console.error('Failed to open cookie preferences:', error);
  }
}
