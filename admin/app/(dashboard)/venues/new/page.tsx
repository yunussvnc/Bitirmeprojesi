'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const venueSchema = z.object({
  name: z.string().min(2, { message: 'Mekan adı en az 2 karakter olmalıdır.' }),
  address: z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' }),
  city: z.string().min(2, { message: 'Semt belirtilmelidir.' }),
  description: z.string().min(10, { message: 'Açıklama en az 10 karakter olmalıdır.' }),
  price_range: z.number().min(1).max(4),
  category: z.string().min(2, { message: 'Kategori seçilmelidir.' }),
  features: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  photo_url: z.string().url({ message: 'Geçerli bir fotoğraf URL\'i giriniz.' }).or(z.string().length(0)).nullable().optional(),
  opening_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Geçerli bir saat giriniz (SS:DD)' }).or(z.string().length(0)).nullable().optional(),
  closing_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Geçerli bir saat giriniz (SS:DD)' }).or(z.string().length(0)).nullable().optional(),
  phone_number: z.string().or(z.string().length(0)).nullable().optional(),
});

type VenueFields = z.infer<typeof venueSchema>;

export default function NewVenuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VenueFields>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      price_range: 2,
      category: 'cafe',
      city: 'Kadikoy',
      features: '',
    },
  });

  const onSubmit = async (data: VenueFields) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        photo_url: data.photo_url || null,
        opening_time: data.opening_time || null,
        closing_time: data.closing_time || null,
        phone_number: data.phone_number || null,
      };

      const response = await api.post('/admin/venues', payload);
      const newId = response.data.id;

      // Automatically trigger single index to Qdrant
      try {
        await api.post(`/admin/venues/${newId}/index`);
        toast.success('Mekan Eklendi ve İndekslendi', {
          description: 'Mekan başarıyla kaydedildi ve Qdrant semantik veritabanına eklendi.',
        });
      } catch (indexErr) {
        toast.warning('Mekan Eklendi fakat İndekslenemedi', {
          description: 'Mekan kaydedildi ancak vektör veritabanına eklenirken hata oluştu. Daha sonra elle indeksleyebilirsiniz.',
        });
      }

      router.push('/venues');
    } catch (err: any) {
      toast.error('Mekan eklenirken hata oluştu', {
        description: err.response?.data?.detail || 'Lütfen bilgileri kontrol edip tekrar deneyin.',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = watch('category');
  const selectedDistrict = watch('city');

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/venues">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Yeni Mekan Ekle</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sisteme yeni bir mekan kaydedin ve otomatik semantik arama dizinine aktarın.
          </p>
        </div>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Mekan Detayları</CardTitle>
          <CardDescription>Mekanın temel bilgilerini ve konum detaylarını doldurun.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mekan Adı</label>
                <Input placeholder="Örn: Kahve Dünyası" {...register('name')} className="border-zinc-200 dark:border-zinc-800" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kategori</label>
                <Select value={selectedCategory} onValueChange={(val) => setValue('category', val || '')}>
                  <SelectTrigger className="border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Kategori Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cafe">Kafe</SelectItem>
                    <SelectItem value="restaurant">Restoran</SelectItem>
                    <SelectItem value="bar">Bar / Gece Kulübü</SelectItem>
                    <SelectItem value="pub">Pub</SelectItem>
                    <SelectItem value="study">Çalışma Alanı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Semt / Bölge</label>
                <Select value={selectedDistrict} onValueChange={(val) => setValue('city', val || '')}>
                  <SelectTrigger className="border-zinc-200 dark:border-zinc-800">
                    <SelectValue placeholder="Semt Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kadikoy">Kadıköy</SelectItem>
                    <SelectItem value="Besiktas">Beşiktaş</SelectItem>
                    <SelectItem value="Sisli">Şişli</SelectItem>
                    <SelectItem value="Karakoy">Karaköy</SelectItem>
                    <SelectItem value="Uskudar">Üsküdar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fiyat Seviyesi (1-4)</label>
                <Input type="number" min={1} max={4} {...register('price_range', { valueAsNumber: true })} className="border-zinc-200 dark:border-zinc-800" />
                {errors.price_range && <p className="text-xs text-red-500">{errors.price_range.message}</p>}
              </div>

              {/* Photo URL */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kapak Fotoğrafı URL</label>
                <Input placeholder="https://images.unsplash.com/..." {...register('photo_url')} className="border-zinc-200 dark:border-zinc-800" />
                {errors.photo_url && <p className="text-xs text-red-500">{errors.photo_url.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Açıklama (AI Araması için Kritik)</label>
                <textarea
                  placeholder="Mekanın atmosferini, sunduğu spesiyalleri ve öne çıkan özelliklerini detaylıca yazın..."
                  rows={4}
                  {...register('description')}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-zinc-200 dark:border-zinc-800"
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              {/* Features */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Özellikler (Virgülle Ayrılmış)</label>
                <Input placeholder="wifi, otopark, alkollü, teras, sessiz" {...register('features')} className="border-zinc-200 dark:border-zinc-800" />
              </div>

              {/* Lat / Long */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Enlem (Latitude)</label>
                <Input type="number" step="any" placeholder="41.0082" {...register('latitude', { valueAsNumber: true })} className="border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Boylam (Longitude)</label>
                <Input type="number" step="any" placeholder="28.9784" {...register('longitude', { valueAsNumber: true })} className="border-zinc-200 dark:border-zinc-800" />
              </div>

              {/* Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Açılış Saati (SS:DD)</label>
                <Input placeholder="09:00" {...register('opening_time')} className="border-zinc-200 dark:border-zinc-800" />
                {errors.opening_time && <p className="text-xs text-red-500">{errors.opening_time.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Kapanış Saati (SS:DD)</label>
                <Input placeholder="22:00" {...register('closing_time')} className="border-zinc-200 dark:border-zinc-800" />
                {errors.closing_time && <p className="text-xs text-red-500">{errors.closing_time.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Telefon Numarası</label>
                <Input placeholder="0212 345 67 89" {...register('phone_number')} className="border-zinc-200 dark:border-zinc-800" />
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tam Adres</label>
                <Input placeholder="Caferağa Mah. Moda Cad. No: 12..." {...register('address')} className="border-zinc-200 dark:border-zinc-800" />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
            <Link href="/venues">
              <Button type="button" variant="ghost" className="text-zinc-500">Vazgeç</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-500 gap-2 rounded-xl h-11 px-6">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mekan Ekleniyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Mekanı Kaydet
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
