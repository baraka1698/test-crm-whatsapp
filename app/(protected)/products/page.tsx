'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  function resetForm() {
    setName('');
    setPrice('');
    setEditId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Le prix doit être un nombre positif');
      return;
    }

    const supabase = createClient();

    if (editId) {
      const { error } = await supabase
        .from('products')
        .update({ name: name.trim(), price: priceNum })
        .eq('id', editId);
      if (error) {
        toast.error('Erreur lors de la modification');
        return;
      }
      toast.success('Produit modifié');
    } else {
      const { error } = await supabase
        .from('products')
        .insert({ name: name.trim(), price: priceNum });
      if (error) {
        toast.error(`Erreur lors de l'ajout`);
        return;
      }
      toast.success('Produit ajouté');
    }

    resetForm();
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }
    toast.success('Produit supprimé');
    fetchProducts();
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Produits</h1>
            <p className="text-sm text-muted-foreground">
              {products.length} produit{products.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Fermer' : 'Produit'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pname">Nom du produit</Label>
              <Input
                id="pname"
                placeholder="Ex: Sac de riz 25kg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pprice">Prix (FCFA)</Label>
              <Input
                id="pprice"
                type="number"
                placeholder="Ex: 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                {editId ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {products.length === 0 && !showForm ? (
        <Card className="p-8 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun produit. Ajoutez-en un pour aller plus vite lors de la création de commandes.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="text-sm text-muted-foreground">{formatFCFA(p.price)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
