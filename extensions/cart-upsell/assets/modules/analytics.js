export const Analytics = {
  shop: window.Shopify?.shop || window.location.hostname,
  appUrl: null,
  version: 'default',  // Track cart drawer version

  init(appUrl) {
    this.appUrl = appUrl;
  },

  setVersion(version) {
    this.version = version || 'default';
  },

  getSessionId() {
    try {
      let sessionId = sessionStorage.getItem('selldrawer_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('selldrawer_session_id', sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'sess_' + Date.now();
    }
  },

  track(event) {
    // Don't track if shop or appUrl is not available
    if (!this.shop) {
      return;
    }

    if (!this.appUrl) {
      return;
    }

    const payload = {
      shop: this.shop,
      events: [{
        ...event,
        version: this.version,  // Include cart drawer version
        sessionId: this.getSessionId(),
        url: window.location.href
      }]
    };

    // Use the configured app URL
    const apiUrl = `${this.appUrl}/api/analytics`;

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const sent = navigator.sendBeacon(apiUrl, blob);
      if (!sent) {
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
      }
    }).catch(err => {});
  }
};

