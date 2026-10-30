import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Native dialog supplies inert background, focus containment and Escape support. */
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
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    // showModal uses the browser's close-request handling (Escape / Android back).
    // Do not add synthetic history entries: closing one dialog must not navigate the app.
    dialog.setAttribute('closedby', 'closerequest');
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className={`not-dialog ${wide ? 'dialog-wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-panel">
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label={`Đóng ${title}`}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}
