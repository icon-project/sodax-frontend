'use client';

import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import { getCookieConsentConfig } from './cookie-consent-config';

export function CookieConsentBanner() {
  useEffect(() => {
    const regionCookie = document.cookie.split('; ').find((row) => row.startsWith('cookie_consent_region='));
    const region = regionCookie?.split('=')[1];

    // Only initialize cookie consent for EU/EEA/UK visitors
    if (region !== 'eu') return;

    CookieConsent.run(getCookieConsentConfig());
  }, []);

  return null;
}

/**
 * Opens the cookie preferences modal.
 */
export function showCookiePreferences() {
  CookieConsent.showPreferences();
}
