import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  if (process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT !== "1") {
    return config as ExpoConfig;
  }
  return {
    ...config,
    name: "마음이 머무는 곳 개발",
    slug: "maeum-local-development",
    scheme: "maeumdev",
    ios: { ...config.ios, bundleIdentifier: "com.taehyun.park.maeum2nd.dev" },
    android: { ...config.android, package: "com.taehyun.park.maeum2nd.dev" },
  };
};
