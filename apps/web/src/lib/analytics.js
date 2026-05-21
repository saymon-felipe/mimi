let posthogClient = null;
let initPromise = null;
const pendingEvents = [];

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

export async function initAnalytics() {
  if (!POSTHOG_KEY) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = import('posthog-js')
    .then((module) => {
      posthogClient = module.default;
      posthogClient.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        persistence: 'localStorage+cookie'
      });

      pendingEvents.splice(0).forEach(({ name, properties }) => {
        posthogClient.capture(name, properties);
      });
    })
    .catch((error) => {
      posthogClient = null;
      pendingEvents.length = 0;
      console.warn('PostHog não foi inicializado.', error);
    });

  return initPromise;
}

export function captureEvent(name, properties = {}) {
  if (!POSTHOG_KEY) {
    return;
  }

  if (!posthogClient) {
    pendingEvents.push({ name, properties });
    void initAnalytics();
    return;
  }

  posthogClient.capture(name, properties);
}

export function getAttribution() {
  const params = new URLSearchParams(window.location.search);

  return {
    source: 'landing',
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    referrer: document.referrer || ''
  };
}
