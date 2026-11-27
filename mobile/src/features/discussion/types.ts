export type LegacyBotId = "blue" | "amber" | "violet";
export type PanelId = "sadness" | "anxiety" | "anger" | "joy";
export type BotId = LegacyBotId | PanelId;
export type DiscussionBot = {
  id: BotId;
  name: string;
  position: string;
  description: string;
};
export type DiscussionMessage = {
  id: string;
  speaker: "user" | "moderator" | BotId;
  text: string;
  turn: number;
  created_at: number;
};
export type DiscussionSession = {
  id: string;
  topic: string;
  bots: DiscussionBot[];
  messages: DiscussionMessage[];
  next_speaker_index: number;
  completed_turns: number;
  revision: number;
  state: "draft" | "active" | "ended";
  protocol_version?: 1 | 2;
  phase?:
    | "opening"
    | "first_opinion"
    | "debate"
    | "bridge"
    | "question"
    | "awaiting_user";
};
export type DiscussionSettings = {
  show_history: boolean;
  reminder_enabled?: boolean;
};
export interface DiscussionService {
  mode: "mock" | "openai";
  current(signal?: AbortSignal): Promise<DiscussionSession | null>;
  get(id: string, signal?: AbortSignal): Promise<DiscussionSession>;
  settings(signal?: AbortSignal): Promise<DiscussionSettings>;
  saveSettings(value: DiscussionSettings): Promise<DiscussionSettings>;
  prepare(
    topic: string,
    requestId: string,
    signal?: AbortSignal,
  ): Promise<DiscussionSession>;
  confirm(id: string, signal?: AbortSignal): Promise<DiscussionSession>;
  send(
    id: string,
    text: string,
    requestId: string,
    signal?: AbortSignal,
  ): Promise<DiscussionSession>;
  reply(
    id: string,
    revision: number,
    requestId: string,
    signal?: AbortSignal,
  ): Promise<DiscussionSession>;
}
