import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  forwardRef,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  motion,
  useIsPresent,
  usePresence,
  useSpring,
  useTransform,
  type SpringOptions,
} from 'motion/react';

export const MotionPreference = createContext(false);
let systemQuery: MediaQueryList | undefined;
const motionListeners = new Set<() => void>();
const notifyMotion = () => motionListeners.forEach((notify) => notify());
function queryMotion() {
  return (systemQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)'));
}
function subscribeMotion(notify: () => void) {
  motionListeners.add(notify);
  if (motionListeners.size === 1) queryMotion().addEventListener('change', notifyMotion);
  return () => {
    motionListeners.delete(notify);
    if (!motionListeners.size) queryMotion().removeEventListener('change', notifyMotion);
  };
}
export function useSystemReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => queryMotion().matches,
    () => false,
  );
}
export function useQuietMotion() {
  const preference = useContext(MotionPreference),
    system = useSystemReducedMotion();
  return preference || system;
}

// Adapted from ibelick/motion-primitives animated-number.tsx at 120f64f6.
// MIT, see public/licenses/motion-primitives.txt. Decimal precision and accessible final value added.
export function AnimatedNumber({
  value,
  decimals = 1,
  className,
  from,
  springOptions,
}: {
  value: number;
  decimals?: number;
  className?: string;
  from?: number;
  springOptions?: SpringOptions;
}) {
  const quiet = useQuietMotion();
  const spring = useSpring(
    from ?? value,
    springOptions ?? { stiffness: 120, damping: 22, mass: 0.8 },
  );
  const display = useTransform(spring, (n) => n.toFixed(decimals));
  useEffect(() => {
    if (quiet) spring.jump(value);
    else spring.set(value);
  }, [spring, value, quiet]);
  return (
    <span className={className} data-motion="number">
      <motion.span aria-hidden="true">{display}</motion.span>
      <span className="sr-only">{value.toFixed(decimals)}</span>
    </span>
  );
}

// Adapted from motion-primitives transition-panel.tsx. Exiting screens are inert.
const Scene = forwardRef<HTMLDivElement, { children: ReactNode; direction: number }>(function Scene(
  { children, direction },
  ref,
) {
  const [present, safeToRemove] = usePresence();
  const quiet = useQuietMotion();
  useEffect(() => {
    if (!present && quiet) safeToRemove?.();
  }, [present, quiet, safeToRemove]);
  return (
    <motion.div
      ref={ref}
      className="app-scene"
      data-motion="scene"
      aria-hidden={!present}
      inert={!present || undefined}
      initial={quiet ? false : { opacity: 0, x: direction * 36, y: 8, filter: 'blur(5px)' }}
      animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      exit={quiet ? { opacity: 0 } : { opacity: 0, x: direction * -24, y: -6, filter: 'blur(4px)' }}
      transition={{ duration: quiet ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
});
export function TransitionPanel({
  activeIndex,
  children,
}: {
  activeIndex: number;
  children: ReactNode[];
}) {
  const quiet = useQuietMotion();
  // Freeze the wrapper for the lifetime of a route. Changing the preference
  // must never reparent/remount the form that owns an unsaved draft.
  const mode = useRef({ index: activeIndex, animated: !quiet });
  if (mode.current.index !== activeIndex) mode.current = { index: activeIndex, animated: !quiet };
  const previous = useRef(activeIndex),
    direction = activeIndex >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = activeIndex;
  }, [activeIndex]);
  if (!mode.current.animated)
    return (
      <div className="screen-stack">
        <Scene key={activeIndex} direction={direction}>
          {children[activeIndex]}
        </Scene>
      </div>
    );
  return (
    <div className="screen-stack">
      <AnimatePresence initial={false} mode="popLayout">
        <Scene key={activeIndex} direction={direction}>
          {children[activeIndex]}
        </Scene>
      </AnimatePresence>
    </div>
  );
}

export function ScoreDial({
  value,
  decimals = 1,
  className = '',
  size = 116,
}: {
  value: number;
  decimals?: number;
  className?: string;
  size?: number;
}) {
  const quiet = useQuietMotion();
  return (
    <span
      className={`score-dial ${className}`}
      style={{ width: size, height: size }}
      data-motion="dial"
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="dial-track" cx="60" cy="60" r="54" />
        <motion.circle
          className="dial-fill"
          cx="60"
          cy="60"
          r="54"
          pathLength="1"
          strokeDasharray="1"
          transform="rotate(-90 60 60)"
          initial={quiet ? false : { strokeDashoffset: 1 }}
          animate={{ strokeDashoffset: 1 - Math.min(10, Math.max(0, value)) / 10 }}
          transition={{ duration: quiet ? 0 : 0.95, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="dial-value">
        <AnimatedNumber value={value} decimals={decimals} from={quiet ? value : 0} />
        <small>/10</small>
      </span>
    </span>
  );
}

export function CriterionBar({ label, value }: { label: string; value: number }) {
  const quiet = useQuietMotion();
  return (
    <div className="criterion">
      <span className="criterion-label">{label}</span>
      <span
        className="criterion-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
      >
        <motion.span
          initial={quiet ? false : { scaleX: 0 }}
          animate={{ scaleX: value / 10 }}
          transition={{ duration: quiet ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <strong>
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </strong>
    </div>
  );
}
