import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { DiscussionController } from "./controller";
import type { DiscussionService } from "./types";

export function useDiscussion(service: DiscussionService) {
  const controller = useMemo(
    () => new DiscussionController(service),
    [service],
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useFocusEffect(useCallback(() => () => controller.pause(), [controller]));
  useEffect(() => {
    controller.setForeground(AppState.currentState === "active");
    void controller.reload();
    const subscription = AppState.addEventListener("change", (state) => {
      controller.setForeground(state === "active");
    });
    return () => {
      subscription.remove();
      controller.dispose();
    };
  }, [controller]);
  return {
    ...state,
    prepare: controller.prepare,
    confirm: controller.confirm,
    cancelProposal: controller.cancelProposal,
    pause: controller.pause,
    resume: controller.resume,
    send: controller.send,
    saveHistory: controller.saveHistory,
    saveReminder: controller.saveReminder,
    reload: controller.reload,
  };
}
