import assert from "node:assert/strict";
import test from "node:test";
import { DiscussionController } from "../src/features/discussion/controller";
import { createLocalDiscussionService } from "../src/features/discussion/localService";
import { createNetworkDiscussionService } from "../src/features/discussion/networkService";
import { PANEL_IDS, COUNCIL_STEPS } from "../src/features/discussion/council";
import type { DiscussionService } from "../src/features/discussion/types";

function fixture() {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
  };
  return {
    storage,
    service: createLocalDiscussionService(storage, {
      protocolVersion: 2,
      delayMs: 0,
    }),
  };
}
async function settled(controller: DiscussionController) {
  const deadline = Date.now() + 4000;
  while (controller.getSnapshot().running || controller.getSnapshot().busy) {
    assert.ok(Date.now() < deadline, "Council did not settle");
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
}
async function start(controller: DiscussionController) {
  await controller.reload();
  assert.equal(
    await controller.prepare("친구에게 서운하지만 다시 만나고 싶어."),
    true,
  );
  assert.equal(await controller.confirm(), true);
  await settled(controller);
}

test("council runs through moderator, four opinions, debate, bridge, question and waits for input", async () => {
  const { storage, service } = fixture();
  const controller = new DiscussionController(service, 0);
  await start(controller);
  const first = controller.getSnapshot().session!;
  assert.deepEqual(
    first.messages.map((message) => message.speaker),
    ["moderator", ...PANEL_IDS, ...PANEL_IDS, "moderator", "sadness"],
  );
  assert.equal(first.messages.length, COUNCIL_STEPS);
  assert.equal(first.phase, "awaiting_user");
  await controller.resume();
  assert.deepEqual(controller.getSnapshot().session, first);
  controller.dispose();
  const reopened = new DiscussionController(
    createLocalDiscussionService(storage, { protocolVersion: 2, delayMs: 0 }),
    0,
  );
  await reopened.reload();
  assert.deepEqual(reopened.getSnapshot().visibleMessages, first.messages);
  assert.equal(reopened.getSnapshot().running, false);
  assert.equal(await reopened.send("내 마음을 먼저 알아줬으면 좋겠어."), true);
  await settled(reopened);
  assert.equal(
    reopened.getSnapshot().session?.messages.at(-1)?.speaker,
    "anxiety",
  );
  assert.equal(reopened.getSnapshot().session?.completed_turns, 2);
  assert.ok(
    reopened
      .getSnapshot()
      .visibleMessages.some((message) => message.speaker === "user"),
  );
  assert.equal(await reopened.saveHistory(true), true);
  assert.equal(
    reopened.getSnapshot().visibleMessages.length,
    COUNCIL_STEPS * 2 + 1,
  );
  reopened.dispose();
});

test("returning mid-cycle resumes remaining speakers without a continue button or duplicate replies", async () => {
  const { storage, service } = fixture();
  const controller = new DiscussionController(service, 15);
  let paused = false;
  controller.subscribe(() => {
    if (!paused && controller.getSnapshot().session?.messages.length === 3) {
      paused = true;
      controller.setForeground(false);
    }
  });
  await start(controller);
  assert.equal(controller.getSnapshot().session?.messages.length, 3);
  controller.dispose();
  const reopened = new DiscussionController(
    createLocalDiscussionService(storage, { protocolVersion: 2, delayMs: 0 }),
    0,
  );
  await reopened.reload();
  await settled(reopened);
  const messages = reopened.getSnapshot().session!.messages;
  assert.equal(messages.length, COUNCIL_STEPS);
  assert.equal(
    new Set(messages.map((message) => message.id)).size,
    COUNCIL_STEPS,
  );
  reopened.dispose();
});

test("reminder toggle persists, invalidates an in-flight generation and affects the following reply", async () => {
  const { storage, service } = fixture();
  let release!: () => void;
  let pending = false;
  let hold = true;
  const flags: boolean[] = [];
  const delayed: DiscussionService = {
    ...service,
    reply: async (...args) => {
      flags.push((await service.settings()).reminder_enabled ?? true);
      if (hold) {
        hold = false;
        pending = true;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      return service.reply(...args);
    },
  };
  const controller = new DiscussionController(delayed, 0);
  await controller.reload();
  await controller.prepare("마음 회의");
  await controller.confirm();
  while (!pending) await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(await controller.saveReminder(false), true);
  release();
  await settled(controller);
  assert.equal(flags[0], true);
  assert.equal(flags.at(-1), false);
  assert.equal(
    controller.getSnapshot().session?.messages.length,
    COUNCIL_STEPS,
  );
  const restored = createLocalDiscussionService(storage, {
    protocolVersion: 2,
    delayMs: 0,
  });
  assert.equal((await restored.settings()).reminder_enabled, false);
  assert.equal(await controller.saveReminder(true), true);
  assert.equal(
    controller.getSnapshot().session?.messages.length,
    COUNCIL_STEPS,
  );
  controller.dispose();
});

test("new council requests use v2 protocol, and reminder settings travel to the server", async () => {
  const { service } = fixture();
  const draft = await service.prepare("새 안건", "prepare-council-001");
  const requests: { url: string; body: unknown }[] = [];
  const network = createNetworkDiscussionService("openai", {
    baseUrl: "http://local.test",
    headers: () => ({}),
    protocolVersion: 2,
    fetch: async (url, init) => {
      requests.push({
        url: String(url),
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      return new Response(
        JSON.stringify(
          String(url).includes("settings")
            ? { show_history: false, reminder_enabled: false }
            : draft,
        ),
        { status: 200 },
      );
    },
  });
  await network.prepare("새 안건", "prepare-council-001");
  assert.deepEqual(requests[0].body, {
    topic: "새 안건",
    request_id: "prepare-council-001",
    protocol_version: 2,
  });
  await network.saveSettings({ show_history: false, reminder_enabled: false });
  assert.deepEqual(requests[1].body, {
    show_history: false,
    reminder_enabled: false,
  });
  assert.equal((await network.settings()).reminder_enabled, false);
  assert.ok(requests[2].url.endsWith("?protocol_version=2"));
});

test("old server or ignored reminder changes cannot masquerade as a working new council", async () => {
  const { service, storage } = fixture();
  const modern = await service.prepare("새 안건", "prepare-modern-001");
  const legacy = await createLocalDiscussionService(storage, {
    delayMs: 0,
  }).prepare("이전 안건", "prepare-legacy-001");
  let response: unknown = legacy;
  const network = createNetworkDiscussionService("openai", {
    baseUrl: "http://local.test",
    headers: () => ({}),
    protocolVersion: 2,
    fetch: async () => new Response(JSON.stringify(response), { status: 200 }),
  });
  await assert.rejects(
    network.prepare("새 안건", "prepare-modern-001"),
    /서버를 업데이트/,
  );
  response = { show_history: false };
  await assert.rejects(
    network.saveSettings({ show_history: false, reminder_enabled: false }),
    /리마인더 설정/,
  );
  response = { ...modern, phase: "awaiting_user" };
  await assert.rejects(network.get(modern.id), /응답 형식/);
});
