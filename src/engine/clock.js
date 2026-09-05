export const clampClockRate = (rate) =>
  Number.isFinite(rate) ? Math.max(0.25, Math.min(32, rate)) : 1;

export function waitForPulse(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", stop);
      reject(new DOMException("Clock interrupted.", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", stop);
      resolve();
    }, milliseconds);
    if (signal?.aborted) stop();
    else signal?.addEventListener("abort", stop, { once: true });
  });
}

// Account for elapsed virtual time before changing rate. A held clock retains
// its unfinished beat; it never restarts the lineage or accumulates catch-up work.
export function createPlaybackClock({
  read,
  subscribe,
  now = () => performance.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  return {
    wait(milliseconds, signal) {
      return new Promise((resolve, reject) => {
        let remaining = Math.max(0, milliseconds);
        let last = now();
        let settings = read();
        let rate = settings.paused ? 0 : clampClockRate(settings.rate);
        let timer = null;
        let finished = false;
        let unsubscribe = () => {};
        const cleanup = () => {
          finished = true;
          clearTimer(timer);
          unsubscribe();
          signal?.removeEventListener("abort", stop);
        };
        const stop = () => {
          if (finished) return;
          cleanup();
          reject(new DOMException("Clock interrupted.", "AbortError"));
        };
        const schedule = () => {
          if (finished) return;
          clearTimer(timer);
          const current = now();
          remaining -= Math.max(0, current - last) * rate;
          last = current;
          settings = read();
          rate = settings.paused ? 0 : clampClockRate(settings.rate);
          if (rate === 0) return;
          if (remaining <= 0) {
            cleanup();
            resolve();
          } else timer = setTimer(schedule, Math.max(1, remaining / rate));
        };
        unsubscribe = subscribe(schedule);
        signal?.addEventListener("abort", stop, { once: true });
        if (signal?.aborted) stop();
        else schedule();
      });
    },
  };
}
