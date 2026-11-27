import type {
  DiscussionBot,
  DiscussionMessage,
  DiscussionSession,
  PanelId,
} from "./types";

export const PANEL_IDS: PanelId[] = ["sadness", "anxiety", "anger", "joy"];
export const COUNCIL_STEPS = 11;
export function canAnswerCouncil(session: DiscussionSession | null) {
  return (
    !!session &&
    session.state === "active" &&
    session.next_speaker_index === COUNCIL_STEPS &&
    session.phase === "awaiting_user"
  );
}
export function annotateCouncilMessages(
  messages: DiscussionMessage[],
): DiscussionMessage[] {
  let cursor = 0;
  let turn = -1;
  return messages.map((message) => {
    if (message.turn !== turn) {
      cursor = 0;
      turn = message.turn;
    }
    if (message.speaker === "user") {
      cursor = 0;
      return { ...message, phase: "user" };
    }
    const step = councilStep({
      next_speaker_index: cursor++,
      completed_turns: turn - 1,
    });
    return {
      ...message,
      phase:
        step.speaker === message.speaker && step.phase !== "awaiting_user"
          ? step.phase
          : undefined,
    };
  });
}
export type CouncilTranscriptRow = {
  id: string;
  phase: DiscussionMessage["phase"];
  turn: number;
  messages: DiscussionMessage[];
};
export function councilTranscript(
  messages: DiscussionMessage[],
): CouncilTranscriptRow[] {
  const rows: CouncilTranscriptRow[] = [];
  for (const message of annotateCouncilMessages(messages)) {
    const previous = rows.at(-1);
    if (
      (message.phase === "first_opinion" || message.phase === "debate") &&
      previous?.phase === message.phase &&
      previous.turn === message.turn
    )
      previous.messages.push(message);
    else
      rows.push({
        id: message.id,
        phase: message.phase,
        turn: message.turn,
        messages: [message],
      });
  }
  return rows;
}
export const PANELS: DiscussionBot[] = [
  {
    id: "sadness",
    name: "슬픔",
    position: "공감자",
    description: "속상함과 상실감, 마음의 온도를 먼저 짚어줘.",
  },
  {
    id: "anxiety",
    name: "불안",
    position: "분석자",
    description: "원인과 기간, 변수와 현실 위험을 꼼꼼히 살펴봐.",
  },
  {
    id: "anger",
    name: "분노",
    position: "비판자",
    description: "판단의 모순과 자기합리화를 직설적으로 짚어줘.",
  },
  {
    id: "joy",
    name: "기쁨",
    position: "지지자",
    description: "남아 있는 힘과 작은 즐거움, 새로운 가능성을 찾아줘.",
  },
];
export function councilStep(
  session: Pick<DiscussionSession, "next_speaker_index" | "completed_turns">,
): {
  speaker: PanelId | "moderator" | "user";
  phase: NonNullable<DiscussionSession["phase"]>;
} {
  const cursor = session.next_speaker_index;
  if (cursor === 0) return { speaker: "moderator", phase: "opening" };
  if (cursor <= 4)
    return { speaker: PANEL_IDS[cursor - 1], phase: "first_opinion" };
  if (cursor <= 8) return { speaker: PANEL_IDS[cursor - 5], phase: "debate" };
  if (cursor === 9) return { speaker: "moderator", phase: "bridge" };
  if (cursor === 10)
    return {
      speaker: PANEL_IDS[session.completed_turns % 4],
      phase: "question",
    };
  return { speaker: "user", phase: "awaiting_user" };
}
export function councilDemoReply(session: DiscussionSession) {
  const { speaker, phase } = councilStep(session);
  const index = PANEL_IDS.indexOf(speaker as PanelId);
  if (speaker === "moderator")
    return (
      "[시연] " +
      (phase === "opening"
        ? "네 마음속 네 명이 모였어. 각자의 목소리를 들어보자."
        : `마음의 결이 서로 다르네. 이번에는 ${PANELS[session.completed_turns % 4].name}이 묻고 싶대.`)
    );
  if (phase === "question")
    return (
      "[시연] " +
      [
        "그 일에서 가장 속상했던 마음은 뭐야?",
        "그 걱정이 얼마나 오래 이어지고 있어?",
        "네 기준과 실제 선택은 어디서 달랐어?",
        "지금 해볼 만한 작은 시도는 뭐야?",
      ][index]
    );
  if (phase === "debate")
    return (
      "[시연] " +
      [
        "기쁨아, 바로 바꾸자고 하면 오히려 부담스럽지 않을까?",
        "슬픔아, 마음만 보다가 원인을 놓칠 수도 있어.",
        "불안아, 위험만 따지다가 판단의 모순을 덮어선 안 돼.",
        "분노야, 다그치기만 하면 작은 시도도 어려워질 수 있어.",
      ][index]
    );
  return (
    "[시연] " +
    [
      "마음이 많이 속상했겠어.\n지금 느끼는 감정부터 천천히 알아보자.",
      "잠깐, 놓친 조건이 있을 수 있어.\n지속 기간과 감당할 범위를 먼저 확인하자.",
      "네 기준과 실제 행동이 다르다면 그 모순부터 확인해야 해.\n핑계로 덮진 말자.",
      "남아 있는 힘도 있을 거야.\n오늘 할 수 있는 작은 시도 하나를 찾아보자.",
    ][index]
  );
}
