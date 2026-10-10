import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { initPage } from "../src/lib/page.js";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup({ reduced = false, fail = false, width = 1440 } = {}) {
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    url: "https://crisp.example/",
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  const w = dom.window,
    $ = (s) => w.document.querySelector(s);
  w.innerWidth = width;
  w.innerHeight = 900;
  const media = new w.EventTarget();
  media.matches = reduced;
  w.matchMedia = () => media;
  w.scrollTo = ({ top }) => {
    w.scrollY = top;
  };
  const rect = (top, height) => () => ({
    top: top - w.scrollY,
    bottom: top + height - w.scrollY,
    height,
    width: 900,
    left: 0,
    right: 900,
  });
  $("#top").getBoundingClientRect = rect(0, 865);
  $("#process-story").getBoundingClientRect = rect(1600, 3650);
  $("#flavours").getBoundingClientRect = rect(5300, 1800);
  $("#product-mount").getBoundingClientRect = rect(5600, 600);
  $(".contact-section").getBoundingClientRect = rect(7400, 600);
  [...w.document.querySelectorAll("[data-step]")].forEach((el, i) => {
    el.getBoundingClientRect = rect(1600 + i * 730, 730);
  });
  const state = {
    playing: !reduced,
    audioOn: false,
    musicOn: false,
    inspect: false,
    stage: 0,
    flavour: 0,
    mode: "factory",
    visible: true,
  };
  const calls = { resized: 0, disposed: 0 };
  const fake = {
    get state() {
      return state;
    },
    setPlaying(v) {
      state.playing = v;
    },
    setAudio(v) {
      state.audioOn = v;
      return Promise.resolve();
    },
    setMusic(v) {
      state.musicOn = v;
    },
    setInspect(v) {
      state.inspect = v;
    },
    setJourney(v) {
      state.stage = Math.round(v);
    },
    setMode(v) {
      state.mode = v;
    },
    setFlavour(v) {
      state.flavour = v;
    },
    setVisible(v) {
      state.visible = v;
    },
    setPageVisible(v) {
      state.pageVisible = v;
    },
    setReducedMotion(v) {
      if (v) state.playing = false;
    },
    resize() {
      calls.resized++;
    },
    dispose() {
      calls.disposed++;
    },
  };
  const ui = initPage({
    autoStart: false,
    loadFactory: async () => {
      if (fail) throw new Error("WebGL unavailable");
      return {
        createFactory(canvas, options) {
          queueMicrotask(options.onReady);
          return fake;
        },
      };
    },
  });
  const close = () => {
    ui.destroy();
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
  };
  return { ui, $, w, media, state, calls, close };
}

test("factory loads muted, transfers between sections, and stops when offscreen", async () => {
  const t = setup();
  try {
    await t.ui.start();
    assert.equal(t.ui.state.ready, true);
    assert.equal(t.$("#scene-rig").parentElement.id, "hero-mount");
    assert.equal(t.state.audioOn, false);
    t.ui.scrollToStep(3);
    t.ui.refresh();
    assert.equal(t.$("#scene-rig").parentElement.id, "story-mount");
    assert.equal(t.state.stage, 3);
    assert.equal(t.$("#process-name").textContent, "Golden frying");
    assert.equal(
      t.$('[data-process="3"]').getAttribute("aria-current"),
      "step",
    );
    t.w.scrollY = 5400;
    t.ui.refresh();
    assert.equal(t.state.mode, "product");
    assert.equal(t.$("#scene-rig").parentElement.id, "product-mount");
    t.w.scrollY = 7200;
    t.ui.refresh();
    assert.equal(t.state.visible, false);
    t.w.scrollY = 0;
    t.ui.refresh();
    assert.equal(t.state.visible, true);
    assert.equal(t.state.mode, "factory");
    assert.ok(t.calls.resized >= 3);
  } finally {
    t.close();
  }
});

