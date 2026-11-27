import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Button, Copy, Field, colors, styles } from "../../components/ui";
import { API_URL, api, authHeaders } from "../../services/api";

type Reaction = "heart" | "like" | "sad";
type CommunityPost = {
  id: string;
  title: string;
  caption: string;
  author_name: string;
  anonymous: boolean;
  created: number;
  image_url: string;
  reaction_counts: Record<Reaction, number>;
  my_reaction: Reaction | null;
  comment_count: number;
  mine: boolean;
};
type PostComment = {
  id: string;
  author_name: string;
  text: string;
  created: number;
};

const reactions: { key: Reaction; emoji: string; label: string }[] = [
  { key: "heart", emoji: "❤️", label: "좋아요" },
  { key: "like", emoji: "👍", label: "공감해요" },
  { key: "sad", emoji: "🥹", label: "슬퍼요" },
];

export default function CommunityFeed({ imageScope }: { imageScope: string }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPost, setBusyPost] = useState("");
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, PostComment[]>
  >({});
  const [commentsLoading, setCommentsLoading] = useState("");
  const [commentSending, setCommentSending] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const refreshRevision = useRef(0);

  const refresh = useCallback(async () => {
    const revision = ++refreshRevision.current;
    setError("");
    try {
      const next = await api<CommunityPost[]>("/feed");
      if (revision === refreshRevision.current) setPosts(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "작품 피드를 불러오지 못했어요.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api<CommunityPost[]>("/feed")
      .then((next) => {
        if (alive) setPosts(next);
      })
      .catch((e: unknown) => {
        if (alive)
          setError(
            e instanceof Error ? e.message : "작품 피드를 불러오지 못했어요.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  async function withdraw(postId: string) {
    ++refreshRevision.current;
    setBusyPost(postId);
    setError("");
    try {
      await api(`/posts/${postId}`, "DELETE");
      ++refreshRevision.current;
      setPosts((current) => current.filter((post) => post.id !== postId));
      setCommentsByPost((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      if (openComments === postId) setOpenComments("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "공유를 취소하지 못했어요.");
    } finally {
      setBusyPost("");
    }
  }

  async function react(postId: string, reaction: Reaction) {
    setBusyPost(postId);
    setError("");
    try {
      const updated = await api<CommunityPost>(
        `/posts/${postId}/reaction`,
        "POST",
        { reaction },
      );
      setPosts((current) =>
        current.map((post) => (post.id === postId ? updated : post)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "공감을 저장하지 못했어요.");
    } finally {
      setBusyPost("");
    }
  }

  async function toggleComments(postId: string) {
    if (openComments === postId) {
      setOpenComments("");
      return;
    }
    setOpenComments(postId);
    setCommentDraft("");
    if (commentsByPost[postId]) return;
    setCommentsLoading(postId);
    setError("");
    try {
      const comments = await api<PostComment[]>(`/posts/${postId}/comments`);
      setCommentsByPost((current) => ({ ...current, [postId]: comments }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글을 불러오지 못했어요.");
    } finally {
      setCommentsLoading("");
    }
  }

  async function submitComment(postId: string) {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentSending(postId);
    setError("");
    try {
      const comment = await api<PostComment>(
        `/posts/${postId}/comments`,
        "POST",
        { text },
      );
      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), comment],
      }));
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, comment_count: post.comment_count + 1 }
            : post,
        ),
      );
      setCommentDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "댓글을 등록하지 못했어요.");
    } finally {
      setCommentSending("");
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
            마음 작품 피드
          </Text>
          <Copy muted>서로의 이야기가 담긴 작품을 함께 감상해요.</Copy>
        </View>
        <Button
          label="새로고침"
          icon="refresh"
          secondary
          onPress={() => void refresh()}
        />
      </View>
      {error ? <Copy>{error}</Copy> : null}
      {loading ? (
        <ActivityIndicator color={colors.green} />
      ) : posts.length ? (
        posts.map((post) => (
          <View key={post.id} style={[styles.card, { padding: 12, gap: 12 }]}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text
                style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}
              >
                {post.title}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {post.anonymous ? "익명" : post.author_name}
              </Text>
            </View>
            <Image
              source={{
                uri: `${API_URL}${post.image_url}`,
                headers: authHeaders(),
              }}
              cachePolicy="none"
              contentFit="contain"
              recyclingKey={`${imageScope}-${post.id}`}
              style={{
                width: "100%",
                aspectRatio: 2 / 3,
                borderRadius: 16,
                backgroundColor: "#F4F0E8",
              }}
            />
            {post.caption ? <Copy>{post.caption}</Copy> : null}
            <View
              style={[
                styles.row,
                { justifyContent: "space-around", flexWrap: "wrap" },
              ]}
            >
              {reactions.map((item) => {
                const selected = post.my_reaction === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label} ${post.reaction_counts[item.key]}개`}
                    accessibilityState={{
                      selected,
                      disabled: busyPost === post.id,
                    }}
                    disabled={busyPost === post.id}
                    onPress={() => void react(post.id, item.key)}
                    style={{
                      minHeight: 42,
                      minWidth: 88,
                      paddingHorizontal: 10,
                      borderRadius: 22,
                      backgroundColor: selected ? "#E4EAD9" : "#F4F0E8",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14 }}>
                      {item.emoji} {post.reaction_counts[item.key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={`댓글 ${post.comment_count}`}
              icon="chatbubble-outline"
              secondary
              onPress={() => void toggleComments(post.id)}
            />
            {post.mine && (
              <Button
                label="공유 취소·게시글 삭제"
                secondary
                disabled={busyPost === post.id}
                onPress={() =>
                  Alert.alert(
                    "공유를 취소할까요?",
                    "피드의 게시글·공감·댓글이 삭제됩니다. 내 갤러리의 원본 작품은 유지됩니다.",
                    [
                      { text: "유지", style: "cancel" },
                      {
                        text: "공유 취소",
                        style: "destructive",
                        onPress: () => void withdraw(post.id),
                      },
                    ],
                  )
                }
              />
            )}
            {openComments === post.id && (
              <View style={{ gap: 10 }}>
                {commentsLoading === post.id ? (
                  <ActivityIndicator color={colors.green} />
                ) : (commentsByPost[post.id] ?? []).length ? (
                  commentsByPost[post.id].map((comment) => (
                    <View
                      key={comment.id}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: "#F4F0E8",
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {comment.author_name}
                      </Text>
                      <Copy>{comment.text}</Copy>
                    </View>
                  ))
                ) : (
                  <Copy muted>첫 댓글을 남겨 보세요.</Copy>
                )}
                <Field
                  label="댓글 작성"
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  maxLength={2000}
                  placeholder="작품을 보고 떠오른 마음을 적어 주세요"
                />
                <Button
                  label={commentSending === post.id ? "등록 중…" : "댓글 등록"}
                  disabled={commentSending === post.id || !commentDraft.trim()}
                  onPress={() => void submitComment(post.id)}
                />
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={[styles.card, { padding: 28 }]}>
          <Copy>
            아직 공유된 작품이 없어요. 갤러리에서 작품을 열고 ‘공유하기’를 눌러
            첫 작품을 소개해 주세요.
          </Copy>
        </View>
      )}
    </View>
  );
}
