import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { initLoadingScreen } from "../src/lib/loading.js";

function setup(
  reduced = false,
  loadArt = async () => ({
    createPacketLoader: () => ({ pause() {}, dispose() {} }),
  }),
  { introDuration = 0, presented = true } = {},
) {
  const dom = new JSDOM(
    readFileSync(new URL("../index.html", import.meta.url), "utf8"),
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  window.matchMedia = () => ({ matches: reduced });
  const timers = new Map();
  let id = 0;
  window.setTimeout = (fn, delay) => {
    timers.set(++id, { fn, delay });
    return id;
  };
  window.clearTimeout = (key) => timers.delete(key);
  // The loader uses the browser's timer cancellation, as it does in production.
  const oldClear = globalThis.clearTimeout;
  globalThis.clearTimeout = window.clearTimeout;
  let clock = 0;
  const loading = initLoadingScreen({
    loadArt,
    introDuration,
    now: () => clock,
  });
  if (presented)
    document
      .querySelector("#loader-product-fallback")
      .dispatchEvent(new window.Event("load"));
  return {
    loading,
    timers,
    advance(ms) {
      clock += ms;
    },
    $(s) {
      return document.querySelector(s);
    },
    close() {
      loading.dispose();
      globalThis.clearTimeout = oldClear;
      dom.window.close();
      delete globalThis.window;
      delete globalThis.document;
    },
  };
}

test("loading releases the page after readiness and restores keyboard access", () => {
  const t = setup();
  try {
    assert.equal(t.$("#main").inert, true);
    assert.equal(document.activeElement.id, "loader-skip");
    t.loading.stage("assemble");
    assert.equal(t.$("#factory-loader").dataset.stage, "2");
    t.loading.stage("ready");
    assert.equal(t.$("#main").inert, undefined);
    assert.equal(document.body.classList.contains("factory-loading"), false);
    assert.equal(document.activeElement.className, "header-cta");
    const fade = [...t.timers.values()].find((t) => t.delay === 500);
    fade.fn();
    assert.equal(t.$("#factory-loader").hidden, true);
  } finally {
    t.close();
  }
});

test("loading can be skipped or released on failure and slow initialization", () => {
  for (const release of ["skip", "fallback", "timeout", "escape"]) {
    const t = setup(true);
    try {
      if (release === "skip") t.$("#loader-skip").click();
      if (release === "fallback") t.loading.stage("fallback");
      if (release === "timeout")
        [...t.timers.values()].find((t) => t.delay === 15000).fn();
      if (release === "escape")
        document.dispatchEvent(
          new window.KeyboardEvent("keydown", { key: "Escape" }),
        );
      assert.equal(document.body.classList.contains("factory-loading"), false);
      assert.notEqual(t.$("#main").inert, true);
      [...t.timers.values()].find((t) => t.delay === 0).fn();
      assert.equal(t.$("#factory-loader").hidden, true);
      t.loading.stage("ready");
      assert.equal(t.$("#factory-loader").hidden, true);
    } finally {
      t.close();
    }
  }
});

test("the product keeps animating during assembly and releases graphics after reveal", async () => {
  let created = 0,
    pauses = 0,
    disposed = 0;
  const t = setup(false, async () => ({
    createPacketLoader() {
      created++;
      let done = false;
      return {
        pause() {
          pauses++;
        },
        dispose() {
          if (!done) disposed++;
          done = true;
        },
      };
    },
  }));
  try {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(created, 1);
    t.loading.stage("assemble");
    assert.equal(pauses, 0);
    t.loading.stage("ready");
    assert.equal(pauses, 1);
    [...t.timers.values()].find((t) => t.delay === 500).fn();
    assert.equal(disposed, 1);
  } finally {
    t.close();
  }
});

test("a fast factory waits for a presented packet and its brief intro", async () => {
  let resolveArt;
  const pending = new Promise((resolve) => {
    resolveArt = resolve;
  });
  const t = setup(false, () => pending, {
    introDuration: 1800,
    presented: false,
  });
  try {
    t.loading.stage("ready");
    assert.equal(
      t.$("#factory-loader").classList.contains("is-leaving"),
      false,
    );
    assert.equal(t.$("#main").inert, true);
    resolveArt({ createPacketLoader: () => ({ pause() {}, dispose() {} }) });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(t.$("#factory-loader").classList.contains("has-packet"), true);
    assert.equal(
      t.$("#factory-loader").classList.contains("is-leaving"),
      false,
    );
    const intro = [...t.timers.values()].find((t) => t.delay === 1800);
    assert.ok(intro);
    t.advance(1800);
    intro.fn();
    assert.equal(t.$("#factory-loader").classList.contains("is-leaving"), true);
  } finally {
    t.close();
  }
});

test("the displayed fallback receives an intro even when WebGL art fails", async () => {
  const t = setup(
    false,
    async () => {
      throw new Error("No WebGL context");
    },
    { introDuration: 1800 },
  );
  try {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    t.loading.stage("ready");
    assert.equal(
      t.$("#factory-loader").classList.contains("without-product"),
      true,
    );
    assert.equal(
      t.$("#factory-loader").classList.contains("is-leaving"),
      false,
    );
    assert.ok([...t.timers.values()].some((t) => t.delay === 1800));
    t.$("#loader-skip").click();
    assert.equal(t.$("#factory-loader").classList.contains("is-leaving"), true);
    assert.equal(
      [...t.timers.values()].some((t) => t.delay === 1800),
      false,
    );
  } finally {
    t.close();
  }
});
