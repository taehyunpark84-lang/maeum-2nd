import assert from "node:assert/strict";
import test from "node:test";
import { publicationInput } from "../src/services/publication";

test("publication uses only approved public fields even if artwork/draft contain private data", () => {
  const artwork = {
    id: "private-art",
    poem: "private poem",
    messages: ["private conversation"],
    interpretation: "private",
    emotion: 0.9,
  };
  const draft = {
    title: "  공개 제목 ",
    caption: " 선택 설명 ",
    anonymous: true,
    messages: artwork.messages,
  };
  const value = publicationInput(artwork, draft);
  assert.deepEqual(value, {
    diary_id: "private-art",
    title: "공개 제목",
    caption: "선택 설명",
    anonymous: true,
  });
  assert.ok(!JSON.stringify(value).includes("private conversation"));
  assert.equal(artwork.poem, "private poem");
});

test("blank title cannot be submitted and opting into nickname remains explicit", () => {
  assert.throws(() =>
    publicationInput(
      { id: "a" },
      { title: "  ", caption: "", anonymous: true },
    ),
  );
  assert.equal(
    publicationInput(
      { id: "a" },
      { title: "제목", caption: "", anonymous: false },
    ).anonymous,
    false,
  );
});
