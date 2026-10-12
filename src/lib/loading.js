export function initLoadingScreen({
  loadArt = () => import("./loading-packet.js"),
  now = () => performance.now(),
  introDuration = 1800,
} = {}) {
  const screen = document.querySelector("#factory-loader");
  const button = document.querySelector("#loader-skip");
  const status = document.querySelector("#loader-status");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const previousFocus = document.activeElement;
  const content = [
    ...document.querySelectorAll(
      "#main, #site-header, .site-footer, .skip-link",
    ),
  ];
  const priorInert = content.map((el) => el.inert);
  const events = new window.AbortController();
  let finished = false,
    readyRequested = false,
    artSettled = false,
    imageFailed = false;
  let readyMessage = "Your factory is ready. Step inside.";
  let hideTimer,
    introTimer,
    product = null,
    shownAt = null;
  const fallback = document.querySelector("#loader-product-fallback");
  function presented() {
    if (finished) return;
    if (shownAt === null) shownAt = now();
    screen.classList.add("has-packet");
    scheduleExit();
  }
  function scheduleExit() {
    if (!readyRequested || finished) return;
    if (reduced.matches || (artSettled && imageFailed && shownAt === null)) {
      finish(readyMessage);
      return;
    }
    // Start the brief intro from an actual displayed packet, not module load.
    if (shownAt === null) return;
    clearTimeout(introTimer);
    const remaining = Math.max(0, introDuration - (now() - shownAt));
    if (remaining === 0) finish(readyMessage);
    else introTimer = window.setTimeout(() => finish(readyMessage), remaining);
  }
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  Promise.all([loadArt(), fontsReady])
    .then(([{ createPacketLoader }]) => {
      if (finished) return;
      product = createPacketLoader(
        document.querySelector("#loader-product-canvas"),
        { reducedMotion: reduced.matches },
      );
      artSettled = true;
      screen.classList.add("is-live-packet");
      presented();
    })
    .catch(() => {
      artSettled = true;
      screen.classList.add("without-product");
      scheduleExit();
    });
  document.body.classList.add("factory-loading");
  content.forEach((el) => {
    el.inert = true;
  });
  button.focus({ preventScroll: true });
  function finish(message) {
    if (finished) return;
    finished = true;
    product?.pause();
    clearTimeout(timeout);
    clearTimeout(introTimer);
    status.textContent = message;
    screen.dataset.stage = "3";
    screen.classList.add("is-leaving");
    screen.setAttribute("aria-modal", "false");
    document.body.classList.remove("factory-loading");
    content.forEach((el, i) => {
      el.inert = priorInert[i];
    });
    events.abort();
    if (screen.contains(document.activeElement)) {
      const target =
        previousFocus !== document.body && previousFocus?.isConnected
          ? previousFocus
          : document.querySelector(".header-cta");
      target?.focus({ preventScroll: true });
    }
    hideTimer = window.setTimeout(
      () => {
        screen.hidden = true;
        product?.dispose();
      },
      reduced.matches ? 0 : 500,
    );
  }
  fallback.addEventListener("load", presented, { signal: events.signal });
  fallback.addEventListener(
    "error",
    () => {
      imageFailed = true;
      scheduleExit();
    },
    { signal: events.signal },
  );
  if (fallback.complete && fallback.naturalWidth > 0) presented();
  const timeout = window.setTimeout(
    () =>
      finish("The page is ready to explore. The factory is still warming up."),
    15000,
  );
  button.addEventListener("click", () => finish("Welcome to CRISP."), {
    signal: events.signal,
  });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") finish("Welcome to CRISP.");
      if (e.key === "Tab") {
        e.preventDefault();
        button.focus();
      }
    },
    { signal: events.signal },
  );
  return {
    stage(value) {
      if (finished) return;
      if (value === "assemble") {
        screen.dataset.stage = "2";
        status.textContent = "Bringing every little detail to life";
      } else if (value === "ready") {
        readyRequested = true;
        screen.dataset.stage = "3";
        status.textContent = "Your factory is ready. Step inside.";
        button.innerHTML =
          'Enter the factory <span aria-hidden="true">↗</span>';
        scheduleExit();
      } else if (value === "fallback") {
        readyRequested = true;
        readyMessage = "Welcome to CRISP. Explore the story and flavours.";
        status.textContent = readyMessage;
        screen.dataset.stage = "3";
        button.innerHTML =
          'Explore the page <span aria-hidden="true">↗</span>';
        scheduleExit();
      }
    },
    dispose() {
      finish("Welcome to CRISP.");
      clearTimeout(hideTimer);
      screen.hidden = true;
      product?.dispose();
    },
  };
}
