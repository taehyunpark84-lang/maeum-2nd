import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/services/saveArtwork.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

function setup(
  options: {
    granted?: boolean;
    albumExists?: boolean;
    lookupFails?: boolean;
    albumFails?: boolean;
    downloadFails?: boolean;
    cleanupFails?: boolean;
  } = {},
) {
  const calls: string[] = [];
  const album = { id: "album" };
  class FakeFile {
    exists = true;
    uri = "file:///cache/maeum-art.png";
    delete() {
      calls.push("cleanup");
      if (options.cleanupFails) throw new Error("cache unavailable");
    }
    static async downloadFileAsync(
      url: string,
      _file: FakeFile,
      config: { headers: Record<string, string> },
    ) {
      assert.equal(url, "https://example.test/diaries/art/image");
      assert.equal(config.headers.Authorization, "Bearer test-token");
      calls.push("download");
      if (options.downloadFails) throw new Error("download failed");
    }
  }
  const modules: Record<string, unknown> = {
    "react-native": { Platform: { OS: "android" } },
    "expo-file-system": { File: FakeFile, Paths: { cache: "cache" } },
    "./api": {
      API_URL: "https://example.test",
      authHeaders: () => ({ Authorization: "Bearer test-token" }),
    },
    "expo-media-library": {
      requestPermissionsAsync: async () => ({
        granted: options.granted ?? true,
      }),
      Album: {
        get: async () => {
          if (options.lookupFails) throw new Error("limited access");
          return options.albumExists ? album : null;
        },
        create: async () => {
          calls.push("create-album");
          if (options.albumFails) throw new Error("album unavailable");
        },
      },
      Asset: {
        create: async (_uri: string, target?: unknown) => {
          calls.push(target === album ? "save-in-album" : "save");
          return { id: "saved" };
        },
      },
    },
  };
  const exports: { saveArtwork?: (id: string) => Promise<string> } = {};
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, `Unexpected dependency: ${name}`);
      return modules[name];
    },
  });
  return { save: () => exports.saveArtwork!("art"), calls };
}

test("artwork save downloads with authentication into an existing album", async () => {
  const flow = setup({ albumExists: true });
  assert.match(await flow.save(), /앨범에 그림을 저장/);
  assert.deepEqual(flow.calls, ["download", "save-in-album", "cleanup"]);
});

test("limited album lookup still saves; album failure reports the saved image", async () => {
  const flow = setup({ lookupFails: true, albumFails: true });
  assert.match(await flow.save(), /전용 앨범에는 넣지 못/);
  assert.deepEqual(flow.calls, ["download", "save", "create-album", "cleanup"]);
});

test("denied permission prevents download and library writes", async () => {
  const flow = setup({ granted: false });
  await assert.rejects(flow.save(), /권한이 필요/);
  assert.deepEqual(flow.calls, []);
});

test("failed download never saves and preserves its error if cleanup fails", async () => {
  const flow = setup({ downloadFails: true, cleanupFails: true });
  await assert.rejects(flow.save(), /download failed/);
  assert.deepEqual(flow.calls, ["download", "cleanup"]);
});

test("cache cleanup failure does not report a successful save as failed", async () => {
  const flow = setup({ cleanupFails: true });
  assert.match(await flow.save(), /앨범에 그림을 저장/);
  assert.deepEqual(flow.calls, ["download", "save", "create-album", "cleanup"]);
});
