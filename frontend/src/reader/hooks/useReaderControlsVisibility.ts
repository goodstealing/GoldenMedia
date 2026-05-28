import { useCallback, useEffect, useRef, useState } from "react";

export function useReaderControlsVisibility(active: boolean, idleMs = 2300) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const poke = useCallback(() => {
    if (!active) return;
    setControlsVisible(true);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, idleMs);
  }, [active, idleMs]);

  useEffect(() => {
    if (!active) {
      setControlsVisible(true);
      return;
    }

    poke();
    window.addEventListener("mousemove", poke);
    window.addEventListener("touchstart", poke, { passive: true });
    return () => {
      window.removeEventListener("mousemove", poke);
      window.removeEventListener("touchstart", poke);
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [active, poke]);

  return { controlsVisible, poke };
}
