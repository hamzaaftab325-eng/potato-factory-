import { useCallback, useEffect, useRef, useState } from "react";

const defaultLoad = () => import("../factory/scene.js");
export function useFactory({
  canvasRef,
  viewportRef,
  stage,
  flavour,
  loadFactory = defaultLoad,
}) {
  const engine = useRef(null);
  const latest = useRef({ stage, flavour });
  latest.current = { stage, flavour };
  const [status, setStatus] = useState("loading");
  const [controls, setControls] = useState({
    playing: true,
    audioOn: false,
    musicOn: false,
    inspect: false,
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const sync = useCallback(() => {
    if (engine.current) {
      const { playing, audioOn, musicOn, inspect } = engine.current.state;
      setControls({ playing, audioOn, musicOn, inspect });
    }
  }, []);
  useEffect(() => {
    let disposed = false,
      observer;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) setControls((s) => ({ ...s, playing: false }));
    const preferences = () => {
      engine.current?.setReducedMotion(media.matches);
      if (media.matches) setControls((s) => ({ ...s, playing: false }));
      sync();
    };
    const visibility = () => engine.current?.setPageVisible(!document.hidden);
    const pagehide = () => engine.current?.setPageVisible(false);
    const pageshow = () => engine.current?.setPageVisible(!document.hidden);
    media.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("pageshow", pageshow);
    (async () => {
      try {
        const [{ createFactory }] = await Promise.all([
          loadFactory(),
          document.fonts?.ready ?? Promise.resolve(),
        ]);
        if (disposed) return;
        const instance = createFactory(canvasRef.current, {
          reducedMotion: media.matches,
          onReady() {
            if (!disposed) {
              setStatus("ready");
              setMessage("");
              sync();
            }
          },
          onInspectExit: sync,
          onContextLost() {
            if (!disposed) {
              setStatus("diagram");
              setMessage(
                "The interactive process guide remains available while 3D recovers.",
              );
            }
          },
        });
        if (disposed) {
          instance.dispose();
          return;
        }
        engine.current = instance;
        instance.setFlavour(latest.current.flavour);
        instance.setMode(
          latest.current.stage === 6
            ? "delivery"
            : latest.current.stage === 7
              ? "product"
              : "factory",
        );
        instance.setJourney(Math.min(5, latest.current.stage));
        instance.setPageVisible(!document.hidden);
        if ("IntersectionObserver" in window) {
          observer = new IntersectionObserver(
            ([entry]) => instance.setVisible(entry.isIntersecting),
            { rootMargin: "80px" },
          );
          observer.observe(viewportRef.current);
        }
        sync();
      } catch (error) {
        console.warn(
          "CRISP: using the process illustration because 3D could not start.",
          error,
        );
        if (!disposed) {
          setStatus("diagram");
          setMessage("Illustrated view · 3D requires WebGL in your browser.");
        }
      }
    })();
    return () => {
      disposed = true;
      observer?.disconnect();
      media.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("pageshow", pageshow);
      engine.current?.dispose();
      engine.current = null;
    };
  }, [canvasRef, viewportRef, loadFactory, sync]);
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.setInspect(false);
    e.setMode(stage === 6 ? "delivery" : stage === 7 ? "product" : "factory");
    e.setJourney(Math.min(5, stage));
    e.setFlavour(flavour);
    sync();
  }, [stage, flavour, sync]);
  const act = useCallback(
    async (action) => {
      const e = engine.current;
      if (action === "play" && !e) {
        setControls((s) => ({ ...s, playing: !s.playing }));
        return;
      }
      if (!e || busy) return;
      try {
        if (action === "play") e.setPlaying(!e.state.playing);
        if (action === "inspect") {
          e.setInspect(!e.state.inspect);
          if (e.state.inspect) canvasRef.current.focus({ preventScroll: true });
        }
        if (action === "reset") {
          e.setInspect(false);
          e.setMode(
            stage === 6 ? "delivery" : stage === 7 ? "product" : "factory",
          );
          e.setJourney(Math.min(stage, 5));
        }
        if (action === "sound" || action === "music") {
          setBusy(true);
          if (action === "sound") await e.setAudio(!e.state.audioOn);
          else {
            const next = !e.state.musicOn;
            if (next && !e.state.audioOn) await e.setAudio(true);
            e.setMusic(next);
          }
        }
        setMessage("");
        sync();
      } catch {
        setMessage("Sound could not start. Try the sound control again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, stage, canvasRef, sync],
  );
  return { status, controls, message, busy, act };
}
