import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { initLoadingScreen } from "../src/lib/loading.js";

function setup(reduced = false) {
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
  const loading = initLoadingScreen();
  return {
    loading,
    timers,
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
