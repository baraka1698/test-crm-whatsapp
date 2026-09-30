'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA, formatDate } from '@/lib/utils/format';
import { calculateBalance, calculateOrderStatus } from '@/lib/utils/balance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Search } from 'lucide-react';

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type Client = {
  id: string;
  name: string;
};

type Payment = {
  order_id: string;
  amount: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [ordersRes, clientsRes, paymentsRes] = await Promise.all([
        supabase.from('orders').select('id, client_id, total_amount, status, created_at').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name'),
        supabase.from('payments').select('order_id, amount'),
      ]);
      setOrders(ordersRes.data || []);
      setClients(clientsRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach((c) => (map[c.id] = c));
    return map;
  }, [clients]);

  const paymentsByOrder = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    for (const p of payments) {
      if (!map[p.order_id]) map[p.order_id] = [];
      map[p.order_id].push(p);
    }
    return map;
  }, [payments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const client = clientMap[o.client_id];
      return client?.name.toLowerCase().includes(q) || false;
    });
  }, [orders, search, clientMap]);

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
          <h1 className="text-xl font-bold text-foreground">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/orders/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Commande
          </Button>
        </Link>
      </div>

      {orders.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          {orders.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>
              <Link href="/orders/new" className="mt-4 inline-block">
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Créer une commande
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune commande ne correspond.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const client = clientMap[order.client_id];
            const orderPayments = paymentsByOrder[order.id] || [];
            const balance = calculateBalance(order.total_amount, orderPayments);
            const status = calculateOrderStatus(order.total_amount, orderPayments);
            const statusColors: Record<string, string> = {
              unpaid: 'bg-red-50 text-red-600',
              partial: 'bg-amber-50 text-amber-600',
              paid: 'bg-green-50 text-green-600',
            };
            const statusLabels: Record<string, string> = {
              unpaid: 'Non payé',
              partial: 'Partiel',
              paid: 'Payé',
            };
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {client?.name || 'Client'}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {formatFCFA(order.total_amount)}
                        </p>
                        {balance > 0 && (
                          <p className="text-xs text-red-500">Solde: {formatFCFA(balance)}</p>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}>
                        {statusLabels[status]}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
