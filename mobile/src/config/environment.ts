// Expo inlines this explicit public variable when bundling the local development app.
export const STORAGE_PREFIX =
  process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT === "1"
    ? "maeum2nd.development"
    : "maeum2nd";
