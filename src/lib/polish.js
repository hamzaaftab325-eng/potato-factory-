export function initPolish() {
  const root = document.documentElement;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  root.classList.add("js-polish");

  const revealSelectors = [
    ".section-intro > div",
    ".intro-description",
    ".flavours-heading > div",
    ".flavours-heading > p",
    ".product-display",
    ".flavour-picker",
    ".craft-copy",
    ".craft-details",
    ".contact-layout > div",
    ".contact-button",
  ];

  const revealItems = revealSelectors.flatMap((selector) => [
    ...document.querySelectorAll(selector),
  ]);

  revealItems.forEach((element, index) => {
    element.classList.add("reveal-item", `reveal-delay-${(index % 3) + 1}`);
  });

  if (motion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -9%", threshold: 0.12 },
    );
    revealItems.forEach((element) => revealObserver.observe(element));
  }

  const heroItems = [
    document.querySelector(".hero-eyebrow"),
    document.querySelector(".hero h1"),
    document.querySelector(".hero-description"),
    document.querySelector(".hero-links"),
  ].filter(Boolean);

  heroItems.forEach((element, index) => {
    element.classList.add("reveal-item", `reveal-delay-${Math.min(index, 3)}`);
  });
  requestAnimationFrame(() => {
    heroItems.forEach((element) => element.classList.add("is-visible"));
  });

  const navLinks = [...document.querySelectorAll(".desktop-nav a[href^='#']")];
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? { link, section: document.getElementById(id) } : null;
    })
    .filter((item) => item?.section);

  if (sections.length && "IntersectionObserver" in window) {
    const activeSections = new Map();
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => activeSections.set(entry.target.id, entry.intersectionRatio));
        const active = [...activeSections.entries()]
          .filter(([, ratio]) => ratio > 0)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        sections.forEach(({ link, section }) => {
          if (section.id === active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-18% 0px -58%", threshold: [0, 0.12, 0.3, 0.55] },
    );
    sections.forEach(({ section }) => navObserver.observe(section));
  }

  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".hero-stage");
  let frame = 0;
  let targetX = 0;
  let targetY = 0;

  const renderParallax = () => {
    frame = 0;
    if (!hero || !stage || motion.matches || !finePointer.matches) return;
    hero.style.setProperty("--hero-x", `${targetX * 14}px`);
    hero.style.setProperty("--hero-y", `${targetY * 10}px`);
    stage.style.transform = `translate3d(${targetX * 8}px, ${targetY * 5}px, 0)`;
  };

  const scheduleParallax = () => {
    if (!frame) frame = requestAnimationFrame(renderParallax);
  };

  if (hero && stage) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        if (motion.matches || !finePointer.matches) return;
        const rect = hero.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width - 0.5;
        targetY = (event.clientY - rect.top) / rect.height - 0.5;
        scheduleParallax();
      },
      { passive: true },
    );

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      scheduleParallax();
    });
  }

  const accordions = [...document.querySelectorAll(".craft-item")];
  accordions.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      accordions.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const syncMotion = () => {
    if (!motion.matches) return;
    hero?.style.removeProperty("--hero-x");
    hero?.style.removeProperty("--hero-y");
    if (stage) stage.style.transform = "none";
    revealItems.forEach((element) => element.classList.add("is-visible"));
    heroItems.forEach((element) => element.classList.add("is-visible"));
  };

  motion.addEventListener?.("change", syncMotion);
  syncMotion();
}
