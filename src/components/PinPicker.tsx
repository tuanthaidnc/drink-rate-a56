import { useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import MapSurface from './MapSurface.tsx';
import { getCurrentPosition, reverseAddress, type Position } from '../lib/geo.ts';
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
  const [pin, setPin] = useState<Position | null>(initial);
  const [source, setSource] = useState<'manual' | 'gps'>('manual');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState<Awaited<ReturnType<typeof reverseAddress>>>();
  const move = (p: Position) => {
    setPin(p);
    setSource('manual');
    setAddress(undefined);
    setError('');
  };
  return (
    <Dialog title="Ghim đúng vị trí quán" onClose={onClose}>
      <div className="stack">
        <p className="muted small">
          Kéo ghim hoặc chạm vị trí thật. Ghim chỉ được coi là xác nhận khi bạn bấm nút bên dưới.
        </p>
        <MapSurface theme={theme} pin={pin} onPin={move} />
        <button
          className="button secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              setPin(await getCurrentPosition());
              setSource('gps');
              setAddress(undefined);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <LocateFixed size={17} />
          {busy ? 'Đang lấy vị trí…' : 'Vị trí GPS của tôi'}
        </button>
        {pin && (
          <div className="panel compact">
            <p className="mono">
              {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
            </p>
            {pin.accuracyM !== undefined && (
              <p className="small muted">
                Sai số GPS khoảng {Math.round(pin.accuracyM)} m. Có thể kéo ghim để chỉnh lại.
              </p>
            )}
            <button
              className="button secondary w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  setAddress(await reverseAddress(pin));
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Search size={16} />
              Lấy gợi ý địa chỉ
            </button>
            <p className="small muted">
              Chỉ khi bấm tra địa chỉ, tọa độ được gửi tới OpenStreetMap. Có thể lưu ghim mà không
              tra.{' '}
              <a
                href="https://operations.osmfoundation.org/policies/nominatim/"
                target="_blank"
                rel="noreferrer"
              >
                Nguồn & chính sách
              </a>
            </p>
            {address && (
              <p className="small">
                Địa chỉ gợi ý: {address.displayName}. Hãy kiểm tra lại tỉnh/phường và đường trước
                khi lưu.
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button
          className="button w-full"
          disabled={!pin || busy}
          onClick={() => {
            if (pin) {
              onConfirm({
                ...pin,
                source,
                city: address?.city,
                ward: address?.ward,
                street: address?.street,
              });
              onClose();
            }
          }}
        >
          Xác nhận tôi đã kiểm tra ghim này
        </button>
      </div>
    </Dialog>
  );
}
