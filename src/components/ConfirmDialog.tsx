import { useState, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
  cancelLabel?: string;
  showFeedback?: boolean;
  children?: ReactNode;
  onConfirm: (feedback?: string) => void;
  onCancel: () => void;
}

const variantClasses = {
  primary: 'bg-accent hover:bg-accent-hover text-white',
  success: 'bg-success hover:bg-green-600 text-white',
  danger: 'bg-danger hover:bg-red-600 text-white',
  warning: 'bg-warning hover:bg-amber-600 text-black',
};

export function ConfirmDialog({
  open, title, message, confirmLabel, confirmVariant = 'primary',
  cancelLabel = 'Cancel', showFeedback, children, onConfirm, onCancel,
}: Props) {
  const [feedback, setFeedback] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6" onClick={onCancel}>
      <div
        className="bg-bg-secondary border border-border rounded-xl w-full max-w-[420px] p-5 sm:p-6 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-3">{title}</h3>
        {message && <p className="text-sm text-text-secondary mb-4 leading-relaxed">{message}</p>}
        {children}
        {showFeedback && (
          <div className="mb-4">
            <label className="block text-xs text-text-muted mb-1.5 uppercase tracking-wide">Feedback (optional)</label>
            <input
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              placeholder="Enter feedback or reason..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>
        )}
        <div className="flex gap-2 justify-end mt-4">
          <button className="px-4 py-2 rounded-md text-sm border border-border text-text-muted hover:text-text-primary hover:border-text-muted" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${variantClasses[confirmVariant]}`}
            onClick={() => { onConfirm(feedback || undefined); setFeedback(''); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
