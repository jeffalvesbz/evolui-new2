import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/**
 * Skeleton screen for Dashboard page
 * Matches the layout of the actual Dashboard component
 */
export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-8" data-testid="dashboard-skeleton">
            {/* Header Cards Section */}
            <section className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-3 pt-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="flex gap-3">
                            <Skeleton className="h-11 flex-1" />
                            <Skeleton className="h-11 flex-1" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                    <Skeleton className="h-4 w-32" />
                    <div className="grid grid-cols-2 gap-3 pt-4">
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-20" />
                    </div>
                </div>
            </section>

            {/* Metas e Status */}
            <section>
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <Skeleton className="h-2 w-full" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Motivational Message */}
            <section>
                <div className="rounded-2xl border border-border bg-card p-5 min-h-[90px]">
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
            </section>

            {/* Metrics Grid */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-[110px] rounded-lg" />
                    <Skeleton className="h-[110px] rounded-lg" />
                    <Skeleton className="h-[110px] rounded-lg" />
                    <Skeleton className="h-[110px] rounded-lg" />
                </div>
            </section>

            {/* Charts Section */}
            <section className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-64 mb-4" />
                        <Skeleton className="h-[250px] w-full" />
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-64 mb-4" />
                        <Skeleton className="h-[250px] w-full" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default DashboardSkeleton;
