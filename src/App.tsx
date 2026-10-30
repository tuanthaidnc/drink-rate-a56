import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  MapPin,
  Map,
  Plus,
  ChartColumn,
  Moon,
  Sun,
  BookOpen,
  Shuffle,
  Coffee,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import {
  applyThemeWithTransition,
  syncStatusBarThemeColor,
  type AppTheme,
} from './components/animate-ui/primitives.tsx';
import { Dialog } from './components/Dialog.tsx';
import FilterBar from './components/FilterBar.tsx';
import ReviewCard from './components/ReviewCard.tsx';
import DataTools from './components/DataTools.tsx';
import AppNavigation from './components/AppNavigation.tsx';
import ReviewInspector from './components/ReviewInspector.tsx';
import PlaceReconciliation, { HistoricalPlaces } from './components/PlaceReconciliation.tsx';
import { applyPlaceCorrections, THANH_HUONG_CANDIDATE } from './lib/placeCorrections.ts';
import { useReviewStore } from './lib/useReviewStore.ts';
import { useNow } from './lib/useNow.ts';
import { usePwa } from './lib/usePwa.ts';
import {
  APP_VERSION,
  emptyDocument,
  hasConfirmedLocation,
  newId,
  type PhotoData,
  type ReviewItem,
  type Settings,
  type Visit,
} from './lib/models.ts';
import { createReview, validateReview, validateReviews, validateVisit } from './lib/validation.ts';
import { DEFAULT_FILTERS, describeFilters, filterReviews, type Filters } from './lib/selection.ts';
import { directionsUrl, distanceKm, getCurrentPosition, type Position } from './lib/geo.ts';
import { INITIAL_REVIEWS as DEMO_REVIEWS } from './data/demo.ts';
const PlaceMap = lazy(() => import('./components/PlaceMap.tsx'));
const ReviewForm = lazy(() => import('./components/ReviewForm.tsx'));
const Insights = lazy(() => import('./components/Insights.tsx'));
const SpinPicker = lazy(() => import('./components/SpinPicker.tsx'));
const VisitManager = lazy(() => import('./components/VisitManager.tsx'));
type Tab = 'places' | 'map' | 'review' | 'insights';
const tabs = [
  { id: 'places', label: 'Quán xá', icon: MapPin },
  { id: 'map', label: 'Bản đồ', icon: Map },
  { id: 'review', label: 'Chấm điểm', icon: Plus },
  { id: 'insights', label: 'Thống kê', icon: ChartColumn },
] as const;
const ratingKeys = [
  'category',
  'mode',
  'foodType',
  'priceK',
  'taste',
  'space',
  'volumeKey',
  'packaging',
  'cleanliness',
  'foodQuality',
] as const;

