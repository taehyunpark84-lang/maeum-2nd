import assert from "node:assert/strict";
import test from "node:test";
import {
  createNetworkDiscussionService,
  DiscussionNetworkError,
} from "../src/features/discussion/networkService";

const session = {
  id: "session-1",
  topic: "진로 고민",
  bots: ["blue", "amber", "violet"].map((id, i) => ({
    id,
    name: `관점${i}`,
    position: `입장${i}`,
    description: "설명",
  })),
  messages: [],
  next_speaker_index: 0,
  completed_turns: 0,
  revision: 1,
  state: "active",
};
const make = (fetcher: typeof fetch) =>
  createNetworkDiscussionService("mock", {
    baseUrl: "http://test.invalid/",
    headers: () => ({ Authorization: "Bearer synthetic-token" }),
    fetch: fetcher,
  });

test("network adapter preserves auth, revision and idempotency contract", async () => {
  const service = make(async (url, init) => {
    assert.equal(url, "http://test.invalid/discussions/session-1/reply");
    assert.equal(init?.method, "POST");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer synthetic-token",
    );
    assert.deepEqual(JSON.parse(init?.body as string), {
      expected_revision: 1,
      request_id: "request-id-1",
    });
    return Response.json(session);
  });
  assert.deepEqual(
    await service.reply("session-1", 1, "request-id-1"),
    session,
  );
});
test("malformed roles/settings cannot enter playback state", async () => {
  const badRoles = make(async () =>
    Response.json({
      ...session,
      bots: [session.bots[0], session.bots[0], session.bots[2]],
    }),
  );
  await assert.rejects(badRoles.get("session-1"), /응답 형식/);
  const badSettings = make(async () =>
    Response.json({ show_history: "false" }),
  );
  await assert.rejects(badSettings.settings(), /설정/);
});
test("generation lease busy response preserves retry delay and expired auth gets readable action", async () => {
  const busy = make(async () =>
    Response.json(
      { detail: "발언 생성 중" },
      { status: 409, headers: { "Retry-After": "2" } },
    ),
  );
  await assert.rejects(
    busy.reply("session-1", 1, "request-id-1"),
    (error: unknown) =>
      error instanceof DiscussionNetworkError &&
      error.status === 409 &&
      error.retryAfter === 2,
  );
  const expired = make(async () => Response.json({}, { status: 401 }));
  await assert.rejects(expired.current(), /다시 로그인/);
});
test("pause signal reaches active fetch and rejects without parsing a late reply", async () => {
  const abort = new AbortController();
  let pending = false;
  const service = make(async (_url, init) => {
    pending = true;
    return new Promise<Response>((_resolve, reject) => {
      init!.signal!.addEventListener(
        "abort",
        () => reject(new Error("cancelled")),
        { once: true },
      );
    });
  });
  const response = service.reply("session-1", 1, "request-id-1", abort.signal);
  assert.equal(pending, true);
  abort.abort();
  await assert.rejects(response, /cancelled/);
});
