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
      <div className="split">
        <h2>Hồ sơ cũ</h2>
        <Info size={16} />
      </div>
      <p className="small muted">Điểm minh họa không dùng để gợi ý.</p>
      {items.map((r) => (
        <button className="historical-row" key={r.id} onClick={onOpen}>
          <span className="venue-symbol">
            <Utensils />
          </span>
          <span>
            <strong>{r.name}</strong>
            <small>
              {r.placeResolution?.status === 'verified'
                ? 'Đã đối chiếu địa điểm · Minh họa'
                : 'Cần xác nhận địa điểm · Minh họa'}
            </small>
          </span>
          <ChevronRight />
        </button>
      ))}
      <Button variant="outline" onClick={onOpen}>
        <Link2 data-icon="inline-start" />
        Đối chiếu địa điểm
      </Button>
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
        <p className="small muted">
          Địa chỉ và ghim được đối chiếu riêng với điểm trải nghiệm của bạn. Dữ liệu mẫu Bếp Trang
          đã được bỏ theo yêu cầu.
        </p>
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
                  <p className="small">Hồ sơ gần khớp được tìm thấy trên Maps:</p>
                  <p>
                    <strong>{candidate.officialName}</strong>
                    <br />
                    {candidate.address} {candidate.street}, {candidate.ward}, {candidate.city}
                  </p>
                  <p className="small muted">
                    Chưa có bằng chứng đây chính là quán trong bản cũ. Ghim cũ đã được bỏ vì không
                    có nguồn xác thực.
                  </p>
                  <a
                    className="source-link"
                    href={candidate.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin />
                    Kiểm tra địa chỉ và ảnh trên Maps
                  </a>
                  <Button disabled={busy} onClick={() => void onConfirm(r)}>
                    Đúng quán này, dùng địa điểm này
                  </Button>
                </>
              )}
              {r.isDemo && (
                <p className="small muted">
                  Điểm và ghi chú cũ là minh họa. Chấm lại để đưa quán vào lựa chọn cá nhân.
                </p>
              )}
              <Button variant="outline" onClick={() => onEdit(r)}>
                Chấm lại / sửa thông tin
              </Button>
            </section>
          ))}
      </div>
    </Dialog>
  );
}
