import type {
  BotId,
  DiscussionBot,
  DiscussionService,
  DiscussionSession,
  DiscussionSettings,
} from "./types";

import { STORAGE_PREFIX } from "../../config/environment";
import {
  PANEL_IDS,
  PANELS,
  COUNCIL_STEPS,
  councilStep,
  councilDemoReply,
  annotateCouncilMessages,
} from "./council";

export const DISCUSSION_LOCAL_KEY = `${STORAGE_PREFIX}.discussion.mock.v1`;

type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
type RequestRecord = { sessionId: string; signature: string };
type Document = {
  version: 1;
  activeId: string | null;
  settings: DiscussionSettings;
  sessions: DiscussionSession[];
  requests: Record<string, RequestRecord>;
};

const BOT_IDS: BotId[] = ["blue", "amber", "violet"];
const MAX_TEXT = 3000;
const MAX_SESSIONS = 100;
const MAX_MESSAGES = 600;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export class LocalDiscussionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "LocalDiscussionError";
  }
}

function aborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error("요청을 중지했어요.");
  error.name = "AbortError";
  throw error;
}

async function delay(ms: number, signal?: AbortSignal) {
  aborted(signal);
  if (!ms) return;
  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      const error = new Error("요청을 중지했어요.");
      error.name = "AbortError";
      reject(error);
    };
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

function checkedText(value: string) {
  const text = value.trim();
  if (!text || text.length > MAX_TEXT)
    throw new LocalDiscussionError(
      400,
      `내용을 1~${MAX_TEXT}자 이내로 입력해 주세요.`,
    );
  return text;
}

function checkedRequest(value: string) {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(value))
    throw new LocalDiscussionError(
      400,
      "요청 식별자가 올바르지 않아요. 다시 시도해 주세요.",
    );
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const shortString = (value: unknown, max = MAX_TEXT): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function isSession(value: unknown): value is DiscussionSession {
  const modern = object(value) && value.protocol_version === 2;
  const ids = modern ? PANEL_IDS : BOT_IDS;
  if (
    !object(value) ||
    !shortString(value.id, 100) ||
    !shortString(value.topic) ||
    !["draft", "active", "ended"].includes(String(value.state)) ||
    !integer(value.revision) ||
    !integer(value.completed_turns) ||
    !integer(value.next_speaker_index) ||
    value.next_speaker_index > (modern ? COUNCIL_STEPS : 2) ||
    !Array.isArray(value.bots) ||
    value.bots.length !== ids.length ||
    !Array.isArray(value.messages) ||
    value.messages.length > MAX_MESSAGES
  )
    return false;
  if (
    !value.bots.every(
      (bot, index) =>
        object(bot) &&
        bot.id === ids[index] &&
        shortString(bot.name, 80) &&
        shortString(bot.position, 200) &&
        shortString(bot.description, 1000),
    )
  )
    return false;
  if (
    !value.messages.every(
      (message) =>
        object(message) &&
        shortString(message.id, 100) &&
        ["user", ...(modern ? ["moderator"] : []), ...ids].includes(
          String(message.speaker),
        ) &&
        shortString(message.text) &&
        integer(message.turn) &&
        message.turn >= 1 &&
        typeof message.created_at === "number" &&
        Number.isFinite(message.created_at),
    )
  )
    return false;
  const messages = value.messages as DiscussionSession["messages"];
  if (new Set(messages.map((message) => message.id)).size !== messages.length)
    return false;
  const botCount = messages.filter(
    (message) => message.speaker !== "user",
  ).length;
  if (modern)
    return (
      value.phase ===
      councilStep({
        next_speaker_index: value.next_speaker_index,
        completed_turns: value.completed_turns,
      }).phase
    );
  return (
    botCount % 3 === value.next_speaker_index &&
    Math.floor(botCount / 3) === value.completed_turns
  );
}

