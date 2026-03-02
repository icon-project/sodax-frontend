import type { CookieConsentConfig } from 'vanilla-cookieconsent';

/**
 * Updates Google Consent Mode v2 signals via gtag().
 * Called from vanilla-cookieconsent callbacks when the user makes a consent choice.
 */
function updateGtagConsent(categories: string[]) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const hasMarketing = categories.includes('marketing');

  window.gtag('consent', 'update', {
    ad_storage: hasMarketing ? 'granted' : 'denied',
    ad_user_data: hasMarketing ? 'granted' : 'denied',
    ad_personalization: hasMarketing ? 'granted' : 'denied',
  });
}

export function getCookieConsentConfig(): CookieConsentConfig {
  return {
    cookie: {
      name: 'cc_cookie',
      expiresAfterDays: 365,
    },

    guiOptions: {
      consentModal: {
        layout: 'box wide',
        position: 'bottom center',
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: 'box',
        position: 'right',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },

    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      analytics: {
        enabled: true,
        readOnly: true, // Cookieless GA4 — always enabled, no user toggle needed
      },
      marketing: {
        enabled: false, // Denied by default for EU — gates X pixel and Reddit pixel
        readOnly: false,
      },
    },

    onFirstConsent: ({ cookie }) => {
      updateGtagConsent(cookie.categories);
    },
    onChange: ({ cookie }) => {
      updateGtagConsent(cookie.categories);
    },

    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description:
              'We use essential cookies for site functionality and optional marketing cookies for personalized ads. You can accept all or customize your preferences.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject non-essential',
            showPreferencesBtn: 'Manage preferences',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject non-essential',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            sections: [
              {
                title: 'Cookie usage',
                description:
                  'We use cookies to ensure basic site functionality and to enhance your experience. You can choose to opt in or out of each category.',
              },
              {
                title: 'Strictly necessary cookies',
                description:
                  'These cookies are essential for the website to function and cannot be switched off. They are set in response to your actions, such as setting privacy preferences or connecting a wallet.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Analytics cookies',
                description:
                  'We use cookieless analytics (Google Analytics 4) that do not store personal data on your device. This category is always enabled.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Marketing cookies',
                description:
                  'These cookies are used by advertising partners (such as X/Twitter and Reddit) to build a profile of your interests and show you relevant ads on other sites.',
                linkedCategory: 'marketing',
              },
            ],
          },
        },
      },
    },
  };
}
