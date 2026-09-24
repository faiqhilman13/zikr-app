import { useEffect, useState } from 'react';

/** The current time, re-read on an interval and whenever the app comes back into view,
 * for readouts that change with the clock rather than with state. */
export function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, interval);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [interval]);
  return now;
}
