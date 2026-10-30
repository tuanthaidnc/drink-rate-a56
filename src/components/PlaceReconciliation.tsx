import {
  CheckCircle2,
  ExternalLink,
  MapPin,
  Utensils,
  ChevronRight,
  Link2,
  Info,
} from 'lucide-react';
import type { ReviewItem } from '../lib/models.ts';
import { THANH_HUONG_CANDIDATE as candidate } from '../lib/placeCorrections.ts';
import { Dialog } from './Dialog.tsx';
import { Button } from './ui/button.tsx';
export function HistoricalPlaces({ items, onOpen }: { items: ReviewItem[]; onOpen: () => void }) {
  if (!items.length) return null;
  return (
    <section className="historical-places stack">
      {items.map((r) => (
        <button className="historical-row" key={r.id} onClick={onOpen}>
          <span className="venue-symbol">
            <Utensils />
          </span>
          <span>
            <strong>{r.name}</strong>
            <small>
              {r.placeResolution?.status === 'verified' ? 'Đã xác nhận' : 'Chờ xác nhận'}
            </small>
          </span>
          <ChevronRight />
        </button>
      ))}
    </section>
  );
}
export default function PlaceReconciliation({
  items,
  busy,
  onClose,
  onEdit,
  onConfirm,
}: {
  items: ReviewItem[];
  busy: boolean;
  onClose: () => void;
  onEdit: (item: ReviewItem) => void;
  onConfirm: (item: ReviewItem) => Promise<boolean>;
}) {
  return (
    <Dialog title="Đối chiếu địa điểm" onClose={onClose}>
      <div className="stack">
        <></>
        {items
          .filter((r) => r.placeResolution)
          .map((r) => (
            <section className="reconciliation-place stack" key={r.id}>
              <h3>{r.name}</h3>
              {r.placeResolution!.status === 'verified' ? (
                <>
                  <p className="source-verified">
                    <CheckCircle2 />
                    Đã đối chiếu
                  </p>
                  <p>{[r.address, r.street, r.ward, r.city].filter(Boolean).join(', ')}</p>
                  <a
                    className="source-link"
                    href={r.placeResolution!.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink />
                    Xem hồ sơ Maps gốc
                  </a>
                </>
              ) : (
                <>
                  <p className="small">Ứng viên</p>
                  <p>
                    <strong>{candidate.officialName}</strong>
                    <br />
                    {candidate.address} {candidate.street}, {candidate.ward}, {candidate.city}
                  </p>
                  <></>
                  <a
                    className="source-link"
                    href={candidate.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin />
                    Maps
                  </a>
                  <Button disabled={busy} onClick={() => void onConfirm(r)}>
                    Dùng địa chỉ này
                  </Button>
                </>
              )}
              {r.isDemo && <></>}
              <Button variant="outline" onClick={() => onEdit(r)}>
                Chấm điểm
              </Button>
            </section>
          ))}
      </div>
    </Dialog>
  );
}