function parse(raw: string | null): Document {
  if (raw === null)
    return {
      version: 1,
      activeId: null,
      settings: { show_history: false },
      sessions: [],
      requests: {},
    };
  const data: unknown = JSON.parse(raw);
  if (
    !object(data) ||
    data.version !== 1 ||
    !(data.activeId === null || shortString(data.activeId, 100)) ||
    !object(data.settings) ||
    typeof data.settings.show_history !== "boolean" ||
    (data.settings.reminder_enabled !== undefined &&
      typeof data.settings.reminder_enabled !== "boolean") ||
    !Array.isArray(data.sessions) ||
    data.sessions.length > MAX_SESSIONS ||
    !data.sessions.every(isSession) ||
    !object(data.requests)
  )
    throw new Error("Invalid discussion data");
  const sessions = data.sessions as DiscussionSession[];
  const active = sessions.filter((session) => session.state === "active");
  if (
    new Set(sessions.map((session) => session.id)).size !== sessions.length ||
    active.length > 1 ||
    (active[0]?.id ?? null) !== data.activeId ||
    !Object.entries(data.requests).every(
      ([key, request]) =>
        /^(prepare|send|reply):[a-zA-Z0-9_-]{8,64}$/.test(key) &&
        object(request) &&
        shortString(request.signature, MAX_TEXT + 200) &&
        sessions.some((session) => session.id === request.sessionId),
    )
  )
    throw new Error("Invalid discussion data");
  return data as Document;
}

function roles(topic: string): DiscussionBot[] {
  const definitions = /취업|기업|이직|직장|커리어|사업|창업|퇴사|연봉/.test(
    topic,
  )
    ? [
        [
          "든든",
          "현실과 생활 안정",
          "현재의 수입, 생활비와 준비할 수 있는 시간을 먼저 살펴봐요.",
        ],
        [
          "도약",
          "미래 성장과 가능성",
          "장기 목표, 배우고 싶은 역량과 도전의 가능성을 살펴봐요.",
        ],
        [
          "나침",
          "나의 기준과 선택의 여지",
          "내가 원하는 일인지, 경험하면서 방향을 바꿀 여지가 있는지 살펴봐요.",
        ],
      ]
    : /관계|친구|연애|가족|부모|결혼|부부|동료|다툼|갈등/.test(topic)
      ? [
          [
            "마음결",
            "내 마음과 경계",
            "내가 느끼는 감정과 지키고 싶은 선을 먼저 살펴봐요.",
          ],
          [
            "다리",
            "상대의 관점과 대화",
            "상대의 사정도 짐작해 보고 오해를 줄일 대화를 찾아봐요.",
          ],
          [
            "한걸음",
            "관계에서 가능한 실천",
            "서로를 존중하면서 지금 시도할 수 있는 작은 행동을 살펴봐요.",
          ],
        ]
      : /공부|학업|시험|전공|자격증|유학|학원|배움|대학/.test(topic)
        ? [
            [
              "차근",
              "시간과 실행 가능성",
              "현재 일정과 체력으로 지속할 수 있는 계획인지 살펴봐요.",
            ],
            [
              "새봄",
              "배움의 목적과 성장",
              "무엇을 배우고 싶은지, 그 배움이 어떤 가능성을 여는지 살펴봐요.",
            ],
            [
              "쉼표",
              "흥미와 지속 가능성",
              "나에게 맞는 방식과 쉬어갈 여유를 함께 살펴봐요.",
            ],
          ]
        : [
            [
              "바탕",
              "현재 조건과 현실성",
              "지금 가진 시간, 자원과 감당할 수 있는 부담을 살펴봐요.",
            ],
            [
              "지평",
              "미래의 가능성과 변화",
              "선택이 앞으로 열어줄 가능성과 변화를 살펴봐요.",
            ],
            [
              "마음눈",
              "가치와 마음의 우선순위",
              "다른 사람의 기준보다 내가 소중하게 여기는 것이 무엇인지 살펴봐요.",
            ],
          ];
  return definitions.map(([name, position, description], index) => ({
    id: BOT_IDS[index],
    name,
    position,
    description,
  }));
}

