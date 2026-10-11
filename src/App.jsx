import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./components/Icon.jsx";
import { FactoryDiagram } from "./components/FactoryDiagram.jsx";
import { DeliveryMap } from "./components/DeliveryMap.jsx";
import { useFactory } from "./hooks/useFactory.js";
import { FLAVOURS } from "./lib/journey.js";

const STAGES = [
  {
    short: "Overview",
    title: "One little potato. A whole world in motion.",
    text: "Follow the complete journey, from the first rinse to the final delivery. Pick a process below to take a closer look.",
    note: "Six connected processes",
    tag: "THE COMPLETE JOURNEY",
  },
  {
    short: "Prepare",
    title: "A fresh start.",
    text: "A metered intake feeds the wash line. Filtered water rinses the potatoes before an enclosed abrasive drum peels them for the next stage.",
    note: "Wash jets · Abrasive peeling · Clean transfers",
    tag: "WATER / ROTATION / RENEWAL",
  },
  {
    short: "Slice",
    title: "The art of the slice.",
    text: "Whole potatoes enter a guarded centrifugal cutting head. Thin slices leave through a dedicated chute, then pass a rinse and air knife.",
    note: "Enclosed cutting head · Eight knife stations",
    tag: "PRECISION / REPETITION / FORM",
  },
  {
    short: "Fry",
    title: "The golden moment.",
    text: "Beneath the extraction hood, the oil gently bubbles. A mesh belt lifts the golden slices out of the fryer to drain and cool.",
    note: "Oil circulation · Extraction hood · Draining belt",
    tag: "HEAT / TEXTURE / TRANSFORMATION",
  },
  {
    short: "Season",
    title: "A little character.",
    text: "Three stainless drums lift and tumble the chips. Salt, paprika and herbs follow their own paths, giving every batch its signature finish.",
    note: "Golden Sea Salt · Smoky Paprika · Garden Herbs",
    tag: "TUMBLE / TEXTURE / PERSONALITY",
  },
  {
    short: "Pack",
    title: "Good things, wrapped up.",
    text: "Weighers portion the chips, film forms around them, and sealing jaws close. Vacuum heads lift finished bags into cartons before the flaps fold and the tape rolls.",
    note: "Weigh · Fill · Seal · Inspect · Case-pack",
    tag: "CARE / PRECISION / THE FINISHING TOUCH",
  },
  {
    short: "Deliver",
    title: "From our factory. Across Pakistan.",
    text: "Cartons reach the loading dock. A branded CRISP truck takes its cargo onto the road, connecting a little golden crunch with a much bigger journey.",
    note: "Karachi · Lahore · Islamabad · Peshawar · Quetta",
    tag: "PACKED WITH CARE / READY FOR THE ROAD",
  },
  {
    short: "Collection",
    title: "A flavour of your own.",
    text: "A closer look at the original collection. Softly formed packaging, printed film and three distinct personalities.",
    note: "Use Inspect to rotate the pack · Choose a flavour below",
    tag: "CRISP / THE ORIGINAL COLLECTION",
  },
];
const TASTES = [
  {
    kicker: "THE TIMELESS ONE",
    description:
      "Delicate sea salt. Golden potato. Nothing gets in the way of a beautifully simple crunch.",
    words: "Bright / Balanced / Familiar",
  },
  {
    kicker: "THE BOLD ONE",
    description:
      "A little smoke, a little warmth. Rich paprika brings a deeper kind of character to every bite.",
    words: "Warm / Smoky / Bold",
  },
  {
    kicker: "THE FRESH ONE",
    description:
      "A fresh, aromatic finish. Little flecks of garden herbs meet the warmth of a golden chip.",
    words: "Herbaceous / Mellow / Fresh",
  },
];
function Wordmark() {
  return (
    <span className="wordmark">
      crisp<span>✳</span>
    </span>
  );
}
function Header() {
  const [open, setOpen] = useState(false),
    dialog = useRef(null);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <header className="site-header page-shell flex items-center justify-between gap-5 border-b border-white/10 py-5 md:py-6">
        <a href="#top" aria-label="CRISP home">
          <Wordmark />
        </a>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-9 text-xs text-cream/75 md:flex"
        >
          <a href="#factory">The factory</a>
          <a href="#flavours">The flavours</a>
          <a href="#delivery">The journey</a>
        </nav>
        <a
          href="#factory"
          className="hidden items-center gap-6 rounded-full border border-cream/20 px-6 py-3 text-xs transition hover:border-gold hover:text-gold md:flex"
        >
          Step inside <Icon name="northeast" />
        </a>
        <button
          type="button"
          className="control md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </header>
      <dialog
        ref={dialog}
        id="mobile-navigation"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        className="mobile-dialog"
      >
        <div className="flex items-center justify-between">
          <Wordmark />
          <button
            type="button"
            className="control"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <Icon name="close" className="h-6 w-6" />
          </button>
        </div>
        <nav
          aria-label="Mobile navigation"
          className="mt-12 flex flex-col gap-7 font-display text-4xl"
        >
          {[
            ["The factory", "factory"],
            ["The flavours", "flavours"],
            ["Across Pakistan", "delivery"],
            ["The craft", "craft"],
          ].map(([text, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>
              {text}
            </a>
          ))}
        </nav>
        <p className="mt-14 text-xs text-cream/55">
          A little potato. A lot of possibility.
        </p>
      </dialog>
    </>
  );
}
function FactoryExperience({ stage, setStage, flavour, loadFactory }) {
  const canvasRef = useRef(null),
    viewportRef = useRef(null);
  const { status, controls, message, busy, act } = useFactory({
    canvasRef,
    viewportRef,
    stage,
    flavour,
    loadFactory,
  });
  const detail = STAGES[stage],
    ready = status === "ready",
    product = stage === 7;
  function keyboardStage(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % 7;
    if (event.key === "ArrowLeft") next = (index + 6) % 7;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 6;
    if (next === undefined) return;
    event.preventDefault();
    setStage(next);
    event.currentTarget.parentElement
      .querySelector(`[data-stage="${next}"]`)
      ?.focus();
  }
  return (
    <section
      id="factory"
      aria-labelledby="factory-heading"
      className="page-shell factory-section scroll-mt-5"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5 text-xs uppercase tracking-[.12em] text-cream/70">
        <h2
          id="factory-heading"
          className="flex items-center gap-3 font-body font-medium"
        >
          <span className="status-dot" />
          Inside the CRISP factory
        </h2>
        <span>Made with a little obsession.</span>
      </div>
      <div
        className={`factory-viewport ${product ? "product-view" : ""}`}
        ref={viewportRef}
        data-renderer={status}
      >
        <div
          className={`scene-fallback ${ready ? "is-hidden" : ""}`}
          aria-hidden={ready}
        >
          {product ? (
            <img
              className="mx-auto h-full max-h-[430px] w-auto object-contain py-8"
              src={`/packs/${FLAVOURS[flavour].pack}.svg`}
              alt={`${FLAVOURS[flavour].name} packaging`}
            />
          ) : (
            <FactoryDiagram stage={stage} playing={controls.playing} />
          )}
        </div>
        <canvas
          ref={canvasRef}
          className={`factory-canvas ${ready ? "is-visible" : ""} ${controls.inspect ? "is-inspecting" : ""}`}
          tabIndex={ready ? 0 : -1}
          aria-label={
            product
              ? `${FLAVOURS[flavour].name} in 3D`
              : `Interactive 3D ${detail.short.toLowerCase()} view. Use the Inspect control to rotate.`
          }
        />
        <div className="scene-caption pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] sm:left-7 sm:top-6">
          <span className="status-dot" />
          {status === "loading"
            ? "Preparing the experience"
            : ready
              ? "Live 3D / Real-time motion"
              : "Illustrated process view"}
        </div>
        {stage === 6 ? (
          <div className="delivery-progress" aria-label="Delivery sequence">
            <span>01 Load</span>
            <span>02 Close</span>
            <span>03 Depart</span>
            <span>04 Arrive</span>
          </div>
        ) : null}
        <span className="scene-edition absolute right-5 top-5 text-[10px] tracking-[.16em] opacity-45 sm:right-7 sm:top-6">
          CRISP / 001
        </span>
        <div className="scene-controls" aria-label="Animation controls">
          <button
            type="button"
            className="control"
            aria-label={controls.playing ? "Pause animation" : "Play animation"}
            aria-pressed={!controls.playing}
            onClick={() => act("play")}
          >
            <Icon name={controls.playing ? "pause" : "play"} />
          </button>
          <span className="control-divider" />
          <button
            type="button"
            className="control gap-2"
            disabled={!ready || busy}
            aria-label={controls.audioOn ? "Turn sound off" : "Turn sound on"}
            aria-pressed={controls.audioOn}
            onClick={() => act("sound")}
          >
            <Icon name={controls.audioOn ? "volume" : "mute"} />
            <span className="text-[11px]">
              {controls.audioOn ? "Sound on" : "Sound off"}
            </span>
          </button>
          <button
            type="button"
            className="control"
            disabled={!ready || busy}
            aria-label={controls.musicOn ? "Disable music" : "Enable music"}
            aria-pressed={controls.musicOn}
            onClick={() => act("music")}
          >
            <Icon name="music" />
          </button>
          <span className="control-divider" />
          <button
            type="button"
            className="control gap-2"
            disabled={!ready}
            aria-label={
              controls.inspect ? "Exit inspection" : "Inspect the 3D view"
            }
            aria-pressed={controls.inspect}
            onClick={() => act("inspect")}
          >
            <Icon name="inspect" />
            <span className="hidden text-[11px] sm:inline">Inspect</span>
          </button>
          {controls.inspect ? (
            <button
              type="button"
              className="control"
              aria-label="Reset camera"
              onClick={() => act("reset")}
            >
              <Icon name="reset" />
            </button>
          ) : null}
        </div>
        {controls.inspect ? (
          <p className="absolute bottom-20 left-0 right-0 text-center text-[11px] text-cream/65">
            Drag to orbit · Arrow keys to rotate · Escape to return
          </p>
        ) : null}
      </div>
      <div
        className="stage-navigation flex gap-1 overflow-x-auto border-y border-white/10 py-3"
        role="group"
        aria-label="Choose a factory process"
      >
        {STAGES.slice(0, 7).map((item, i) => (
          <button
            key={item.short}
            type="button"
            data-stage={i}
            className={`stage-button ${stage === i ? "is-active" : ""}`}
            aria-pressed={stage === i}
            onClick={() => setStage(i)}
            onKeyDown={(event) => keyboardStage(event, i)}
          >
            <span className="stage-number">
              {i === 0 ? "✳" : String(i).padStart(2, "0")}
            </span>
            {item.short}
            {i === 6 ? <Icon name="truck" /> : null}
          </button>
        ))}
      </div>
      <div
        className="stage-description grid gap-5 py-7 sm:py-9 md:grid-cols-[1.05fr_1fr] md:gap-16"
        aria-live="polite"
      >
        <div>
          <p className="eyebrow mb-3">{detail.tag}</p>
          <h3 className="font-display text-[clamp(30px,3.2vw,45px)] leading-[1.08] tracking-[-.02em]">
            {stage === 7 ? FLAVOURS[flavour].name : detail.title}
          </h3>
        </div>
        <div>
          <p className="max-w-xl text-[13px] leading-7 text-cream/65 sm:text-sm">
            {detail.text}
          </p>
          <p className="mt-4 text-xs leading-6 tracking-[.025em] text-gold/90">
            {detail.note}
          </p>
        </div>
      </div>
      <p className="experience-message" role="status">
        {message}
      </p>
    </section>
  );
}
export default function App({ loadFactory }) {
  const [stage, setStage] = useState(0),
    [flavour, setFlavour] = useState(0);
  function visitStage(next) {
    setStage(next);
    document.getElementById("factory")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <section
          id="top"
          className="page-shell hero-intro grid items-end gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:gap-16 md:pb-12 md:pt-16"
          aria-labelledby="hero-title"
        >
          <div>
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="tiny-star">✳</span>A study in flavour & motion
            </p>
            <h1 id="hero-title" className="hero-title font-display">
              Crafted for
              <br />
              the <em>crunch.</em>
            </h1>
          </div>
          <div className="hero-aside md:pb-3">
            <p className="max-w-[330px] text-sm leading-7 text-cream/70">
              A little potato. A remarkable journey.
              <br />
              Step inside a world where every movement makes something golden.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <a href="#factory" className="pill-button">
                Explore the factory <Icon name="northeast" />
              </a>
              <a href="#flavours" className="text-link">
                Find your flavour <Icon name="arrow" />
              </a>
            </div>
            <p className="mt-8 hidden text-[10px] uppercase tracking-[.17em] text-cream/35 md:block">
              Six processes. Three personalities. One satisfying loop.
            </p>
          </div>
        </section>
        <FactoryExperience
          stage={stage}
          setStage={setStage}
          flavour={flavour}
          loadFactory={loadFactory}
        />
        <section
          className="flavours-section mt-16 bg-cream text-ink md:mt-24"
          id="flavours"
          aria-labelledby="flavours-heading"
        >
          <div className="page-shell py-16 md:py-24">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-ink/55">
                  01 / THE ORIGINAL COLLECTION
                </p>
                <h2
                  id="flavours-heading"
                  className="mt-5 font-display text-5xl leading-[.98] tracking-[-.025em] md:text-7xl"
                >
                  Pick your kind
                  <br />
                  of <em className="text-olive">crunch.</em>
                </h2>
              </div>
              <p className="max-w-[230px] text-xs leading-6 text-ink/60">
                Three distinct personalities.
                <br />
                The same golden beginning.
              </p>
            </div>
            <div className="collection-layout">
              <div
                id="collection-product"
                className="collection-product"
                style={{ "--pack-color": FLAVOURS[flavour].color }}
              >
                <p className="collection-edition">
                  CRISP / THE ORIGINAL COLLECTION
                </p>
                <div className="collection-image">
                  <span className="collection-orbit" aria-hidden="true" />
                  <img
                    src={`/packs/${FLAVOURS[flavour].pack}.svg`}
                    alt={`${FLAVOURS[flavour].name} CRISP chip bag`}
                    width="420"
                    height="540"
                    loading="lazy"
                  />
                </div>
                <div className="collection-caption">
                  <span>{FLAVOURS[flavour].personality}</span>
                  <span>0{flavour + 1} / 03</span>
                </div>
              </div>
              <div
                className="collection-picker"
                role="group"
                aria-label="Choose a flavour"
              >
                {FLAVOURS.map((f, i) => (
                  <button
                    key={f.name}
                    type="button"
                    aria-pressed={flavour === i}
                    aria-controls="collection-product"
                    onClick={() => setFlavour(i)}
                    className={`collection-option text-left ${flavour === i ? "is-selected" : ""}`}
                    style={{ "--pack-color": f.color }}
                  >
                    <span className="collection-index">0{i + 1}</span>
                    <span className="collection-copy">
                      <span className="collection-kicker">
                        {TASTES[i].kicker}
                      </span>
                      <span className="collection-title font-display">
                        {f.name}
                      </span>
                      {flavour === i && (
                        <span className="collection-details">
                          <span>{TASTES[i].description}</span>
                          <span className="collection-tasting">
                            {TASTES[i].words}
                          </span>
                        </span>
                      )}
                    </span>
                    <Icon
                      name="northeast"
                      className="collection-arrow h-5 w-5"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
              <p className="text-[11px] text-ink/50">
                Original concept flavours & packaging.
              </p>
              <div className="flex flex-wrap gap-6">
                <button
                  type="button"
                  className="text-link"
                  onClick={() => visitStage(4)}
                >
                  Watch this flavour being made <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => visitStage(7)}
                >
                  Inspect the packaging <Icon name="northeast" />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section
          id="delivery"
          aria-labelledby="delivery-heading"
          className="delivery-section page-shell grid items-center gap-10 py-20 md:grid-cols-[1.15fr_1fr] md:gap-24 md:py-28"
        >
          <div>
            <p className="eyebrow">02 / THE JOURNEY CONTINUES</p>
            <h2
              id="delivery-heading"
              className="mt-6 font-display text-5xl leading-[1.02] tracking-[-.025em] md:text-7xl"
            >
              A little crunch.
              <br />
              <em>A bigger journey.</em>
            </h2>
            <p className="mt-7 max-w-[430px] text-sm leading-7 text-cream/60">
              From the loading dock to the open road. Our imagined delivery
              fleet carries CRISP across Pakistan, bringing the factory’s final
              movement into the world.
            </p>
            <button
              type="button"
              className="pill-button mt-8"
              onClick={() => visitStage(6)}
            >
              Watch the truck depart <Icon name="truck" />
            </button>
            <div className="mt-10 flex items-center gap-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                <Icon name="truck" className="h-5 w-5" />
              </span>
              <p className="text-[11px] leading-6 text-cream/60">
                Filled. Sealed. Packed with care.
                <br />
                <span className="text-gold">Ready for the road.</span>
              </p>
            </div>
          </div>
          <div className="route-card relative mx-auto aspect-[1/1] w-full max-w-[470px]">
            <div className="absolute left-7 top-6 text-[9px] tracking-[.18em] text-cream/50">
              CRISP / PAKISTAN
            </div>
            <DeliveryMap />
          </div>
        </section>
        <section
          id="craft"
          aria-labelledby="craft-heading"
          className="border-y border-white/10"
        >
          <div className="page-shell grid gap-12 py-16 md:grid-cols-[1fr_1.1fr] md:gap-24 md:py-24">
            <div>
              <p className="eyebrow">03 / BEHIND THE EXPERIENCE</p>
              <h2
                id="craft-heading"
                className="mt-5 font-display text-5xl leading-[1.03] md:text-6xl"
              >
                Small details.
                <br />
                <em>Big feeling.</em>
              </h2>
              <p className="mt-6 max-w-sm text-xs leading-7 text-cream/60">
                An original brand world by Hamza Aftab. A playful meeting of art
                direction, mechanical choreography and creative development.
              </p>
            </div>
            <div className="craft-list">
              {[
                [
                  "The choreography",
                  "Connected conveyors, enclosed machinery and a final delivery sequence. Each movement has a purpose, from the first wash to the last carton.",
                ],
                [
                  "The material study",
                  "Brushed stainless steel, warm enamel, textured food and folded packaging. Little details make the miniature world feel considered.",
                ],
                [
                  "The soundscape",
                  "Water, slicing, oil, chip rustle and packing share the animation’s clock. Sound is your choice. Turn it on when you want to step a little closer.",
                ],
              ].map(([title, text], i) => (
                <details key={title} open={i === 0}>
                  <summary>
                    <span className="text-[10px] text-gold/65">0{i + 1}</span>
                    <span className="flex-1 font-display text-2xl">
                      {title}
                    </span>
                    <span className="accordion-mark">+</span>
                  </summary>
                  <p>{text}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-cream text-ink">
          <div className="page-shell flex flex-col justify-between gap-8 py-14 md:flex-row md:items-center md:py-20">
            <div>
              <p className="eyebrow text-ink/45">
                GOOD IDEAS DESERVE A LITTLE MOTION.
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-[-.02em] md:text-6xl">
                Let’s make something <em className="text-olive">move.</em>
              </h2>
            </div>
            <a
              href="https://github.com/hamzaaftab325-eng"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-link"
            >
              Meet the creator <Icon name="northeast" className="h-5 w-5" />
            </a>
          </div>
        </section>
      </main>
      <footer className="page-shell flex flex-wrap items-center justify-between gap-7 py-9">
        <a href="#top" aria-label="CRISP back to top">
          <Wordmark />
        </a>
        <p className="text-xs leading-6 text-cream/65">
          An original portfolio concept · Hamza Aftab
          <br />
          Fictional products and delivery network.
        </p>
        <a
          href="https://github.com/hamzaaftab325-eng/potato-factory-"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-cream/65"
        >
          Explore the source <Icon name="northeast" />
        </a>
      </footer>
    </>
  );
}
