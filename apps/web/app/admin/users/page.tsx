import React from 'react';
import { UsersRound } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">User Management</h2>
          <p className="text-neutral-500 mt-1">Review B2B buyer applications, roles, and permissions.</p>
        </div>
      </div>

      <div className="bg-white border text-center border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <UsersRound className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900">User List Empty</h3>
        <p className="text-neutral-500 text-sm mt-2 max-w-sm">
          Once users register across the platform, you can manage access control and block suspicious accounts here.
        </p>
      </div>
    </div>
  );
}
