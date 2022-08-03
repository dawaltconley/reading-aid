import { useState, useEffect, useCallback } from 'react';

/**
 * Hook implementing a pausible timer that runs a callback when finished.
 * @param initialTime - initial time on the clock.
 * @param cb - Callback executed when time runs out.
 */
export function usePauseableTimer(initialTime = 0, cb: Function | null = null) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [callback, setCallback] = useState(() => cb);
  const [timePaused, setTimePaused] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(true);
  const [timeRunning, setTimeRunning] = useState(0);

  // const getTimeRunning = () => startedAt ? Date.now() - startedAt : 0;
  // const getTimePaused = () => pausedAt ? Date.now() - pausedAt : 0;

  /** Get the remaining time in milliseconds. */
  const getTimeLeft = useCallback(
    (now = Date.now()) => {
      if (paused) return timeLeft;
      const timeRunning = startedAt ? now - startedAt : 0;
      return timeLeft - timeRunning;
    },
    [paused, timeLeft, startedAt]
  );

  const getTimeRunning = useCallback(
    (now = Date.now()) => {
      if (!paused && startedAt) return now - startedAt + timeRunning;
      return timeRunning;
    },
    [paused, startedAt, timeRunning]
  );

  /** Updates the callback function that executes when the timer runs out. */
  useEffect(() => {
    if (!paused && callback && timeLeft > 0) {
      const timeLeft = getTimeLeft();
      const timer = setTimeout(callback, timeLeft);
      return () => clearTimeout(timer);
    }
  }, [callback, timeLeft, getTimeLeft, paused, startedAt]);

  /** Start the timer. */
  const start = useCallback(() => {
    const now = Date.now();
    const timeJustPaused = pausedAt ? now - pausedAt : 0;
    setTimePaused(t => t + timeJustPaused);
    setPaused(false);
    setStartedAt(now);
  }, [pausedAt]);

  /** Pause the timer. */
  const pause = useCallback(() => {
    const now = Date.now();
    setTimeLeft(getTimeLeft(now));
    setTimeRunning(getTimeRunning(now));
    setPaused(true);
    setPausedAt(now);
  }, [getTimeLeft, getTimeRunning]);

  /**
   * Reset the timer.
   * @param newTime - time on the clock when reset.
   */
  const reset = useCallback((newTime = 0) => {
    setTimeLeft(newTime);
    setTimeRunning(0);
    setPaused(true);
    setTimePaused(0);
    setPausedAt(null);
  }, []);

  return {
    start,
    reset,
    pause,
    toggle: paused ? start : pause,
    paused,
    active: !paused,
    get callback() {
      return callback;
    },
    set callback(cb) {
      setCallback(() => cb);
    },
    get timeLeft() {
      return getTimeLeft();
    },
    get timeRunning() {
      return getTimeRunning();
    },
    timePaused,
  };
}
