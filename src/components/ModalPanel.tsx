import type { PropsWithChildren } from "react";

interface ModalPanelProps extends PropsWithChildren {
  description?: string;
  onClose: () => void;
  title: string;
}

export function ModalPanel({
  children,
  description,
  onClose,
  title
}: ModalPanelProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-label={title}
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <div className="modal-panel__header">
          <div>
            <p className="section-eyebrow">Editor</p>
            <h2>{title}</h2>
            {description ? <p className="modal-panel__lede">{description}</p> : null}
          </div>
          <button
            aria-label={`Close ${title}`}
            className="button button--ghost"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
      </section>
    </div>
  );
}
