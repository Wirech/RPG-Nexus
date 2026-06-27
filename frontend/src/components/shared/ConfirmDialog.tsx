import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  resourceName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'text-red-500',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: 'text-yellow-500',
    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
  },
  default: {
    icon: 'text-accent',
    button: 'bg-accent hover:bg-accent/90 focus:ring-accent',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  resourceName,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-surface border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-start gap-4 p-6 pb-0">
            <div className={cn('p-2 rounded-full bg-surface', styles.icon)}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                {description}
                {resourceName && (
                  <span className="block mt-1 font-medium text-foreground">
                    "{resourceName}"
                  </span>
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50',
                styles.button
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processando...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
