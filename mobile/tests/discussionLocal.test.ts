import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalDiscussionService,
  DISCUSSION_LOCAL_KEY,
  LocalDiscussionError,
} from "../src/features/discussion/localService";
import type { DiscussionService } from "../src/features/discussion/types";

function memoryStorage(initial: string | null = null) {
  let raw = initial;
  let writes = 0;
  let fail = false;
  return {
    get raw() {
      return raw;
    },
    get writes() {
      return writes;
    },
    set fail(value: boolean) {
      fail = value;
    },
    async getItem(key: string) {
      assert.equal(key, DISCUSSION_LOCAL_KEY);
      return raw;
    },
    async setItem(key: string, value: string) {
      assert.equal(key, DISCUSSION_LOCAL_KEY);
      if (fail) throw new Error("Disk full");
      writes++;
      raw = value;
    },
    async removeItem(key: string) {
      assert.equal(key, DISCUSSION_LOCAL_KEY);
      raw = null;
    },
  };
}
async function active(
  service: DiscussionService,
  topic = "바로 중소기업에 취업할지 대기업에 도전할지 고민이에요",
) {
  const proposal = await service.prepare(topic, "prepare-first-001");
  return service.confirm(proposal.id);
}
const conflict = (error: unknown) =>
  error instanceof LocalDiscussionError && error.status === 409;

test("one complete turn has exactly three distinct bots and waits at the next turn boundary", async () => {
  const storage = memoryStorage();
  const service = createLocalDiscussionService(storage, { delayMs: 0 });
  let session = await active(service);
  assert.deepEqual(
    session.bots.map((bot) => bot.id),
    ["blue", "amber", "violet"],
  );
  assert.equal(new Set(session.bots.map((bot) => bot.position)).size, 3);
  for (let index = 0; index < 3; index++) {
    session = await service.reply(
      session.id,
      session.revision,
      `turn-first-${index}`,
    );
    assert.equal(session.messages.length, index + 1);
  }
  assert.equal(session.next_speaker_index, 0);
  assert.equal(session.completed_turns, 1);
  assert.deepEqual(
    session.messages.map((message) => message.speaker),
    ["blue", "amber", "violet"],
  );
  assert.match(session.messages[1].text, new RegExp(session.bots[0].name));
  assert.match(session.messages[2].text, new RegExp(session.bots[1].name));
  assert.equal((await service.get(session.id)).messages.length, 3);
});

test("user intervention preserves the cursor and changes subsequent support", async () => {
  const service = createLocalDiscussionService(memoryStorage(), { delayMs: 0 });
  let session = await active(service);
  session = await service.reply(
    session.id,
    session.revision,
    "reply-before-001",
  );
  session = await service.send(
    session.id,
    "미래보다 현실성에 비중을 두고 싶어요",
    "opinion-first-001",
  );
  assert.equal(session.next_speaker_index, 1);
  assert.equal(session.completed_turns, 0);
  session = await service.reply(
    session.id,
    session.revision,
    "reply-after-001",
  );
  assert.equal(session.messages.at(-1)?.speaker, "amber");
  assert.match(session.messages.at(-1)!.text, /미래보다 현실성에 비중/);
  assert.match(session.messages.at(-1)!.text, /현실과 생활 안정에 무게/);
});

test("request replay is idempotent and stale revisions do not add messages", async () => {
  const storage = memoryStorage();
  let service = createLocalDiscussionService(storage, { delayMs: 0 });
  const session = await active(service);
  const first = await service.reply(
    session.id,
    session.revision,
    "reply-idempotent-001",
  );
  const repeated = await service.reply(
    session.id,
    session.revision,
    "reply-idempotent-001",
  );
  assert.deepEqual(repeated, first);
  await assert.rejects(
    service.reply(session.id, session.revision, "reply-stale-001"),
    conflict,
  );
  const sent = await service.send(
    session.id,
    "성장 가능성이 더 중요해요",
    "send-idempotent-001",
  );
  assert.deepEqual(
    await service.send(
      session.id,
      "성장 가능성이 더 중요해요",
      "send-idempotent-001",
    ),
    sent,
  );
  await assert.rejects(
    service.send(session.id, "현실이 더 중요해요", "send-idempotent-001"),
    conflict,
  );
  service = createLocalDiscussionService(storage, { delayMs: 0 });
  assert.deepEqual(
    await service.send(
      session.id,
      "성장 가능성이 더 중요해요",
      "send-idempotent-001",
    ),
    sent,
  );
  assert.equal((await service.get(session.id)).messages.length, 2);
});

