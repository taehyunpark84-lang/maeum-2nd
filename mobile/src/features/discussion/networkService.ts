import type {
  DiscussionService,
  DiscussionSession,
  DiscussionSettings,
} from "./types";

function session(value: unknown): DiscussionSession {
  if (!value || typeof value !== "object")
    throw new Error("생각방 응답 형식을 확인하지 못했어요.");
  const data = value as DiscussionSession;
  const ids = ["blue", "amber", "violet"];
  if (
    typeof data.id !== "string" ||
    typeof data.topic !== "string" ||
    !["draft", "active", "ended"].includes(data.state) ||
    !Number.isInteger(data.revision) ||
    data.revision < 0 ||
    !Number.isInteger(data.completed_turns) ||
    data.completed_turns < 0 ||
    !Number.isInteger(data.next_speaker_index) ||
    data.next_speaker_index < 0 ||
    data.next_speaker_index > 2 ||
    !Array.isArray(data.bots) ||
    data.bots.length !== 3 ||
    !data.bots.every(
      (bot, i) =>
        bot?.id === ids[i] &&
        [bot.name, bot.position, bot.description].every(
          (text) => typeof text === "string" && text.trim(),
        ),
    ) ||
    !Array.isArray(data.messages) ||
    !data.messages.every(
      (message) =>
        message &&
        typeof message.id === "string" &&
        typeof message.text === "string" &&
        ["user", ...ids].includes(message.speaker) &&
        Number.isInteger(message.turn) &&
        Number.isFinite(message.created_at),
    )
  )
    throw new Error(
      "생각방 응답 형식이 달라요. 앱과 서버 버전을 확인해 주세요.",
    );
  return data;
}
function settings(value: unknown): DiscussionSettings {
  if (
    !value ||
    typeof value !== "object" ||
    typeof (value as DiscussionSettings).show_history !== "boolean"
  )
    throw new Error("표시 설정을 읽지 못했어요.");
  return value as DiscussionSettings;
}

export class DiscussionNetworkError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export function createNetworkDiscussionService(
  mode: DiscussionService["mode"],
  connection: {
    baseUrl: string;
    headers: () => Record<string, string>;
    fetch?: typeof fetch;
  },
): DiscussionService {
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), 150000);
    try {
      const response = await (connection.fetch ?? fetch)(
        `${connection.baseUrl.replace(/\/$/, "")}/discussions${path}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            ...connection.headers(),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail =
          result && typeof result === "object"
            ? (result as { detail?: unknown }).detail
            : undefined;
        throw new DiscussionNetworkError(
          response.status,
          response.status === 401
            ? "로그인이 만료됐어요. 공간으로 돌아가 다시 로그인해 주세요."
            : response.status === 404
              ? "생각방을 찾지 못했어요. 서버에 새 기능이 적용됐는지 확인해 주세요."
              : typeof detail === "string"
                ? detail
                : "생각방 요청을 처리하지 못했어요. 다시 시도해 주세요.",
          Number(response.headers.get("Retry-After")) || undefined,
        );
      }
      return result;
    } catch (error) {
      if (controller.signal.aborted && !signal?.aborted)
        throw new Error(
          "AI 응답이 늦어지고 있어요. 대화 이어하기로 다시 시도해 주세요.",
        );
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  return {
    mode,
    current: async (signal) => {
      const value = await request("/current", "GET", undefined, signal);
      return value === null ? null : session(value);
    },
    get: async (id, signal) =>
      session(
        await request(`/${encodeURIComponent(id)}`, "GET", undefined, signal),
      ),
    settings: async (signal) =>
      settings(await request("/settings", "GET", undefined, signal)),
    saveSettings: async (value) =>
      settings(await request("/settings", "PATCH", value)),
    prepare: async (topic, requestId, signal) =>
      session(
        await request(
          "/prepare",
          "POST",
          { topic, request_id: requestId },
          signal,
        ),
      ),
    confirm: async (id, signal) =>
      session(
        await request(
          `/${encodeURIComponent(id)}/confirm`,
          "POST",
          undefined,
          signal,
        ),
      ),
    send: async (id, text, requestId, signal) =>
      session(
        await request(
          `/${encodeURIComponent(id)}/messages`,
          "POST",
          { text, request_id: requestId },
          signal,
        ),
      ),
    reply: async (id, revision, requestId, signal) =>
      session(
        await request(
          `/${encodeURIComponent(id)}/reply`,
          "POST",
          { expected_revision: revision, request_id: requestId },
          signal,
        ),
      ),
  };
}
