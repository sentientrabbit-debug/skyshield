import { useCallback, useEffect, useRef, useState } from "react";

/** Drives the replay clock. Advances `tick` to `totalTicks` then stops. */
export function useReplay(totalTicks: number, msPerTick = 380) {
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(true);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    function step(ts: number) {
      if (!last.current) last.current = ts;
      if (ts - last.current >= msPerTick) {
        last.current = ts;
        setTick((t) => {
          if (t >= totalTicks) {
            setPlaying(false);
            return t;
          }
          return t + 1;
        });
      }
      raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = 0;
    };
  }, [playing, totalTicks, msPerTick]);

  const pause = useCallback(() => setPlaying((p) => !p), []);
  const restart = useCallback(() => {
    setTick(0);
    setPlaying(true);
  }, []);
  const skip = useCallback(() => {
    setTick(totalTicks);
    setPlaying(false);
  }, [totalTicks]);

  const done = tick >= totalTicks;
  return { tick, playing, done, pause, restart, skip };
}
