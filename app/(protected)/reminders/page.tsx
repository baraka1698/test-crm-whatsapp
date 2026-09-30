'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA, formatDate, buildWhatsAppUrl, generateReminderMessage } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, MessageCircle, ChevronRight } from 'lucide-react';

type Reminder = {
  id: string;
  client_id: string;
  order_id: string;
  scheduled_at: string;
  status: string;
};

type Client = {
  id: string;
  name: string;
  phone: string;
};

type Order = {
  id: string;
  total_amount: number;
};

type Payment = {
  order_id: string;
  amount: number;
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [remindersRes, clientsRes, ordersRes, paymentsRes] = await Promise.all([
        supabase.from('reminders').select('id, client_id, order_id, scheduled_at, status').order('scheduled_at', { ascending: true }),
        supabase.from('clients').select('id, name, phone'),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('payments').select('order_id, amount'),
      ]);
      setReminders(remindersRes.data || []);
      setClients(clientsRes.data || []);
      setOrders(ordersRes.data || []);
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

  const orderMap = useMemo(() => {
    const map: Record<string, Order> = {};
    orders.forEach((o) => (map[o.id] = o));
    return map;
  }, [orders]);

  const balanceByOrder = useMemo(() => {
    const paidByOrder: Record<string, number> = {};
    for (const p of payments) {
      paidByOrder[p.order_id] = (paidByOrder[p.order_id] || 0) + p.amount;
    }
    const balances: Record<string, number> = {};
    for (const o of orders) {
      balances[o.id] = Math.max(0, o.total_amount - (paidByOrder[o.id] || 0));
    }
    return balances;
  }, [orders, payments]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueReminders = reminders.filter((r) => {
    if (r.status !== 'pending') return false;
    const d = new Date(r.scheduled_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  });

  const upcomingReminders = reminders.filter((r) => {
    if (r.status !== 'pending') return false;
    const d = new Date(r.scheduled_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  });

  const pastReminders = reminders.filter((r) => r.status !== 'pending');

  function renderReminder(r: Reminder) {
    const client = clientMap[r.client_id];
    const balance = balanceByOrder[r.order_id] || 0;
    const statusColors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600',
      completed: 'bg-green-50 text-green-600',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Effectuée',
      cancelled: 'Annulée',
    };
    const whatsappUrl = client && balance > 0
      ? buildWhatsAppUrl(client.phone, generateReminderMessage(client.name, balance))
      : '#';

    return (
      <Card key={r.id} className="p-4">
        <div className="flex items-center justify-between">
          <Link href={`/clients/${r.client_id}`} className="flex-1">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  {client?.name || 'Client'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(r.scheduled_at)}
                  {balance > 0 && ` - Solde: ${formatFCFA(balance)}`}
                </p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[r.status]}`}>
              {statusLabels[r.status]}
            </span>
            {r.status === 'pending' && balance > 0 && client && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1 bg-[#25D366] hover:bg-[#1da851]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Relancer
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Relances</h1>
        <p className="text-sm text-muted-foreground">
          Suivez vos rappels de paiement
        </p>
      </div>

      {reminders.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucune relance programmée.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les relances se créent depuis la fiche d'une commande.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {dueReminders.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  A échéance ({dueReminders.length})
                </h2>
              </div>
              <div className="space-y-2">
                {dueReminders.map(renderReminder)}
              </div>
            </div>
          )}

          {upcomingReminders.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                À venir ({upcomingReminders.length})
              </h2>
              <div className="space-y-2">
                {upcomingReminders.map(renderReminder)}
              </div>
            </div>
          )}

          {pastReminders.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                Historique ({pastReminders.length})
              </h2>
              <div className="space-y-2">
                {pastReminders.map(renderReminder)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
