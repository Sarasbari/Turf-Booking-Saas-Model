import { Toast } from '../Toast/Toast';
import type { Toast as ToastType } from '../../../hooks/useToast';
import styles from './ToastContainer.module.css';

interface ToastContainerProps {
    toasts: ToastType[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}
