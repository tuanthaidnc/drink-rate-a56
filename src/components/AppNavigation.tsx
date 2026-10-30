import { MapPin, Map, Plus, ChartColumn } from 'lucide-react';
import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationLabel,
} from '@animate-ui/react/primitives/bottom-navigation';
export type AppTab = 'places' | 'map' | 'review' | 'insights';
export const NAV_ITEMS = [
  { id: 'places', label: 'Quán xá', icon: MapPin },
  { id: 'map', label: 'Bản đồ', icon: Map },
  { id: 'review', label: 'Chấm điểm', icon: Plus },
  { id: 'insights', label: 'Thống kê', icon: ChartColumn },
] as const;
export default function AppNavigation({
  value,
  onChange,
  desktop = false,
}: {
  value: AppTab;
  onChange: (tab: AppTab) => void;
  desktop?: boolean;
}) {
  return (
    <BottomNavigation
      value={value}
      onValueChange={(v) => onChange(v as AppTab)}
      scrollBehavior="none"
      className={desktop ? 'desktop-nav' : 'bottom-dock'}
      aria-label={desktop ? 'Điều hướng máy tính' : 'Điều hướng chính'}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <BottomNavigationItem key={id} value={id} asChild>
          <button
            type="button"
            aria-current={value === id ? 'page' : undefined}
            data-active={value === id}
          >
            <Icon />
            <BottomNavigationLabel>{label}</BottomNavigationLabel>
          </button>
        </BottomNavigationItem>
      ))}
    </BottomNavigation>
  );
}
