import { Store, Map, Plus, ChartColumn } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useQuietMotion } from './motion/kinetic.tsx';
import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationLabel,
} from '@animate-ui/react/primitives/bottom-navigation';
export type AppTab = 'places' | 'map' | 'review' | 'insights';
export const NAV_ITEMS = [
  { id: 'places', label: 'Quán xá', icon: Store },
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
  const quiet = useQuietMotion();
  const dock = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (desktop || !dock.current) return;
    const element = dock.current;
    const update = () =>
      document.documentElement.style.setProperty(
        '--not-dock-height',
        `${Math.ceil(element.getBoundingClientRect().height)}px`,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--not-dock-height');
    };
  }, [desktop]);
  return (
    <BottomNavigation
      ref={dock}
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
            data-nav-tab={id}
          >
            {value === id && (
              <motion.span
                className="nav-indicator"
                layoutId={desktop ? 'rail-active' : 'dock-active'}
                transition={{
                  type: 'spring',
                  stiffness: 360,
                  damping: 25,
                  duration: quiet ? 0 : undefined,
                }}
              />
            )}
            <span className="nav-icon" aria-hidden="true">
              <motion.span
                className="nav-glyph"
                animate={{
                  rotate: value === id && id === 'review' ? 90 : 0,
                  y: value === id && id !== 'review' ? -2 : 0,
                }}
                transition={
                  quiet ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 20 }
                }
              >
                <Icon />
              </motion.span>
            </span>
            <BottomNavigationLabel className="nav-label">{label}</BottomNavigationLabel>
          </button>
        </BottomNavigationItem>
      ))}
    </BottomNavigation>
  );
}
