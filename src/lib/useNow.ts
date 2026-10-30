import { useEffect, useState } from 'react';
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const t = setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return now;
}
