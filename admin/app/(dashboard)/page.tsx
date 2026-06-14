'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  MapPin, 
  Flame, 
  BrainCircuit, 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  Terminal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, aiStatsRes, logsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/ai/stats'),
          api.get('/admin/system/logs?limit=5'),
        ]);

        setStats(statsRes.data);
        setChartData(aiStatsRes.data.daily);
        setRecentLogs(logsRes.data);
      } catch (err: any) {
        console.error(err);
        toast.error('Dashboard verileri yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const cardItems = [
    {
      title: 'Toplam Kullanıcı',
      value: stats?.total_users,
      icon: Users,
      description: 'Sistemdeki toplam kayıtlı kullanıcı',
      color: 'from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Kayıtlı Mekanlar',
      value: stats?.total_venues,
      icon: MapPin,
      description: 'Qdrant semantik aramadaki mekan sayısı',
      color: 'from-emerald-500/10 to-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Aktif Hikayeler',
      value: stats?.active_stories,
      icon: Flame,
      description: 'Son 24 saatte paylaşılan hikayeler',
      color: 'from-amber-500/10 to-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Bugünkü AI Sorguları',
      value: stats?.ai_queries_today,
      icon: BrainCircuit,
      description: 'Sistem tarafından işlenen LLM istekleri',
      color: 'from-violet-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:to-zinc-400">
          Genel Bakış
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          AsEmOs platformunun anlık performans, kullanıcı büyümesi ve AI analiz metrikleri.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))
          : cardItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card 
                  key={index} 
                  className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-zinc-200/40 dark:hover:shadow-none hover:-translate-y-0.5"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {item.title}
                    </CardTitle>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {item.value ?? 0}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main AI Traffic Area Chart */}
        <Card className="col-span-2 border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-base font-bold">AI Trafik Analizi</CardTitle>
            </div>
            <CardDescription>Son 30 günde gelen toplam sorgu ve fallback/blocked oranları</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Veri bulunmamaktadır.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="total" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fallback" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} 
                    style={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis style={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: 12, 
                      border: '1px solid #e4e4e7',
                      fontSize: 12
                    }} 
                  />
                  <Area type="monotone" dataKey="total" name="Toplam İstek" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#total)" />
                  <Area type="monotone" dataKey="fallback" name="Gemma Fallback" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#fallback)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Audit Log / Admin Activity Stream */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base font-bold">Son Yönetici İşlemleri</CardTitle>
            </div>
            <CardDescription>Sistem audit log akışındaki en son işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-zinc-500">
                Henüz işlem geçmişi yok.
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {log.admin_username}
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400">
                        {log.action} ({log.target_type})
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
