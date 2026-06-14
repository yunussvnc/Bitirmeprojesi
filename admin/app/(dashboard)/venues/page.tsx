'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Place } from '@/types';
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
  Plus, 
  RefreshCw, 
  Database, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Place[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [indexingMap, setIndexingMap] = useState<Record<number, boolean>>({});
  const [bulkIndexing, setBulkIndexing] = useState(false);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (districtFilter !== 'all') params.district = districtFilter;

      const response = await api.get('/admin/venues', { params });
      setVenues(response.data.items);
      setTotal(response.data.total);
    } catch (err: any) {
      console.error(err);
      toast.error('Mekanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVenues();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, districtFilter, page]);

  const handleIndexSingle = async (venueId: number) => {
    setIndexingMap((prev) => ({ ...prev, [venueId]: true }));
    try {
      await api.post(`/admin/venues/${venueId}/index`);
      toast.success('Mekan Qdrant\'a Eklendi', {
        description: 'Mekan açıklamaları vektörleştirildi ve Qdrant DB güncellendi.',
      });
      fetchVenues();
    } catch (err: any) {
      toast.error('Vektörleştirme hatası', {
        description: err.response?.data?.detail || 'AI servisi yanıt vermiyor.',
      });
    } finally {
      setIndexingMap((prev) => ({ ...prev, [venueId]: false }));
    }
  };

  const handleBulkIndex = async () => {
    if (!confirm('Tüm mekanları toplu olarak yeniden indekslemek istediğinize emin misiniz? Bu işlem birkaç dakika sürebilir.')) return;
    setBulkIndexing(true);
    try {
      const response = await api.post('/admin/venues/bulk-index');
      toast.success('Toplu İndeksleme Başlatıldı', {
        description: response.data?.message || 'Qdrant veri tabanındaki tüm vektörler güncelleniyor.',
      });
      fetchVenues();
    } catch (err: any) {
      toast.error('Toplu indeksleme hatası');
    } finally {
      setBulkIndexing(false);
    }
  };

  const handleDeleteVenue = async (venue: Place) => {
    if (!confirm(`${venue.name} mekanını silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/admin/venues/${venue.id}`);
      toast.success('Mekan Silindi', {
        description: 'Mekan kaydı sistemden kalıcı olarak kaldırıldı.',
      });
      fetchVenues();
    } catch (err: any) {
      toast.error('Mekan silinemedi');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Mekan Yönetimi</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sistemdeki kafe, restoran, eğlence mekanlarını düzenleyin ve Qdrant semantik arama dizinini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBulkIndex}
            disabled={bulkIndexing || loading}
            className="rounded-xl border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 gap-2 h-11"
          >
            <RefreshCw className={`h-4 w-4 ${bulkIndexing ? 'animate-spin' : ''}`} />
            Toplu Vektör İndeksle
          </Button>
          <Link href="/venues/new">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 gap-2 h-11">
              <Plus className="h-4 w-4" />
              Yeni Mekan Ekle
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Mekan adına göre ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || 'all')}>
                <SelectTrigger className="w-[150px] border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Kategori Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  <SelectItem value="cafe">Kafe</SelectItem>
                  <SelectItem value="restaurant">Restoran</SelectItem>
                  <SelectItem value="bar">Bar / Gece Kulübü</SelectItem>
                  <SelectItem value="pub">Pub</SelectItem>
                  <SelectItem value="study">Çalışma Alanı</SelectItem>
                </SelectContent>
              </Select>

              <Select value={districtFilter} onValueChange={(val) => setDistrictFilter(val || 'all')}>
                <SelectTrigger className="w-[150px] border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Semt Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Semtler</SelectItem>
                  <SelectItem value="Kadikoy">Kadıköy</SelectItem>
                  <SelectItem value="Besiktas">Beşiktaş</SelectItem>
                  <SelectItem value="Sisli">Şişli</SelectItem>
                  <SelectItem value="Karakoy">Karaköy</SelectItem>
                  <SelectItem value="Uskudar">Üsküdar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead>Mekan Adı</TableHead>
                <TableHead>Semt / Şehir</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Qdrant İndeks Durumu</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : venues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                    Mekan bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {venue.name}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">
                      {venue.city}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize shadow-none">
                        {venue.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {venue.has_vector ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          <span>İndekslendi</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Vektör Eksik</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={indexingMap[venue.id]}
                          onClick={() => handleIndexSingle(venue.id)}
                          title="Semantik Arama Dizinine Ekle"
                          className="h-8 w-8 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                        >
                          <Database className={`h-4 w-4 ${indexingMap[venue.id] ? 'animate-spin' : ''}`} />
                        </Button>
                        <Link href={`/venues/${venue.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVenue(venue)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                Toplam {total} mekandan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} arası gösteriliyor.
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
