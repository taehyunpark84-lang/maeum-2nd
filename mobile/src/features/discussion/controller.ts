import type {
  DiscussionMessage,
  DiscussionService,
  DiscussionSession,
} from "./types";
import { canAnswerCouncil } from "./council";

export type DiscussionState = {
  ready: boolean;
  error: string;
  session: DiscussionSession | null;
  proposal: DiscussionSession | null;
  visibleMessages: DiscussionMessage[];
  hiddenCount: number;
  showHistory: boolean;
  reminderEnabled: boolean;
  canAnswer: boolean;
  running: boolean;
  waiting: boolean;
  busy: "load" | "prepare" | "confirm" | "send" | "settings" | null;
};

export function discussionRequestId() {
  return `discussion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function abortableWait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

// Playback is separate from persistence: pausing never deletes a committed reply.
export class DiscussionController {
  private snapshot: DiscussionState = {
    ready: false,
    error: "",
    session: null,
    proposal: null,
    visibleMessages: [],
    hiddenCount: 0,
    showHistory: false,
    reminderEnabled: true,
    canAnswer: false,
    running: false,
    waiting: false,
    busy: null,
  };
  private listeners = new Set<() => void>();
  private previousIds = new Set<string>();
  private entrySessionId: string | null | undefined;
  private playback?: AbortController;
  private operation?: AbortController;
  private operationVersion = 0;
  private playbackVersion = 0;
  private disposed = false;
  private suspended = false;
  private retrySend: { sessionId: string; text: string; id: string } | null =
    null;
  private retryPrepare: { topic: string; id: string } | null = null;

  constructor(
    private service: DiscussionService,
    private gapMs = 1800,
  ) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private patch(value: Partial<DiscussionState>) {
    if (this.disposed) return;
    const next = { ...this.snapshot, ...value };
    const messages = next.session?.messages ?? [];
    next.canAnswer =
      next.ready &&
      !next.running &&
      !next.busy &&
      canAnswerCouncil(next.session);
    next.hiddenCount = messages.filter((m) =>
      this.previousIds.has(m.id),
    ).length;
    next.visibleMessages = next.showHistory
      ? messages
      : next.session?.protocol_version === 2
        ? messages.filter(
            (m) => m.turn === Math.max(0, ...messages.map((item) => item.turn)),
          )
        : messages.filter((m) => !this.previousIds.has(m.id));
    if (next.session?.protocol_version === 2)
      next.hiddenCount = messages.length - next.visibleMessages.length;
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }
  private accept(session: DiscussionSession | null, fresh = false) {
    if (fresh || this.entrySessionId !== (session?.id ?? null)) {
      this.entrySessionId = session?.id ?? null;
      this.previousIds = new Set(
        fresh ? [] : (session?.messages.map((m) => m.id) ?? []),
      );
    }
    this.patch({ session });
  }
  private fail(error: unknown, fallback: string) {
    this.patch({ error: error instanceof Error ? error.message : fallback });
  }
  private begin(busy: DiscussionState["busy"]) {
    this.operation?.abort();
    const controller = new AbortController();
    this.operation = controller;
    const version = ++this.operationVersion;
    this.patch({ busy, error: "" });
    return {
      controller,
      valid: () =>
        !this.disposed &&
        !controller.signal.aborted &&
        version === this.operationVersion,
    };
  }
  reload = async () => {
    this.disposed = false;
    this.pause();
    const op = this.begin("load");
    try {
      const [session, settings] = await Promise.all([
        this.service.current(op.controller.signal),
        this.service.settings(op.controller.signal),
      ]);
      if (!op.valid()) return;
      this.accept(session);
      this.patch({
        showHistory: settings.show_history,
        reminderEnabled: settings.reminder_enabled ?? true,
        ready: true,
      });
      if (
        session?.protocol_version === 2 &&
        session.phase !== "awaiting_user"
      ) {
        this.patch({ busy: null });
        void this.resume();
      }
    } catch (error) {
      if (op.valid()) this.fail(error, "생각방을 불러오지 못했어요.");
    } finally {
      if (op.valid()) this.patch({ busy: null });
    }
  };
  pause = () => {
    this.playbackVersion++;
    this.playback?.abort();
    this.patch({ running: false, waiting: false });
  };
  setForeground = (active: boolean) => {
    this.suspended = !active;
    if (!active) this.pause();
    else if (
      this.snapshot.ready &&
      this.snapshot.session?.protocol_version === 2
    )
      void this.reload();
  };
  prepare = async (topic: string) => {
    const value = topic.trim();
    if (!value || value.length > 2000 || this.snapshot.busy) return false;
    this.pause();
    const op = this.begin("prepare");
    this.patch({ proposal: null });
    const request =
      this.retryPrepare?.topic === value
        ? this.retryPrepare
        : { topic: value, id: discussionRequestId() };
    this.retryPrepare = request;
    try {
      const proposal = await this.service.prepare(
        value,
        request.id,
        op.controller.signal,
      );
      if (!op.valid()) return false;
      this.patch({ proposal });
      return true;
    } catch (error) {
      if (op.valid())
        this.fail(error, "세 관점을 준비하지 못했어요. 다시 시도해 주세요.");
      return false;
    } finally {
      if (op.valid()) this.patch({ busy: null });
    }
  };
  cancelProposal = () => {
    if (this.snapshot.busy === "confirm") return;
    if (this.snapshot.busy === "prepare") {
      this.operationVersion++;
      this.operation?.abort();
      this.patch({ busy: null });
    }
    this.patch({ proposal: null });
    this.retryPrepare = null;
  };
  confirm = async () => {
    const proposal = this.snapshot.proposal;
    if (!proposal || this.snapshot.busy) return false;
    const op = this.begin("confirm");
    const resumeVersion = this.playbackVersion;
    try {
      const session = await this.service.confirm(
        proposal.id,
        op.controller.signal,
      );
      if (!op.valid()) return false;
      this.accept(session, true);
      this.retryPrepare = null;
      this.retrySend = null;
      this.patch({ proposal: null, busy: null });
      if (resumeVersion === this.playbackVersion) void this.resume();
      return true;
    } catch (error) {
      if (op.valid()) this.fail(error, "대화를 시작하지 못했어요.");
      return false;
    } finally {
      if (op.valid() && this.snapshot.busy === "confirm")
        this.patch({ busy: null });
    }
  };
  resume = async () => {
    const initial = this.snapshot.session;
    if (
      this.suspended ||
      this.disposed ||
      !this.snapshot.ready ||
      this.snapshot.busy ||
      this.snapshot.running ||
      !initial ||
      initial.state !== "active" ||
      (initial.protocol_version === 2 && initial.phase === "awaiting_user")
    )
      return;
    const version = ++this.playbackVersion;
    const controller = new AbortController();
    this.playback = controller;
    const valid = () =>
      !this.disposed &&
      !controller.signal.aborted &&
      version === this.playbackVersion;
    // A paused third reply can have reached the server. Never silently start a second turn.
    const target = initial.completed_turns + 1;
    this.patch({ running: true, waiting: true, error: "" });
    try {
      let current = await this.service.get(initial.id, controller.signal);
      if (!valid()) return;
      this.accept(current);
      let conflicts = 0;
      const busyDeadline = Date.now() + 150000;
      while (
        current.state === "active" &&
        !(
          current.protocol_version === 2 && current.phase === "awaiting_user"
        ) &&
        current.completed_turns < target &&
        valid()
      ) {
        this.patch({ waiting: true });
        try {
          current = await this.service.reply(
            current.id,
            current.revision,
            discussionRequestId(),
            controller.signal,
          );
          conflicts = 0;
        } catch (error) {
          if (!valid()) return;
          const retry = error as { status?: number; retryAfter?: number };
          if (
            retry?.status === 409 &&
            retry.retryAfter &&
            Date.now() < busyDeadline
          ) {
            await abortableWait(
              Math.min(5000, Math.max(250, retry.retryAfter * 1000)),
              controller.signal,
            );
            current = await this.service.get(initial.id, controller.signal);
            if (!valid()) return;
            this.accept(current);
            continue;
          }
          if (
            (error as { status?: number })?.status === 409 &&
            conflicts++ < 2
          ) {
            current = await this.service.get(initial.id, controller.signal);
            if (!valid()) return;
            this.accept(current);
            continue;
          }
          throw error;
        }
        if (!valid()) return;
        this.accept(current);
        this.patch({ waiting: false });
        if (current.completed_turns < target)
          await abortableWait(this.gapMs, controller.signal);
      }
    } catch (error) {
      if (valid())
        this.fail(
          error,
          "대화가 잠시 멈췄어요. 이어하기로 다시 시도해 주세요.",
        );
    } finally {
      if (valid()) this.patch({ running: false, waiting: false });
    }
  };
  send = async (text: string) => {
    const session = this.snapshot.session;
    const value = text.trim();
    if (
      !session ||
      session.state !== "active" ||
      (session.protocol_version === 2 && !this.snapshot.canAnswer) ||
      !value ||
      value.length > 2000 ||
      this.snapshot.busy
    )
      return false;
    this.pause();
    const resumeVersion = this.playbackVersion;
    const op = this.begin("send");
    const request =
      this.retrySend?.sessionId === session.id && this.retrySend.text === value
        ? this.retrySend
        : { sessionId: session.id, text: value, id: discussionRequestId() };
    this.retrySend = request;
    try {
      const updated = await this.service.send(
        session.id,
        value,
        request.id,
        op.controller.signal,
      );
      if (!op.valid()) return false;
      this.accept(updated);
      this.retrySend = null;
      this.patch({ busy: null });
      if (resumeVersion === this.playbackVersion) void this.resume();
      return true;
    } catch (error) {
      if (op.valid())
        this.fail(
          error,
          "의견을 보내지 못했어요. 같은 내용으로 다시 보낼 수 있어요.",
        );
      return false;
    } finally {
      if (op.valid() && this.snapshot.busy === "send")
        this.patch({ busy: null });
    }
  };
  saveHistory = async (showHistory: boolean) => {
    if (this.snapshot.busy) return false;
    const op = this.begin("settings");
    try {
      const settings = await this.service.saveSettings({
        show_history: showHistory,
        ...(this.snapshot.session?.protocol_version === 2
          ? { reminder_enabled: this.snapshot.reminderEnabled }
          : {}),
      });
      if (!op.valid()) return false;
      this.patch({ showHistory: settings.show_history });
      return true;
    } catch (error) {
      if (op.valid()) this.fail(error, "표시 설정을 저장하지 못했어요.");
      return false;
    } finally {
      if (op.valid()) this.patch({ busy: null });
    }
  };
  saveReminder = async (enabled: boolean) => {
    if (this.snapshot.busy) return false;
    this.pause();
    const op = this.begin("settings");
    try {
      const settings = await this.service.saveSettings({
        show_history: this.snapshot.showHistory,
        reminder_enabled: enabled,
      });
      if (!op.valid()) return false;
      this.patch({
        reminderEnabled: settings.reminder_enabled ?? true,
        busy: null,
      });
      const current = this.snapshot.session;
      if (current?.protocol_version === 2 && current.phase !== "awaiting_user")
        void this.resume();
      return true;
    } catch (error) {
      if (op.valid()) this.fail(error, "리마인더 설정을 저장하지 못했어요.");
      return false;
    } finally {
      if (op.valid() && this.snapshot.busy === "settings")
        this.patch({ busy: null });
    }
  };
  dispose = () => {
    this.pause();
    this.disposed = true;
    this.operationVersion++;
    this.operation?.abort();
    this.listeners.clear();
  };
}
