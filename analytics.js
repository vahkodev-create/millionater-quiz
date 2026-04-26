(function () {
  const USER_ID_KEY = "millionater-analytics-user-id-v1";
  const SESSION_ID_KEY = "millionater-analytics-session-id-v1";
  const SESSION_STARTED_KEY = "millionater-analytics-session-started-v1";
  const DEFAULT_CONFIG = {
    enabled: false,
    firebase: {},
  };

  const config = {
    ...DEFAULT_CONFIG,
    ...(window.MILLIONATER_ANALYTICS_CONFIG || {}),
  };

  const state = {
    ready: false,
    disabled: !config.enabled,
    analytics: null,
    logEvent: null,
    setUserId: null,
  };

  function getStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setStoredValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Analytics must never block gameplay.
    }
  }

  function createId(prefix) {
    const randomId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${randomId}`;
  }

  function getUserId() {
    let userId = getStoredValue(USER_ID_KEY);
    if (!userId) {
      userId = createId("anon");
      setStoredValue(USER_ID_KEY, userId);
    }
    return userId;
  }

  function getSessionId() {
    let sessionId = getStoredValue(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = createId("session");
      setStoredValue(SESSION_ID_KEY, sessionId);
      setStoredValue(SESSION_STARTED_KEY, String(Date.now()));
    }
    return sessionId;
  }

  function detectPlatform() {
    const userAgent = navigator.userAgent || "";
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true;

    if (/Android/i.test(userAgent)) return standalone ? "android_app" : "android_web";
    if (/iPhone|iPad|iPod/i.test(userAgent)) return standalone ? "ios_app" : "ios_web";
    return standalone ? "desktop_app" : "web";
  }

  function cleanParams(params = {}) {
    return Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (typeof value === "boolean") return [key, value ? 1 : 0];
          if (typeof value === "string") return [key, value.slice(0, 100)];
          return [key, value];
        }),
    );
  }

  function baseParams() {
    return {
      app_platform: detectPlatform(),
      app_user_id: getUserId(),
      app_session_id: getSessionId(),
    };
  }

  async function initialize() {
    if (state.disabled) return;

    const firebaseConfig = config.firebase || {};
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE_")) {
      state.disabled = true;
      return;
    }

    try {
      const [{ initializeApp }, { getAnalytics, logEvent, setUserId }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js"),
      ]);
      const app = initializeApp(firebaseConfig);
      state.analytics = getAnalytics(app);
      state.logEvent = logEvent;
      state.setUserId = setUserId;
      state.setUserId(state.analytics, getUserId());
      state.ready = true;
      trackEvent("app_open");
      trackEvent("session_start");
    } catch (error) {
      state.disabled = true;
      console.warn("Analytics disabled:", error);
    }
  }

  function trackEvent(name, params = {}) {
    const eventParams = cleanParams({
      ...baseParams(),
      ...params,
    });

    if (!state.ready || state.disabled) return;
    state.logEvent(state.analytics, name, eventParams);
  }

  window.MillionaterAnalytics = {
    getUserId,
    getSessionId,
    getPlatform: detectPlatform,
    trackEvent,
  };

  initialize();
})();
