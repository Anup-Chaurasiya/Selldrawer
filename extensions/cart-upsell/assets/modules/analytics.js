export const Analytics = {
  shop: window.Shopify?.shop || window.location.hostname,
  appUrl: null,
  
  init(appUrl) {
    this.appUrl = appUrl;
  },
  
  getSessionId() {
    try {
      let sessionId = sessionStorage.getItem('upsellity_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('upsellity_session_id', sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'sess_' + Date.now();
    }
  },

  track(event) {
    // Don't track if shop or appUrl is not available
    if (!this.shop) {
      console.warn('[Upsellity Analytics] Shop not detected, skipping tracking');
      return;
    }
    
    if (!this.appUrl) {
      console.warn('[Upsellity Analytics] App URL not configured, skipping tracking');
      return;
    }

    const payload = {
      shop: this.shop,
      events: [{
        ...event,
        sessionId: this.getSessionId(),
        url: window.location.href
      }]
    };

    // Use the configured app URL
    const apiUrl = `${this.appUrl}/api/analytics`;

    // Log for debugging
    console.log('[Upsellity Analytics]', event.eventType, event.component, payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon(apiUrl, blob);
      if (!sent) {
        console.warn('[Upsellity Analytics] sendBeacon failed, falling back to fetch');
        this.fallbackFetch(apiUrl, payload);
      }
    } else {
      this.fallbackFetch(apiUrl, payload);
    }
  },

  fallbackFetch(apiUrl, payload) {
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(response => {
      if (!response.ok) {
        console.error('[Upsellity Analytics] API error:', response.status, apiUrl);
      }
    }).catch(err => console.error('[Upsellity Analytics] Fetch error:', err));
  }
};

