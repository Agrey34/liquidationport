import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-16">
      
      {/* Skeleton Hero Header */}
      <div className="bg-neutral-900 py-12 md:py-16 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="h-10 bg-neutral-800 rounded-2xl w-48 md:w-64 mx-auto" />
          <div className="h-4 bg-neutral-800 rounded-xl w-72 md:w-96 mx-auto" />
          <div className="h-14 bg-neutral-800 rounded-2xl w-full max-w-xl mx-auto mt-6" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Skeleton Sidebar Filters */}
          <div className="w-full lg:w-64 shrink-0 hidden lg:block space-y-6 animate-pulse">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm h-64">
              <div className="h-4 bg-neutral-200 rounded-lg w-24" />
              <div className="space-y-3 pt-2">
                <div className="h-3 bg-neutral-200 rounded-lg w-32" />
                <div className="h-3 bg-neutral-200 rounded-lg w-28" />
                <div className="h-3 bg-neutral-200 rounded-lg w-36" />
                <div className="h-3 bg-neutral-200 rounded-lg w-20" />
              </div>
            </div>
            
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm h-64">
              <div className="h-4 bg-neutral-200 rounded-lg w-32" />
              <div className="space-y-3 pt-2">
                <div className="h-3 bg-neutral-200 rounded-lg w-24" />
                <div className="h-3 bg-neutral-200 rounded-lg w-28" />
                <div className="h-3 bg-neutral-200 rounded-lg w-20" />
              </div>
            </div>
          </div>

          {/* Skeleton Grid */}
          <div className="flex-1 w-full space-y-6 animate-pulse">
            <div className="hidden lg:flex items-center justify-between bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
              <div className="h-4 bg-neutral-200 rounded-lg w-32" />
              <div className="h-4 bg-neutral-200 rounded-lg w-40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-neutral-200 p-5 space-y-4 shadow-sm flex flex-col h-[380px]">
                  <div className="aspect-[4/3] bg-neutral-200 rounded-2xl w-full" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-neutral-200 rounded-lg w-24" />
                    <div className="h-4 bg-neutral-200 rounded-lg w-full" />
                    <div className="h-4 bg-neutral-200 rounded-lg w-2/3" />
                  </div>
                  <div className="h-px bg-neutral-100 w-full mt-auto mb-2" />
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="h-2.5 bg-neutral-200 rounded-lg w-16" />
                      <div className="h-5 bg-neutral-200 rounded-lg w-24" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 bg-neutral-200 rounded-lg w-16" />
                      <div className="h-4 bg-neutral-200 rounded-lg w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
