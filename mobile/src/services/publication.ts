type Draft = { title: string; caption: string; anonymous: boolean };

// Deliberate allowlist: no conversation, poem, interpretation or model scores.
export function publicationInput(artwork: { id: string }, draft: Draft) {
  const title = draft.title.trim();
  if (!title) throw new Error("제목을 입력해 주세요.");
  return {
    diary_id: artwork.id,
    title,
    caption: draft.caption.trim(),
    anonymous: draft.anonymous,
  };
}
