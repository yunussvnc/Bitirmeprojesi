'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SystemHealth, RedisStats, QdrantStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Server, 
  Database, 
  HardDrive, 
  RefreshCw, 
  TrendingUp, 
  Activity, 
  CheckCircle,
  AlertOctagon,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemDiagnostics() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [redis, setRedis] = useState<RedisStats | null>(null);
  const [qdrant, setQdrant] = useState<QdrantStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [healthRes, redisRes, qdrantRes, logsRes] = await Promise.all([
        api.get('/admin/system/health'),
        api.get('/admin/system/redis-stats'),
        api.get('/admin/system/qdrant-stats'),
        api.get('/admin/system/logs?limit=10'),
      ]);

      setHealth(healthRes.data);
      setRedis(redisRes.data);
      setQdrant(qdrantRes.data);
      setAuditLogs(logsRes.data);
    } catch (err: any) {
      console.error(err);
      toast.error('Sistem durumu verileri alınırken hata oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll system health every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Sistem Sağlığı</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            PostgreSQL, Redis, Qdrant ve AI servislerinin çalışma durumlarını ve kaynak kullanımlarını izleyin.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={triggerRefresh}
            disabled={refreshing}
            className="rounded-xl border-zinc-300 dark:border-zinc-800 gap-2 h-11"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Şimdi Yenile
          </Button>
        </div>
      </div>

      {/* Services status cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))
          : health && (
              <>
                {/* Postgres Card */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      PostgreSQL
                    </CardTitle>
                    <Database className="h-4.5 w-4.5 text-zinc-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${health.services.postgresql.status === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-2xl font-bold">{health.services.postgresql.status === 'UP' ? 'Aktif' : 'Çevrimdışı'}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Gecikme: {health.services.postgresql.latency_ms} ms</p>
                  </CardContent>
                </Card>

                {/* Redis Card */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Redis (Önbellek)
                    </CardTitle>
                    <HardDrive className="h-4.5 w-4.5 text-zinc-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${health.services.redis.status === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-2xl font-bold">{health.services.redis.status === 'UP' ? 'Aktif' : 'Çevrimdışı'}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Gecikme: {health.services.redis.latency_ms} ms</p>
                  </CardContent>
                </Card>

                {/* AI Service Card */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      AI Servisi
                    </CardTitle>
                    <Server className="h-4.5 w-4.5 text-zinc-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${health.services['asemos-ai'].status === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-2xl font-bold">{health.services['asemos-ai'].status === 'UP' ? 'Aktif' : 'Çevrimdışı'}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Gecikme: {health.services['asemos-ai'].latency_ms} ms</p>
                  </CardContent>
                </Card>

                {/* Qdrant Card */}
                <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Qdrant Cloud
                    </CardTitle>
                    <TrendingUp className="h-4.5 w-4.5 text-zinc-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${health.services['qdrant-cloud'].status === 'UP' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                      <span className="text-2xl font-bold">{health.services['qdrant-cloud'].status === 'UP' ? 'Aktif' : 'Belirsiz'}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Gecikme: {health.services['qdrant-cloud'].latency_ms} ms</p>
                  </CardContent>
                </Card>
              </>
            )}
      </div>

      {/* Redis / Qdrant Detailed Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Redis details */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-violet-500" />
              Redis Bellek & Önbellek Analizi
            </CardTitle>
            <CardDescription>Önbellekte saklanan anahtar ve bellek tüketim metrikleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : redis && redis.connected ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-4">
                  <span className="text-xs text-zinc-500 font-medium block">Kayıtlı Önbellek Anahtarı</span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{redis.keys_count}</span>
                </div>
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-4">
                  <span className="text-xs text-zinc-500 font-medium block">Tüketilen Bellek</span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{redis.used_memory_human}</span>
                </div>
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-4">
                  <span className="text-xs text-zinc-500 font-medium block">Önbellek İsabet Oranı (Hit Rate)</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{redis.hit_rate_pct}%</span>
                </div>
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-4">
                  <span className="text-xs text-zinc-500 font-medium block">İsabet / Kaçırma (Hit/Miss)</span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{redis.hits} / {redis.misses}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">Redis bağlantısı sağlanamadı.</div>
            )}
          </CardContent>
        </Card>

        {/* Qdrant details */}
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-500" />
              AI & Vektör Tabanı Detayları
            </CardTitle>
            <CardDescription>Semantik indeksleme ve AI çalışma durumu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : qdrant ? (
              <div className="space-y-3">
                {qdrant.version && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                    <span className="text-sm text-zinc-500">AI Sürüm Versiyonu</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{qdrant.version}</span>
                  </div>
                )}
                {qdrant.phase && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                    <span className="text-sm text-zinc-500">Çalışma Fazı</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{qdrant.phase}</span>
                  </div>
                )}
                {qdrant.collections && Array.isArray(qdrant.collections) && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                    <span className="text-sm text-zinc-500">Koleksiyonlar</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {qdrant.collections.length > 0 ? (
                        qdrant.collections.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs shadow-none">{c}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-400">Koleksiyon yok</span>
                      )}
                    </div>
                  </div>
                )}
                {qdrant.vectors_count !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/40">
                    <span className="text-sm text-zinc-500">Vektörize Edilmiş Mekan Sayısı</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{qdrant.vectors_count}</span>
                  </div>
                )}
                {qdrant.status && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-zinc-500">Veritabanı Durumu</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize shadow-none">{qdrant.status}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 text-sm">Qdrant servis bilgisine erişilemedi.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Stream */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-500" />
            Detaylı İşlem ve Denetim Günlüğü (Audit Trail)
          </CardTitle>
          <CardDescription>Yöneticiler tarafından yapılan işlemlerin güvenli geçmişi</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead>Yönetici</TableHead>
                <TableHead>Eylem / İşlem</TableHead>
                <TableHead>Hedef Tür</TableHead>
                <TableHead>Hedef ID</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                    Kayıtlı denetim logu bulunmamaktadır.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {log.admin_username}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.action}
                    </TableCell>
                    <TableCell className="capitalize text-zinc-500 text-xs">
                      {log.target_type}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {log.target_id || '-'}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
