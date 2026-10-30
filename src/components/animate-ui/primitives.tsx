import * as React from 'react';
import { flushSync } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
  type SpringOptions,
} from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AppTheme = 'dark' | 'light';

/* ============================================================================
 * 1. ANIMATE-UI: ThemeToggler with Circular View Transition API & Status Bar Sync
 * ========================================================================== */
export function syncStatusBarThemeColor(nextTheme: AppTheme) {
  const statusColor = nextTheme === 'light' ? '#ffffff' : '#101823';
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.documentElement.style.colorScheme = nextTheme;

  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (metas.length > 0) {
    metas.forEach((m) => m.setAttribute('content', statusColor));
  } else {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.id = 'app-theme-color';
    meta.content = statusColor;
    document.head.appendChild(meta);
  }
}

export function applyThemeWithTransition(
  nextTheme: AppTheme,
  setThemeState: (t: AppTheme) => void,
  originEvent?: React.MouseEvent<HTMLElement>,
) {
  const applyDom = () => {
    syncStatusBarThemeColor(nextTheme);
    try {
      localStorage.setItem('not_app_theme_v8', nextTheme);
    } catch {
      /* Theme remains usable if optional preferences cannot be persisted. */
    }
    setThemeState(nextTheme);
  };

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> };
  };

  if (
    !doc.startViewTransition ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.reducedMotion === 'true'
  ) {
    applyDom();
    return;
  }

  const x = originEvent ? originEvent.clientX : window.innerWidth - 40;
  const y = originEvent ? originEvent.clientY : 28;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = doc.startViewTransition(() => {
    flushSync(() => {
      applyDom();
    });
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {});
}

/* ============================================================================
 * 2. ANIMATE-UI: Shine & Interactive Spotlight Glare Effect
 * ========================================================================== */
export interface ShineProps extends React.ComponentProps<'div'> {
  color?: string;
  opacity?: number;
  duration?: number;
  deg?: number;
  enableOnTap?: boolean;
  enableOnHover?: boolean;
}

