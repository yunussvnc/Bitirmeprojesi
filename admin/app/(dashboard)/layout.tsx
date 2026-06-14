'use client';

import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
      <Sidebar />
      <div className="flex flex-col pl-64">
        <TopBar />
        <main className="flex-1 p-8 pt-24 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
