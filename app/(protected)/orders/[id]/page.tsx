'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatFCFA, formatDate, buildWhatsAppUrl, generateReminderMessage } from '@/lib/utils/format';
import { calculateBalance, calculateOrderStatus, calculateTotalPaid } from '@/lib/utils/balance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Wallet,
  Plus,
  MessageCircle,
  Bell,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

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
  phone: string;
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
  scheduled_at: string;
  status: string;
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reminderDate, setReminderDate] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (orderErr || !orderData) {
        toast.error('Commande introuvable');
        router.push('/orders');
        return;
      }

      setOrder(orderData);

      const [clientRes, paymentsRes, remindersRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone').eq('id', orderData.client_id).maybeSingle(),
        supabase.from('payments').select('id, order_id, amount, payment_method, created_at').eq('order_id', params.id).order('created_at', { ascending: false }),
        supabase.from('reminders').select('id, scheduled_at, status').eq('order_id', params.id).order('created_at', { ascending: false }),
      ]);

      setClient(clientRes.data);
      setPayments(paymentsRes.data || []);
      setReminders(remindersRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [params.id, router]);

  async function refreshData() {
    const supabase = createClient();
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('id, order_id, amount, payment_method, created_at')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false });
    setPayments(paymentsData || []);

    const { data: remindersData } = await supabase
      .from('reminders')
      .select('id, scheduled_at, status')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false });
    setReminders(remindersData || []);

    if (order) {
      const newStatus = calculateOrderStatus(order.total_amount, paymentsData || []);
      if (newStatus !== order.status) {
        const { data: updatedOrder } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', params.id)
          .select('*')
          .maybeSingle();
        if (updatedOrder) setOrder(updatedOrder);
      }
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('payments').insert({
      order_id: params.id,
      amount,
      payment_method: paymentMethod,
    });

    if (error) {
      toast.error(`Erreur lors de l'enregistrement`);
      setSubmitting(false);
      return;
    }

    toast.success('Paiement enregistre');
    setPaymentAmount('');
    setPaymentMethod('cash');
    setShowPaymentForm(false);
    setSubmitting(false);
    refreshData();
  }

  async function handleReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !client) return;

    let scheduledAt: string;
    const now = new Date();

    if (reminderDate === 'today') {
      scheduledAt = now.toISOString();
    } else if (reminderDate === '3days') {
      now.setDate(now.getDate() + 3);
      scheduledAt = now.toISOString();
    } else if (reminderDate === '7days') {
      now.setDate(now.getDate() + 7);
      scheduledAt = now.toISOString();
    } else {
      if (!customDate) {
        toast.error('Selectionnez une date');
        return;
      }
      scheduledAt = new Date(customDate).toISOString();
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from('reminders').insert({
      client_id: client.id,
      order_id: order.id,
      scheduled_at: scheduledAt,
      status: 'pending',
    });

    if (error) {
      toast.error(`Erreur lors de la programmation`);
      setSubmitting(false);
      return;
    }

    toast.success('Relance programmee');
    setShowReminderForm(false);
    setSubmitting(false);
    refreshData();
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Supprimer ce paiement ?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
      return;
    }
    toast.success('Paiement supprime');
    refreshData();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order || !client) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-center text-muted-foreground">Commande introuvable</p>
      </div>
    );
  }

  const totalPaid = calculateTotalPaid(payments);
  const balance = calculateBalance(order.total_amount, payments);
  const status = calculateOrderStatus(order.total_amount, payments);
  const statusColors: Record<string, string> = {
    unpaid: 'bg-red-50 text-red-600',
    partial: 'bg-amber-50 text-amber-600',
    paid: 'bg-green-50 text-green-600',
  };
  const statusLabels: Record<string, string> = {
    unpaid: 'Non paye',
    partial: 'Partiel',
    paid: 'Paye',
  };
  const methodLabels: Record<string, string> = {
    cash: 'Especes',
    mobile_money: 'Mobile Money',
    transfer: 'Virement',
    other: 'Autre',
  };

  const whatsappUrl = balance > 0
    ? buildWhatsAppUrl(client.phone, generateReminderMessage(client.name, balance))
    : buildWhatsAppUrl(client.phone, `Bonjour ${client.name}`);

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/clients/${client.id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Commande</h1>
      </div>

      {/* Order summary */}
      <Card className="mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <Link href={`/clients/${client.id}`} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-foreground">{formatFCFA(order.total_amount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Paye</p>
            <p className="text-sm font-bold text-green-600">{formatFCFA(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className={`text-sm font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatFCFA(balance)}
            </p>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="gap-1"
          onClick={() => {
            setShowPaymentForm(!showPaymentForm);
            setShowReminderForm(false);
          }}
        >
          <Plus className="h-4 w-4" />
          Paiement
        </Button>
        {balance > 0 && (
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => {
              setShowReminderForm(!showReminderForm);
              setShowPaymentForm(false);
            }}
          >
            <Bell className="h-4 w-4" />
            Relancer
          </Button>
        )}
      </div>

      {/* Payment form */}
      {showPaymentForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={handlePayment} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pamount">Montant (FCFA) *</Label>
              <Input
                id="pamount"
                type="number"
                placeholder={balance > 0 ? `Solde: ${balance}` : 'Montant'}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
                required
              />
              {balance > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setPaymentAmount(balance.toString())}
                >
                  Solder ({formatFCFA(balance)})
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pmethod">Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="pmethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Especes</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentForm(false)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? '...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reminder form */}
      {showReminderForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleReminder} className="space-y-3">
            <div className="space-y-2">
              <Label>Programmer pour</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={reminderDate === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setReminderDate('today')}>
                  Aujourd&apos;hui
                </Button>
                <Button type="button" variant={reminderDate === '3days' ? 'default' : 'outline'} size="sm" onClick={() => setReminderDate('3days')}>
                  Dans 3 jours
                </Button>
                <Button type="button" variant={reminderDate === '7days' ? 'default' : 'outline'} size="sm" onClick={() => setReminderDate('7days')}>
                  Dans 7 jours
                </Button>
                <Button type="button" variant={reminderDate === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setReminderDate('custom')}>
                  Date custom
                </Button>
              </div>
            </div>
            {reminderDate === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="rdate">Date</Label>
                <Input
                  id="rdate"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowReminderForm(false)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? '...' : 'Programmer'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* WhatsApp button */}
      {balance > 0 && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mb-4 block">
          <Button className="w-full gap-1 bg-[#25D366] hover:bg-[#1da851]">
            <MessageCircle className="h-4 w-4" />
            Relancer sur WhatsApp
          </Button>
        </a>
      )}

      {/* Payments list */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Paiements ({payments.length})
          </h2>
        </div>

        {payments.length === 0 ? (
          <Card className="p-6 text-center">
            <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucun paiement enregistre</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">{formatFCFA(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {methodLabels[p.payment_method] || p.payment_method} - {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDeletePayment(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reminders list */}
      {reminders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Relances ({reminders.length})
          </h2>
          <div className="space-y-2">
            {reminders.map((r) => {
              const rStatusColors: Record<string, string> = {
                pending: 'bg-amber-50 text-amber-600',
                completed: 'bg-green-50 text-green-600',
                cancelled: 'bg-gray-100 text-gray-500',
              };
              const rStatusLabels: Record<string, string> = {
                pending: 'En attente',
                completed: 'Effectuee',
                cancelled: 'Annulee',
              };
              return (
                <Card key={r.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{formatDate(r.scheduled_at)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rStatusColors[r.status]}`}>
                    {rStatusLabels[r.status]}
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