test("draft creation preserves existing topic until confirmation and confirm is idempotent", async () => {
  const service = createLocalDiscussionService(memoryStorage(), { delayMs: 0 });
  const current = await active(service);
  const draft = await service.prepare(
    "친구와의 관계에서 어디까지 배려해야 할까요",
    "prepare-second-001",
  );
  assert.equal((await service.current())?.id, current.id);
  assert.equal((await service.get(current.id)).state, "active");
  assert.equal(draft.state, "draft");
  assert.match(draft.bots[1].position, /상대/);
  const next = await service.confirm(draft.id);
  assert.equal((await service.get(current.id)).state, "ended");
  assert.equal((await service.current())?.id, draft.id);
  assert.deepEqual(await service.confirm(draft.id), next);
  await assert.rejects(
    service.reply(current.id, current.revision, "ended-reply-001"),
    conflict,
  );
});

test("history setting defaults off and sessions survive restart with defensive copies", async () => {
  const storage = memoryStorage();
  const service = createLocalDiscussionService(storage, { delayMs: 0 });
  assert.deepEqual(await service.settings(), { show_history: false });
  let session = await active(
    service,
    "시험 공부와 자격증 준비를 병행할지 고민이에요",
  );
  assert.match(session.bots[1].position, /배움/);
  session = await service.reply(
    session.id,
    session.revision,
    "reply-restored-001",
  );
  await service.saveSettings({ show_history: true });
  const restored = createLocalDiscussionService(storage, { delayMs: 0 });
  assert.deepEqual(await restored.settings(), { show_history: true });
  assert.deepEqual(await restored.current(), session);
  const copied = await restored.current();
  copied!.messages[0].text = "mutated by caller";
  assert.notEqual(
    (await restored.current())!.messages[0].text,
    "mutated by caller",
  );
  await restored.saveSettings({ show_history: false });
  assert.equal((await restored.current())!.messages.length, 1);
});

test("corrupt records and read failures are protected from overwrite", async () => {
  for (const raw of ["{broken", JSON.stringify({ version: 9, sessions: [] })]) {
    const storage = memoryStorage(raw);
    const service = createLocalDiscussionService(storage, { delayMs: 0 });
    await assert.rejects(service.current(), /기록이 손상/);
    await assert.rejects(
      service.saveSettings({ show_history: true }),
      /기록이 손상/,
    );
    assert.equal(storage.writes, 0);
    assert.equal(storage.raw, raw);
  }
  const storage = memoryStorage();
  const service = createLocalDiscussionService(
    {
      ...storage,
      async getItem() {
        throw new Error("Unavailable");
      },
    },
    { delayMs: 0 },
  );
  await assert.rejects(
    service.prepare("무엇을 먼저 해야 할까요", "prepare-readfail-001"),
    /기록을 읽지 못/,
  );
  assert.equal(storage.writes, 0);
});

test("failed writes do not mutate memory and retry commits once", async () => {
  const storage = memoryStorage();
  const service = createLocalDiscussionService(storage, { delayMs: 0 });
  const session = await active(service);
  const original = storage.raw;
  storage.fail = true;
  await assert.rejects(
    service.send(session.id, "제 마음을 우선할게요", "write-retry-001"),
    /저장하지 못/,
  );
  assert.equal(storage.raw, original);
  assert.equal((await service.current())!.messages.length, 0);
  storage.fail = false;
  const result = await service.send(
    session.id,
    "제 마음을 우선할게요",
    "write-retry-001",
  );
  assert.equal(result.messages.length, 1);
});

test("an intervening user message rejects an in-flight stale reply", async () => {
  const service = createLocalDiscussionService(memoryStorage(), {
    delayMs: 30,
  });
  const session = await active(service);
  const reply = service.reply(
    session.id,
    session.revision,
    "concurrent-reply-001",
  );
  const rejected = assert.rejects(reply, conflict);
  await service.send(
    session.id,
    "지금은 안정이 더 중요해요",
    "concurrent-send-001",
  );
  await rejected;
  const current = await service.current();
  assert.equal(current!.messages.length, 1);
  assert.equal(current!.messages[0].speaker, "user");
  assert.equal(current!.next_speaker_index, 0);
});

test("aborting a pending reply stops generation without adding a message", async () => {
  const service = createLocalDiscussionService(memoryStorage(), {
    delayMs: 30,
  });
  const session = await active(service);
  const controller = new AbortController();
  const reply = service.reply(
    session.id,
    session.revision,
    "aborted-reply-001",
    controller.signal,
  );
  const rejected = assert.rejects(
    reply,
    (error: unknown) => error instanceof Error && error.name === "AbortError",
  );
  controller.abort();
  await rejected;
  assert.equal((await service.current())!.messages.length, 0);
});
