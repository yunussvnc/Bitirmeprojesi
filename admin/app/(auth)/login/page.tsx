'use client';

import axios from 'axios';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { getSafeRedirectPath } from '@/lib/safe-redirect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, ShieldAlert, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
});

type LoginFields = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { user } = response.data;
      setUser(user);
      toast.success('Giriş Başarılı', {
        description: 'Yönetim paneline yönlendiriliyorsunuz...',
      });

      const redirect = getSafeRedirectPath(searchParams.get('redirect'));
      router.push(redirect);
    } catch (error) {
      console.error('Login error:', error);
      const detail = axios.isAxiosError<{ detail?: string }>(error)
        ? error.response?.data?.detail || 'Giriş yapılırken bir hata oluştu.'
        : 'Giriş yapılırken bir hata oluştu.';
      toast.error('Giriş Başarısız', {
        description: detail,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md">
      <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl shadow-indigo-950/20">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            AsEmOs Yönetim
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Yönetici kimlik bilgilerinizle sisteme giriş yapın.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                E-posta
              </label>
              <Input
                type="email"
                placeholder="admin@asemos.app"
                {...register('email')}
                className="border-zinc-800 bg-zinc-950/40 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500/20"
              />
              {errors.email && (
                <p className="flex items-center gap-1 text-[11px] text-red-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Şifre
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="border-zinc-800 bg-zinc-950/40 pr-10 text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-violet-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-[11px] text-red-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 py-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bağlanılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </Button>
            <div className="text-center text-[10px] text-zinc-500">
              Bu sistem izinsiz erişimlere karşı izlenmektedir.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[40%] left-[20%] h-[80%] w-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[40%] right-[20%] h-[80%] w-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      </div>

      <Suspense fallback={
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-2" />
          <span className="text-xs text-zinc-400">Giriş ekranı yükleniyor...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