function demoReply(session: DiscussionSession) {
  const bot = session.bots[session.next_speaker_index];
  const prior = [...session.messages]
    .reverse()
    .find((message) => message.speaker !== "user");
  const priorBot = session.bots.find(
    (candidate) => candidate.id === prior?.speaker,
  );
  const opinion = [...session.messages]
    .reverse()
    .find((message) => message.speaker === "user");
  const turn = session.completed_turns;
  const aliases = [
    [
      bot.id === "blue" ? bot.name : session.bots[0].name,
      "현실",
      "안정",
      "생활",
      "시간",
      "경계",
    ],
    [session.bots[1].name, "미래", "성장", "도전", "가능성", "상대"],
    [session.bots[2].name, "가치", "마음", "흥미", "균형", "실천"],
  ];
  const weights = aliases.map((words) =>
    Math.max(-1, ...words.map((word) => opinion?.text.lastIndexOf(word) ?? -1)),
  );
  const preferred =
    Math.max(...weights) >= 0
      ? session.bots[weights.indexOf(Math.max(...weights))]
      : null;
  const response = priorBot
    ? [
        `${priorBot.name}님, 그 기준이 필요한 이유에 공감해요.`,
        `${priorBot.name}님 말에 동의하는 부분이 있어요. 다만 그 선택에 따르는 부담도 함께 확인하면 좋겠어요.`,
        `${priorBot.name}님이 짚은 부분과 제 관점을 이어서 생각해 볼게요.`,
      ][session.next_speaker_index]
    : `“${session.topic.slice(0, 110)}”라는 고민을 ${bot.position}의 관점에서 먼저 살펴볼게요.`;
  if (opinion) {
    const support = preferred
      ? `${preferred.position}에 무게를 두고 싶다는 뜻을 중심에 놓을게요.`
      : "말씀해 주신 방향을 우선하는 선택을 함께 찾아볼게요.";
    return `${response} “${opinion.text.slice(0, 180)}”라는 의견을 들었어요. ${support} ${
      [
        "그 방향을 지키면서 지금 감당할 수 있는 조건부터 적어 보면 어떨까요?",
        "그 기준에 맞는 선택이 실제로 가능한지 작은 경험으로 먼저 확인해 보면 좋겠어요.",
        "그 선택을 지지하되 남는 부담을 줄일 보완책도 하나 정해두면 어떨까요?",
      ][(turn + session.next_speaker_index) % 3]
    }`;
  }
  return `${response} ${bot.description} ${
    [
      "이 선택에서 꼭 지키고 싶은 조건 한 가지는 무엇인가요?",
      "가능성이 있다는 이유만으로 결과를 단정할 수는 없어요. 기대하는 점을 확인할 작은 시도가 있으면 좋겠어요.",
      "두 관점 중 어느 쪽이 지금 내 마음에 더 가까운지 알려주시면 그 기준에 힘을 실어 함께 생각해 볼게요.",
    ][(turn + session.next_speaker_index) % 3]
  }`;
}

