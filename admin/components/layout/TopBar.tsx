'use client';

import { useAuthStore } from '@/store/authStore';
import { User, Bell, ChevronDown } from 'lucide-react';
import { useEffect } from 'react';

export default function TopBar() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <header className="fixed top-0 right-0 z-10 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-zinc-200/80 bg-white/85 px-8 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      {/* Search / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">AsEmOs</span>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Yönetici Paneli</span>
      </div>

      {/* Action items */}
      <div className="flex items-center gap-6">
        {/* Notifications Icon */}
        <button className="relative rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400" />
        </button>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Admin User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400">
            <User className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {user?.email ? user.email.split('@')[0] : 'Sistem Yöneticisi'}
            </span>
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              {user?.role || 'Admin'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