export function Shine({
  color = 'rgba(16, 185, 129, 0.35)',
  opacity = 0.28,
  duration = 760,
  deg = -18,
  enableOnTap = true,
  enableOnHover = true,
  children,
  className,
  style,
  onPointerDown,
  onMouseEnter,
  ...props
}: ShineProps) {
  const [shineKey, setShineKey] = React.useState(0);
  const [glarePos, setGlarePos] = React.useState<{ x: number; y: number } | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const triggerShine = (clientX?: number, clientY?: number) => {
    setShineKey((k) => k + 1);
    if (boxRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = boxRef.current.getBoundingClientRect();
      setGlarePos({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  return (
    <div
      ref={boxRef}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
      onPointerDown={(e) => {
        if (enableOnTap) triggerShine(e.clientX, e.clientY);
        onPointerDown?.(e);
      }}
      onMouseEnter={(e) => {
        if (enableOnHover) triggerShine(e.clientX, e.clientY);
        onMouseEnter?.(e);
      }}
      {...props}
    >
      {children}
      {shineKey > 0 && (
        <>
          <motion.div
            key={`sweep-${shineKey}`}
            initial={{ x: '-115%', skewX: deg }}
            animate={{ x: '120%', skewX: deg }}
            transition={{ duration: duration / 1000, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              background: `linear-gradient(to right, transparent, ${color}, transparent)`,
              opacity,
            }}
          />
          {glarePos && (
            <motion.div
              key={`glare-${shineKey}`}
              initial={{ opacity: 0.45, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.9 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: glarePos.x - 85,
                top: glarePos.y - 85,
                width: 170,
                height: 170,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9,
                background:
                  'radial-gradient(circle, rgba(16,185,129,0.28) 0%, rgba(6,182,212,0.12) 45%, transparent 72%)',
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================================
 * 3. ANIMATE-UI: MotionEffect (Spring Blur + Slide + Scale Entrance)
 * ========================================================================== */
export interface MotionEffectProps extends HTMLMotionProps<'div'> {
  delay?: number;
  slideOffset?: number;
  blurAmount?: string;
}

export function MotionEffect({
  delay = 0,
  slideOffset = 10,
  blurAmount = '4px',
  children,
  ...props
}: MotionEffectProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: slideOffset,
        scale: 0.98,
        filter: `blur(${blurAmount})`,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 28,
        mass: 0.7,
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
 * 4. ANIMATE-UI: CountingNumber with Elastic Spring Physics
 * ========================================================================== */
export interface CountingNumberProps extends React.ComponentProps<'span'> {
  number: number;
  decimalPlaces?: number;
  decimalSeparator?: string;
  transition?: SpringOptions;
}

export function CountingNumber({
  number,
  decimalPlaces = 1,
  decimalSeparator = '.',
  transition = { stiffness: 280, damping: 24, mass: 0.6 },
  className,
  ...props
}: CountingNumberProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(number);
  const springVal = useSpring(motionVal, transition);

  React.useEffect(() => {
    motionVal.set(number);
  }, [number, motionVal]);

  React.useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      if (localRef.current) {
        const formatted =
          decimalPlaces > 0
            ? latest.toFixed(decimalPlaces).replace('.', decimalSeparator)
            : Math.round(latest).toString();
        localRef.current.textContent = formatted;
      }
    });
    return () => unsubscribe();
  }, [springVal, decimalPlaces, decimalSeparator]);

  return (
    <span
      ref={localRef}
      data-slot="counting-number"
      className={cn('tabular-nums tracking-tight inline-block', className)}
      {...props}
    >
      {number.toFixed(decimalPlaces).replace('.', decimalSeparator)}
    </span>
  );
}

/* ============================================================================
 * 5A. ENTERTAINING INTERACTIVE DRINK CUP (Boba Pearls + Floating Ice + Shake!)
 * ========================================================================== */
export function LiquidScoreCup({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const [shakeKey, setShakeKey] = React.useState(0);
  const pct = Math.min(96, Math.max(16, (score / 10) * 100));
  const dims = size === 'sm' ? 'w-10 h-11 rounded-xl' : 'w-12 h-14 rounded-2xl';

  React.useEffect(() => {
    setShakeKey((k) => k + 1);
  }, [Math.round(score * 2)]);

  return (
    <motion.div
      key={shakeKey}
      onClick={(e) => {
        e.stopPropagation();
        setShakeKey((k) => k + 1);
      }}
      animate={{
        rotate: [0, -7, 7, -4, 4, 0],
        scale: [1, 1.08, 0.96, 1.02, 1],
      }}
      transition={{ duration: 0.48, ease: 'easeInOut' }}
      whileTap={{ scale: 0.88, rotate: -12 }}
      className={cn(
        'relative overflow-hidden shrink-0 border-2 border-[var(--border-active)] bg-[#07111e] shadow-md flex items-center justify-center select-none cursor-pointer',
        dims,
      )}
      title="Chạm để lắc ly nước!"
    >
      <motion.div
        initial={false}
        animate={{ height: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 190, damping: 18 }}
        className="absolute bottom-0 inset-x-0"
        style={{
          background:
            score >= 7.5
              ? 'linear-gradient(180deg, #34d399 0%, #10b981 55%, #059669 100%)'
              : score >= 6.0
                ? 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 55%, #0891b2 100%)'
                : 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)',
        }}
      >
        <svg
          viewBox="0 0 120 14"
          preserveAspectRatio="none"
          className="absolute -top-2.5 left-0 w-[200%] h-3 animate-liquid-wave"
        >
          <path
            d="M0,7 C15,14 45,0 60,7 C75,14 105,0 120,7 L120,14 L0,14 Z"
            fill={score >= 7.5 ? '#6ee7b7' : score >= 6.0 ? '#67e8f9' : '#fde68a'}
          />
        </svg>
        <svg
          viewBox="0 0 120 14"
          preserveAspectRatio="none"
          className="absolute -top-2 left-0 w-[200%] h-2.5 animate-liquid-wave-reverse opacity-70"
        >
          <path
            d="M0,7 C20,0 40,14 60,7 C80,0 100,14 120,7 L120,14 L0,14 Z"
            fill="rgba(255, 255, 255, 0.75)"
          />
        </svg>

        <motion.div
          animate={{ y: [-1, 2, -1], rotate: [-8, 10, -8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0.5 left-1.5 w-2.5 h-2 rounded-[3px] bg-white/75 border border-white/90 shadow-xs"
        />

        <div className="absolute bottom-1 inset-x-1.5 flex items-center justify-around opacity-85">
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
            className="w-1.5 h-1.5 rounded-full bg-[#042f2e]"
          />
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 rounded-full bg-[#042f2e]"
          />
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
            className="w-1.5 h-1.5 rounded-full bg-[#042f2e]"
          />
        </div>

        <motion.span
          animate={{ y: [14, -20], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-white"
        />
        <motion.span
          animate={{ y: [16, -24], opacity: [0, 0.85, 0] }}
          transition={{
            duration: 2.3,
            repeat: Infinity,
            delay: 0.6,
            ease: 'easeOut',
          }}
          className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-white/90"
        />
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            'inset 0 1.5px 1px rgba(255,255,255,0.45), inset 2px 0 3px rgba(255,255,255,0.18)',
        }}
      />
      <span className="relative z-10 font-mono text-[10px] font-extrabold text-[#042f2e] bg-white/85 px-1 py-0.2 rounded shadow-xs">
        {Math.round((score / 10) * 100)}%
      </span>
    </motion.div>
  );
}

/* ============================================================================
 * 5B. ENTERTAINING INTERACTIVE FOOD BOWL (Steaming Noodles + Chopsticks Toss!)
 * ========================================================================== */
export function SteamingFoodBowl({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const [tossKey, setTossKey] = React.useState(0);
  const pct = Math.min(92, Math.max(24, (score / 10) * 95));
  const dims = size === 'sm' ? 'w-10 h-11 rounded-xl' : 'w-12 h-14 rounded-2xl';

  React.useEffect(() => {
    setTossKey((k) => k + 1);
  }, [Math.round(score * 2)]);

  return (
    <motion.div
      key={tossKey}
      onClick={(e) => {
        e.stopPropagation();
        setTossKey((k) => k + 1);
      }}
      animate={{
        y: [0, -3, 1, 0],
        rotate: [0, -5, 5, -2, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{ duration: 0.48, ease: 'easeInOut' }}
      whileTap={{ scale: 0.88, rotate: 10 }}
      className={cn(
        'relative overflow-hidden shrink-0 border-2 border-[#f97316]/75 bg-[#160d08] shadow-md flex items-center justify-center select-none cursor-pointer',
        dims,
      )}
      title="Chạm để trộn tô đồ ăn!"
    >
      {/* Rising Savory Broth & Noodle Level */}
      <motion.div
        initial={false}
        animate={{ height: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 190, damping: 18 }}
        className="absolute bottom-0 inset-x-0"
        style={{
          background:
            score >= 7.5
              ? 'linear-gradient(180deg, #fb923c 0%, #f97316 55%, #c2410c 100%)'
              : score >= 6.0
                ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 55%, #b45309 100%)'
                : 'linear-gradient(180deg, #94a3b8 0%, #64748b 60%, #475569 100%)',
        }}
      >
        {/* Golden Noodle Wave Surface */}
        <svg
          viewBox="0 0 120 14"
          preserveAspectRatio="none"
          className="absolute -top-2.5 left-0 w-[200%] h-3 animate-liquid-wave"
        >
          <path d="M0,7 C15,14 45,0 60,7 C75,14 105,0 120,7 L120,14 L0,14 Z" fill="#fde68a" />
        </svg>

        {/* Floating Soft-Boiled Egg & Scallion Herb Toppings */}
        <motion.div
          animate={{ y: [-1, 1.5, -1], rotate: [-6, 8, -6] }}
          transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0.5 left-1.5 w-2.5 h-2 rounded-full bg-white border border-amber-300 flex items-center justify-center"
        >
          <span className="w-1 h-1 rounded-full bg-orange-500" />
        </motion.div>
        <motion.div
          animate={{ y: [1, -1.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
      </motion.div>

      {/* Rising Hot Aroma Steam Plumes */}
      <div className="pointer-events-none absolute top-1 inset-x-2 flex justify-around">
        <motion.span
          animate={{ y: [4, -6], opacity: [0, 0.85, 0], scaleX: [0.8, 1.2, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          className="w-0.5 h-2.5 rounded-full bg-orange-200/80"
        />
        <motion.span
          animate={{ y: [5, -7], opacity: [0, 0.9, 0], scaleX: [1, 0.8, 1.1] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: 0.4,
            ease: 'easeOut',
          }}
          className="w-0.5 h-3 rounded-full bg-amber-100/90"
        />
        <motion.span
          animate={{ y: [4, -6], opacity: [0, 0.75, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: 0.8,
            ease: 'easeOut',
          }}
          className="w-0.5 h-2 rounded-full bg-orange-200/80"
        />
      </div>

      {/* Bowl Rim & Score Percentage Badge */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            'inset 0 1.5px 1px rgba(255,255,255,0.4), inset 2px 0 3px rgba(255,255,255,0.14)',
        }}
      />
      <span className="relative z-10 font-mono text-[10px] font-extrabold text-[#431407] bg-amber-50/92 px-1 py-0.2 rounded shadow-xs">
        {Math.round((score / 10) * 100)}%
      </span>
    </motion.div>
  );
}

export function CategoryScoreBadge({
  category,
  score,
  size = 'md',
}: {
  category: 'drink' | 'food';
  score: number;
  size?: 'sm' | 'md';
}) {
  if (category === 'food') {
    return <SteamingFoodBowl score={score} size={size} />;
  }
  return <LiquidScoreCup score={score} size={size} />;
}

/* ============================================================================
 * 5C. ANIMATED STAR RATING BADGE (1.0 ★ - 5.0 ★)
 * ========================================================================== */
export function scoreToStars(score10: number): number {
  return Math.round((score10 / 2) * 10) / 10;
}

export function StarRatingBadge({
  score10,
  showFiveScale = false,
  className,
}: {
  score10: number;
  showFiveScale?: boolean;
  className?: string;
}) {
  const stars = scoreToStars(score10);
  const fullStars = Math.floor(stars);
  const hasHalf = stars - fullStars >= 0.4;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-amber-400 font-mono text-[11px] font-bold',
        className,
      )}
    >
      <div className="flex items-center gap-0.2 text-[11px] leading-none">
        {Array.from({ length: 5 }, (_, i) => {
          const active = i < fullStars || (i === fullStars && hasHalf);
          return (
            <span
              key={i}
              className={cn(
                'transition-transform',
                active ? 'text-[#fbbf24]' : 'text-slate-500/40',
              )}
            >
              ★
            </span>
          );
        })}
      </div>
      <span className="text-[var(--text-primary)] font-extrabold">{stars.toFixed(1)}</span>
      {showFiveScale && <span className="text-[9px] text-[var(--text-muted)]">/5</span>}
    </div>
  );
}

/* ============================================================================
 * 6. ANIMATE-UI: LiquidButton
 * ========================================================================== */
export type LiquidButtonProps = HTMLMotionProps<'button'> & {
  delay?: string;
  fillHeight?: string;
  tapScale?: number;
};

export function LiquidButton({
  delay = '0.25s',
  fillHeight = '2px',
  tapScale = 0.92,
  className,
  style,
  children,
  ...props
}: LiquidButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: tapScale, rotate: -4 }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      style={
        {
          '--liquid-button-fill-width': '-1%',
          '--liquid-button-fill-height': fillHeight,
          '--liquid-button-delay': '0s',
          background:
            'linear-gradient(var(--accent-soft) 0 0) no-repeat calc(200% - var(--liquid-button-fill-width, -1%)) 100% / 200% var(--liquid-button-fill-height, 0.2em)',
          transition: `background ${delay} var(--liquid-button-delay, 0s), color ${delay} ${delay}, background-position ${delay} calc(${delay} - var(--liquid-button-delay, 0s))`,
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        'relative overflow-hidden cursor-pointer select-none theme-surface-elevated',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ============================================================================
 * 7. ANIMATE-UI: RippleButton + Explosive Fizzy Particle Burst!
 * ========================================================================== */
type Ripple = {
  id: number;
  x: number;
  y: number;
  particles: { angle: number; dist: number; size: number; color: string }[];
};

export type RippleButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: React.ReactNode;
  tapScale?: number;
  rippleColor?: string;
};

const PARTICLE_COLORS = ['#34d399', '#22d3ee', '#a7f3d0', '#ffffff', '#fbbf24'];

export function RippleButton({
  onClick,
  tapScale = 0.94,
  rippleColor = 'rgba(255, 255, 255, 0.38)',
  children,
  className,
  style,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (button) {
        const rect = button.getBoundingClientRect();
        const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
        const y = event.clientY ? event.clientY - rect.top : rect.height / 2;
        const particles = Array.from({ length: 8 }, (_, i) => ({
          angle: (i * Math.PI * 2) / 8 + (Math.random() * 0.4 - 0.2),
          dist: 24 + Math.random() * 26,
          size: 4 + Math.random() * 3,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        }));
        const newRipple: Ripple = {
          id: Date.now() + Math.random(),
          x,
          y,
          particles,
        };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 680);
      }
      onClick?.(event);
    },
    [onClick],
  );

  return (
    <motion.button
      ref={buttonRef}
      data-slot="ripple-button"
      onClick={handleClick}
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 440, damping: 22 }}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={cn('cursor-pointer select-none', className)}
      {...props}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <React.Fragment key={ripple.id}>
            <motion.span
              initial={{ scale: 0, opacity: 0.55 }}
              animate={{ scale: 14, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.58, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                pointerEvents: 'none',
                width: '20px',
                height: '20px',
                backgroundColor: rippleColor,
                top: ripple.y - 10,
                left: ripple.x - 10,
              }}
            />
            {ripple.particles.map((p, idx) => (
              <motion.span
                key={idx}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.dist,
                  y: Math.sin(p.angle) * p.dist,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.52, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: ripple.x,
                  top: ripple.y,
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  pointerEvents: 'none',
                  zIndex: 20,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </motion.button>
  );
}

/* ============================================================================
 * 8. ANIMATE-UI: MotionSegmented Control (Elastic Pill + Bounce)
 * ========================================================================== */
interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface MotionSegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
}

export function MotionSegmented<T extends string>({
  options,
  value,
  onChange,
  className,
  itemClassName,
}: MotionSegmentedProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const count = options.length;

  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        'relative grid p-1 rounded-2xl theme-surface-elevated overflow-hidden',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 8px) / ${count})`,
          transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
          background: 'var(--bg-pill)',
          border: '1.5px solid var(--border-active)',
          boxShadow: 'var(--card-inset)',
        }}
      />

      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="tab"
            whileTap={{ scale: 0.95 }}
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-xs font-medium transition-colors duration-200 cursor-pointer select-none overflow-hidden text-center',
              isActive
                ? 'text-[var(--text-primary)] font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              itemClassName,
            )}
          >
            <div className="flex items-center justify-center gap-1 leading-snug">
              {opt.icon && (
                <motion.span
                  animate={isActive ? { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="shrink-0"
                >
                  {opt.icon}
                </motion.span>
              )}
              <span className="whitespace-nowrap">{opt.label}</span>
            </div>
            {opt.badge && <div className="mt-0.5 leading-tight whitespace-nowrap">{opt.badge}</div>}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 9. ANIMATE-UI: AnimatedProgress (Shimmering Spring Bar)
 * ========================================================================== */
interface AnimatedProgressProps {
  value: number;
  max?: number;
  label: string;
  weightLabel?: string;
  displayValue: string;
  isHighlight?: boolean;
}

export function AnimatedProgress({
  value,
  max = 10,
  label,
  weightLabel,
  displayValue,
  isHighlight = false,
}: AnimatedProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1.5" data-slot="progress">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
          <span>{label}</span>
          {weightLabel && (
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{weightLabel}</span>
          )}
        </span>
        <span className="font-mono text-xs font-bold text-[var(--text-primary)] tabular-nums">
          {displayValue}
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full overflow-hidden p-0.5"
        style={{ background: 'var(--slider-track)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="h-full rounded-full relative overflow-hidden"
          style={{
            background: isHighlight
              ? 'linear-gradient(90deg, var(--accent), var(--accent-secondary))'
              : 'var(--text-secondary)',
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * 10. ANIMATE-UI: AutoHeight Collapse (Zero Layout Jump & Zero Thumb Clipping)
 * ========================================================================== */
export function AutoHeight({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div hidden={!isOpen} inert={!isOpen} className={cn('collapse-grid', isOpen && 'is-open')}>
      <div className="collapse-inner">{children}</div>
    </div>
  );
}

/* ============================================================================
 * 11. AMBIENT BACKGROUND GLOW (DARK & LIGHT)
 * ========================================================================== */
export function AmbientGlowBackground({ theme }: { theme: AppTheme }) {
  if (theme === 'light') {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[420px] rounded-full bg-[#10b981]/10 blur-[100px]" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 h-72 w-[420px] rounded-full bg-[#10b981]/[0.08] blur-[110px]" />
    </div>
  );
}
