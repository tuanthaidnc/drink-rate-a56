import { normalizeSearch, type ReviewDocument, type ReviewItem } from './models.ts';
export const PLACE_CORRECTIONS_VERSION = 1;
export const NOT_MAP_SOURCE = 'https://maps.app.goo.gl/TSXSAzECjtmbwCVC9';
export const NOT_PLACE = {
  officialName: 'Nốt Tea',
  address: '38',
  street: 'Phan Thanh',
  ward: 'Thanh Khê',
  city: 'Đà Nẵng',
  provinceCode: '48',
  wardCode: '20209',
  lat: 16.06528,
  lng: 108.2083,
};
export const THANH_HUONG_CANDIDATE = {
  officialName: 'Quán Bánh Canh Thanh Hương',
  address: '227',
  street: 'Trần Phú',
  ward: 'Hải Châu',
  city: 'Đà Nẵng',
  provinceCode: '48',
  wardCode: '20242',
  lat: 16.0631907,
  lng: 108.2234641,
  sourceUrl:
    'https://www.google.com/maps/search/?api=1&query=Qu%C3%A1n+B%C3%A1nh+Canh+Thanh+H%C6%B0%C6%A1ng&query_place_id=ChIJ07QGJs0ZQjERgw29Fx9idN0',
};
export function isRetiredBepTrangSample(r: ReviewItem) {
  return (
    r.id === 'seed-food-mi-quang-hai-chau' &&
    r.isDemo &&
    r.visitLog.length === 0 &&
    r.photoIds.length === 0 &&
    r.ratingHistory.length === 0
  );
}
export function isUnresolvedThanhHuong(r: ReviewItem) {
  return r.id === 'seed-food-banh-canh-phan-thanh' && r.isDemo && !r.placeResolution;
}
function isNot(r: ReviewItem) {
  return (
    r.category === 'drink' &&
    ['not', 'not tea'].includes(normalizeSearch(r.name)) &&
    normalizeSearch(r.city) === 'da nang' &&
    normalizeSearch(r.street).replace(/^duong\s+/, '') === 'phan thanh'
  );
}
function needsNotRemap(r: ReviewItem, doc: ReviewDocument) {
  return (
    isNot(r) &&
    !r.placeResolution &&
    (r.locationSource === 'legacy' ||
      (r.id === 'seed-not-phan-thanh-dn' &&
        doc.settings.placeCorrectionsVersion !== PLACE_CORRECTIONS_VERSION))
  );
}
export function applyPlaceCorrections(doc: ReviewDocument, now = new Date()): ReviewDocument {
  const date = now.toISOString();
  return {
    ...doc,
    settings: { ...doc.settings, placeCorrectionsVersion: PLACE_CORRECTIONS_VERSION },
    reviews: doc.reviews
      .filter((r) => !isRetiredBepTrangSample(r))
      .map((r) => {
        if (needsNotRemap(r, doc)) {
          const preservePin =
            r.locationStatus === 'confirmed' && ['manual', 'gps'].includes(r.locationSource ?? '');
          return {
            ...r,
            name: r.name === 'Nốt' ? 'Nốt Tea' : r.name,
            address: NOT_PLACE.address,
            street: NOT_PLACE.street,
            city: NOT_PLACE.city,
            ward: NOT_PLACE.ward,
            provinceCode: NOT_PLACE.provinceCode,
            wardCode: NOT_PLACE.wardCode,
            ...(!preservePin
              ? {
                  lat: NOT_PLACE.lat,
                  lng: NOT_PLACE.lng,
                  locationStatus: 'confirmed' as const,
                  locationSource: 'research' as const,
                  accuracyM: undefined,
                }
              : {}),
            updatedAt: date,
            placeResolution: {
              status: 'verified' as const,
              officialName: NOT_PLACE.officialName,
              sourceUrl: NOT_MAP_SOURCE,
              checkedAt: date,
              originalAddress: [r.address, r.street, r.ward, r.city].filter(Boolean).join(', '),
            },
          };
        }
        if (isUnresolvedThanhHuong(r))
          return {
            ...r,
            street: '',
            ward: '',
            address: undefined,
            wardCode: undefined,
            lat: null,
            lng: null,
            locationStatus: 'missing' as const,
            updatedAt: date,
            placeResolution: {
              status: 'candidate' as const,
              officialName: THANH_HUONG_CANDIDATE.officialName,
              sourceUrl: THANH_HUONG_CANDIDATE.sourceUrl,
              checkedAt: date,
              originalAddress: [r.address, r.street, r.ward, r.city].filter(Boolean).join(', '),
            },
          };
        return r;
      }),
  };
}
export function needsPlaceCorrections(doc: ReviewDocument) {
  return (
    doc.settings.placeCorrectionsVersion !== PLACE_CORRECTIONS_VERSION ||
    doc.reviews.some(
      (r) => isRetiredBepTrangSample(r) || isUnresolvedThanhHuong(r) || needsNotRemap(r, doc),
    )
  );
}
