'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShoppingCart,
  Wallet,
  TrendingDown,
  Bell,
  ArrowRight,
  Plus,
} from 'lucide-react';

type Client = {
  id: string;
  name: string;
  phone: string;
};

type Order = {
  id: string;
  total_amount: number;
  client_id: string;
};

type Payment = {
  order_id: string;
  amount: number;
};

type Reminder = {
  id: string;
  scheduled_at: string;
  status: string;
  client_id: string;
  order_id: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [clientsRes, ordersRes, paymentsRes, remindersRes] =
        await Promise.all([
          supabase.from('clients').select('id, name, phone'),
          supabase.from('orders').select('id, total_amount, client_id'),
          supabase.from('payments').select('order_id, amount'),
          supabase.from('reminders').select('id, scheduled_at, status, client_id, order_id'),
        ]);

      setClients(clientsRes.data || []);
      setOrders(ordersRes.data || []);
      setPayments(paymentsRes.data || []);
      setReminders(remindersRes.data || []);

      const map: Record<string, Client> = {};
      (clientsRes.data || []).forEach((c) => {
        map[c.id] = c;
      });
      setClientMap(map);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Calculate balances per order
  const orderBalances: Record<string, number> = {};
  for (const order of orders) {
    const orderPayments = payments.filter((p) => p.order_id === order.id);
    const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);
    orderBalances[order.id] = Math.max(0, order.total_amount - totalPaid);
  }

  // Who owes money: aggregate by client
  const clientBalances: Record<string, number> = {};
  for (const order of orders) {
    const balance = orderBalances[order.id] || 0;
    if (balance > 0) {
      clientBalances[order.client_id] =
        (clientBalances[order.client_id] || 0) + balance;
    }
  }

  const debtors = Object.entries(clientBalances)
    .map(([clientId, balance]) => ({
      client: clientMap[clientId],
      balance,
    }))
    .filter((d) => d.client)
    .sort((a, b) => b.balance - a.balance);

  const totalToCollect = debtors.reduce((sum, d) => sum + d.balance, 0);
  const clientsWithBalance = debtors.length;

  // Today's reminders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReminders = reminders.filter((r) => {
    if (r.status !== 'pending') return false;
    const d = new Date(r.scheduled_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const stats = [
    {
      label: 'Clients',
      value: clients.length.toString(),
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Commandes',
      value: orders.length.toString(),
      icon: ShoppingCart,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: 'À récupérer',
      value: formatFCFA(totalToCollect),
      icon: Wallet,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Clients en solde',
      value: clientsWithBalance.toString(),
      icon: TrendingDown,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Client
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="truncate text-lg font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Today's reminders */}
      {todayReminders.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Relances du jour
            </h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {todayReminders.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayReminders.map((r) => {
              const client = clientMap[r.client_id];
              const balance = orderBalances[r.order_id] || 0;
              return (
                <Link key={r.id} href={`/clients/${r.client_id}`}>
                  <Card className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
                    <div>
                      <p className="font-medium text-foreground">
                        {client?.name || 'Client'}
                      </p>
                      <p className="text-sm text-red-500">
                        Solde: {formatFCFA(balance)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Who owes money */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Qui me doit de l'argent ?
          </h2>
          {debtors.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {debtors.length} client{debtors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {debtors.length === 0 ? (
          <Card className="p-8 text-center">
            <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Personne ne vous doit d'argent pour le moment.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {debtors.slice(0, 10).map((debtor, idx) => (
              <Link key={debtor.client.id} href={`/clients/${debtor.client.id}`}>
                <Card className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {debtor.client.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {debtor.client.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500">
                      {formatFCFA(debtor.balance)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Dernières commandes
          </h2>
          <Link
            href="/orders"
            className="text-xs font-medium text-primary hover:underline"
          >
            Voir tout
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Aucune commande pour le moment.
            </p>
            <Link href="/orders/new" className="mt-3 inline-block">
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />
                Créer une commande
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.slice(-5).reverse().map((order) => {
              const client = clientMap[order.client_id];
              const balance = orderBalances[order.id] || 0;
              return (
                <Link
                  key={order.id}
                  href={`/clients/${order.client_id}`}
                >
                  <Card className="flex items-center justify-between p-4 transition-colors hover:bg-accent/50">
                    <div>
                      <p className="font-medium text-foreground">
                        {client?.name || 'Client'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFCFA(order.total_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      {balance === 0 ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                          Payé
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-red-500">
                          Solde: {formatFCFA(balance)}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
