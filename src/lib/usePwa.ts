import { useCallback, useEffect, useRef, useState } from 'react';
export function usePwa() {
  const [online, setOnline] = useState(navigator.onLine),
    [ready, setReady] = useState(false),
    [waiting, setWaiting] = useState(false),
    [error, setError] = useState('');
  const registration = useRef<ServiceWorkerRegistration | null>(null),
    applying = useRef(false),
    alive = useRef(true);
  const check = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setError('Trình duyệt chưa hỗ trợ chuẩn bị ngoại tuyến.');
      return;
    }
    try {
      const existing = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
      const r =
        existing?.scope === new URL(import.meta.env.BASE_URL, location.origin).href
          ? existing
          : await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
              scope: import.meta.env.BASE_URL,
              updateViaCache: 'none',
            });
      registration.current = r;
      const inspect = () => {
        if (!alive.current) return;
        setWaiting(!!r.waiting);
        const worker = r.active;
        if (!worker) return;
        const channel = new MessageChannel();
        const timer = setTimeout(() => channel.port1.close(), 3000);
        channel.port1.onmessage = (e) => {
          clearTimeout(timer);
          channel.port1.close();
          if (alive.current && e.data?.app === 'not-food-drink') setReady(e.data.ready === true);
        };
        worker.postMessage({ type: 'STATUS' }, [channel.port2]);
      };
      const installing = () => {
        const worker = r.installing;
        if (worker)
          worker.onstatechange = () => {
            inspect();
            if (alive.current) {
              if (worker.state === 'redundant')
                setError('Chưa tải đủ bản dùng ngoại tuyến. Hãy thử lại khi mạng ổn định.');
              else if (['installed', 'activated'].includes(worker.state)) setError('');
            }
          };
      };
      r.onupdatefound = installing;
      if (r.installing) installing();
      inspect();
      if (navigator.onLine) {
        await r.update();
      }
      inspect();
    } catch {
      if (alive.current)
        setError(
          navigator.onLine
            ? 'Chưa chuẩn bị được bản ngoại tuyến.'
            : 'Chưa có bản ngoại tuyến hoàn chỉnh; kết nối mạng để chuẩn bị.',
        );
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void check();
    const connection = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void check();
    };
    const changed = () => {
      if (applying.current) location.reload();
      else void check();
    };
    const focus = () => {
      if (navigator.onLine) void check();
    };
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    window.addEventListener('focus', focus);
    navigator.serviceWorker?.addEventListener('controllerchange', changed);
    return () => {
      alive.current = false;
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
      window.removeEventListener('focus', focus);
      navigator.serviceWorker?.removeEventListener('controllerchange', changed);
    };
  }, [check]);
  return {
    online,
    ready,
    waiting,
    error,
    retry: check,
    apply: () => {
      if (registration.current?.waiting) {
        applying.current = true;
        registration.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    },
  };
}
