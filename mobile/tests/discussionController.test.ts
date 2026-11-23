import assert from "node:assert/strict";
import test from "node:test";
import { DiscussionController } from "../src/features/discussion/controller";
import { createLocalDiscussionService } from "../src/features/discussion/localService";
import type { DiscussionService } from "../src/features/discussion/types";

function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: async (key: string) => {
      values.delete(key);
    },
  };
  return {
    storage,
    service: createLocalDiscussionService(storage, { delayMs: 0 }),
  };
}
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 2500;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("controller did not settle");
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}
async function start(controller: DiscussionController) {
  await controller.reload();
  assert.equal(
    await controller.prepare("바로 취업할지 대기업을 준비할지 고민이에요"),
    true,
  );
  assert.equal(await controller.confirm(), true);
}
test("confirmation plays exactly three voices, then waits for another explicit turn", async () => {
  const { service } = fixture();
  const controller = new DiscussionController(service, 0);
  await start(controller);
  await until(() => !controller.getSnapshot().running);
  assert.deepEqual(
    controller.getSnapshot().session?.messages.map((m) => m.speaker),
    ["blue", "amber", "violet"],
  );
  assert.equal(controller.getSnapshot().session?.completed_turns, 1);
  await controller.resume();
  assert.equal(controller.getSnapshot().session?.messages.length, 6);
  assert.equal(controller.getSnapshot().session?.completed_turns, 2);
  controller.dispose();
});
test("pause between voices prevents delayed append and resumes only the unfinished turn", async () => {
  const { service } = fixture();
  const controller = new DiscussionController(service, 30);
  let stopped = false;
  controller.subscribe(() => {
    if (!stopped && controller.getSnapshot().session?.messages.length === 1) {
      stopped = true;
      controller.pause();
    }
  });
  await start(controller);
  await until(() => stopped);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(controller.getSnapshot().session?.messages.length, 1);
  await controller.resume();
  assert.equal(controller.getSnapshot().session?.messages.length, 3);
  assert.equal(controller.getSnapshot().session?.completed_turns, 1);
  controller.dispose();
});
test("late aborted generation cannot overwrite user intervention or new turn state", async () => {
  const { service } = fixture();
  let release!: () => void;
  let first = true;
  let pending = false;
  const delayed: DiscussionService = {
    ...service,
    reply: async (id, revision, requestId, signal) => {
      if (first) {
        first = false;
        pending = true;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        // Simulate a server that could not cancel an already running model request.
        return service.reply(id, revision, requestId);
      }
      return service.reply(id, revision, requestId, signal);
    },
  };
  const controller = new DiscussionController(delayed, 0);
  await start(controller);
  await until(() => pending);
  assert.equal(await controller.send("현실성에 더 비중을 두고 싶어요"), true);
  release();
  await until(() => !controller.getSnapshot().running);
  const messages = controller.getSnapshot().session!.messages;
  assert.equal(messages.length, 4);
  assert.equal(messages[0].speaker, "user");
  assert.deepEqual(
    messages.slice(1).map((m) => m.speaker),
    ["blue", "amber", "violet"],
  );
  assert.equal(controller.getSnapshot().error, "");
  controller.dispose();
});
test("entry hides previous messages by default; showing history survives restart and never deletes messages", async () => {
  const { service, storage } = fixture();
  const first = new DiscussionController(service, 0);
  await start(first);
  await until(() => !first.getSnapshot().running);
  first.dispose();
  const next = new DiscussionController(
    createLocalDiscussionService(storage, { delayMs: 0 }),
    0,
  );
  await next.reload();
  assert.equal(next.getSnapshot().showHistory, false);
  assert.equal(next.getSnapshot().hiddenCount, 3);
  assert.equal(next.getSnapshot().visibleMessages.length, 0);
  await next.saveHistory(true);
  assert.equal(next.getSnapshot().visibleMessages.length, 3);
  next.dispose();
  const restored = new DiscussionController(
    createLocalDiscussionService(storage, { delayMs: 0 }),
    0,
  );
  await restored.reload();
  assert.equal(restored.getSnapshot().visibleMessages.length, 3);
  await restored.saveHistory(false);
  await restored.resume();
  assert.equal(restored.getSnapshot().visibleMessages.length, 3);
  assert.equal(restored.getSnapshot().session?.messages.length, 6);
  restored.dispose();
});
test("cancelled role assignment ignores late result and keeps current topic", async () => {
  const { service } = fixture();
  const controller = new DiscussionController(service, 0);
  await start(controller);
  await until(() => !controller.getSnapshot().running);
  const originalId = controller.getSnapshot().session?.id;
  const request = controller.prepare("친구와 갈등이 있어요");
  controller.cancelProposal();
  assert.equal(await request, false);
  assert.equal(controller.getSnapshot().proposal, null);
  assert.equal(controller.getSnapshot().session?.id, originalId);
  controller.dispose();
});
test("retry sends reuse idempotency key after a response is lost", async () => {
  const { service } = fixture();
  let first = true;
  const unreliable: DiscussionService = {
    ...service,
    send: async (...args) => {
      const result = await service.send(...args);
      if (first) {
        first = false;
        throw new Error("connection lost after commit");
      }
      return result;
    },
  };
  const controller = new DiscussionController(unreliable, 0);
  await start(controller);
  await until(() => !controller.getSnapshot().running);
  assert.equal(await controller.send("미래 가능성을 중요하게 생각해요"), false);
  assert.equal(await controller.send("미래 가능성을 중요하게 생각해요"), true);
  await until(() => !controller.getSnapshot().running);
  assert.equal(
    controller
      .getSnapshot()
      .session?.messages.filter((m) => m.speaker === "user").length,
    1,
  );
  controller.dispose();
});

