import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  calculateTotalPaid,
  calculateOrderStatus,
} from '@/lib/utils/balance';

describe('calculateBalance', () => {
  it('36000 - 15000 = 21000', () => {
    expect(calculateBalance(36000, [{ amount: 15000 }])).toBe(21000);
  });

  it('36000 - 15000 - 10000 = 11000', () => {
    expect(
      calculateBalance(36000, [{ amount: 15000 }, { amount: 10000 }])
    ).toBe(11000);
  });

  it('36000 - 15000 - 21000 = 0', () => {
    expect(
      calculateBalance(36000, [{ amount: 15000 }, { amount: 21000 }])
    ).toBe(0);
  });

  it('no payments returns full amount', () => {
    expect(calculateBalance(36000, [])).toBe(36000);
  });

  it('overpayment returns 0 (not negative)', () => {
    expect(
      calculateBalance(36000, [{ amount: 40000 }])
    ).toBe(0);
  });
});

describe('calculateTotalPaid', () => {
  it('sums all payments', () => {
    expect(
      calculateTotalPaid([{ amount: 15000 }, { amount: 5000 }, { amount: 10000 }])
    ).toBe(30000);
  });

  it('no payments returns 0', () => {
    expect(calculateTotalPaid([])).toBe(0);
  });
});

describe('calculateOrderStatus', () => {
  it('no payments = unpaid', () => {
    expect(calculateOrderStatus(36000, [])).toBe('unpaid');
  });

  it('partial payment = partial', () => {
    expect(calculateOrderStatus(36000, [{ amount: 15000 }])).toBe('partial');
  });

  it('full payment = paid', () => {
    expect(calculateOrderStatus(36000, [{ amount: 36000 }])).toBe('paid');
  });

  it('overpayment = paid', () => {
    expect(calculateOrderStatus(36000, [{ amount: 40000 }])).toBe('paid');
  });

  it('multiple payments summing to total = paid', () => {
    expect(
      calculateOrderStatus(36000, [
        { amount: 15000 },
        { amount: 10000 },
        { amount: 11000 },
      ])
    ).toBe('paid');
  });
});
