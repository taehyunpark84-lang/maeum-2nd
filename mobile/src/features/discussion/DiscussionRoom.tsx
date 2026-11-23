import { useRef, useState, type PropsWithChildren } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Copy, IconButton, colors } from "../../components/ui";
import { discussionAssets } from "../../config/assets";
import type {
  BotId,
  DiscussionBot,
  DiscussionMessage,
  DiscussionService,
} from "./types";
import { useDiscussion } from "./useDiscussion";

const botColors: Record<BotId, { ink: string; pale: string; line: string }> = {
  blue: { ink: "#245B9F", pale: "#EAF2FD", line: "#A9C8EF" },
  amber: { ink: "#8C5416", pale: "#FFF1DE", line: "#EDC48E" },
  violet: { ink: "#71439C", pale: "#F3EAFB", line: "#CFB4E5" },
};
const botIds: BotId[] = ["blue", "amber", "violet"];
type ModalKind = "topic" | "roles" | "participants" | "settings" | null;

function Avatar({ id, size = 40 }: { id: BotId; size?: number }) {
  return (
    <View
      style={[
        s.avatarFrame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: botColors[id].pale,
          borderColor: botColors[id].line,
        },
      ]}
    >
      <Image
        source={discussionAssets.avatars[id]}
        resizeMode="contain"
        accessible={false}
        style={{ width: size - 4, height: size - 4 }}
      />
    </View>
  );
}

function RoleCard({ bot }: { bot: DiscussionBot }) {
  return (
    <View style={[s.roleCard, { borderColor: botColors[bot.id].line }]}>
      <View style={s.row}>
        <Avatar id={bot.id} size={60} />
        <View style={s.flex}>
          <Text style={[s.botName, { color: botColors[bot.id].ink }]}>
            {bot.name}
          </Text>
          <Text style={s.roleText}>{bot.position}</Text>
        </View>
      </View>
      <Copy>{bot.description}</Copy>
    </View>
  );
}

