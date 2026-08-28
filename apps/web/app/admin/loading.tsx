import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      
      {/* Skeleton Page Header Area */}
      <div className="space-y-2">
        <div className="h-7 bg-neutral-300 rounded-lg w-48" />
        <div className="h-4 bg-neutral-300 rounded-lg w-72" />
      </div>

      {/* Skeleton KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 lg:p-6 border border-neutral-200 shadow-sm flex flex-col justify-between min-w-0 h-28 lg:h-32 space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 bg-neutral-200 rounded-full" />
              <div className="w-12 h-4 bg-neutral-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-neutral-300 rounded-lg w-2/3" />
              <div className="h-3.5 bg-neutral-200 rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Skeleton Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-[400px] p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
            <div className="h-5 bg-neutral-300 rounded-lg w-32" />
            <div className="h-4 bg-neutral-200 rounded-lg w-16" />
          </div>
          <div className="space-y-4 flex-1 pt-2">
            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-neutral-100">
              <div className="h-3 bg-neutral-200 rounded-lg w-16" />
              <div className="h-3 bg-neutral-200 rounded-lg w-20" />
              <div className="h-3 bg-neutral-200 rounded-lg w-12" />
              <div className="h-3 bg-neutral-200 rounded-lg w-16" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 py-1">
                <div className="h-4 bg-neutral-200 rounded-lg w-14" />
                <div className="h-4 bg-neutral-200 rounded-lg w-28" />
                <div className="h-4 bg-neutral-200 rounded-lg w-20" />
                <div className="h-4 bg-neutral-200 rounded-lg w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton Action Panel */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6 h-[400px]">
          <div className="h-5 bg-neutral-300 rounded-lg w-40 border-b border-neutral-100 pb-4 w-full" />
          <div className="space-y-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-neutral-200 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-neutral-200 rounded-lg w-full" />
                  <div className="h-2.5 bg-neutral-200 rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
