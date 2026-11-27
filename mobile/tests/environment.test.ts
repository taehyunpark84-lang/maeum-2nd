import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import appConfig from "../app.config";
import type { ConfigContext } from "expo/config";

test("local development gives the app separate identities and preserves the base config", () => {
  const previous = process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT;
  const config = {
    name: "Original app",
    slug: "original-app",
    scheme: "original",
    ios: { bundleIdentifier: "original.ios" },
    android: { package: "original.android" },
    extra: { marker: "preserved" },
  };
  const snapshot = structuredClone(config);
  const context: ConfigContext = {
    config,
    projectRoot: process.cwd(),
    staticConfigPath: null,
    packageJsonPath: `${process.cwd()}/package.json`,
  };
  try {
    delete process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT;
    assert.deepEqual(appConfig(context), snapshot);
    process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT = "1";
    const development = appConfig(context);
    assert.notEqual(development.slug, config.slug);
    assert.notEqual(development.scheme, config.scheme);
    assert.notEqual(development.ios?.bundleIdentifier, config.ios.bundleIdentifier);
    assert.notEqual(development.android?.package, config.android.package);
    assert.deepEqual(development.extra, config.extra);
    assert.deepEqual(config, snapshot);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT;
    else process.env.EXPO_PUBLIC_LOCAL_DEVELOPMENT = previous;
  }
});

test("development storage cannot read or clear the original app namespace", () => {
  const prefixes = ["", "1"].map((flag) => {
    const child = spawnSync(
      process.execPath,
      ["--import", "tsx", "--eval", 'process.stdout.write(require("./src/config/environment.ts").STORAGE_PREFIX)'],
      { encoding: "utf8", env: { ...process.env, EXPO_PUBLIC_LOCAL_DEVELOPMENT: flag } },
    );
    assert.equal(child.status, 0, child.stderr);
    return child.stdout;
  });
  assert.equal(prefixes[0], "maeum2nd");
  assert.notEqual(prefixes[1], prefixes[0]);
  for (const suffix of ["api.token", "local.v1", "discussion.mock.v1"]) {
    assert.notEqual(`${prefixes[0]}.${suffix}`, `${prefixes[1]}.${suffix}`);
  }
});
