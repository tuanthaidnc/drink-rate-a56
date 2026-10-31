import { useState } from 'react';
import { Dialog } from './Dialog.tsx';
import CaptureLocation from './CaptureLocation.tsx';
import { getCurrentPosition, type Position } from '../lib/geo.ts';
export interface PickedPosition extends Position {
  source: 'manual' | 'gps';
  city?: string;
  ward?: string;
  street?: string;
}
export default function PinPicker({
  initial,
  theme,
  onClose,
  onConfirm,
}: {
  initial: Position | null;
  theme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: (p: PickedPosition) => void;
}) {
  const [pin, setPin] = useState(initial),
    [source, setSource] = useState<'manual' | 'gps'>('manual'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <Dialog title="Vị trí quán" onClose={onClose}>
      <CaptureLocation
        theme={theme}
        pin={pin}
        gps={null}
        busy={busy}
        error={error}
        onPin={(p) => {
          setPin(p);
          setSource('manual');
          setError('');
        }}
        onLocate={() => {
          setBusy(true);
          setError('');
          void getCurrentPosition()
            .then((p) => {
              setPin(p);
              setSource('gps');
            })
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
        onConfirm={() => {
          if (pin) {
            onConfirm({ ...pin, source });
            onClose();
          }
        }}
      />
    </Dialog>
  );
}
