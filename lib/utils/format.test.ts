import { describe, it, expect } from 'vitest';
import {
  formatFCFA,
  normalizePhone,
  buildWhatsAppUrl,
  generateReminderMessage,
} from '@/lib/utils/format';

describe('formatFCFA', () => {
  it('formats 36000 correctly', () => {
    expect(formatFCFA(36000)).toMatch(/36[\s\u202f]000 FCFA/);
  });

  it('formats 0 correctly', () => {
    expect(formatFCFA(0)).toBe('0 FCFA');
  });

  it('formats 21000 correctly', () => {
    expect(formatFCFA(21000)).toMatch(/21[\s\u202f]000 FCFA/);
  });
});

describe('normalizePhone', () => {
  it('removes spaces and dashes', () => {
    expect(normalizePhone('+221 77 123 45 67')).toBe('221771234567');
  });

  it('converts leading 0 to 221 prefix', () => {
    expect(normalizePhone('0771234567')).toBe('221771234567');
  });

  it('removes + prefix', () => {
    expect(normalizePhone('+221771234567')).toBe('221771234567');
  });

  it('removes 00 prefix', () => {
    expect(normalizePhone('00221771234567')).toBe('221771234567');
  });

  it('removes parentheses and dots', () => {
    expect(normalizePhone('(221) 77.123.45.67')).toBe('221771234567');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds correct wa.me URL with encoded message', () => {
    const url = buildWhatsAppUrl('+221 77 123 45 67', 'Bonjour');
    expect(url).toBe('https://wa.me/221771234567?text=Bonjour');
  });

  it('encodes special characters in message', () => {
    const url = buildWhatsAppUrl('+221 77 123 45 67', 'Bonjour! Comment ça va?');
    expect(url).toContain('https://wa.me/221771234567?text=');
    expect(url).toContain('Bonjour');
    expect(url).toContain('%C3%A7a');
  });
});

describe('generateReminderMessage', () => {
  it('includes client name and balance', () => {
    const msg = generateReminderMessage('Mariam', 21000);
    expect(msg).toContain('Mariam');
    expect(msg).toMatch(/21[\s\u202f]000 FCFA/);
  });

  it('contains greeting and thanks', () => {
    const msg = generateReminderMessage('Fatou', 15500);
    expect(msg).toContain('Bonjour');
    expect(msg).toContain('Merci');
  });
});
