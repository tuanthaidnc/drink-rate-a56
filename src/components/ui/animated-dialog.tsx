import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuietMotion } from '../motion/kinetic.tsx';
import * as Primitive from '@animate-ui/react/primitives/radix-ui/dialog';
import { X } from 'lucide-react';

/** Animate UI's animated Radix dialog, shared by every modal in NỐT. */
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const previous = useRef(document.activeElement as HTMLElement | null);
  const [open, setOpen] = useState(true);
  const quiet = useQuietMotion();
  const closing = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef(() => {});
  const close = useRef(onClose);
  close.current = onClose;
  request.current = () => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    timer.current = setTimeout(() => close.current(), quiet ? 0 : 300);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const Constructor = (
      window as unknown as { CloseWatcher?: new () => EventTarget & { destroy: () => void } }
    ).CloseWatcher;
    if (!Constructor) return;
    const watcher = new Constructor();
    const cancel = () => request.current();
    watcher.addEventListener('close', cancel);
    return () => watcher.destroy();
  }, []);
  return (
    <Primitive.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) request.current();
      }}
    >
      <Primitive.Portal>
        <Primitive.Overlay
          className="dialog-backdrop"
          transition={{ duration: quiet ? 0 : 0.25 }}
        />
        <Primitive.Content
          className={`not-dialog ${wide ? 'dialog-wide' : ''}`}
          aria-describedby={undefined}
          from="bottom"
          transition={{ duration: quiet ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (previous.current?.isConnected) previous.current.focus({ preventScroll: true });
          }}
        >
          <header className="dialog-header">
            <Primitive.Title>{title}</Primitive.Title>
            <button
              type="button"
              className="icon-button"
              aria-label={`Đóng ${title}`}
              onClick={() => request.current()}
            >
              <X />
            </button>
          </header>
          <div className="dialog-body">{children}</div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
