'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Mail, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        setName(data?.name || '');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-foreground">Profil</h1>

      <Card className="mb-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4 divide-y divide-border">
        <div className="flex items-center gap-3 p-4">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-foreground">{email}</span>
        </div>
      </Card>

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ReliaPay — Micro-CRM WhatsApp
      </p>
    </div>
  );
}
