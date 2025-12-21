import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { XIcon } from '../icons';

// Size variants for the modal
const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[95vw]',
} as const;

export interface BaseModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
    /** Size variant of the modal */
    size?: keyof typeof sizeClasses;
    /** Modal content */
    children: React.ReactNode;
    /** Additional classes for the modal container */
    className?: string;
    /** Whether clicking on the overlay closes the modal (default: true) */
    closeOnOverlayClick?: boolean;
    /** Whether pressing ESC closes the modal (default: true) */
    closeOnEsc?: boolean;
    /** Whether to show the close button in the header (default: true) */
    showCloseButton?: boolean;
}

// Animation variants
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { opacity: 0, scale: 0.95, y: 20 },
};

/**
 * BaseModal - A reusable modal component with consistent styling and animations
 * 
 * Features:
 * - Framer Motion animations for smooth enter/exit
 * - ESC key to close
 * - Click outside to close
 * - Focus trap for accessibility
 * - Portal rendering for proper z-index stacking
 * - Responsive sizes
 */
export const BaseModal: React.FC<BaseModalProps> = ({
    isOpen,
    onClose,
    size = 'lg',
    children,
    className = '',
    closeOnOverlayClick = true,
    closeOnEsc = true,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<Element | null>(null);

    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (closeOnEsc && e.key === 'Escape') {
            onClose();
        }
    }, [closeOnEsc, onClose]);

    // Lock body scroll and manage focus when modal opens
    useEffect(() => {
        if (isOpen) {
            // Store the previously focused element
            previousActiveElement.current = document.activeElement;

            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Add ESC listener
            document.addEventListener('keydown', handleKeyDown);

            // Focus the modal
            setTimeout(() => {
                modalRef.current?.focus();
            }, 50);
        } else {
            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus to previous element
            if (previousActiveElement.current instanceof HTMLElement) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Don't render anything if not open (AnimatePresence handles exit animation)
    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={overlayVariants}
                    onClick={handleOverlayClick}
                >
                    {/* Overlay backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal container */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        tabIndex={-1}
                        className={`
              relative w-full ${sizeClasses[size]}
              bg-card rounded-2xl border border-border shadow-2xl
              my-auto max-h-[95vh] flex flex-col
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
              ${className}
            `}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

// ============================================
// Sub-components for structured modal content
// ============================================

interface ModalHeaderProps {
    children: React.ReactNode;
    onClose?: () => void;
    showCloseButton?: boolean;
    className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
    children,
    onClose,
    showCloseButton = true,
    className = '',
}) => (
    <header className={`p-4 sm:p-6 border-b border-border flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
            {children}
        </div>
        {showCloseButton && onClose && (
            <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Fechar modal"
            >
                <XIcon className="w-5 h-5" />
            </button>
        )}
    </header>
);

interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({
    children,
    className = '',
}) => (
    <div className={`p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 ${className}`}>
        {children}
    </div>
);

interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
    children,
    className = '',
}) => (
    <footer className={`p-4 sm:p-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3 ${className}`}>
        {children}
    </footer>
);

// ============================================
// Compound component pattern for exports
// ============================================

export const Modal = Object.assign(BaseModal, {
    Header: ModalHeader,
    Body: ModalBody,
    Footer: ModalFooter,
});

export default Modal;
