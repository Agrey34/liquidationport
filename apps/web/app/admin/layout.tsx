import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-500 w-full font-sans antialiased">
        <Sidebar />
        
        <div className="flex flex-col flex-1 min-w-0  overflow-hidden bg-gray-200">
            <Header />
            <main className="flex-1 overflow-y-auto w-full pb-16 md:pb-0">
              <div className="max-w-7xl mx-auto p-6 md:p-8 w-full">
                {children}
              </div>
            </main>
        </div>
   </div>
  );
}
