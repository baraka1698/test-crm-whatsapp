'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Phone, Tag } from 'lucide-react';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (fetched) return;
    const supabase = createClient();
    supabase
      .from('clients')
      .select('name, phone, tags')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Client introuvable');
          router.push('/clients');
          return;
        }
        setName(data.name);
        setPhone(data.phone);
        setTags(data.tags || '');
        setFetched(true);
      });
  }, [params.id, fetched, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return;
    }

    const phoneDigits = phone.replace(/[\s\-().]/g, '');
    if (phoneDigits.length < 8) {
      toast.error('Le numéro doit contenir au moins 8 chiffres');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('clients')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          tags: tags.trim(),
        })
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Client modifié avec succès');
      router.push(`/clients/${params.id}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Erreur lors de la modification`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/clients/${params.id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Modifier le client</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du client *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Ex: Mariam Diop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro WhatsApp *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +221 77 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optionnel)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="tags"
                placeholder="Ex: VIP, Grossiste"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/clients/${params.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Modification...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
