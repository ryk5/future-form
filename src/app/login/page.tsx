'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        router.replace('/dashboard');
      }
    });
    // Optionally, subscribe to auth state changes:
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
      if (session?.user) {
        router.replace('/dashboard');
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : ''}
        />
      </div>
    );
  }

  return null;
}