import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  forwardRef,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useSpring,
  useTransform,
  type SpringOptions,
} from 'motion/react';

export const MotionPreference = createContext(false);
export const MotionActivity = createContext(true);
let systemQuery: MediaQueryList | undefined;
const motionListeners = new Set<() => void>();
const notifyMotion = () => motionListeners.forEach((notify) => notify());
let nativeReducedMotion = false;
export function setNativeReducedMotion(value: boolean) {
  nativeReducedMotion = value;
  notifyMotion();
}
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
    () => queryMotion().matches || nativeReducedMotion,
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
  const active = useContext(MotionActivity);
  const spring = useSpring(
    from ?? value,
    springOptions ?? { stiffness: 120, damping: 22, mass: 0.8 },
  );
  const display = useTransform(spring, (n) => n.toFixed(decimals));
  useEffect(() => {
    if (quiet) spring.jump(value);
    else if (active) spring.set(value);
  }, [spring, value, quiet, active]);
  return (
    <span className={className} data-motion="number">
      <motion.span aria-hidden="true">{display}</motion.span>
      <span className="sr-only">{value.toFixed(decimals)}</span>
    </span>
  );
}

// Adapted from motion-primitives transition-panel.tsx. Exiting screens are inert.
const Scene = forwardRef<HTMLDivElement, { children: ReactNode; direction: number; index: number }>(
  function Scene({ children, direction, index }, ref) {
    // usePresence registers a manual exit participant. It must not be used here:
    // motion.div owns completion, otherwise its parent leaves old screens mounted.
    const present = useIsPresent();
    const quiet = useQuietMotion();
    const [transitioning, setTransitioning] = useState(!quiet);
    return (
      <motion.div
        ref={ref}
        className="app-scene"
        data-motion="scene"
        data-screen-index={index}
        data-transitioning={transitioning && !quiet}
        onAnimationStart={() => setTransitioning(true)}
        onAnimationComplete={() => setTransitioning(false)}
        aria-hidden={!present}
        inert={!present || undefined}
        initial={quiet ? false : { opacity: 0.6, x: direction * 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: quiet ? 0 : direction * -8 }}
        transition={{ duration: quiet ? 0 : present ? 0.24 : 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    );
  },
);
export function TransitionPanel({
  activeIndex,
  children,
}: {
  activeIndex: number;
  children: ReactNode[];
}) {
  // Keep the same ownership tree when the motion preference changes so an
  // in-progress form never remounts. Waiting prevents two routes sharing a frame.
  const previous = useRef(activeIndex),
    direction = activeIndex >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = activeIndex;
  }, [activeIndex]);
  return (
    <div className="screen-stack">
      <AnimatePresence initial={false} mode="wait">
        <Scene key={activeIndex} index={activeIndex} direction={direction}>
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
  const active = useContext(MotionActivity);
  return (
    <span
      className={`score-dial ${className}`}
      style={{ width: size, height: size }}
      data-motion="dial"
    >
      <svg
        viewBox="0 0 120 120"
        width="120"
        height="120"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
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
          animate={{
            strokeDashoffset: quiet || active ? 1 - Math.min(10, Math.max(0, value)) / 10 : 1,
          }}
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
  const active = useContext(MotionActivity);
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
          animate={{ scaleX: quiet || active ? value / 10 : 0 }}
          transition={{ duration: quiet ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <strong>
        <AnimatedNumber value={value} decimals={Number.isInteger(value) ? 0 : 1} />
      </strong>
    </div>
  );
}
