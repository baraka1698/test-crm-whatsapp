'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ShoppingCart, Package, User } from 'lucide-react';

type Client = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function NewOrderPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [mode, setMode] = useState<'product' | 'amount'>('amount');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [clientsRes, productsRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase.from('products').select('id, name, price').order('name'),
      ]);
      setClients(clientsRes.data || []);
      setProducts(productsRes.data || []);

      const preselectedClient = searchParams.get('client_id');
      if (preselectedClient) setSelectedClient(preselectedClient);

      setFetching(false);
    }
    fetchData();
  }, [searchParams]);

  const computedAmount =
    mode === 'product' && selectedProduct
      ? (() => {
          const product = products.find((p) => p.id === selectedProduct);
          const qty = parseInt(quantity) || 1;
          return product ? product.price * qty : 0;
        })()
      : parseFloat(customAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      toast.error('Sélectionnez un client');
      return;
    }

    if (computedAmount <= 0) {
      toast.error('Le montant doit être positif');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .insert({
          client_id: selectedClient,
          total_amount: computedAmount,
          status: 'unpaid',
        })
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Commande créée');
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/orders">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Nouvelle commande</h1>
        </div>
        <Card className="p-8 text-center">
          <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Vous devez d'abord créer un client.
          </p>
          <Link href="/clients/new" className="mt-4 inline-block">
            <Button size="sm" className="gap-1">
              Créer un client
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nouvelle commande</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Sélectionnez un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mode de saisie</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === 'amount' ? 'default' : 'outline'}
                onClick={() => setMode('amount')}
                className="gap-1"
              >
                Montant libre
              </Button>
              <Button
                type="button"
                variant={mode === 'product' ? 'default' : 'outline'}
                onClick={() => setMode('product')}
                className="gap-1"
              >
                <Package className="h-4 w-4" />
                Produit
              </Button>
            </div>
          </div>

          {mode === 'product' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="product">Produit *</Label>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun produit. Ajoutez-en dans l'onglet Produits, ou utilisez le mode "Montant libre".
                  </p>
                ) : (
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Sélectionnez un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatFCFA(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedProduct && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="amount">Montant total (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 36000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="1"
                required
              />
            </div>
          )}

          {computedAmount > 0 && (
            <div className="rounded-lg bg-accent/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Montant total</p>
              <p className="text-lg font-bold text-foreground">
                {formatFCFA(computedAmount)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Création...' : 'Créer la commande'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
