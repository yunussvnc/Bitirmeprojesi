'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AIQueryLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  BrainCircuit, 
  Cpu, 
  Clock, 
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

export default function AILogsPage() {
  const [logs, setLogs] = useState<AIQueryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [queryTypeFilter, setQueryTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockedOnly, setBlockedOnly] = useState(false);

  // Stats summary
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [successRate, setSuccessRate] = useState(100);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let endpoint = '/admin/ai/logs';
      const params: any = {
        page,
        limit,
      };

      if (blockedOnly) {
        endpoint = '/admin/ai/filter-logs';
      } else {
        if (queryTypeFilter !== 'all') params.query_type = queryTypeFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
      }

      const response = await api.get(endpoint, { params });
      setLogs(response.data.items);
      setTotal(response.data.total);

      // Compute statistics based on currently fetched items for UX
      if (response.data.items.length > 0) {
        const times = response.data.items.map((l: AIQueryLog) => l.response_time_ms);
        const avg = times.reduce((a: number, b: number) => a + b, 0) / times.length;
        setAvgResponseTime(Math.round(avg));

        const errors = response.data.items.filter((l: AIQueryLog) => l.status === 'error').length;
        setSuccessRate(Math.round(((response.data.items.length - errors) / response.data.items.length) * 100));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('AI logları yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, queryTypeFilter, statusFilter, blockedOnly]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">AI & LLM İzleme</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kullanıcıların semantik arama / sohbet sorgularını, LLM gecikme sürelerini ve güvenlik filtresi loglarını analiz edin.
        </p>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Ortalama Gecikme Süresi
            </CardTitle>
            <Clock className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? <Skeleton className="h-8 w-16" /> : `${avgResponseTime} ms`}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Son gelen sorguların ortalama süresi</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Başarı Oranı
            </CardTitle>
            <Cpu className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? <Skeleton className="h-8 w-12" /> : `${successRate}%`}
            </div>
            <p className="text-xs text-zinc-500 mt-1">İsteklerin hata almadan işlenme oranı</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Toplam Kayıtlı Sorgu
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? <Skeleton className="h-8 w-16" /> : total}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Sistem genelindeki toplam AI etkileşimi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={blockedOnly ? 'default' : 'outline'}
                onClick={() => {
                  setBlockedOnly(!blockedOnly);
                  setPage(1);
                }}
                className={`rounded-xl gap-2 h-10 ${blockedOnly ? 'bg-amber-600 hover:bg-amber-500' : 'border-zinc-300 dark:border-zinc-800'}`}
              >
                <ShieldAlert className="h-4 w-4" />
                Engellenen Sorguları Filtrele
              </Button>

              {!blockedOnly && (
                <>
                  <Select value={queryTypeFilter} onValueChange={(val) => setQueryTypeFilter(val || 'all')}>
                    <SelectTrigger className="w-[160px] border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Sorgu Tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Tipler</SelectItem>
                      <SelectItem value="venue_search">Semantik Arama</SelectItem>
                      <SelectItem value="chit_chat">Sohbet (Chit-Chat)</SelectItem>
                      <SelectItem value="blocked">Engellenmiş</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                    <SelectTrigger className="w-[160px] border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="İşlem Statüsü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="success">Başarılı</SelectItem>
                      <SelectItem value="fallback">Gemma Fallback</SelectItem>
                      <SelectItem value="error">Hata</SelectItem>
                      <SelectItem value="blocked">Güvenlik Engeli</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead>Sorgu Metni</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Model / Katman</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>Sonuç Sayısı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                    Sorgu logu bulunmamaktadır.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    <TableCell className="max-w-xs truncate font-medium text-zinc-800 dark:text-zinc-200" title={log.query_text}>
                      {log.query_text}
                    </TableCell>
                    <TableCell>
                      {log.query_type === 'venue_search' && <Badge variant="outline" className="text-blue-500 border-blue-500/20 shadow-none">Arama</Badge>}
                      {log.query_type === 'chit_chat' && <Badge variant="outline" className="text-zinc-500 border-zinc-500/20 shadow-none">Sohbet</Badge>}
                      {log.query_type === 'blocked' && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none">Engelli</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                      {log.llm_layer === 'groq' ? 'Groq (Llama 3)' : 'Gemma Fallback'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 font-mono">
                      {log.response_time_ms} ms
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                      {log.result_count}
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Başarılı</Badge>}
                      {log.status === 'fallback' && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none">Fallback</Badge>}
                      {log.status === 'blocked' && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none">Engellendi</Badge>}
                      {log.status === 'error' && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none">Hata</Badge>}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-[10px]">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <span className="text-xs text-zinc-500">
                Toplam {total} sorgudan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} arası gösteriliyor.
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg h-8"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Geri
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg h-8"
                >
                  İleri <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
