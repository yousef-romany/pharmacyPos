
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store'; // Import the auth store
import { LogIn, Loader2 } from 'lucide-react';
import { getUserForLogin } from '@/lib/data'; // Import login function

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const login = useAuthStore((state) => state.login); // Get login function from store

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // --- IMPORTANT ---
      // This is a simplified login. In a real app:
      // 1. Send username and password to a server endpoint.
      // 2. The server verifies the password hash against the stored hash.
      // 3. The server returns a session token (e.g., JWT) or user data on success.
      // Here, we simulate by fetching the user and checking password match.
      // DO NOT use this in production without proper password hashing and server-side validation.
      const user = await getUserForLogin(username); // Fetch user by username

      if (user && user.passwordHash === password) {
        // Check if password matches (should be hashed in production)
        login(user); // Update the auth store
        toast({ title: 'تسجيل الدخول ناجح', description: `مرحباً ${user.name}!` });
        router.replace('/dashboard'); // Redirect to dashboard
      } else {
        toast({ title: 'فشل تسجيل الدخول', description: 'اسم المستخدم أو كلمة المرور غير صحيحة.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء محاولة تسجيل الدخول.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل اسم المستخدم وكلمة المرور للوصول للنظام</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
