import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Copy, styles } from "../components/ui";
import {
  api,
  API_URL,
  authHeaders,
  restoreToken,
  type Account,
} from "../services/api";
import { useStore } from "../storage/store";
import DiscussionRoom from "../features/discussion/DiscussionRoom";
import { createNetworkDiscussionService } from "../features/discussion/networkService";
import { createLocalDiscussionService } from "../features/discussion/localService";

const local = process.env.EXPO_PUBLIC_APP_MODE === "mock";

export default function DiscussionRoute() {
  const { state } = useStore();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!local);
  const [focused, setFocused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setFocused(true);
      if (!local) {
        setLoading(true);
        setError("");
        if (attempt > 0) setAccount(null);
        void Promise.resolve(!!authHeaders().Authorization || restoreToken())
          .then(async (exists) => {
            if (!exists) throw new Error("공간에서 먼저 로그인해 주세요.");
            const value = await api<Account>("/me");
            if (alive) setAccount(value);
          })
          .catch((e: unknown) => {
            if (alive)
              setError(
                e instanceof Error ? e.message : "계정을 확인하지 못했어요.",
              );
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
      }
      return () => {
        alive = false;
        setFocused(false);
      };
    }, [attempt]),
  );
  const service = useMemo(
    () =>
      local
        ? createLocalDiscussionService(AsyncStorage, { protocolVersion: 2 })
        : createNetworkDiscussionService(
            account?.ai_mode === "mock" ? "mock" : "openai",
            { baseUrl: API_URL, headers: authHeaders, protocolVersion: 2 },
          ),
    [account?.ai_mode],
  );
  const navigate = (tab: "places" | "gallery") =>
    router.dismissTo({ pathname: "/", params: { tab } });
  if (!focused || loading)
    return (
      <SafeAreaView
        style={[styles.screen, { justifyContent: "center", padding: 24 }]}
      >
        <ActivityIndicator />
        <Copy>마음 회의를 열고 있어요…</Copy>
      </SafeAreaView>
    );
  if (error || (!local && !account) || (local && !state.settings.nickname))
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Copy>{error || "공간에서 먼저 시작해 주세요."}</Copy>
          <Button label="다시 연결" onPress={() => setAttempt((n) => n + 1)} />
          <Button
            label="공간으로"
            secondary
            onPress={() => navigate("places")}
          />
        </View>
      </SafeAreaView>
    );
  return (
    <DiscussionRoom
      key={local ? "mock" : account!.id}
      service={service}
      nickname={local ? state.settings.nickname : account!.nickname}
      onNavigate={navigate}
    />
  );
}
