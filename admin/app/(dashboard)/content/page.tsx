'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Post, Story, Report } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Eye, 
  AlertTriangle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ModerationHub() {
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  // Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsStatus, setPostsStatus] = useState<'pending' | 'approved' | 'rejected' | 'reported'>('pending');
  const [stories, setStories] = useState<Story[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/posts', {
        params: { status: postsStatus, limit: 30 }
      });
      setPosts(response.data.items);
    } catch {
      toast.error('Gönderiler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [postsStatus]);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stories', {
        params: { limit: 30 }
      });
      setStories(response.data.items);
    } catch {
      toast.error('Hikayeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports', {
        params: { status: 'pending' }
      });
      setReports(response.data);
    } catch {
      toast.error('Bildirim raporları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'posts') {
        void fetchPosts();
      } else if (activeTab === 'stories') {
        void fetchStories();
      } else if (activeTab === 'reports') {
        void fetchReports();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchPosts, fetchReports, fetchStories]);

  const handlePostStatus = async (postId: number, newStatus: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/posts/${postId}/status`, { status: newStatus });
      toast.success(newStatus === 'approved' ? 'Gönderi Onaylandı' : 'Gönderi Reddedildi');
      fetchPosts();
    } catch {
      toast.error('İşlem başarısız oldu.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Gönderiyi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      toast.success('Gönderi Silindi');
      fetchPosts();
    } catch {
      toast.error('Gönderi silinemedi.');
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!confirm('Hikayeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/admin/stories/${storyId}`);
      toast.success('Hikaye Silindi');
      fetchStories();
    } catch {
      toast.error('Hikaye silinemedi.');
    }
  };

  const handleResolveReport = async (reportId: number, status: 'reviewed' | 'dismissed') => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`, { status });
      toast.success(status === 'reviewed' ? 'Rapor İncelendi Olarak İşaretlendi' : 'Rapor Reddedildi');
      fetchReports();
    } catch {
      toast.error('İşlem başarısız oldu.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Moderasyon Paneli</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Topluluk paylaşımlarını, hikayeleri ve kullanıcı şikayetlerini moderatör gözüyle inceleyin ve onaylayın.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setLoading(true); }} className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl h-11">
            <TabsTrigger value="posts" className="rounded-lg px-4 text-xs font-semibold">Gönderiler</TabsTrigger>
            <TabsTrigger value="stories" className="rounded-lg px-4 text-xs font-semibold">Hikayeler</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-4 text-xs font-semibold relative">
              Şikayet Raporları
              {reports.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {reports.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'posts' && (
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected', 'reported'] as const).map((status) => (
                <Button
                  key={status}
                  variant={postsStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPostsStatus(status)}
                  className="capitalize rounded-lg h-9 text-xs"
                >
                  {status === 'pending' && 'Bekleyen'}
                  {status === 'approved' && 'Onaylanan'}
                  {status === 'rejected' && 'Reddedilen'}
                  {status === 'reported' && 'Şikayet Edilen'}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* POSTS TAB */}
        <TabsContent value="posts">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <TableHead>Gönderi / Medya</TableHead>
                    <TableHead>Paylaşan Kullanıcı</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Şikayetler</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Skeleton className="h-12 w-16 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                        Gönderi bulunmamaktadır.
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <TableCell>
                          {post.media && post.media.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Image
                                src={post.media[0].media_url}
                                alt="Post media"
                                width={64}
                                height={48}
                                unoptimized
                                className="h-12 w-16 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
                              />
                              {post.media.length > 1 && (
                                <span className="text-[10px] text-zinc-500 font-semibold">+{post.media.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">Görsel Yok</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {post.user?.username || `User #${post.user?.id}`}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                          {post.caption || <span className="italic text-zinc-400">Metin girilmedi</span>}
                        </TableCell>
                        <TableCell>
                          {post.reports && post.reports.length > 0 ? (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {post.reports.length} Şikayet
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-400">Sorun Yok</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {post.status !== 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePostStatus(post.id, 'approved')}
                                className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                title="Onayla"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {post.status !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePostStatus(post.id, 'rejected')}
                                className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                title="Reddet / Engelle"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePost(post.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Sil"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* STORIES TAB */}
        <TabsContent value="stories">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <TableHead>Medya</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Paylaşım Zamanı</TableHead>
                    <TableHead>Etkileşim</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Skeleton className="h-16 w-12 rounded-md" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : stories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                        Aktif hikaye bulunmamaktadır.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stories.map((story) => (
                      <TableRow key={story.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <TableCell>
                          <Image
                            src={story.media_url}
                            alt="Story thumbnail"
                            width={48}
                            height={64}
                            unoptimized
                            className="h-16 w-12 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm"
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {story.user?.username || `User #${story.user?.id}`}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(story.created_at).toLocaleTimeString()} ({new Date(story.created_at).toLocaleDateString()})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>{story.view_count || 0} İzlenme</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{story.reaction_count || 0} Reaksiyon</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStory(story.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Hikayeyi Kaldır"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <TableHead>Rapor ID</TableHead>
                    <TableHead>Hedef Tür / ID</TableHead>
                    <TableHead>Neden</TableHead>
                    <TableHead>Detaylar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                        Bekleyen bildirim bulunmamaktadır.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                          #{report.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize shadow-none">
                            {report.target_type} ({report.target_id})
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-amber-600 dark:text-amber-400">
                          {report.reason}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {report.description || <span className="italic text-zinc-400">Detay yok</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResolveReport(report.id, 'reviewed')}
                              className="h-8 w-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="İncelendi Olarak İşaretle"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResolveReport(report.id, 'dismissed')}
                              className="h-8 w-8 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Reddet / Kapat"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
