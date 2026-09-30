export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0')) cleaned = '221' + cleaned.slice(1);
  return cleaned;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function generateReminderMessage(
  clientName: string,
  balance: number
): string {
  return `Bonjour ${clientName} 👋

Petit rappel concernant votre commande.

Il reste ${formatFCFA(balance)} à régler.

Merci beaucoup 🙏`;
}
