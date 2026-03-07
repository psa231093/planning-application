"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerReturn {
  isRunning: boolean;
  elapsed: number; // seconds
  start: () => void;
  stop: () => number; // returns elapsed seconds
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);

  const stop = useCallback(() => {
    setIsRunning(false);
    const secs = elapsed;
    return secs;
  }, [elapsed]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  return { isRunning, elapsed, start, stop, reset };
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
