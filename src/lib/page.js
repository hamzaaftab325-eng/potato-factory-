import {
  FLAVOURS,
  PROCESS_NAMES,
  chooseSurface,
  journeyPosition,
} from "./journey.js";

export function initPage({
  loadFactory = () => import("../factory/scene.js"),
  autoStart = true,
} = {}) {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const rig = $("#scene-rig");
  const mounts = {
    hero: $("#hero-mount"),
    story: $("#story-mount"),
    product: $("#product-mount"),
  };
  const hero = $("#top"),
    story = $("#process-story"),
    flavours = $("#flavours");
  const contact = $(".contact-section"),
    header = $("#site-header");
  const steps = $$("[data-step]"),
    processButtons = $$("[data-process]"),
    flavourButtons = $$("[data-flavour]");
  const compactButtons = $$("[data-choice]");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = () => window.innerWidth <= 800;
  const events = new window.AbortController();
  const on = (target, event, fn, options = {}) =>
    target.addEventListener(event, fn, { ...options, signal: events.signal });
  let engine = null,
    selectedFlavour = 0,
    surface = null,
    currentStep = 1;
  let scheduledFrame = 0,
    toastTimer = 0,
    idleId = 0,
    startTimer = 0;
  let audioBusy = false,
    ready = false,
    destroyed = false,
    startPromise = null;

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.hidden = true;
    }, 4500);
  }

  function closeMenu(returnFocus = false) {
    $("#menu-toggle").setAttribute("aria-expanded", "false");
    $("#menu-toggle").setAttribute("aria-label", "Open menu");
    $("#mobile-menu").hidden = true;
    document.body.classList.remove("menu-open");
    $("#main").inert = false;
    $(".site-footer").inert = false;
    if (returnFocus) $("#menu-toggle").focus();
  }
  on($("#menu-toggle"), "click", () => {
    const open = $("#mobile-menu").hidden;
    if (!open) return closeMenu(true);
    $("#mobile-menu").hidden = false;
    $("#menu-toggle").setAttribute("aria-expanded", "true");
    $("#menu-toggle").setAttribute("aria-label", "Close menu");
    document.body.classList.add("menu-open");
    $("#main").inert = true;
    $(".site-footer").inert = true;
    $("#mobile-menu a").focus();
  });
  $$("#mobile-menu a").forEach((link) => on(link, "click", () => closeMenu()));
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && !$("#mobile-menu").hidden) closeMenu(true);
    if (e.key === "Escape" && engine?.state.inspect) {
      engine.setInspect(false);
      syncControls();
    }
    if (e.key !== "Tab" || $("#mobile-menu").hidden) return;
    const focusables = [$("#menu-toggle"), ...$$("#mobile-menu a")];
    const index = focusables.indexOf(document.activeElement);
    if (e.shiftKey && index <= 0) {
      e.preventDefault();
      focusables.at(-1).focus();
    }
    if (!e.shiftKey && index === focusables.length - 1) {
      e.preventDefault();
      focusables[0].focus();
    }
  });

  function setStep(step) {
    if (step === currentStep) return;
    currentStep = step;
    $("#process-count").textContent =
      `${String(step).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    $("#process-name").textContent = PROCESS_NAMES[step - 1];
    steps.forEach((el) =>
      el.classList.toggle("is-active", Number(el.dataset.step) === step),
    );
    processButtons.forEach((button) => {
      if (Number(button.dataset.process) === step)
        button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function syncControls() {
    if (!engine) return;
    const {
      playing,
      audioOn,
      musicOn,
      inspect,
      ultraQuality,
      zoom = 100,
      renderWidth,
      renderHeight,
      qualityScale = 1,
    } = engine.state;
    $("#quality-toggle").setAttribute("aria-pressed", String(ultraQuality));
    $("#quality-toggle").setAttribute(
      "aria-label",
      ultraQuality
        ? "Switch to smooth rendering"
        : "Enable detail rendering up to 4K",
    );
    $("#quality-label").textContent = ultraQuality ? "4K MAX" : "AUTO";
    $("#quality-toggle").title =
      `${ultraQuality ? "Up to 4K" : "Adaptive native detail"} · ${renderWidth || 0} × ${renderHeight || 0}${qualityScale < 0.99 ? " · adjusted for smooth playback" : ""}`;
    $("#zoom-label").textContent = `${zoom}%`;
    $("#zoom-reset").setAttribute(
      "aria-label",
      `Reset zoom (currently ${zoom}%)`,
    );
    $("#zoom-in").disabled = !ready || zoom >= 250;
    $("#zoom-out").disabled = !ready || zoom <= 56;
    $("#play-toggle").setAttribute("aria-pressed", String(!playing));
    $("#play-toggle").setAttribute(
      "aria-label",
      playing ? "Pause animation" : "Play animation",
    );
    $("#sound-toggle").setAttribute("aria-pressed", String(audioOn));
    $("#sound-label").textContent = audioOn ? "Sound on" : "Sound off";
    $("#music-toggle").setAttribute("aria-pressed", String(musicOn));
    $("#music-toggle").setAttribute(
      "aria-label",
      musicOn ? "Disable background music" : "Enable background music",
    );
    $("#inspect-toggle").setAttribute("aria-pressed", String(inspect));
    $("#inspect-toggle").setAttribute(
      "aria-label",
      inspect ? "Exit camera inspection" : "Enable camera inspection",
    );
    $("#inspect-hint").hidden = !inspect;
    document.body.classList.toggle("scene-inspecting", inspect);
  }

  function refresh() {
    scheduledFrame = 0;
    if (destroyed) return;
    const height = window.innerHeight;
    const scrollable = document.documentElement.scrollHeight - height;
    const progress =
      scrollable > 0
        ? Math.min(1, Math.max(0, window.scrollY / scrollable))
        : 0;
    $(".reading-progress").style.transform = `scaleX(${progress})`;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    const f = flavours.getBoundingClientRect(),
      c = contact.getBoundingClientRect();
    header.classList.toggle(
      "is-light",
      (f.top < 94 && f.bottom > 94) || (c.top < 94 && c.bottom > 94),
    );
    if (!mobile() && !$("#mobile-menu").hidden) closeMenu();
    const position = journeyPosition(
      steps.map((el) => el.getBoundingClientRect()),
      height,
      mobile(),
    );
    setStep(Math.round(position));
    const next = chooseSurface(
      {
        hero: hero.getBoundingClientRect(),
        story: story.getBoundingClientRect(),
        product: mounts.product.getBoundingClientRect(),
      },
      height,
    );
    if (!engine) return;
    if (next && next !== surface) {
      mounts[surface]?.classList.remove("has-scene", "is-ready");
      mounts[next].append(rig);
      mounts[next].classList.add("has-scene");
      mounts[next].classList.toggle("is-ready", ready);
      surface = next;
      engine.setJourney(next === "hero" ? 0 : position);
      engine.setMode(next === "product" ? "product" : "factory");
      engine.setInspect(false);
      rig.dataset.mode = next === "product" ? "product" : "factory";
      engine.resize();
      syncControls();
    }
    if (next) {
      engine.setJourney(next === "hero" ? 0 : position);
      $("#scene-label").textContent =
        next === "product"
          ? FLAVOURS[selectedFlavour].name
          : next === "hero"
            ? "A world in motion"
            : PROCESS_NAMES[currentStep - 1];
      $("#scene-kind").textContent =
        next === "product" ? "THE COLLECTION" : "LIVE 3D";
    }
    engine.setVisible(Boolean(next));
  }
  function schedule() {
    if (!scheduledFrame) scheduledFrame = window.requestAnimationFrame(refresh);
  }
  on(window, "scroll", schedule, { passive: true });
  on(window, "resize", schedule, { passive: true });
  on(document, "visibilitychange", () =>
    engine?.setPageVisible(!document.hidden),
  );
  on(window, "pagehide", (e) => {
    if (!e.persisted) destroy();
    else engine?.setPageVisible(false);
  });
  on(window, "pageshow", () => {
    engine?.setPageVisible(!document.hidden);
    schedule();
  });
  on(motion, "change", () => {
    engine?.setReducedMotion(motion.matches);
    syncControls();
    schedule();
  });

  function scrollToStep(step) {
    closeMenu();
    const rect = steps[step - 1].getBoundingClientRect();
    const line = window.innerHeight * (mobile() ? 0.78 : 0.55);
    window.scrollTo({
      top: Math.max(0, window.scrollY + rect.top + rect.height / 2 - line),
      behavior: motion.matches ? "auto" : "smooth",
    });
  }
  processButtons.forEach((button) =>
    on(button, "click", () => scrollToStep(Number(button.dataset.process))),
  );
  on($("#watch-flavour"), "click", () => {
    engine?.setFlavour(selectedFlavour);
    scrollToStep(4);
  });

  function selectFlavour(index) {
    selectedFlavour = index;
    const choice = FLAVOURS[index];
    document.documentElement.style.setProperty("--flavour", choice.color);
    flavourButtons.forEach((button) => {
      const selected = Number(button.dataset.flavour) === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    compactButtons.forEach((button) => {
      const selected = Number(button.dataset.choice) === index;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    rig.dataset.variant = String(index);
    $("#product-personality").textContent = choice.personality;
    $("#product-number").textContent =
      `${String(index + 1).padStart(2, "0")} / 03`;
    $("#product-poster").src = `/packs/${choice.pack}.svg`;
    $("#product-poster").alt = `${choice.name} CRISP concept packaging.`;
    $("#experience-status").textContent =
      `Showing ${choice.name} concept packaging.`;
    engine?.setFlavour(index);
    refresh();
  }
  flavourButtons.forEach((button, index) => {
    on(button, "click", () => selectFlavour(index));
    on(button, "keydown", (e) => {
      let next = index;
      if (e.key === "ArrowDown" || e.key === "ArrowRight")
        next = (index + 1) % FLAVOURS.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        next = (index + FLAVOURS.length - 1) % FLAVOURS.length;
      else return;
      e.preventDefault();
      selectFlavour(next);
      flavourButtons[next].focus();
    });
  });
  compactButtons.forEach((button) =>
    on(button, "click", () => selectFlavour(Number(button.dataset.choice))),
  );

  on($("#play-toggle"), "click", () => {
    if (engine) {
      engine.setPlaying(!engine.state.playing);
      syncControls();
    }
  });
  async function changeAudio(action) {
    if (!engine || audioBusy) return;
    audioBusy = true;
    $("#sound-toggle").disabled = true;
    $("#music-toggle").disabled = true;
    try {
      if (action === "sound") await engine.setAudio(!engine.state.audioOn);
      else {
        const next = !engine.state.musicOn;
        if (next && !engine.state.audioOn) await engine.setAudio(true);
        engine.setMusic(next);
      }
      syncControls();
    } catch {
      toast("Sound could not start. Please try the sound button again.");
    } finally {
      audioBusy = false;
      $("#sound-toggle").disabled = !ready;
      $("#music-toggle").disabled = !ready;
    }
  }
  on($("#sound-toggle"), "click", () => changeAudio("sound"));
  on($("#music-toggle"), "click", () => changeAudio("music"));
  on($("#inspect-toggle"), "click", () => {
    if (!engine) return;
    engine.setInspect(!engine.state.inspect);
    syncControls();
    if (engine.state.inspect)
      $("#factory-canvas").focus({ preventScroll: true });
  });
  on($("#quality-toggle"), "click", () => {
    if (!engine) return;
    engine.setQuality(!engine.state.ultraQuality);
    syncControls();
  });

  on($("#zoom-in"), "click", () => engine?.zoomBy(1.2));
  on($("#zoom-out"), "click", () => engine?.zoomBy(1 / 1.2));
  on($("#zoom-reset"), "click", () => engine?.resetZoom());

  function markReady() {
    if (destroyed) return;
    ready = true;
    rig.classList.add("is-ready");
    mounts[surface]?.classList.add("is-ready");
    $$(".scene-control").forEach((button) => {
      button.disabled = false;
    });
    syncControls();
    $("#experience-status").textContent = motion.matches
      ? "3D experience ready. Animation is paused to respect your motion preference."
      : "3D experience ready. Sound is off until you enable it.";
  }
  function start() {
    if (startPromise) return startPromise;
    startPromise = (async () => {
      try {
        const [{ createFactory }] = await Promise.all([
          loadFactory(),
          document.fonts?.ready ?? Promise.resolve(),
        ]);
        if (destroyed) return;
        engine = createFactory($("#factory-canvas"), {
          reducedMotion: motion.matches,
          onReady: markReady,
          onLogistics: (label) => {
            const caption = $("#dispatch-phase");
            if (caption && caption.textContent !== label)
              caption.textContent = label;
          },
          onInspectExit: syncControls,
          onZoomChange: syncControls,
          onQualityChange: syncControls,
          onContextLost: () => {
            ready = false;
            rig.classList.remove("is-ready");
            mounts[surface]?.classList.remove("is-ready");
            $$(".scene-control").forEach((button) => {
              button.disabled = true;
            });
            $("#experience-status").textContent =
              "Showing a still preview while the 3D view recovers.";
          },
        });
        engine.setFlavour(selectedFlavour);
        refresh();
        syncControls();
      } catch {
        $("#experience-status").textContent =
          "The 3D view is unavailable. Still previews, the process story and the flavour collection remain available.";
        rig.hidden = true;
      }
    })();
    return startPromise;
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    events.abort();
    engine?.dispose();
    window.cancelAnimationFrame(scheduledFrame);
    if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
    clearTimeout(startTimer);
    clearTimeout(toastTimer);
  }
  refresh();
  if (autoStart) {
    if ("requestIdleCallback" in window)
      idleId = window.requestIdleCallback(start, { timeout: 1400 });
    else startTimer = window.setTimeout(start, 120);
  }
  return {
    start,
    refresh,
    destroy,
    selectFlavour,
    scrollToStep,
    get state() {
      return {
        selectedFlavour,
        currentStep,
        surface,
        ready,
        engine: engine?.state,
      };
    },
  };
}
