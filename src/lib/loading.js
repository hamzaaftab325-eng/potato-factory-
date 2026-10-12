export function initLoadingScreen() {
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
  let finished = false;
  let hideTimer;
  document.body.classList.add("factory-loading");
  content.forEach((el) => {
    el.inert = true;
  });
  button.focus({ preventScroll: true });
  function finish(message) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
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
      },
      reduced.matches ? 0 : 500,
    );
  }
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
        status.textContent = "Sealing the crunch. Preparing your factory.";
      } else if (value === "ready")
        finish("Your factory is ready. Step inside.");
      else if (value === "fallback")
        finish("Welcome to CRISP. Explore the story and flavours.");
    },
    dispose() {
      finish("Welcome to CRISP.");
      clearTimeout(hideTimer);
      screen.hidden = true;
    },
  };
}
