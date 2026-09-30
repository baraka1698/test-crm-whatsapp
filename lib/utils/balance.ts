export function calculateBalance(
  totalAmount: number,
  payments: { amount: number }[]
): number {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return Math.max(0, totalAmount - totalPaid);
}

export function calculateTotalPaid(payments: { amount: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export type OrderStatus = 'unpaid' | 'partial' | 'paid';

export function calculateOrderStatus(
  totalAmount: number,
  payments: { amount: number }[]
): OrderStatus {
  const balance = calculateBalance(totalAmount, payments);
  if (balance <= 0) return 'paid';
  const totalPaid = calculateTotalPaid(payments);
  if (totalPaid === 0) return 'unpaid';
  return 'partial';
}