function Dialog({
  title,
  onClose,
  closeDisabled = false,
  children,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
}>) {
  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!closeDisabled) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={s.modalShade}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView edges={["top", "bottom"]} style={s.modalPanel}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.modalContent}
          >
            <View style={s.row}>
              <Text accessibilityRole="header" style={[s.dialogTitle, s.flex]}>
                {title}
              </Text>
              <IconButton
                name="close"
                label="팝업 닫기"
                disabled={closeDisabled}
                onPress={onClose}
              />
            </View>
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
    ready,
    error,
    session,
    proposal,
    visibleMessages,
    hiddenCount,
    showHistory,
    running,
    waiting,
    busy,
  } = discussion;
  const [modal, setModal] = useState<ModalKind>(null);
  const [topicDraft, setTopicDraft] = useState("");
  const [opinion, setOpinion] = useState("");
  const [showLatest, setShowLatest] = useState(false);
  const list = useRef<FlatList<DiscussionMessage>>(null);
  const nearBottom = useRef(true);
  const modalEpoch = useRef(0);
  const isLocal = process.env.EXPO_PUBLIC_APP_MODE === "mock";
  const locked = !!busy;
  const nextBot = session?.bots[session.next_speaker_index];
  const dialogBots = modal === "roles" ? proposal?.bots : session?.bots;

  function closeModal() {
    if (busy === "confirm") return;
    modalEpoch.current += 1;
    if (modal === "topic" || modal === "roles") {
      discussion.pause();
      discussion.cancelProposal();
    }
    Keyboard.dismiss();
    setModal(null);
  }

  function newTopic() {
    discussion.pause();
    modalEpoch.current += 1;
    setModal("topic");
  }

  async function prepare() {
    const version = ++modalEpoch.current;
    Keyboard.dismiss();
    if (await discussion.prepare(topicDraft.trim())) {
      if (version === modalEpoch.current) setModal("roles");
      else discussion.cancelProposal();
    }
  }

  async function confirm() {
    if (await discussion.confirm()) {
      nearBottom.current = true;
      setShowLatest(false);
      setTopicDraft("");
      setOpinion("");
      setModal(null);
    }
  }

  async function send() {
    const text = opinion.trim();
    if (!text) return;
    discussion.pause();
    if (await discussion.send(text)) {
      setOpinion((current) => (current.trim() === text ? "" : current));
      nearBottom.current = true;
      setShowLatest(false);
      Keyboard.dismiss();
      list.current?.scrollToEnd({ animated: true });
    }
  }

  function navigate(tab: "places" | "gallery") {
    discussion.pause();
    Keyboard.dismiss();
    onNavigate(tab);
  }

  const progressText = session
    ? session.state === "ended"
      ? "종료된 주제예요. 새 고민을 입력해 주세요."
      : running
        ? `${session.completed_turns + 1}턴 · ${session.next_speaker_index + 1}/3 발언`
        : session.next_speaker_index > 0
          ? `${session.completed_turns + 1}턴 · ${session.next_speaker_index}/3 발언 후 멈춤`
          : session.completed_turns > 0
            ? `${session.completed_turns}턴 완료 · 천천히 읽어보세요`
            : "대화를 시작할 준비가 됐어요"
    : "서로 다른 시선으로, 나의 마음을 살펴요";

  function renderMessage({ item }: { item: DiscussionMessage }) {
    if (item.speaker === "user")
      return (
        <View style={s.userRow}>
          <Text style={s.userName}>{nickname} · 나의 생각</Text>
          <View style={s.userBubble}>
            <Text selectable style={s.messageText}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    const bot = session?.bots.find(
      (candidate) => candidate.id === item.speaker,
    );
    const color = botColors[item.speaker];
    return (
      <View style={s.messageRow}>
        <Avatar id={item.speaker} />
        <View style={s.flex}>
          <View style={s.speakerLine}>
            <Text style={[s.botName, { color: color.ink }]}>
              {bot?.name ?? "AI 대화 상대"}
            </Text>
            <Text style={s.turnLabel}>{item.turn}턴</Text>
          </View>
          <Text style={s.messagePosition}>{bot?.position}</Text>
          <View style={[s.botBubble, { borderColor: color.line }]}>
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
        resizeMode="cover"
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.flex} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.header}>
            <View style={s.flex}>
              <View style={s.row}>
                <Text accessibilityRole="header" style={s.pageTitle}>
                  생각방
                </Text>
                <Text style={s.modeBadge}>
                  {service.mode === "mock" ? "토론 시연" : "AI 토론"}
                </Text>
              </View>
              <Text style={s.subtitle}>세 가지 시선, 나에게 맞는 생각</Text>
            </View>
            <IconButton
              name="settings-outline"
              label="생각방 설정"
              disabled={!ready || locked}
              onPress={() => {
                discussion.pause();
                setModal("settings");
              }}
            />
          </View>

          {!ready ? (
            <View style={s.loading}>
              {error ? (
                <>
                  <Copy>{error}</Copy>
                  <Button
                    label="다시 불러오기"
                    onPress={() => void discussion.reload()}
                  />
                </>
              ) : (
                <>
                  <ActivityIndicator color={colors.green} />
                  <Copy>생각방을 준비하고 있어요…</Copy>
                </>
              )}
            </View>
          ) : (
            <>
              {error && !modal ? (
                <View style={s.errorBox} accessibilityLiveRegion="polite">
                  <Text style={s.errorText}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="생각방 상태 다시 확인"
                    onPress={() => void discussion.reload()}
                    disabled={locked}
                    style={s.inlineAction}
                  >
                    <Text style={s.linkText}>상태 다시 확인</Text>
                  </Pressable>
                </View>
              ) : null}
              <FlatList
                ref={list}
                data={visibleMessages}
                keyExtractor={(message) => message.id}
                renderItem={renderMessage}
                style={s.flex}
                contentContainerStyle={[s.messages, !session && s.emptyList]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScroll={({ nativeEvent }) => {
                  const remaining =
                    nativeEvent.contentSize.height -
                    nativeEvent.layoutMeasurement.height -
                    nativeEvent.contentOffset.y;
                  nearBottom.current = remaining < 90;
                  if (nearBottom.current) setShowLatest(false);
                }}
                scrollEventThrottle={100}
                onContentSizeChange={() => {
                  if (nearBottom.current)
                    list.current?.scrollToEnd({ animated: true });
                  else setShowLatest(true);
                }}
                ListHeaderComponent={
                  session ? (
                    <View style={s.conversationHeader}>
                      <View style={s.topicCard}>
                        <Text style={s.eyebrow}>함께 살펴볼 고민</Text>
                        <Text selectable style={s.topicText}>
                          {session.topic}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="세 챗봇의 이름과 입장 보기"
                          onPress={() => {
                            discussion.pause();
                            setModal("participants");
                          }}
                          style={s.participantsButton}
                        >
                          <View style={s.avatarGroup}>
                            {session.bots.map((bot) => (
                              <Avatar key={bot.id} id={bot.id} size={30} />
                            ))}
                          </View>
                          <Text style={s.linkText}>참여자와 입장 보기</Text>
                          <Ionicons
                            name="chevron-forward"
                            color={colors.muted}
                            size={16}
                          />
                        </Pressable>
                      </View>
                      {hiddenCount > 0 && !showHistory ? (
                        <View style={s.historyNotice}>
                          <Ionicons
                            name="eye-off-outline"
                            size={16}
                            color={colors.muted}
                          />
                          <Text style={s.noticeText}>
                            이전 대화 {hiddenCount}개는 숨겨져 있어요. 설정에서
                            표시할 수 있어요.
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : undefined
                }
                ListEmptyComponent={
                  !session ? (
                    <View style={s.welcome}>
                      <View style={s.welcomeAvatars}>
                        {botIds.map((id) => (
                          <Avatar key={id} id={id} size={58} />
                        ))}
                      </View>
                      <Text style={s.welcomeTitle}>
                        당신의 고민을 알려주세요
                      </Text>
                      <Text style={s.welcomeText}>
                        지금 마음에 걸리는 선택이 있나요?{"\n"}
                        서로 다른 입장의 세 친구가 이야기를 나누며{"\n"}
                        생각을 정리할 여유를 함께 만들어요.
                      </Text>
                      <View style={s.exampleCard}>
                        <Text style={s.eyebrow}>
                          이런 고민으로 시작해 보세요
                        </Text>
                        <Text style={s.exampleText}>
                          “지금 취업할까요, 조금 더 준비해서{"\n"}원하는 회사에
                          도전할까요?”
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={s.sessionEmpty}>
                      {hiddenCount > 0
                        ? "고민의 맥락은 이어집니다. 나의 생각을 덧붙이거나 대화를 이어가세요."
                        : "세 친구가 어떤 이야기를 나눌지 천천히 지켜보세요."}
                    </Text>
                  )
                }
                ListFooterComponent={
                  waiting && running ? (
                    <View style={s.typing} accessibilityLiveRegion="polite">
                      <ActivityIndicator size="small" color={colors.green} />
                      <Text style={s.typingText}>
                        {nextBot?.name ?? "대화 상대"}이 생각을 정리하고 있어요…
                      </Text>
                    </View>
                  ) : undefined
                }
              />

              {showLatest ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="최근 대화로 이동"
                  style={s.latestButton}
                  onPress={() => {
                    nearBottom.current = true;
                    setShowLatest(false);
                    list.current?.scrollToEnd({ animated: true });
                  }}
                >
                  <Text style={s.linkText}>최근 대화 보기 ↓</Text>
                </Pressable>
              ) : null}

              <View style={s.controls}>
                {session ? (
                  <>
                    <Text style={s.progress} accessibilityLiveRegion="polite">
                      {progressText}
                    </Text>
                    <View style={s.controlRow}>
                      <View style={s.flex}>
                        <Button
                          label={
                            running
                              ? "대화 중지"
                              : session.next_speaker_index > 0
                                ? "대화 다시 시작"
                                : "대화 이어하기"
                          }
                          icon={running ? "pause" : "play"}
                          secondary={running}
                          disabled={locked || session.state !== "active"}
                          onPress={() =>
                            running
                              ? discussion.pause()
                              : void discussion.resume()
                          }
                        />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="새로운 고민 입력"
                        accessibilityState={{ disabled: locked }}
                        disabled={locked}
                        style={[s.newTopicButton, locked && s.disabled]}
                        onPress={newTopic}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={s.newTopicText}>고민입력</Text>
                      </Pressable>
                    </View>
                    <Text style={s.turnHelp}>
                      세 친구가 한 번씩 말하면 멈춰요. 의견을 보내면 반영해
                      이어갑니다.
                    </Text>
                    <View style={s.composer}>
                      <TextInput
                        accessibilityLabel="토론에 보탤 나의 생각"
                        placeholder="예: 지금은 현실성에 더 비중을 두고 싶어요"
                        placeholderTextColor={colors.muted}
                        value={opinion}
                        onChangeText={setOpinion}
                        maxLength={2000}
                        multiline
                        editable={!locked && session.state === "active"}
                        style={s.opinionInput}
                      />
                      <IconButton
                        name="arrow-up"
                        label={
                          busy === "send" ? "의견 전송 중" : "내 의견 보내기"
                        }
                        disabled={
                          !opinion.trim() ||
                          locked ||
                          session.state !== "active"
                        }
                        onPress={() => void send()}
                      />
                    </View>
                  </>
                ) : (
                  <View style={s.emptyAction}>
                    <Text style={s.emptyHint}>고민입력을 눌러 시작해요</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="고민 입력"
                      accessibilityState={{ disabled: locked }}
                      disabled={locked}
                      onPress={newTopic}
                      style={[s.newTopicButton, locked && s.disabled]}
                    >
                      <Ionicons name="add" size={22} color="#fff" />
                      <Text style={s.newTopicText}>고민입력</Text>
                    </Pressable>
                  </View>
                )}
                {service.mode === "mock" ? (
                  <Text style={s.modeNote}>
                    시연 응답입니다. 실제 AI가 역할과 토론을 생성하지 않습니다.
                  </Text>
                ) : null}
              </View>
            </>
          )}
          <View style={s.tabBar}>
            {(
              [
                { key: "places", title: "공간", icon: "leaf-outline" },
                {
                  key: "discussion",
                  title: "생각방",
                  icon: "chatbubbles-outline",
                },
                { key: "gallery", title: "갤러리", icon: "images-outline" },
              ] as const
            ).map((tab) => (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.title}
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
                  style={[s.tabText, tab.key === "discussion" && s.selectedTab]}
                >
                  {tab.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {modal ? (
        <Dialog
          title={
            modal === "topic"
              ? "어떤 고민을 나눌까요?"
              : modal === "settings"
                ? "생각방 설정"
                : "오늘의 세 가지 시선"
          }
          onClose={closeModal}
          closeDisabled={busy === "confirm"}
        >
          {modal === "topic" ? (
            <>
              <Copy>
                고민이나 함께 토론해 보고 싶은 주제를 자유롭게 적어주세요.
              </Copy>
              {session ? (
                <View style={s.noteBox}>
                  <Copy muted>
                    새로운 역할을 확인하면 지금의 고민 대화가 종료됩니다.
                    취소하면 기존 대화가 유지돼요.
                  </Copy>
                </View>
              ) : null}
              <TextInput
                accessibilityLabel="고민 또는 토론 주제"
                value={topicDraft}
                onChangeText={setTopicDraft}
                placeholder="상황과 선택지, 중요하게 생각하는 점을 알려주세요."
                placeholderTextColor={colors.muted}
                multiline
                maxLength={2000}
                editable={!locked}
                autoFocus
                style={s.topicInput}
              />
              <Text style={s.characterCount}>{topicDraft.length}/2,000</Text>
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button
                label={
                  busy === "prepare"
                    ? "세 가지 입장을 준비하고 있어요…"
                    : service.mode === "mock"
                      ? "시연 역할 만나보기"
                      : "세 가지 입장 만나보기"
                }
                disabled={!topicDraft.trim() || locked}
                onPress={() => void prepare()}
              />
              <Text style={s.smallNote}>
                {isLocal
                  ? "이 기기에만 보관되는 비공개 시연입니다."
                  : "내 계정의 비공개 대화이며 다른 사용자에게 공유되지 않습니다."}
              </Text>
            </>
          ) : null}
          {(modal === "roles" || modal === "participants") && dialogBots ? (
            <>
              <Text selectable style={s.dialogTopic}>
                {modal === "roles" ? proposal?.topic : session?.topic}
              </Text>
              <Copy muted>
                각자의 입장에서 서로 공감하고 질문하며, 때로는 다른 의견을
                나눠요.
              </Copy>
              {dialogBots.map((bot) => (
                <RoleCard key={bot.id} bot={bot} />
              ))}
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              {modal === "roles" ? (
                <>
                  <Button
                    label={
                      busy === "confirm"
                        ? "대화를 준비하고 있어요…"
                        : "확인하고 대화 시작"
                    }
                    disabled={locked}
                    onPress={() => void confirm()}
                  />
                  <Button
                    label="고민 수정하기"
                    secondary
                    disabled={locked}
                    onPress={() => {
                      discussion.cancelProposal();
                      setModal("topic");
                    }}
                  />
                </>
              ) : (
                <Button label="대화로 돌아가기" onPress={closeModal} />
              )}
            </>
          ) : null}
          {modal === "settings" ? (
            <>
              <View style={s.settingRow}>
                <View style={s.flex}>
                  <Text style={s.settingTitle}>이전 생각방 대화 표시</Text>
                  <Copy muted>
                    페이지 재입장이나 앱 재시작 후에도 이전 메시지를 보여줍니다.
                  </Copy>
                </View>
                <Switch
                  accessibilityLabel="이전 생각방 대화 표시"
                  value={showHistory}
                  disabled={locked}
                  onValueChange={(value) => void discussion.saveHistory(value)}
                  trackColor={{ false: "#CBCBC4", true: "#89A17C" }}
                  thumbColor="#FFFCF7"
                />
              </View>
              <View style={s.noteBox}>
                <Copy muted>
                  기본 설정은 숨김입니다. 숨기기는 기록 삭제가 아니며, 고민의
                  맥락은 이어집니다. 이번 입장 후 나눈 대화는 계속 보여요.
                </Copy>
              </View>
              <Copy muted>
                {isLocal
                  ? "대화는 이 기기에 평문으로 저장됩니다. 로컬 설정의 전체 삭제 시 함께 삭제됩니다."
                  : "대화와 설정은 내 계정에 따로 보관됩니다. 일반 공간의 대화 표시 설정과는 별개입니다."}
              </Copy>
              <Copy muted>
                탭을 나가거나 앱이 뒤로 가면 대화가 멈춥니다. 다시 들어온 뒤
                이어하기를 눌러주세요.
              </Copy>
              {service.mode === "mock" ? (
                <Copy muted>
                  현재는 시연 모드입니다. 역할과 응답은 준비된 규칙으로
                  구성합니다.
                </Copy>
              ) : (
                <Copy muted>
                  AI가 여러 관점의 대화를 생성합니다. 중요한 선택은 자신의
                  상황과 사실을 함께 살펴 결정하세요.
                </Copy>
              )}
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <Button label="설정 닫기" onPress={closeModal} />
            </>
          ) : null}
        </Dialog>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 34,
    color: "#314536",
    fontWeight: "700",
  },
  subtitle: { fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 3 },
  modeBadge: {
    color: "#50694C",
    backgroundColor: "#E8EDDF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    overflow: "hidden",
  },
  loading: { flex: 1, justifyContent: "center", padding: 24, gap: 18 },
  messages: { paddingHorizontal: 16, paddingBottom: 20, gap: 20 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  conversationHeader: { gap: 12, paddingTop: 5 },
  topicCard: {
    backgroundColor: "#FFFCF7E8",
    borderColor: "#E5DFD3",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 9,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
    color: colors.muted,
  },
  topicText: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
  },
  participantsButton: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
    minHeight: 44,
    paddingVertical: 4,
  },
  avatarGroup: { flexDirection: "row", gap: 3 },
  avatarFrame: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
  },
  historyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 5,
  },
  noticeText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 19 },
  messageRow: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  speakerLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  botName: { fontSize: 15, lineHeight: 23, fontWeight: "700" },
  turnLabel: { color: colors.muted, fontSize: 11, lineHeight: 18 },
  messagePosition: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 5,
  },
  botBubble: {
    backgroundColor: "#FFFCF7F5",
    borderWidth: 1,
    borderRadius: 18,
    borderTopLeftRadius: 5,
    padding: 14,
  },
  messageText: { fontSize: 16, lineHeight: 26, color: colors.text },
  userRow: { alignItems: "flex-end", gap: 5, paddingLeft: 36 },
  userName: { fontSize: 12, lineHeight: 19, color: colors.muted },
  userBubble: {
    backgroundColor: "#E6ECDF",
    borderColor: "#C9D5BF",
    borderWidth: 1,
    borderRadius: 18,
    borderTopRightRadius: 5,
    padding: 14,
  },
  welcome: { paddingVertical: 24, alignItems: "center", gap: 20 },
  welcomeAvatars: { flexDirection: "row", gap: 16, marginBottom: 3 },
  welcomeTitle: {
    color: "#3D4B3D",
    fontSize: 23,
    lineHeight: 33,
    fontWeight: "600",
    textAlign: "center",
  },
  welcomeText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 25,
    textAlign: "center",
  },
  exampleCard: {
    backgroundColor: "#FFFCF7B8",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    alignItems: "center",
  },
  exampleText: {
    color: "#66725F",
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
  },
  sessionEmpty: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 49,
    gap: 8,
    paddingBottom: 4,
  },
  typingText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 20 },
  latestButton: {
    alignSelf: "center",
    backgroundColor: "#FFFCF7",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    marginBottom: 6,
    justifyContent: "center",
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: "#F7F4EDE8",
    borderTopWidth: 1,
    borderTopColor: "#E5DFD380",
  },
  progress: {
    fontSize: 12,
    color: "#66735E",
    lineHeight: 19,
    textAlign: "center",
  },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  newTopicButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    gap: 4,
    paddingHorizontal: 17,
    paddingVertical: 12,
    backgroundColor: "#697A61",
    borderRadius: 26,
  },
  newTopicText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  disabled: { opacity: 0.45 },
  turnHelp: {
    fontSize: 11,
    lineHeight: 18,
    color: colors.muted,
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFCF7",
    borderWidth: 1,
    borderColor: "#D7D9CC",
    borderRadius: 24,
    padding: 5,
    paddingLeft: 14,
    gap: 4,
  },
  opinionInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 116,
    paddingTop: 11,
    paddingBottom: 10,
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    textAlignVertical: "top",
  },
  modeNote: {
    color: "#7A735F",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingVertical: 6,
  },
  emptyHint: {
    flex: 1,
    textAlign: "right",
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    paddingVertical: 5,
    gap: 4,
  },
  tabText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  selectedTab: { color: colors.green, fontWeight: "700" },
  modalShade: {
    flex: 1,
    backgroundColor: "#27322666",
    justifyContent: "flex-end",
  },
  modalPanel: {
    maxHeight: "94%",
    backgroundColor: colors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  dialogTitle: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 32,
    fontWeight: "700",
  },
  topicInput: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
    minHeight: 150,
    maxHeight: 260,
    textAlignVertical: "top",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  characterCount: {
    alignSelf: "flex-end",
    color: colors.muted,
    fontSize: 12,
    marginTop: -8,
  },
  noteBox: { padding: 14, backgroundColor: "#F0EFE7", borderRadius: 15 },
  smallNote: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  dialogTopic: {
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.text,
  },
  roleCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 20,
    gap: 12,
    backgroundColor: "#FFFFFFA6",
  },
  roleText: { color: colors.text, fontSize: 15, lineHeight: 23, marginTop: 3 },
  settingRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  settingTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
    marginBottom: 6,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF0E5",
    borderWidth: 1,
    borderColor: "#EBCDB8",
  },
  errorText: { color: "#8B4127", fontSize: 14, lineHeight: 22 },
  inlineAction: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  linkText: {
    color: "#506A48",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
});
