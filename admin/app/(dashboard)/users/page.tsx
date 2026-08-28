'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
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
  ShieldAlert, 
  UserCog, 
  Ban, 
  CheckCircle2, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'standard' | 'venue' | 'admin'>('standard');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.is_active = statusFilter === 'active';

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch {
      toast.error('Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [limit, page, roleFilter, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchUsers();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      toast.success('Rol Güncellendi', {
        description: `${selectedUser.username || selectedUser.email} kullanıcısının rolü ${newRole} olarak güncellendi.`,
      });
      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      toast.error('Rol güncellenemedi', {
        description: getApiErrorMessage(error, 'Bilinmeyen bir hata oluştu.'),
      });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/admin/users/${selectedUser.id}/ban`, { reason: banReason || 'Kural ihlali' });
      toast.success('Kullanıcı Askıya Alındı', {
        description: `${selectedUser.username || selectedUser.email} kullanıcısı pasif yapıldı.`,
      });
      setBanDialogOpen(false);
      setBanReason('');
      fetchUsers();
    } catch {
      toast.error('Kullanıcı askıya alınamadı');
    }
  };

  const handleUnbanUser = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/unban`);
      toast.success('Kullanıcı Aktif Edildi', {
        description: `${user.username || user.email} kullanıcısı tekrar aktif edildi.`,
      });
      fetchUsers();
    } catch {
      toast.error('Kullanıcı aktif edilemedi');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`${user.username || user.email} kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success('Kullanıcı Silindi', {
        description: 'Kullanıcı hesabı soft-delete yöntemiyle devre dışı bırakıldı.',
      });
      fetchUsers();
    } catch {
      toast.error('Kullanıcı silinemedi');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kullanıcı rollerini güncelleyebilir, hesapları askıya alabilir veya silebilirsiniz.
        </p>
      </div>

      {/* Filters section */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="E-posta, kullanıcı adı veya ad/soyad ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'all')}>
                <SelectTrigger className="w-[140px] border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Rol Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="venue">Mekan Sahibi</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-[140px] border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Durum Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="banned">Banlı / Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <TableHead>Kullanıcı Bilgileri</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                    Kullanıcı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {user.username || 'Kullanıcı Adı Yok'}
                      {(user.first_name || user.last_name) && (
                        <span className="block text-xs font-normal text-zinc-500">
                          {user.first_name} {user.last_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">{user.email}</TableCell>
                    <TableCell>
                      {user.role === 'admin' && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none">Admin</Badge>}
                      {user.role === 'venue' && <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 shadow-none">Mekan</Badge>}
                      {user.role === 'standard' && <Badge variant="outline" className="text-zinc-500 border-zinc-300 dark:border-zinc-700 shadow-none">Standart</Badge>}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none">Aktif</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none">Pasif / Banlı</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setRoleDialogOpen(true);
                          }}
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>

                        {user.is_active ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setBanDialogOpen(true);
                            }}
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnbanUser(user)}
                            className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <span className="text-xs text-zinc-500">
                Toplam {total} kullanıcıdan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} arası gösteriliyor.
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

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Rolünü Değiştir</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedUser?.username || selectedUser?.email} kullanıcısı için yeni yetki rolü seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newRole}
              onValueChange={(value) => {
                if (value === 'standard' || value === 'venue' || value === 'admin') {
                  setNewRole(value);
                }
              }}
            >
              <SelectTrigger className="w-full bg-zinc-950 border-zinc-800 text-white">
                <SelectValue placeholder="Rol Seçin" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                <SelectItem value="standard">Standard Kullanıcı</SelectItem>
                <SelectItem value="venue">Mekan Sahibi (İşletme)</SelectItem>
                <SelectItem value="admin">Admin (Yönetici)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleDialogOpen(false)} className="text-zinc-400 hover:text-white">
              Vazgeç
            </Button>
            <Button onClick={handleRoleChange} className="bg-violet-600 hover:bg-violet-500">
              Rolü Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-white max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              Kullanıcıyı Askıya Al
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedUser?.username || selectedUser?.email} hesabı pasif duruma getirilecek ve aktif oturumları kapatılacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Askıya Alma Nedeni</label>
            <Input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Örn: Topluluk kuralları ihlali..."
              className="bg-zinc-950 border-zinc-800 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanDialogOpen(false)} className="text-zinc-400 hover:text-white">
              Vazgeç
            </Button>
            <Button onClick={handleBanUser} className="bg-red-600 hover:bg-red-500">
              Kullanıcıyı Yasakla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
