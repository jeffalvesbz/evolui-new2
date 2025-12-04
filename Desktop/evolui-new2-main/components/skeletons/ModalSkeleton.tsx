import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/**
 * Generic skeleton for modal dialogs
 * Used as fallback while lazy-loaded modals are loading
 */
export const ModalSkeleton: React.FC = () => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            data-testid="modal-skeleton"
        >
            <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl mx-4">
                {/* Modal Header */}
                <div className="space-y-2 mb-6">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>

                {/* Modal Content */}
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 mt-6">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
        </div>
    );
};

export default ModalSkeleton;
