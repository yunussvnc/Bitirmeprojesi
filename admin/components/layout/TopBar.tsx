'use client';

import { useAuthStore } from '@/store/authStore';
import { User, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function TopBar() {
  const { user, initialize, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        {/* Admin User Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-all focus:outline-none"
          >
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
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Box */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-xl dark:border-zinc-800/80 dark:bg-zinc-900/90 backdrop-blur-md animate-in fade-in slide-in-from-top-1.5 duration-200">
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/40 mb-1">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Giriş Yapılan Hesap</p>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate mt-0.5">{user?.email || 'Bilinmiyor'}</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
