'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA, formatDate, buildWhatsAppUrl, generateReminderMessage } from '@/lib/utils/format';
import { calculateBalance, calculateOrderStatus } from '@/lib/utils/balance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Phone,
  Tag,
  ShoppingCart,
  Wallet,
  Plus,
  MessageCircle,
  Pencil,
  Trash2,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type Client = {
  id: string;
  name: string;
  phone: string;
  tags: string;
  created_at: string;
};

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  created_at: string;
};

type Reminder = {
  id: string;
  order_id: string;
  scheduled_at: string;
  status: string;
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [clientRes, ordersRes, paymentsRes, remindersRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', params.id).maybeSingle(),
        supabase.from('orders').select('id, total_amount, status, created_at').eq('client_id', params.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('id, order_id, amount, payment_method, created_at').in('order_id', (await supabase.from('orders').select('id').eq('client_id', params.id)).data?.map((o: { id: string }) => o.id) || []),
        supabase.from('reminders').select('id, order_id, scheduled_at, status').eq('client_id', params.id).order('created_at', { ascending: false }),
      ]);

      setClient(clientRes.data);
      setOrders(ordersRes.data || []);
      setPayments(paymentsRes.data || []);
      setReminders(remindersRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce client et toutes ses commandes ? Cette action est irréversible.')) return;

    const supabase = createClient();
    const { error } = await supabase.from('clients').delete().eq('id', params.id);
    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }
    toast.success('Client supprimé');
    router.push('/clients');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-center text-muted-foreground">Client introuvable</p>
        <Link href="/clients" className="mt-4 block text-center">
          <Button variant="outline" size="sm">Retour aux clients</Button>
        </Link>
      </div>
    );
  }

  const totalOrdered = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBalance = Math.max(0, totalOrdered - totalPaid);

  const paymentsByOrder: Record<string, Payment[]> = {};
  for (const p of payments) {
    if (!paymentsByOrder[p.order_id]) paymentsByOrder[p.order_id] = [];
    paymentsByOrder[p.order_id].push(p);
  }

  const whatsappUrl = totalBalance > 0
    ? buildWhatsAppUrl(client.phone, generateReminderMessage(client.name, totalBalance))
    : buildWhatsAppUrl(client.phone, `Bonjour ${client.name} 👋`);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Client info */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
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

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Commandé</p>
          <p className="mt-1 text-sm font-bold text-foreground">{formatFCFA(totalOrdered)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Payé</p>
          <p className="mt-1 text-sm font-bold text-green-600">{formatFCFA(totalPaid)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Restant</p>
          <p className={`mt-1 text-sm font-bold ${totalBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {formatFCFA(totalBalance)}
          </p>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Link href={`/orders/new?client_id=${client.id}`}>
          <Button variant="outline" className="w-full gap-1">
            <Plus className="h-4 w-4" />
            Commande
          </Button>
        </Link>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <Button className="w-full gap-1 bg-[#25D366] hover:bg-[#1da851]">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>
      </div>

      {/* Orders history */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Commandes ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <Card className="p-6 text-center">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune commande</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
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
                        <p className="font-medium text-foreground">{formatFCFA(order.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {balance > 0 && (
                          <span className="text-sm font-medium text-red-500">
                            Solde: {formatFCFA(balance)}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}>
                          {statusLabels[status]}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Relances ({reminders.length})
          </h2>
          <div className="space-y-2">
            {reminders.map((r) => {
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
              return (
                <Card key={r.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{formatDate(r.scheduled_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Payments history */}
      {payments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Paiements ({payments.length})
          </h2>
          <div className="space-y-2">
            {payments.map((p) => {
              const methodLabels: Record<string, string> = {
                cash: 'Espèces',
                mobile_money: 'Mobile Money',
                transfer: 'Virement',
                other: 'Autre',
              };
              return (
                <Card key={p.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatFCFA(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {methodLabels[p.payment_method] || p.payment_method} - {formatDate(p.created_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