test("backgrounding during confirmation prevents delayed automatic playback", async () => {
  const { service } = fixture();
  let release!: () => void;
  const delayed: DiscussionService = {
    ...service,
    confirm: async (...args) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return service.confirm(...args);
    },
  };
  const controller = new DiscussionController(delayed, 0);
  await controller.reload();
  await controller.prepare("진로 고민");
  const pending = controller.confirm();
  controller.setForeground(false);
  release();
  assert.equal(await pending, true);
  assert.equal(controller.getSnapshot().running, false);
  assert.equal(controller.getSnapshot().session?.messages.length, 0);
  controller.setForeground(true);
  assert.equal(controller.getSnapshot().running, false);
  await controller.resume();
  assert.equal(controller.getSnapshot().session?.completed_turns, 1);
  controller.dispose();
});

test("a committed last response is reconciled after pause without starting another turn", async () => {
  const { service } = fixture();
  const controller = new DiscussionController(service, 30);
  let stopped = false;
  controller.subscribe(() => {
    if (!stopped && controller.getSnapshot().session?.messages.length === 2) {
      stopped = true;
      controller.pause();
    }
  });
  await start(controller);
  await until(() => stopped);
  const before = controller.getSnapshot().session!;
  await service.reply(before.id, before.revision, "late-committed-reply");
  await controller.resume();
  assert.equal(controller.getSnapshot().session?.messages.length, 3);
  assert.equal(controller.getSnapshot().session?.completed_turns, 1);
  controller.dispose();
});

test("strict effect cleanup followed by reload restores a usable controller", async () => {
  const { service } = fixture();
  const controller = new DiscussionController(service, 0);
  const old = controller.reload();
  controller.dispose();
  await controller.reload();
  await old;
  assert.equal(controller.getSnapshot().ready, true);
  assert.equal(await controller.prepare("관계 고민"), true);
  controller.dispose();
});

test("generation lease busy waits before retry and remains pausable", async () => {
  const { service } = fixture();
  let calls = 0;
  const busy: DiscussionService = {
    ...service,
    reply: async (...args) => {
      calls++;
      if (calls === 1)
        throw Object.assign(new Error("generation busy"), {
          status: 409,
          retryAfter: 0.001,
        });
      return service.reply(...args);
    },
  };
  const controller = new DiscussionController(busy, 0);
  await start(controller);
  await until(() => calls === 1);
  controller.pause();
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(calls, 1);
  await controller.resume();
  assert.equal(controller.getSnapshot().session?.completed_turns, 1);
  controller.dispose();
});