test("flavour choice updates the bag, notes, keyboard selection and matching factory line", async () => {
  const t = setup({ width: 390 });
  try {
    await t.ui.start();
    t.$('[data-choice="1"]').click();
    assert.equal(t.state.flavour, 1);
    assert.ok(t.$("#product-poster").src.endsWith("/packs/paprika.svg"));
    assert.equal(
      t.$('[data-flavour="1"]').getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      t.$('[data-flavour="0"]').getAttribute("aria-pressed"),
      "false",
    );
    t.$('[data-flavour="1"]').dispatchEvent(
      new t.w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    assert.equal(t.state.flavour, 2);
    assert.equal(t.$("#product-personality").textContent, "The fresh one.");
    t.$("#watch-flavour").click();
    t.ui.refresh();
    assert.equal(t.state.stage, 4);
    assert.equal(t.state.flavour, 2);
  } finally {
    t.close();
  }
});

test("play, sound, optional music and inspect controls report their state", async () => {
  const t = setup();
  try {
    await t.ui.start();
    t.$("#play-toggle").click();
    assert.equal(t.state.playing, false);
    assert.equal(
      t.$("#play-toggle").getAttribute("aria-label"),
      "Play animation",
    );
    t.$("#sound-toggle").click();
    await tick();
    assert.equal(t.state.audioOn, true);
    assert.equal(t.$("#sound-label").textContent, "Sound on");
    t.$("#music-toggle").click();
    await tick();
    assert.equal(t.state.musicOn, true);
    t.$("#sound-toggle").click();
    await tick();
    assert.equal(t.state.audioOn, false);
    t.$("#inspect-toggle").click();
    assert.equal(t.state.inspect, true);
    assert.equal(t.$("#inspect-hint").hidden, false);
    t.w.document.dispatchEvent(
      new t.w.KeyboardEvent("keydown", { key: "Escape" }),
    );
    assert.equal(t.state.inspect, false);
    assert.equal(t.$("#inspect-hint").hidden, true);
  } finally {
    t.close();
  }
});

test("mobile menu opens, traps focus, follows a link, and closes with Escape", () => {
  const t = setup({ width: 390 });
  try {
    t.$("#menu-toggle").click();
    assert.equal(t.$("#mobile-menu").hidden, false);
    assert.equal(t.$("#main").inert, true);
    assert.equal(t.$("#menu-toggle").getAttribute("aria-expanded"), "true");
    t.$("#mobile-menu a:last-of-type").focus();
    t.w.document.dispatchEvent(
      new t.w.KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(t.w.document.activeElement.id, "menu-toggle");
    t.w.document.dispatchEvent(
      new t.w.KeyboardEvent("keydown", { key: "Escape" }),
    );
    assert.equal(t.$("#mobile-menu").hidden, true);
    assert.equal(t.$("#main").inert, false);
    t.$("#menu-toggle").click();
    t.$("#mobile-menu a").click();
    assert.equal(t.$("#mobile-menu").hidden, true);
  } finally {
    t.close();
  }
});

test("reduced motion starts paused and changes of preference pause a playing scene", async () => {
  const t = setup({ reduced: true });
  try {
    await t.ui.start();
    assert.equal(t.state.playing, false);
    assert.equal(
      t.$("#play-toggle").getAttribute("aria-label"),
      "Play animation",
    );
    t.$("#play-toggle").click();
    assert.equal(t.state.playing, true);
    t.media.dispatchEvent(new t.w.Event("change"));
    assert.equal(t.state.playing, false);
  } finally {
    t.close();
  }
});

test("a failed 3D engine leaves a usable page, still packaging and flavour controls", async () => {
  const t = setup({ fail: true });
  try {
    await t.ui.start();
    assert.equal(t.$("#scene-rig").hidden, true);
    assert.match(t.$("#experience-status").textContent, /Still previews/);
    t.$('[data-flavour="2"]').click();
    assert.ok(t.$("#product-poster").src.endsWith("/packs/herbs.svg"));
    assert.equal(t.$("#play-toggle").disabled, true);
  } finally {
    t.close();
  }
});

test("every internal link, image and ARIA control has a real target", () => {
  const dom = new JSDOM(html),
    d = dom.window.document;
  const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const link of d.querySelectorAll('a[href^="#"]'))
    assert.ok(d.getElementById(link.getAttribute("href").slice(1)));
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
  assert.equal(d.documentElement.lang, "en");
  dom.window.close();
});
