'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  ShieldAlert, 
  BrainCircuit, 
  Activity, 
  LogOut,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isVenue = user?.role === 'venue';

  const menuItems = [
    { name: 'Genel Bakış', href: '/', icon: LayoutDashboard, visible: true },
    { name: 'Kullanıcılar', href: '/users', icon: Users, visible: isAdmin },
    { name: 'Mekanlar', href: '/venues', icon: MapPin, visible: isAdmin || isVenue },
    { name: 'Moderasyon', href: '/content', icon: ShieldAlert, visible: isAdmin },
    { name: 'AI & LLM Takip', href: '/ai/logs', icon: BrainCircuit, visible: isAdmin },
    { name: 'Sistem Sağlığı', href: '/system', icon: Activity, visible: isAdmin },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r border-zinc-200/80 bg-zinc-50/50 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/50">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200/80 px-6 dark:border-zinc-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
          <Flame className="h-5 w-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">AsEmOs</span>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Yönetim Paneli</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {menuItems.filter(item => item.visible).map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-white text-violet-600 shadow-sm shadow-zinc-200/50 dark:bg-zinc-900 dark:text-violet-400 dark:shadow-none font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100'
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
              <span>{item.name}</span>
              {isActive && (
                <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-zinc-200/80 p-4 dark:border-zinc-800/80">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Çıkış Yap</span>
        </Button>
      </div>
    </aside>
  );
}
