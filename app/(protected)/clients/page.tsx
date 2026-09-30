'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Phone, Tag } from 'lucide-react';

type Client = {
  id: string;
  name: string;
  phone: string;
  tags: string;
};

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
};

type Payment = {
  order_id: string;
  amount: number;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [clientsRes, ordersRes, paymentsRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone, tags').order('created_at', { ascending: false }),
        supabase.from('orders').select('id, client_id, total_amount'),
        supabase.from('payments').select('order_id, amount'),
      ]);

      setClients(clientsRes.data || []);
      setOrders(ordersRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const clientBalances = useMemo(() => {
    const orderPaid: Record<string, number> = {};
    for (const p of payments) {
      orderPaid[p.order_id] = (orderPaid[p.order_id] || 0) + p.amount;
    }
    const balances: Record<string, number> = {};
    for (const o of orders) {
      const bal = Math.max(0, o.total_amount - (orderPaid[o.id] || 0));
      if (bal > 0) {
        balances[o.client_id] = (balances[o.client_id] || 0) + bal;
      }
    }
    return balances;
  }, [orders, payments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.tags || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Client
          </Button>
        </Link>
      </div>

      {clients.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          {clients.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre premier client pour commencer.
              </p>
              <Link href="/clients/new" className="mt-4 inline-block">
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter un client
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun client ne correspond à votre recherche.
            </p>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const balance = clientBalances[client.id] || 0;
            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                      {client.tags && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          {client.tags}
                        </div>
                      )}
                    </div>
                  </div>
                  {balance > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Solde dû</p>
                      <p className="font-bold text-red-500">{formatFCFA(balance)}</p>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