export function createLocalDiscussionService(
  storage: Storage,
  options: { delayMs?: number; protocolVersion?: 1 | 2 } = {},
): DiscussionService {
  let state: Document | null = null;
  let loading: Promise<Document> | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  const delayMs = Math.max(0, options.delayMs ?? 600);

  async function load() {
    if (state) return state;
    if (!loading)
      loading = storage
        .getItem(DISCUSSION_LOCAL_KEY)
        .then((raw) => {
          try {
            state = parse(raw);
          } catch {
            throw new LocalDiscussionError(
              503,
              "생각방 기록이 손상되었거나 버전이 달라요. 원본 보호를 위해 저장하지 않았어요. 로컬 설정에서 전체 기록을 초기화할 수 있어요.",
            );
          }
          return state;
        })
        .catch((error: unknown) => {
          loading = null;
          if (error instanceof LocalDiscussionError) throw error;
          throw new LocalDiscussionError(
            503,
            "생각방 기록을 읽지 못했어요. 기존 기록을 보존했으니 다시 시도해 주세요.",
          );
        });
    return loading;
  }
  async function read(signal?: AbortSignal) {
    await queue;
    aborted(signal);
    const document = await load();
    aborted(signal);
    return document;
  }
  function sessionIn(document: Document, sessionId: string, active = false) {
    const session = document.sessions.find((item) => item.id === sessionId);
    if (!session)
      throw new LocalDiscussionError(404, "생각방 기록을 찾지 못했어요.");
    if (
      active &&
      (session.state !== "active" || document.activeId !== sessionId)
    )
      throw new LocalDiscussionError(
        409,
        "이 고민의 대화는 종료됐어요. 현재 고민을 다시 불러와 주세요.",
      );
    return session;
  }
  function remembered(document: Document, key: string, signature: string) {
    const request = Object.hasOwn(document.requests, key)
      ? document.requests[key]
      : undefined;
    if (!request) return null;
    if (request.signature !== signature)
      throw new LocalDiscussionError(
        409,
        "같은 요청으로 다른 내용을 보낼 수 없어요. 새로 시도해 주세요.",
      );
    return sessionIn(document, request.sessionId);
  }
  function mutate<T>(
    action: (draft: Document) => T,
    signal?: AbortSignal,
  ): Promise<T> {
    const operation = queue.then(async () => {
      aborted(signal);
      const draft = clone(await load());
      aborted(signal);
      const result = action(draft);
      aborted(signal);
      try {
        await storage.setItem(DISCUSSION_LOCAL_KEY, JSON.stringify(draft));
      } catch {
        throw new LocalDiscussionError(
          503,
          "생각방 기록을 저장하지 못했어요. 기기 공간을 확인하고 다시 시도해 주세요.",
        );
      }
      // Once a storage write succeeds it is committed, even if cancellation arrived during it.
      state = draft;
      aborted(signal);
      return clone(result);
    });
    queue = operation.catch(() => {});
    return operation;
  }
  function capacity(session: DiscussionSession) {
    if (session.messages.length >= MAX_MESSAGES)
      throw new LocalDiscussionError(
        400,
        "이 고민의 대화가 길어졌어요. 고민입력으로 새 주제를 시작해 주세요. 이전 기록은 보존돼요.",
      );
  }

  return {
    mode: "mock",
    async current(signal) {
      const document = await read(signal);
      return document.activeId
        ? clone(sessionIn(document, document.activeId))
        : null;
    },
    async get(sessionId, signal) {
      return clone(sessionIn(await read(signal), sessionId));
    },
    async settings(signal) {
      const settings = clone((await read(signal)).settings);
      return options.protocolVersion === 2
        ? { ...settings, reminder_enabled: settings.reminder_enabled ?? true }
        : settings;
    },
    saveSettings(value) {
      if (
        typeof value.show_history !== "boolean" ||
        (value.reminder_enabled !== undefined &&
          typeof value.reminder_enabled !== "boolean")
      )
        return Promise.reject(
          new LocalDiscussionError(400, "기록 표시 설정이 올바르지 않아요."),
        );
      return mutate((document) => {
        if (
          value.reminder_enabled !== undefined &&
          (document.settings.reminder_enabled ?? true) !==
            value.reminder_enabled
        ) {
          document.sessions
            .filter(
              (session) =>
                session.state === "active" && session.protocol_version === 2,
            )
            .forEach((session) => session.revision++);
        }
        return (document.settings = { ...document.settings, ...value });
      });
    },
    async prepare(rawTopic, requestId, signal) {
      const topic = checkedText(rawTopic);
      checkedRequest(requestId);
      const key = `prepare:${requestId}`;
      const prior = remembered(await read(signal), key, topic);
      if (prior) return clone(prior);
      await delay(delayMs, signal);
      return mutate((document) => {
        const existing = remembered(document, key, topic);
        if (existing) return existing;
        if (document.sessions.length >= MAX_SESSIONS)
          throw new LocalDiscussionError(
            400,
            "로컬 생각방 보관 한도에 도달했어요. 로컬 설정에서 전체 기록 초기화 후 이용해 주세요.",
          );
        const session: DiscussionSession = {
          id: id(),
          topic,
          bots: options.protocolVersion === 2 ? clone(PANELS) : roles(topic),
          messages: [],
          next_speaker_index: 0,
          completed_turns: 0,
          revision: 0,
          state: "draft",
          ...(options.protocolVersion === 2
            ? { protocol_version: 2 as const, phase: "opening" as const }
            : {}),
        };
        document.sessions.push(session);
        document.requests[key] = { sessionId: session.id, signature: topic };
        return session;
      }, signal);
    },
    confirm(sessionId, signal) {
      return mutate((document) => {
        const session = sessionIn(document, sessionId);
        if (document.activeId === session.id && session.state === "active")
          return session;
        if (session.state !== "draft")
          throw new LocalDiscussionError(
            409,
            "이미 종료된 고민은 다시 시작할 수 없어요.",
          );
        if (document.activeId) {
          const old = sessionIn(document, document.activeId);
          old.state = "ended";
          old.revision++;
        }
        session.state = "active";
        session.revision++;
        document.activeId = session.id;
        return session;
      }, signal);
    },
    async send(sessionId, rawText, requestId, signal) {
      const text = checkedText(rawText);
      checkedRequest(requestId);
      const signature = `${sessionId}:${text}`;
      return mutate((document) => {
        const prior = remembered(document, `send:${requestId}`, signature);
        if (prior) return prior;
        const session = sessionIn(document, sessionId, true);
        capacity(session);
        if (session.protocol_version === 2) {
          if (session.next_speaker_index !== COUNCIL_STEPS)
            throw new LocalDiscussionError(
              409,
              "대표 패널의 질문이 끝난 뒤에 답변할 수 있어요.",
            );
          session.next_speaker_index = 0;
          session.phase = "opening";
        }
        session.messages.push({
          id: id(),
          speaker: "user",
          text,
          turn: session.completed_turns + 1,
          created_at: Date.now() / 1000,
        });
        session.revision++;
        document.requests[`send:${requestId}`] = { sessionId, signature };
        return session;
      }, signal);
    },
    async reply(sessionId, revision, requestId, signal) {
      checkedRequest(requestId);
      const signature = `${sessionId}:${revision}`;
      const document = await read(signal);
      const prior = remembered(document, `reply:${requestId}`, signature);
      if (prior) return clone(prior);
      const snapshot = clone(sessionIn(document, sessionId, true));
      if (snapshot.revision !== revision)
        throw new LocalDiscussionError(
          409,
          "새 의견이 들어왔어요. 최신 대화를 불러온 뒤 이어갈게요.",
        );
      if (
        snapshot.protocol_version === 2 &&
        councilStep(snapshot).phase === "awaiting_user"
      )
        throw new LocalDiscussionError(409, "사용자의 답변을 기다리고 있어요.");
      const text =
        snapshot.protocol_version === 2
          ? councilDemoReply(snapshot)
          : demoReply(snapshot);
      await delay(delayMs, signal);
      return mutate((draft) => {
        const existing = remembered(draft, `reply:${requestId}`, signature);
        if (existing) return existing;
        const session = sessionIn(draft, sessionId, true);
        if (session.revision !== revision)
          throw new LocalDiscussionError(
            409,
            "새 의견이 들어왔어요. 최신 대화를 불러온 뒤 이어갈게요.",
          );
        capacity(session);
        session.messages.push({
          id: id(),
          speaker:
            session.protocol_version === 2
              ? councilStep(session).speaker
              : session.bots[session.next_speaker_index].id,
          text,
          turn: session.completed_turns + 1,
          created_at: Date.now() / 1000,
        });
        session.next_speaker_index =
          session.protocol_version === 2
            ? session.next_speaker_index + 1
            : (session.next_speaker_index + 1) % 3;
        if (
          session.protocol_version === 2
            ? session.next_speaker_index === COUNCIL_STEPS
            : session.next_speaker_index === 0
        )
          session.completed_turns++;
        if (session.protocol_version === 2)
          session.phase = councilStep(session).phase;
        if (session.protocol_version === 2)
          session.messages = annotateCouncilMessages(session.messages);
        session.revision++;
        draft.requests[`reply:${requestId}`] = { sessionId, signature };
        return session;
      }, signal);
    },
  };
}
