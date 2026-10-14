// Store links for the KerayeGo mobile app. The plan is for the website to
// become listings-only, with sign-up, booking and seat requests moving to the
// app. Until the app is live these stay unset: every "get the app" surface
// renders nothing and pages keep their current web links, so setting these
// env vars is the only switch needed when the app ships.
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || null;
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || null;
export const HAS_MOBILE_APP = Boolean(APP_STORE_URL || PLAY_STORE_URL);
