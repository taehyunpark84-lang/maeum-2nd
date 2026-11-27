import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, IconButton, colors } from "../../components/ui";
import { discussionAssets } from "../../config/assets";
import { useDiscussion } from "./useDiscussion";
import { PANELS } from "./council";
import { CouncilAvatar } from "./CouncilAvatar";
import LegacyDiscussionRoom from "./LegacyDiscussionRoom";
import type { DiscussionMessage, DiscussionService, PanelId } from "./types";

const tones: Record<string, string> = {
  sadness: "#315F9B",
  anxiety: "#9B5F1D",
  anger: "#A33D36",
  joy: "#8A6B0E",
  moderator: "#526E46",
};

export default function DiscussionRoom({
  service,
  nickname,
  onNavigate,
}: {
  service: DiscussionService;
  nickname: string;
  onNavigate: (tab: "places" | "gallery") => void;
}) {
  const discussion = useDiscussion(service);
  const {
    session,
    ready,
    busy,
    running,
    waiting,
    error,
    visibleMessages,
    reminderEnabled,
  } = discussion;
  const [newAgenda, setNewAgenda] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [topic, setTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [settings, setSettings] = useState(false);
  const [showLatest, setShowLatest] = useState(false);
  const list = useRef<FlatList<DiscussionMessage>>(null);
  const nearBottom = useRef(true);
  const { width } = useWindowDimensions();
  const cardSize = Math.min(140, Math.max(96, (width - 76) / 2));
  const welcome = newAgenda || !session || session.protocol_version !== 2;
  const awaitingUser = session?.phase === "awaiting_user";

  if (session && session.protocol_version !== 2 && showLegacy && !newAgenda) {
    return (
      <LegacyDiscussionRoom
        service={service}
        nickname={nickname}
        onNavigate={onNavigate}
        onNewCouncil={() => {
          discussion.pause();
          setShowLegacy(false);
          setNewAgenda(true);
        }}
      />
    );
  }
  async function start() {
    Keyboard.dismiss();
    if (await discussion.prepare(topic)) {
      if (await discussion.confirm()) {
        setNewAgenda(false);
        setTopic("");
        setAnswer("");
        nearBottom.current = true;
      }
    }
  }
  async function send() {
    const text = answer.trim();
    if (!text) return;
    if (await discussion.send(text)) {
      setAnswer((current) => (current.trim() === text ? "" : current));
      nearBottom.current = true;
      setShowLatest(false);
      Keyboard.dismiss();
    }
  }
  function navigate(tab: "places" | "gallery") {
    discussion.pause();
    Keyboard.dismiss();
    onNavigate(tab);
  }
  function renderMessage({ item }: { item: DiscussionMessage }) {
    const user = item.speaker === "user";
    const panel = PANELS.find((bot) => bot.id === item.speaker);
    return (
      <View style={[s.messageRow, user && s.userRow]}>
        {!user && <CouncilAvatar id={item.speaker as PanelId | "moderator"} />}
        <View style={s.messageBody}>
          <Text
            style={[s.speaker, { color: tones[item.speaker] ?? colors.text }]}
          >
            {user
              ? nickname
              : panel
                ? `${panel.name} · ${panel.position}`
                : "사회자"}
          </Text>
          <View style={[s.bubble, user && s.userBubble]}>
            <Text selectable style={s.messageText}>
              {item.text}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={s.screen}>
      <Image
        source={discussionAssets.background}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible={false}
      />
      <SafeAreaView style={s.flex} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.header}>
            <Text style={s.title} accessibilityRole="header">
              마음
            </Text>
            <Text style={s.badge}>
              {service.mode === "mock" ? "시연모드" : "AI 마음 회의"}
            </Text>
            <View style={s.flex} />
            {!welcome && (
              <IconButton
                name="add-outline"
                label="새 안건 만들기"
                disabled={!!busy}
                onPress={() => {
                  discussion.pause();
                  setNewAgenda(true);
                }}
              />
            )}
            <IconButton
              name="settings-outline"
              label="마음 회의 설정"
              disabled={!ready || !!busy}
              onPress={() => setSettings(true)}
            />
          </View>
          {error ? (
            <View style={s.error}>
              <Text style={s.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                style={s.touch}
                onPress={() =>
                  void (!ready
                    ? discussion.reload()
                    : welcome
                      ? start()
                      : discussion.reload())
                }
                disabled={!!busy}
              >
                <Text style={s.link}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}
          {!ready ? (
            <View style={s.loading}>
              <ActivityIndicator color={colors.green} />
              <Text>마음 회의를 준비하고 있어요…</Text>
            </View>
          ) : welcome ? (
            <ScrollView
              style={s.flex}
              contentContainerStyle={s.welcomeScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={s.welcomeCard}>
                <Text style={s.welcomeTitle}>🏛️ 마음속 회의 개회</Text>
                <Text style={s.question}>오늘의 안건은 무엇인가요?</Text>
                <Text style={s.welcomeHint}>
                  네 마음속 네 명의 참석자가 이야기를 기다리고 있어.
                </Text>
                <View style={s.grid}>
                  {PANELS.map((panel) => (
                    <View key={panel.id} style={s.panelCard}>
                      <CouncilAvatar
                        id={panel.id as PanelId}
                        size={cardSize}
                        square
                      />
                      <Text style={s.panelName}>{panel.name}</Text>
                      <Text style={s.panelRole}>{panel.position}</Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  accessibilityLabel="오늘의 안건"
                  placeholder="오늘 무슨 일이 있었는지 편하게 이야기해 줘."
                  placeholderTextColor="#91999E"
                  value={topic}
                  onChangeText={setTopic}
                  multiline
                  maxLength={2000}
                  editable={!busy}
                  style={s.topicInput}
                />
                <Button
                  label={busy ? "회의를 준비하고 있어요…" : "회의 시작하기  →"}
                  disabled={!topic.trim() || !!busy}
                  onPress={() => void start()}
                />
                {session && (
                  <Pressable
                    accessibilityRole="button"
                    style={s.touch}
                    onPress={() => {
                      setNewAgenda(false);
                      if (session.protocol_version !== 2) setShowLegacy(true);
                      discussion.cancelProposal();
                      if (session.protocol_version === 2)
                        void discussion.resume();
                    }}
                  >
                    <Text style={s.link}>
                      {session.protocol_version === 2
                        ? "최근 대화로 돌아가기"
                        : "기존 생각방 대화 보기"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          ) : (
            <>
              <FlatList
                ref={list}
                data={visibleMessages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                style={s.flex}
                contentContainerStyle={s.messages}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                  <Text selectable style={s.agenda}>
                    오늘의 안건 · {session?.topic}
                  </Text>
                }
                onScroll={({ nativeEvent }) => {
                  nearBottom.current =
                    nativeEvent.contentSize.height -
                      nativeEvent.layoutMeasurement.height -
                      nativeEvent.contentOffset.y <
                    100;
                  if (nearBottom.current) setShowLatest(false);
                }}
                scrollEventThrottle={100}
                onContentSizeChange={() => {
                  if (nearBottom.current)
                    list.current?.scrollToEnd({ animated: true });
                  else setShowLatest(true);
                }}
                ListFooterComponent={
                  waiting && running ? (
                    <View style={s.typing}>
                      <ActivityIndicator size="small" color={colors.green} />
                      <Text style={s.muted}>마음의 목소리를 듣고 있어…</Text>
                    </View>
                  ) : undefined
                }
              />
              {showLatest && (
                <Pressable
                  accessibilityRole="button"
                  style={s.latest}
                  onPress={() => {
                    nearBottom.current = true;
                    setShowLatest(false);
                    list.current?.scrollToEnd({ animated: true });
                  }}
                >
                  <Text style={s.link}>최근 대화 보기 ↓</Text>
                </Pressable>
              )}
              <View style={s.composerPanel}>
                {awaitingUser && (
                  <Text style={s.waitHint}>
                    네 이야기를 기다리고 있어. 편할 때 답해 줘.
                  </Text>
                )}
                <View style={s.composer}>
                  <TextInput
                    accessibilityLabel="패널 질문에 답하기"
                    placeholder={
                      awaitingUser
                        ? "지금 떠오르는 생각을 들려줘."
                        : "네 명의 이야기를 듣고 있어…"
                    }
                    placeholderTextColor={colors.muted}
                    value={answer}
                    onChangeText={setAnswer}
                    multiline
                    maxLength={2000}
                    editable={!!awaitingUser && !busy}
                    style={s.answerInput}
                  />
                  <IconButton
                    name="arrow-up"
                    label="내 답변 보내기"
                    disabled={!awaitingUser || !answer.trim() || !!busy}
                    onPress={() => void send()}
                  />
                </View>
              </View>
            </>
          )}
          <View style={s.tabs}>
            {(
              [
                { key: "places", label: "공간", icon: "leaf-outline" },
                {
                  key: "discussion",
                  label: "마음",
                  icon: "chatbubbles-outline",
                },
                { key: "gallery", label: "갤러리", icon: "images-outline" },
              ] as const
            ).map((tab) => (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: tab.key === "discussion" }}
                style={s.tab}
                onPress={() => {
                  if (tab.key !== "discussion") navigate(tab.key);
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={tab.key === "discussion" ? colors.green : colors.muted}
                />
                <Text
                  style={{
                    color:
                      tab.key === "discussion" ? colors.green : colors.muted,
                    fontSize: 12,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Modal
        visible={settings}
        transparent
        animationType="slide"
        onRequestClose={() => setSettings(false)}
      >
        <View style={s.modalShade}>
          <SafeAreaView edges={["bottom"]} style={s.modalPanel}>
            <View style={s.header}>
              <Text style={s.title}>마음 회의 설정</Text>
              <View style={s.flex} />
              <IconButton
                name="close"
                label="설정 닫기"
                onPress={() => setSettings(false)}
              />
            </View>
            <View style={s.settingRow}>
              <View style={s.flex}>
                <Text style={s.settingTitle}>페르소나 리마인더</Text>
                <Text style={s.settingHint}>
                  각 패널이 말할 때 핵심 성격을 다시 전달해요. 변경은 다음
                  발언부터 적용돼요.
                </Text>
              </View>
              <Switch
                accessibilityLabel="페르소나 리마인더"
                value={reminderEnabled}
                disabled={!!busy}
                onValueChange={(value) => void discussion.saveReminder(value)}
              />
            </View>
            <Text style={s.settingHint}>
              기본 페르소나는 계속 유지되며, 끄면 추가 리마인더 메시지를 보내지
              않아요.
              {service.mode === "mock"
                ? " 현재는 네트워크를 사용하지 않는 시연모드예요."
                : ""}
            </Text>
            <View style={s.settingRow}>
              <View style={s.flex}>
                <Text style={s.settingTitle}>이전 라운드 대화 표시</Text>
                <Text style={s.settingHint}>
                  최근 라운드는 항상 남아요. 켜면 이 안건의 이전 대화도 함께 볼
                  수 있어요.
                </Text>
              </View>
              <Switch
                accessibilityLabel="이전 라운드 대화 표시"
                value={discussion.showHistory}
                disabled={!!busy}
                onValueChange={(value) => void discussion.saveHistory(value)}
              />
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: { fontSize: 23, fontWeight: "700", color: colors.text },
  badge: {
    fontSize: 11,
    color: colors.green,
    backgroundColor: "#F7F4EDDD",
    padding: 6,
    borderRadius: 8,
  },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  welcomeScroll: { padding: 16, paddingTop: 6 },
  welcomeCard: {
    backgroundColor: "#FFFCF7F2",
    borderRadius: 24,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E9E6DE",
  },
  welcomeTitle: { fontSize: 21, fontWeight: "700", color: "#17222C" },
  question: { fontSize: 19, fontWeight: "700", color: "#17222C" },
  welcomeHint: { fontSize: 14, lineHeight: 22, color: "#8A9299" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  panelCard: { width: "48%", alignItems: "center", gap: 3 },
  panelName: { fontSize: 15, color: "#26333C", marginTop: 3 },
  panelRole: { fontSize: 14, color: "#858C92" },
  topicInput: {
    minHeight: 92,
    maxHeight: 180,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DEDEDB",
    borderRadius: 12,
    color: colors.text,
    backgroundColor: "#FFFFFFB3",
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  messages: { padding: 16, gap: 18, paddingBottom: 24 },
  agenda: {
    fontSize: 13,
    color: colors.muted,
    paddingBottom: 16,
    lineHeight: 20,
  },
  messageRow: { flexDirection: "row", gap: 9 },
  userRow: { paddingLeft: 38 },
  messageBody: { flex: 1, gap: 5 },
  speaker: { fontSize: 13, fontWeight: "700" },
  bubble: {
    backgroundColor: "#FFFCF7F2",
    padding: 13,
    borderRadius: 18,
    borderTopLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: "#E6EEDFF2",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 5,
  },
  messageText: { fontSize: 16, lineHeight: 26, color: colors.text },
  typing: { flexDirection: "row", gap: 8, paddingVertical: 12 },
  muted: { color: colors.muted, fontSize: 13 },
  composerPanel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFCF7EB",
  },
  waitHint: { fontSize: 12, color: colors.muted, marginBottom: 5 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    paddingLeft: 12,
  },
  answerInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 130,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: colors.text,
    lineHeight: 23,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  tab: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  touch: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  link: { color: colors.green, fontSize: 14, fontWeight: "600" },
  latest: {
    alignSelf: "center",
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.panel,
  },
  error: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFF0E8",
  },
  errorText: { fontSize: 14, lineHeight: 22, color: "#8A3C2C" },
  modalShade: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#00000055",
  },
  modalPanel: {
    backgroundColor: colors.panel,
    padding: 16,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    gap: 16,
  },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  settingTitle: { fontSize: 17, fontWeight: "700", color: colors.text },
  settingHint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 5,
  },
});
