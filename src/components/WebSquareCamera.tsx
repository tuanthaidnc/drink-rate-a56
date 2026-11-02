import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

export function webSquareCamera(): Promise<File[]> {
  return new Promise(resolve => {
    const host = document.createElement('div');
    document.body.append(host);
    const previous = document.activeElement as HTMLElement | null;
    const root = createRoot(host);
    root.render(<WebCamera onFinish={files => {
      root.unmount(); host.remove();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      resolve(files);
    }} />);
  });
}
function WebCamera({ onFinish }: { onFinish: (files: File[]) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [front, setFront] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const completed = useRef(false);
  const finish = (files: File[]) => { if (!completed.current) { completed.current = true; onFinish(files); } };
  useEffect(() => {
    dialog.current?.showModal();
    const back = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); finish([]); } };
    document.addEventListener('keydown', back);
    return () => document.removeEventListener('keydown', back);
  }, []);
  useEffect(() => {
    let active = true;
    let media: MediaStream | undefined;
    setReady(false); setError('');
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable');
        media = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: { ideal: front ? 'user' : 'environment' }, width: { ideal: 1600 }, height: { ideal: 1600 },
        } });
        if (!active) { media.getTracks().forEach(t => t.stop()); return; }
        video.current!.srcObject = media;
        await video.current!.play();
        if (active) setReady(true);
      } catch { if (active) setError('Chưa mở được camera. Cho phép camera rồi thử lại, hoặc đóng để chọn Thư viện.'); }
    })();
    return () => { active = false; media?.getTracks().forEach(t => t.stop()); };
  }, [front]);
  const capture = () => {
    const v = video.current;
    if (!ready || busy || !v?.videoWidth || !v.videoHeight) return;
    setBusy(true);
    const side = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = Math.min(1600, side);
    canvas.getContext('2d')!.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (completed.current) return;
      if (blob) finish([new File([blob], 'capture.jpg', { type: 'image/jpeg' })]);
      else { setBusy(false); setError('Chưa chụp được ảnh. Hãy thử lại.'); }
    }, 'image/jpeg', .92);
  };
  return <dialog ref={dialog} role="dialog" className="square-camera" aria-label="Camera vuông" onCancel={e => { e.preventDefault(); finish([]); }}>
    <header><button type="button" className="icon-button" aria-label="Đóng camera" onClick={() => finish([])}><X /></button><strong>NỐT</strong><span /></header>
    <div className="square-viewfinder"><video ref={video} playsInline muted aria-label="Khung ảnh vuông" /></div>
    {error && <p role="alert">{error}</p>}
    <footer><span /><button type="button" className="square-shutter" aria-label="Chụp ảnh" disabled={!ready || busy} onClick={capture}><Camera /></button>
      <button type="button" className="icon-button" aria-label="Đổi camera" disabled={busy} onClick={() => setFront(f => !f)}><RefreshCw /></button></footer>
  </dialog>;
}
