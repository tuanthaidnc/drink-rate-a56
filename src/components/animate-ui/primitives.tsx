import * as React from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
  type SpringOptions,
  type Transition,
} from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ============================================================================
 * 1. ANIMATE-UI: CountingNumber (registry/primitives/texts/counting-number)
 * ========================================================================== */
export interface CountingNumberProps extends React.ComponentProps<'span'> {
  number: number;
  fromNumber?: number;
  decimalPlaces?: number;
  decimalSeparator?: string;
  transition?: SpringOptions;
}

export function CountingNumber({
  number,
  fromNumber = 0,
  decimalPlaces = 1,
  decimalSeparator = '.',
  transition = { stiffness: 180, damping: 24, mass: 0.8 },
  className,
  ...props
}: CountingNumberProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(fromNumber);
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
      className={cn('tabular-nums tracking-tight', className)}
      {...props}
    >
      {number.toFixed(decimalPlaces).replace('.', decimalSeparator)}
    </span>
  );
}

/* ============================================================================
 * 2. ANIMATE-UI: LiquidButton (registry/primitives/buttons/liquid)
 * ========================================================================== */
export type LiquidButtonProps = HTMLMotionProps<'button'> & {
  delay?: string;
  fillHeight?: string;
  hoverScale?: number;
  tapScale?: number;
};

export function LiquidButton({
  delay = '0.28s',
  fillHeight = '2px',
  hoverScale = 1.02,
  tapScale = 0.96,
  className,
  style,
  ...props
}: LiquidButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: tapScale }}
      whileHover={{
        scale: hoverScale,
        '--liquid-button-fill-width': '100%',
        '--liquid-button-fill-height': '100%',
        '--liquid-button-delay': delay,
        transition: {
          '--liquid-button-fill-width': { duration: 0 },
          '--liquid-button-fill-height': { duration: 0 },
          '--liquid-button-delay': { duration: 0 },
        },
      } as any}
      style={
        {
          '--liquid-button-fill-width': '-1%',
          '--liquid-button-fill-height': fillHeight,
          '--liquid-button-delay': '0s',
          background:
            'linear-gradient(var(--liquid-button-color, rgba(245,158,11,0.16)) 0 0) no-repeat calc(200% - var(--liquid-button-fill-width, -1%)) 100% / 200% var(--liquid-button-fill-height, 0.2em)',
          backgroundColor: 'var(--liquid-button-background-color, transparent)',
          transition: `background ${delay} var(--liquid-button-delay, 0s), color ${delay} ${delay}, background-position ${delay} calc(${delay} - var(--liquid-button-delay, 0s))`,
          ...style,
        } as React.CSSProperties
      }
      className={cn('relative overflow-hidden cursor-pointer select-none', className)}
      {...props}
    />
  );
}

/* ============================================================================
 * 3. ANIMATE-UI: RippleButton (registry/primitives/buttons/ripple)
 * ========================================================================== */
type Ripple = { id: number; x: number; y: number };

export type RippleButtonProps = HTMLMotionProps<'button'> & {
  hoverScale?: number;
  tapScale?: number;
  rippleColor?: string;
};

export function RippleButton({
  onClick,
  hoverScale = 1.01,
  tapScale = 0.97,
  rippleColor = 'rgba(255, 255, 255, 0.32)',
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
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const newRipple: Ripple = { id: Date.now() + Math.random(), x, y };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 620);
      }
      onClick?.(event);
    },
    [onClick]
  );

  return (
    <motion.button
      ref={buttonRef}
      data-slot="ripple-button"
      onClick={handleClick}
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={cn('cursor-pointer select-none', className)}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: 12, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
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
      ))}
    </motion.button>
  );
}

/* ============================================================================
 * 4. ANIMATE-UI: MotionHighlight Tabs & Segmented Control
 *    (registry/primitives/animate/tabs & effects/highlight)
 * ========================================================================== */
interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface MotionSegmentedProps<T extends string> {
  layoutId: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  itemClassName?: string;
  activeHighlightClassName?: string;
  transition?: Transition;
}

export function MotionSegmented<T extends string>({
  layoutId,
  options,
  value,
  onChange,
  className,
  itemClassName,
  activeHighlightClassName = 'bg-zinc-800 dark:bg-zinc-800 border border-white/10 shadow-sm',
  transition = { type: 'spring', stiffness: 360, damping: 30 },
}: MotionSegmentedProps<T>) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        'relative flex items-center p-1 rounded-2xl bg-zinc-900/90 border border-white/[0.07]',
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer select-none',
              isActive ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200',
              itemClassName
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                data-slot="tabs-highlight"
                transition={transition}
                className={cn('absolute inset-0 rounded-xl -z-10', activeHighlightClassName)}
              />
            )}
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <div className="flex flex-col items-center leading-tight">
              <span>{opt.label}</span>
              {opt.sublabel && (
                <span
                  className={cn(
                    'text-[10px] font-normal mt-0.5 transition-colors',
                    isActive ? 'text-zinc-300' : 'text-zinc-500'
                  )}
                >
                  {opt.sublabel}
                </span>
              )}
            </div>
            {opt.badge && <span className="ml-0.5">{opt.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 5. ANIMATE-UI: AnimatedProgress (registry/primitives/base/progress)
 * ========================================================================== */
interface AnimatedProgressProps {
  value: number; // 0 to 10
  max?: number;
  label: string;
  weightLabel?: string;
  displayValue: string;
  accentClass?: string;
}

export function AnimatedProgress({
  value,
  max = 10,
  label,
  weightLabel,
  displayValue,
  accentClass = 'bg-amber-500',
}: AnimatedProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1.5" data-slot="progress">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
          <span>{label}</span>
          {weightLabel && (
            <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-800/80 border border-white/[0.05]">
              {weightLabel}
            </span>
          )}
        </span>
        <span className="font-mono text-xs font-semibold text-zinc-200 tabular-nums">
          {displayValue}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800/90 overflow-hidden p-[1px]">
        <motion.div
          data-slot="progress-indicator"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          className={cn('h-full rounded-full', accentClass)}
        />
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. ANIMATE-UI: AutoHeight Collapse (registry/primitives/effects/auto-height)
 * ========================================================================== */
export function AutoHeight({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
          animate={{ height: 'auto', opacity: 1, filter: 'blur(0px)' }}
          exit={{ height: 0, opacity: 0, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
 * 7. ANIMATE-UI: Ambient Bubble Glow Background (registry/backgrounds/bubble)
 * ========================================================================== */
export function AmbientGlowBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        animate={{
          x: [0, 24, -16, 0],
          y: [0, -20, 14, 0],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-amber-500/[0.07] blur-[90px]"
      />
      <motion.div
        animate={{
          x: [0, -20, 18, 0],
          y: [0, 24, -12, 0],
          scale: [1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 -right-28 h-80 w-80 rounded-full bg-orange-500/[0.05] blur-[100px]"
      />
    </div>
  );
}