export default function App() {
  const store = useReviewStore(),
    doc = store.document,
    now = useNow(),
    pwa = usePwa();
  const [theme, setTheme] = useState<AppTheme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  );
  const [tab, setTab] = useState<Tab>('places'),
    [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });
  const [draft, setDraft] = useState<ReviewItem | null>(null),
    [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sort, setSort] = useState('score'),
    [position, setPosition] = useState<Position | null>(null),
    [locating, setLocating] = useState(false);
  const [reconciliation, setReconciliation] = useState(false);
  const [spin, setSpin] = useState(false),
    [formula, setFormula] = useState(false),
    [demo, setDemo] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(null),
    [deleteItem, setDeleteItem] = useState<ReviewItem | null>(null);
  const [selected, setSelected] = useState<string | null>(null),
    [undo, setUndo] = useState<ReviewItem | null>(null);
  const [message, setMessage] = useState(''),
    [typing, setTyping] = useState(false),
    [leaveTo, setLeaveTo] = useState<Tab | null>(null);
  const main = useRef<HTMLElement>(null),
    isForm = tab === 'review' && draft !== null;
  const formRef = useRef(isForm);
  formRef.current = isForm && dirty;
  const reduced = doc?.settings.reducedMotion === true;
  const navigate = useCallback((target: Tab, push = true) => {
    setTab(target);
    if (push) history.pushState({ notTab: target }, '', location.href);
    main.current?.scrollTo({ top: 0 });
  }, []);
  const add = (p?: Position) => {
    setDirty(!!p);
    setDraft({
      ...createReview(),
      ...(p
        ? {
            lat: p.lat,
            lng: p.lng,
            locationStatus: 'confirmed' as const,
            locationSource: 'manual' as const,
          }
        : {}),
    });
    setEditing(false);
    navigate('review');
  };
  const edit = (r: ReviewItem) => {
    setDirty(false);
    setDraft(structuredClone(r));
    setEditing(!!doc?.reviews.some((x) => x.id === r.id));
    setDemo(false);
    navigate('review');
  };
  const selectTab = (target: Tab) => {
    if (target === tab) return;
    if (isForm && dirty && target !== tab) {
      setLeaveTo(target);
      return;
    }
    if (target === 'review') {
      if (!draft) add();
      else navigate(target);
    } else {
      if (isForm) {
        setDraft(null);
        setDirty(false);
      }
      navigate(target);
    }
  };
  useEffect(() => {
    history.replaceState({ notTab: 'places' }, '', location.href);
    const pop = (e: PopStateEvent) => {
      if (formRef.current) {
        setLeaveTo(
          e.state?.notTab === 'review' ? 'places' : ((e.state?.notTab as Tab) ?? 'places'),
        );
        history.pushState({ notTab: 'review' }, '', location.href);
        return;
      }
      const next = e.state?.notTab;
      setDraft(null);
      setDirty(false);
      setTab(next !== 'review' && tabs.some((t) => t.id === next) ? next : 'places');
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    if (isForm && dirty) window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [isForm, dirty]);
  useEffect(() => {
    syncStatusBarThemeColor(theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced);
  }, [reduced]);
  useEffect(() => {
    let fullHeight = window.innerHeight;
    const viewport = window.visualViewport;
    const update = () => {
      const active = document.activeElement;
      const editable =
        (active instanceof HTMLInputElement &&
          !['range', 'checkbox', 'radio', 'file', 'button', 'submit'].includes(active.type)) ||
        active instanceof HTMLTextAreaElement;
      const height = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
      if (!editable) fullHeight = Math.max(fullHeight, height);
      setTyping(!!editable && height < fullHeight - 120);
    };
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 9000);
    return () => clearTimeout(timer);
  }, [message]);
  const reviews = doc?.reviews ?? [],
    personal = reviews.filter((r) => !r.isDemo),
    demos = reviews.filter((r) => r.isDemo);
  const filtered = useMemo(
    () => filterReviews(reviews, filters, position, now),
    [reviews, filters, position, now],
  );
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        sort === 'price'
          ? a.priceK - b.priceK
          : sort === 'taste'
            ? b.taste - a.taste
            : sort === 'recent'
              ? b.updatedAt.localeCompare(a.updatedAt)
              : sort === 'distance' && position
                ? (hasConfirmedLocation(a)
                    ? distanceKm(position, { lat: a.lat!, lng: a.lng! })
                    : Infinity) -
                  (hasConfirmedLocation(b)
                    ? distanceKm(position, { lat: b.lat!, lng: b.lng! })
                    : Infinity)
                : b.totalScore - a.totalScore,
      ),
    [filtered, sort, position],
  );
  const inspector = sorted.find((r) => r.id === selected) ?? sorted[0];
  const summary = describeFilters(filters),
    visitItem = reviews.find((r) => r.id === visitId);
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    try {
      setPosition(await getCurrentPosition());
      setMessage('Đã lấy GPS. Khoảng cách là đường chim bay tới ghim đã xác nhận.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setLocating(false);
    }
  };
  const directions = (r: ReviewItem) => {
    window.open(directionsUrl(r), '_blank', 'noopener,noreferrer');
  };
  const saveSettings = (settings: Settings) =>
    store.update((d) => ({ ...d, settings: { ...d.settings, ...settings } }), 'Cập nhật tùy chọn');
  const saveReview = async (
    item: ReviewItem,
    photos: PhotoData[],
    firstVisit: boolean,
    expectedUpdatedAt: string,
  ) => {
    const ok = await store.update(
      (current) => {
        const old = current.reviews.find((r) => r.id === item.id);
        if (editing && (!old || old.updatedAt !== expectedUpdatedAt))
          throw new Error(
            'Quán này đã thay đổi ở cửa sổ khác. Bản đang nhập được giữ; hãy sao chép ghi chú rồi mở lại đánh giá mới nhất.',
          );
        if (!editing && old) throw new Error('Mã quán đã có. Hãy mở lại màn hình chấm điểm.');
        const changed = old && !old.isDemo && ratingKeys.some((key) => old[key] !== item[key]);
        const visitLog =
          old?.visitLog ??
          (firstVisit ? [{ id: newId('visit'), visitedAt: new Date().toISOString() }] : []);
        const next = validateReview({
          ...item,
          visitLog,
          visits: visitLog.map((v) => v.visitedAt),
          ratingHistory: changed
            ? [
                ...old.ratingHistory.slice(-999),
                {
                  reviewedAt: old.reviewedAt ?? old.updatedAt,
                  totalScore: old.totalScore,
                  priceK: old.priceK,
                  taste: old.taste,
                  scoringVersion: old.scoringVersion,
                },
              ]
            : (old?.ratingHistory ?? []),
          updatedAt: new Date().toISOString(),
        });
        return {
          ...current,
          reviews: old
            ? current.reviews.map((r) => (r.id === next.id ? next : r))
            : [...current.reviews, next],
        };
      },
      editing ? 'Cập nhật đánh giá' : 'Thêm đánh giá',
      photos,
    );
    if (ok) {
      setDraft(null);
      setDirty(false);
      setSelected(item.id);
      setFilters({ ...DEFAULT_FILTERS });
      navigate('places');
      setMessage(editing ? 'Đã lưu cập nhật trên thiết bị.' : 'Đã lưu trải nghiệm trên thiết bị.');
    }
    return ok;
  };
  const saveVisit = (visit: Visit, isEdit: boolean) =>
    store.update(
      (current) => {
        const item = current.reviews.find((r) => r.id === visitId);
        if (!item) throw new Error('Quán đã được thay đổi ở cửa sổ khác.');
        const v = validateVisit(visit),
          exists = item.visitLog.some((x) => x.id === v.id);
        if (isEdit && !exists) throw new Error('Lượt ghé đã bị xóa. Hãy mở lại lịch sử.');
        if (!isEdit && exists) throw new Error('Lượt ghé này đã được lưu.');
        const visitLog = isEdit
          ? item.visitLog.map((x) => (x.id === v.id ? v : x))
          : [...item.visitLog, v];
        return {
          ...current,
          reviews: current.reviews.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  visitLog,
                  visits: visitLog.map((v) => v.visitedAt),
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        };
      },
      isEdit ? 'Sửa lượt ghé' : 'Ghi nhận lượt ghé',
    );
  const deleteVisit = (id: string) =>
    store.update(
      (current) => ({
        ...current,
        reviews: current.reviews.map((r) => {
          if (r.id !== visitId) return r;
          const visitLog = r.visitLog.filter((v) => v.id !== id);
          return {
            ...r,
            visitLog,
            visits: visitLog.map((v) => v.visitedAt),
            updatedAt: new Date().toISOString(),
          };
        }),
      }),
      'Bỏ lượt ghé',
    );
  const remove = async () => {
    if (!deleteItem) return;
    const item = deleteItem;
    let removed: ReviewItem | undefined;
    const ok = await store.update((d) => {
      removed = d.reviews.find((r) => r.id === item.id);
      if (!removed) throw new Error('Quán này đã được xóa.');
      return { ...d, reviews: d.reviews.filter((r) => r.id !== item.id) };
    }, 'Xóa quán');
    if (ok) {
      setUndo(removed!);
      setDeleteItem(null);
      setMessage('Đã xóa quán. Có thể hoàn tác hoặc khôi phục bản dự phòng.');
    }
  };
  const restoreDeleted = async () => {
    if (!undo) return;
    const item = undo;
    const ok = await store.update((d) => {
      if (d.reviews.some((r) => r.id === item.id))
        throw new Error('Quán này đã tồn tại; không ghi đè.');
      return { ...d, reviews: [...d.reviews, item] };
    }, 'Hoàn tác xóa quán');
    if (ok) {
      setUndo(null);
      setMessage('Đã khôi phục quán và các lượt ghé.');
    }
  };
  const dataTools = (
    <DataTools
      document={doc}
      backups={store.backups}
      busy={store.busy}
      error={store.error}
      onImport={store.importFile}
      onRestore={store.restore}
      onSettings={saveSettings}
      onMessage={setMessage}
    />
  );
  const examples = demos.length
    ? demos
    : applyPlaceCorrections({
        ...emptyDocument(),
        reviews: validateReviews(DEMO_REVIEWS, true),
      }).reviews.map((r) => ({ ...r, isDemo: true }));
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <div className={`not-app ${typing && isForm ? 'is-typing' : ''}`}>
        <header className="app-header">
          <div className="header-inner">
            <a
              className="brand"
              href="#main"
              onClick={(e) => {
                e.preventDefault();
                selectTab('places');
              }}
            >
              <span className="brand-icon">
                <Coffee size={22} />
              </span>
              <span>
                <strong>NỐT</strong>
                <small>FOOD & DRINK</small>
              </span>
            </a>
            <div className="header-actions">
              <button
                className="button secondary theme-toggle"
                onClick={(e) =>
                  applyThemeWithTransition(theme === 'dark' ? 'light' : 'dark', setTheme, e)
                }
                aria-label={`Đổi sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`}
              >
                {theme === 'dark' ? <Moon /> : <Sun />}
                <span>{theme === 'dark' ? 'Tối' : 'Sáng'}</span>
              </button>
              <button
                className="icon-button secondary"
                aria-label="Xem công thức tính điểm"
                onClick={() => setFormula(true)}
              >
                <BookOpen />
              </button>
            </div>
          </div>
        </header>
        {doc && <AppNavigation desktop value={tab} onChange={selectTab} />}
        <main id="main" ref={main} className="app-main" tabIndex={-1}>
          <div className="content-width stack">
            <div className="connection-status" role="status">
              {!pwa.online ? (
                <>
                  <WifiOff size={14} />
                  Ngoại tuyến · vẫn lưu trên thiết bị
                </>
              ) : pwa.ready ? (
                'Sẵn sàng dùng ngoại tuyến'
              ) : (
                'Đang chuẩn bị bản dùng ngoại tuyến…'
              )}
            </div>
            {pwa.error && (
              <p className="notice small">
                {pwa.error}
                <button className="text-button" onClick={() => void pwa.retry()}>
                  Thử chuẩn bị lại
                </button>
              </p>
            )}
            {pwa.waiting && (
              <div className="notice update-notice">
                <span>
                  Có phiên bản mới{dirty ? ' · hãy lưu hoặc hủy phần đang nhập trước.' : ''}
                </span>
                <button
                  className="button"
                  disabled={dirty || store.busy || !!visitItem}
                  onClick={() => pwa.apply()}
                >
                  <RefreshCw size={16} />
                  Cập nhật
                </button>
              </div>
            )}
            {store.loading ? (
              <p role="status" className="empty">
                Đang mở dữ liệu cá nhân…
              </p>
            ) : !doc ? (
              <>
                <section className="panel stack">
                  <h1>Cần khôi phục dữ liệu</h1>
                  <p role="alert" className="alert">
                    {store.error?.message ?? 'Chưa thể mở kho dữ liệu.'}
                  </p>
                  <p>
                    Dữ liệu cũ được giữ nguyên. Chọn file sao lưu hoặc bản dự phòng bên dưới, hoặc
                    thử mở lại kho.
                  </p>
                  <button className="button secondary" onClick={() => void store.reload()}>
                    Thử mở lại
                  </button>
                </section>
                {dataTools}
              </>
            ) : (
              <>
                {store.error && (
                  <div className="alert" role="alert">
                    <strong>Chưa lưu thay đổi.</strong>
                    <p>{store.error.message}</p>
                    <button className="text-button" onClick={store.clearError}>
                      Đóng thông báo
                    </button>
                  </div>
                )}
                {!isForm && (
                  <div className="page-heading">
                    <div>
                      <h1>
                        {tab === 'places' ? (
                          <>
                            Quán xá <small>({filtered.length})</small>
                          </>
                        ) : tab === 'map' ? (
                          'Bản đồ'
                        ) : (
                          'Thống kê'
                        )}
                      </h1>
                      <p>
                        {tab === 'places'
                          ? 'Trải nghiệm của riêng bạn'
                          : tab === 'map'
                            ? 'Ghim đúng quán, tìm đúng nơi'
                            : 'Nhìn lại gu ăn uống và chi tiêu'}
                      </p>
                    </div>
                    <button className="button" onClick={() => setSpin(true)}>
                      <Shuffle size={16} />
                      Ăn gì?
                    </button>
                  </div>
                )}
                {!isForm && (
                  <FilterBar
                    key={theme}
                    items={reviews}
                    filters={filters}
                    onChange={setFilters}
                    position={position}
                    onLocate={() => void locate()}
                    locating={locating}
                  />
                )}
                <Suspense
                  fallback={
                    <p className="empty" role="status">
                      Đang mở màn hình…
                    </p>
                  }
                >
                  {tab === 'places' && (
                    <div className="workspace-view">
                      <div className="places-column stack">
                        <div className="split list-heading">
                          <label className="sort-field">
                            <span className="sr-only">Sắp xếp quán</span>
                            <select
                              aria-label="Sắp xếp quán"
                              value={sort}
                              onChange={(e) => {
                                setSort(e.target.value);
                                if (e.target.value === 'distance' && !position) void locate();
                              }}
                            >
                              <option value="score">Điểm cao trước</option>
                              <option value="taste">Ngon nhất trước</option>
                              <option value="price">Giá thấp trước</option>
                              <option value="recent">Mới cập nhật</option>
                              <option value="distance">Gần GPS nhất</option>
                            </select>
                          </label>
                          <span className="list-count">{filtered.length} quán</span>
                        </div>
                        {undo && (
                          <div className="notice split">
                            <span>Đã xóa {undo.name}.</span>
                            <button
                              className="text-button"
                              disabled={store.busy}
                              onClick={() => void restoreDeleted()}
                            >
                              Hoàn tác xóa quán
                            </button>
                          </div>
                        )}
                        {!personal.length ? (
                          <section className="panel empty stack">
                            <Coffee size={40} />
                            <h2>Nhớ quán ngon, chọn dễ hơn</h2>
                            <p>
                              Chấm trải nghiệm thật đầu tiên của bạn. Điểm, giá và những lần quay
                              lại sẽ giúp chọn quán lần sau.
                            </p>
                            <button className="button" onClick={() => add()}>
                              <Plus size={18} />
                              Chấm quán đầu tiên
                            </button>
                            <button className="text-button" onClick={() => setDemo(true)}>
                              Xem cách hoạt động với quán minh họa
                            </button>
                          </section>
                        ) : !sorted.length ? (
                          <section className="panel empty stack">
                            <h2>Chưa có quán khớp điều kiện</h2>
                            <p>{summary}</p>
                            <button
                              className="button secondary"
                              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                            >
                              Xóa bộ lọc
                            </button>
                          </section>
                        ) : (
                          sorted.map((item, index) => (
                            <ReviewCard
                              key={item.id}
                              item={item}
                              index={index}
                              now={now}
                              position={position}
                              selected={item.id === selected}
                              onInspect={() => setSelected(item.id)}
                              onEdit={() => edit(item)}
                              onDelete={() => setDeleteItem(item)}
                              onVisit={() => setVisitId(item.id)}
                              onDirections={() => directions(item)}
                              onMap={() => {
                                setSelected(item.id);
                                navigate('map');
                              }}
                            />
                          ))
                        )}
                        <HistoricalPlaces items={demos} onOpen={() => setReconciliation(true)} />
                      </div>
                      <ReviewInspector
                        item={inspector}
                        now={now}
                        onEdit={() => inspector && edit(inspector)}
                        onVisit={() => inspector && setVisitId(inspector.id)}
                        onDelete={() => inspector && setDeleteItem(inspector)}
                        onDirections={() => inspector && directions(inspector)}
                        onMap={() => {
                          if (inspector) {
                            setSelected(inspector.id);
                            navigate('map');
                          }
                        }}
                      />
                    </div>
                  )}
                  {tab === 'map' && (
                    <PlaceMap
                      key={selected ?? 'map'}
                      items={filtered}
                      theme={theme}
                      summary={summary}
                      position={position}
                      onLocate={() => void locate()}
                      onEdit={edit}
                      onDirections={directions}
                      onCreate={add}
                      selectedId={selected}
                    />
                  )}
                  {tab === 'review' && draft && (
                    <ReviewForm
                      key={draft.id}
                      initial={draft}
                      isEdit={editing}
                      theme={theme}
                      busy={store.busy}
                      isTyping={typing}
                      existing={reviews}
                      onSave={saveReview}
                      onDirtyChange={setDirty}
                      onCancel={() => {
                        if (dirty) setLeaveTo('places');
                        else {
                          setDraft(null);
                          navigate('places');
                        }
                      }}
                    />
                  )}
                  {tab === 'insights' && (
                    <Insights
                      document={doc}
                      items={filtered}
                      summary={summary}
                      now={now}
                      dataTools={dataTools}
                      onBudget={async (value) => {
                        const ok = await saveSettings({ monthlyBudgetK: value });
                        if (ok) setMessage('Đã lưu ngân sách chu kỳ.');
                        return ok;
                      }}
                      onVisit={(r) => setVisitId(r.id)}
                    />
                  )}
                </Suspense>
              </>
            )}
            <footer className="app-footer">
              NỐT {APP_VERSION} · Trải nghiệm của riêng bạn
              <button className="text-button" onClick={() => setFormula(true)}>
                Cách chấm điểm
              </button>
            </footer>
          </div>
        </main>
        {doc && !(isForm && typing) && <AppNavigation value={tab} onChange={selectTab} />}
        {reconciliation && doc && (
          <PlaceReconciliation
            items={reviews}
            busy={store.busy}
            onClose={() => setReconciliation(false)}
            onEdit={(r) => {
              setReconciliation(false);
              edit(r);
            }}
            onConfirm={async (item) => {
              const ok = await store.update(
                (d) => ({
                  ...d,
                  reviews: d.reviews.map((r) =>
                    r.id === item.id
                      ? {
                          ...r,
                          ...THANH_HUONG_CANDIDATE,
                          name: r.name,
                          locationStatus: 'confirmed' as const,
                          locationSource: 'research' as const,
                          updatedAt: new Date().toISOString(),
                          placeResolution: {
                            ...r.placeResolution!,
                            status: 'verified' as const,
                            checkedAt: new Date().toISOString(),
                          },
                        }
                      : r,
                  ),
                }),
                'Xác nhận hồ sơ Maps Thanh Hương',
              );
              if (ok)
                setMessage(
                  'Đã đối chiếu địa điểm. Hãy chấm lại theo trải nghiệm của bạn trước khi dùng để gợi ý.',
                );
              return ok;
            }}
          />
        )}
        {message && (
          <div className="toast" role="status">
            <span>{message}</span>
            <button
              className="icon-button"
              aria-label="Đóng thông báo"
              onClick={() => setMessage('')}
            >
              ×
            </button>
          </div>
        )}
        {leaveTo && (
          <Dialog title="Rời phần đang nhập?" onClose={() => setLeaveTo(null)}>
            <div className="stack">
              <p>
                Đánh giá đang nhập chưa được lưu. Bạn có thể tiếp tục nhập hoặc bỏ bản nháp này.
              </p>
              <button className="button" onClick={() => setLeaveTo(null)}>
                Tiếp tục nhập
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  const target = leaveTo;
                  setDraft(null);
                  setDirty(false);
                  setLeaveTo(null);
                  navigate(target);
                }}
              >
                Bỏ bản nháp và rời màn hình
              </button>
            </div>
          </Dialog>
        )}
        {deleteItem && (
          <Dialog title="Xóa quán đã lưu?" onClose={() => setDeleteItem(null)}>
            <div className="stack">
              <p>
                Xóa <strong>{deleteItem.name}</strong> cùng lịch sử ghé khỏi danh sách. Một bản dự
                phòng được giữ trước khi xóa.
              </p>
              <button className="button danger" disabled={store.busy} onClick={() => void remove()}>
                Xóa quán này
              </button>
              <button className="button secondary" onClick={() => setDeleteItem(null)}>
                Giữ lại
              </button>
            </div>
          </Dialog>
        )}
        {demo && (
          <Dialog title="Quán minh họa" onClose={() => setDemo(false)}>
            <div className="stack">
              <p className="notice">
                Các điểm này giúp xem giao diện. Chúng không nằm trong thống kê hoặc vòng quay cá
                nhân. Hãy chấm lại theo trải nghiệm của bạn trước khi lưu.
              </p>
              {examples.map((r) => (
                <div key={r.id} className="panel stack">
                  <div className="split">
                    <h3>{r.name}</h3>
                    <strong>{r.totalScore.toFixed(1)}đ</strong>
                  </div>
                  <p className="small">
                    {r.priceK}k · {r.category === 'food' ? 'Quán ăn' : 'Quán nước'} · Minh họa
                  </p>
                  <div className="button-row">
                    <button
                      className="button secondary"
                      onClick={() =>
                        edit(demos.some((x) => x.id === r.id) ? r : { ...r, id: newId('review') })
                      }
                    >
                      Chấm lại theo trải nghiệm của tôi
                    </button>
                    {demos.some((x) => x.id === r.id) && (
                      <button
                        className="text-button danger-text"
                        onClick={() => {
                          setDemo(false);
                          setDeleteItem(r);
                        }}
                      >
                        Bỏ minh họa cũ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Dialog>
        )}
        {formula && (
          <Dialog title="Điểm để chọn quán theo gu của bạn" onClose={() => setFormula(false)}>
            <div className="stack">
              <p>
                Điểm tổng là trung bình có trọng số, làm tròn 2 chữ số. Sao hiển thị bằng điểm / 2,
                không phải đánh giá cộng đồng.
              </p>
              <div className="comparison-table">
                <table>
                  <thead>
                    <tr>
                      <th>Trải nghiệm</th>
                      <th>Trọng số</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>Nước mang đi</th>
                      <td>Vị 50% · Giá 25% · Lượng 20% · Ly 5%</td>
                    </tr>
                    <tr>
                      <th>Nước ngồi lại</th>
                      <td>Vị 35% · Không gian 20% · Giá 20% · Lượng 20% · Ly 5%</td>
                    </tr>
                    <tr>
                      <th>Ăn bình dân / vỉa hè</th>
                      <td>Ngon 40% · Chất lượng 25% · Sạch 15% · Giá 15% · Không gian 5%</td>
                    </tr>
                    <tr>
                      <th>Ăn quán / nhà hàng</th>
                      <td>Ngon 35% · Chất lượng 25% · Sạch 15% · Không gian 15% · Giá 10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="notice">
                Mốc ban đầu được giữ: Nốt 31k, vị 7, lượng ít, ly 9 → 6,5/10 khi mang đi.
              </p>
              <h3>Tần suất theo từng quán</h3>
              <p>
                ≤40k: 2 lần/tuần. Quán ăn &gt;40–80k: 1 lần/tuần; &gt;80k: 1 lần/tháng. Quán nước
                &gt;40–80k: tối đa 2 lần/chu kỳ tháng, gợi ý cách khoảng 2 tuần; &gt;80k: 2 lần/năm.
              </p>
              <p className="small muted">
                Tuần bắt đầu thứ Hai; tháng từ ngày 5; năm từ ngày 5/1. Mốc giờ Việt Nam. Lượt chỉ
                tính khi bạn ghi đã ghé. Vòng quay loại quán hết lượt, áp dụng bộ lọc hiện tại, ưu
                tiên điểm cao và số lượt gợi ý còn lại.
              </p>
              <h3>Giữ dữ liệu lâu dài</h3>
              <p className="small muted">
                Đánh giá, ảnh và tiền thực trả lưu trong trình duyệt trên thiết bị này. Chưa có đồng
                bộ giữa máy tính và điện thoại. Hãy xuất JSON định kỳ ở Thống kê; giữ file bên ngoài
                ứng dụng trước khi xóa dữ liệu Chrome hoặc đổi máy.
              </p>
            </div>
          </Dialog>
        )}
        <Suspense fallback={null}>
          {spin && (
            <SpinPicker
              items={filtered}
              summary={summary}
              theme={theme}
              now={now}
              onClose={() => setSpin(false)}
              onSelect={(r) => {
                setSelected(r.id);
                setSpin(false);
                navigate('places');
              }}
              onDirections={directions}
              onVisit={(r) => {
                setSpin(false);
                setVisitId(r.id);
              }}
            />
          )}
          {visitItem && (
            <VisitManager
              item={visitItem}
              now={now}
              busy={store.busy}
              onSave={saveVisit}
              onDelete={deleteVisit}
              onClose={() => setVisitId(null)}
            />
          )}
        </Suspense>
      </div>
    </MotionConfig>
  );
}
