import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

// The existing interaction suite now targets the React entry, not the retired
// imperative HTML controller. It remains available to the repository's CI.
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const { default: App } = await server.ssrLoadModule("/src/App.jsx");
after(() => server.close());

async function setup({ reduced = false, fail = false } = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    pretendToBeVisual: true,
    url: "https://crisp.example/",
  });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const media = new w.EventTarget();
  media.matches = reduced;
  w.matchMedia = () => media;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const state = {
    playing: !reduced,
    audioOn: false,
    musicOn: false,
    inspect: false,
    stage: 0,
    flavour: 0,
    mode: "factory",
  };
  const calls = { disposed: 0 };
  const engine = {
    get state() {
      return state;
    },
    setPlaying(v) {
      state.playing = v;
    },
    setFlavour(v) {
      state.flavour = v;
    },
    setJourney(v) {
      state.stage = v;
    },
    setMode(v) {
      state.mode = v;
    },
    setInspect(v) {
      state.inspect = v;
    },
    setMusic(v) {
      state.musicOn = v;
    },
    async setAudio(v) {
      state.audioOn = v;
    },
    setReducedMotion(v) {
      if (v) state.playing = false;
    },
    setPageVisible() {},
    setVisible() {},
    dispose() {
      calls.disposed++;
    },
  };
  const loadFactory = async () => ({
    createFactory(canvas, options) {
      if (fail) throw new Error("Graphics unavailable");
      queueMicrotask(options.onReady);
      return engine;
    },
  });
  const root = createRoot(w.document.getElementById("root"));
  await act(async () => {
    root.render(React.createElement(App, { loadFactory }));
  });
  const button = (name) =>
    [...w.document.querySelectorAll("button")].find(
      (b) =>
        b.getAttribute("aria-label") === name || b.textContent.includes(name),
    );
  const click = async (name) => {
    const b = button(name);
    assert.ok(b, name);
    await act(async () => {
      b.click();
    });
  };
  return {
    w,
    state,
    calls,
    media,
    button,
    click,
    async close() {
      await act(async () => root.unmount());
      dom.window.close();
    },
  };
}

test("the factory, product collection and truck share one stable canvas", async () => {
  const t = await setup();
  try {
    const canvas = t.w.document.querySelector("canvas");
    await t.click("Deliver");
    assert.equal(t.state.mode, "delivery");
    await t.click("Inspect the packaging");
    assert.equal(t.state.mode, "product");
    await t.click("Slice");
    assert.equal(t.state.mode, "factory");
    assert.equal(t.state.stage, 2);
    assert.equal(t.w.document.querySelector("canvas"), canvas);
    assert.equal(t.w.document.querySelectorAll("canvas").length, 1);
  } finally {
    await t.close();
  }
  assert.equal(t.calls.disposed, 1);
});

test("flavours update the renderer and the product artwork", async () => {
  const t = await setup();
  try {
    await t.click("Garden Herbs");
    assert.equal(t.state.flavour, 2);
    await t.click("Inspect the packaging");
    assert.ok(
      t.w.document
        .querySelector(".scene-fallback img")
        .src.endsWith("/packs/herbs.svg"),
    );
  } finally {
    await t.close();
  }
});

test("audio, optional music and pause remain synchronized with engine state", async () => {
  const t = await setup();
  try {
    await t.click("Enable music");
    assert.equal(t.state.musicOn, true);
    assert.equal(t.state.audioOn, true);
    await t.click("Turn sound off");
    assert.equal(t.state.audioOn, false);
    await t.click("Pause animation");
    assert.equal(t.state.playing, false);
    await t.click("Play animation");
    assert.equal(t.state.playing, true);
  } finally {
    await t.close();
  }
});

test("reduced motion starts paused and preference changes pause playback", async () => {
  const t = await setup({ reduced: true });
  try {
    assert.equal(t.state.playing, false);
    await t.click("Play animation");
    await act(async () => t.media.dispatchEvent(new t.w.Event("change")));
    assert.equal(t.state.playing, false);
  } finally {
    await t.close();
  }
});

test("a failed graphics engine leaves process, delivery and packaging usable", async () => {
  const t = await setup({ fail: true });
  try {
    assert.equal(
      t.w.document.querySelector("[data-renderer]").dataset.renderer,
      "diagram",
    );
    await t.click("Deliver");
    assert.ok(t.w.document.querySelector(".delivery-truck-drawing"));
    await t.click("Pause animation");
    assert.ok(t.w.document.querySelector(".diagram.is-paused"));
    await t.click("Smoky Paprika");
    await t.click("Inspect the packaging");
    assert.ok(
      t.w.document
        .querySelector(".scene-fallback img")
        .src.endsWith("/packs/paprika.svg"),
    );
    assert.equal(t.button("Turn sound on").disabled, true);
  } finally {
    await t.close();
  }
});

test("rendered page links and ARIA controls resolve, and packaging assets exist", () => {
  const dom = new JSDOM(
    `<html lang="en"><body>${renderToString(React.createElement(App))}</body></html>`,
  );
  const d = dom.window.document;
  const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const e of d.querySelectorAll('a[href^="#"]'))
    assert.ok(d.getElementById(e.getAttribute("href").slice(1)));
  for (const e of d.querySelectorAll("[aria-controls]"))
    assert.ok(d.getElementById(e.getAttribute("aria-controls")));
  for (const img of d.querySelectorAll("img")) {
    assert.ok(img.alt.trim());
    assert.ok(
      fs.existsSync(
        new URL(`../public${img.getAttribute("src")}`, import.meta.url),
      ),
    );
  }
  assert.equal(d.querySelectorAll("h1").length, 1);
  dom.window.close();
});
