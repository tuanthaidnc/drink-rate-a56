import { useEffect, useRef, type ReactNode } from 'react';
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
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const Constructor = (
      window as unknown as { CloseWatcher?: new () => EventTarget & { destroy: () => void } }
    ).CloseWatcher;
    if (!Constructor) return;
    const watcher = new Constructor();
    const cancel = () => close.current();
    watcher.addEventListener('close', cancel);
    return () => watcher.destroy();
  }, []);
  return (
    <Primitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Primitive.Portal>
        <Primitive.Overlay className="dialog-backdrop" transition={{ duration: 0.16 }} />
        <Primitive.Content
          className={`not-dialog ${wide ? 'dialog-wide' : ''}`}
          aria-describedby={undefined}
          from="bottom"
          transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
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
              onClick={onClose}
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
