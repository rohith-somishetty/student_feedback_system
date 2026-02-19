import React from 'react';

export const SkeletonBase: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div className={`bg-slate-200 animate-pulse skeleton-shimmer ${className}`} />
);

export const SkeletonStatCard: React.FC = () => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
            <SkeletonBase className="w-10 h-10 rounded-xl" />
            <SkeletonBase className="w-12 h-5 rounded-full" />
        </div>
        <div className="space-y-2">
            <SkeletonBase className="w-16 h-8 rounded-lg" />
            <div className="flex justify-between items-center">
                <SkeletonBase className="w-20 h-3 rounded" />
                <SkeletonBase className="w-12 h-3 rounded" />
            </div>
        </div>
    </div>
);

export const SkeletonIssueCard: React.FC = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2 flex-grow">
                <div className="flex gap-2">
                    <SkeletonBase className="w-12 h-4 rounded" />
                    <SkeletonBase className="w-20 h-4 rounded" />
                </div>
                <SkeletonBase className="w-3/4 h-6 rounded-lg" />
                <SkeletonBase className="w-full h-4 rounded" />
            </div>
            <SkeletonBase className="w-12 h-12 rounded-xl shrink-0" />
        </div>
        <div className="flex justify-between items-center mt-4">
            <SkeletonBase className="w-24 h-4 rounded" />
            <SkeletonBase className="w-32 h-8 rounded-xl" />
        </div>
    </div>
);

export const SkeletonHub: React.FC = () => (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <SkeletonBase className="w-32 h-4 rounded-full" />
                <SkeletonBase className="w-48 h-10 rounded-lg" />
                <SkeletonBase className="w-64 h-5 rounded-md" />
            </div>
            <SkeletonBase className="w-36 h-12 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <SkeletonBase className="w-48 h-8 rounded-lg mb-4" />
                {[1, 2, 3].map(i => <SkeletonIssueCard key={i} />)}
            </div>
            <div className="space-y-6">
                <SkeletonBase className="w-full h-48 rounded-2xl" />
                <SkeletonBase className="w-full h-32 rounded-2xl" />
            </div>
        </div>
    </div>
);
