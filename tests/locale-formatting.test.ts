import { describe, it, expect } from 'vitest';
import { formatDZDAmount, formatDocumentCurrency } from '../lib/inheritance/document-branding';

describe('Algerian Locale (ar-DZ) and DZD Formatting Runtime Verification', () => {
  it('asserts that Node/edge runtime supports ar-DZ locale and produces expected grouped output', () => {
    const num = 1234567;
    const formatted = num.toLocaleString('ar-DZ');
    
    // Ensure it doesn't fail or fall back to ungrouped string
    expect(formatted).not.toEqual('1234567');
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('567');

    const intlFormatted = new Intl.NumberFormat('ar-DZ').format(num);
    expect(intlFormatted).not.toEqual('1234567');
    expect(intlFormatted).toContain('1');
    expect(intlFormatted).toContain('234');
    expect(intlFormatted).toContain('567');
  });

  it('asserts formatDZDAmount helper produces unified grouping for screen and exports', () => {
    expect(formatDZDAmount(1234567)).toBe('1.234.567');
    expect(formatDZDAmount(1234567, 'western', true)).toBe('1.234.567 دج');
    expect(formatDZDAmount(1234567.5, 'western', true)).toBe('1.234.567,50 دج');
    expect(formatDZDAmount(0)).toBe('0');
    expect(formatDZDAmount(0, 'western', true)).toBe('0 دج');
    expect(formatDZDAmount(-500000, 'western', true)).toBe('-500.000 دج');
  });

  it('asserts formatDocumentCurrency and formatDZDAmount produce identical grouped outputs', () => {
    const amount = 50000000;
    const docCurrency = formatDocumentCurrency(amount, false, 'western', 'ar');
    const dzdAmountWithSymbol = formatDZDAmount(amount, 'western', true);

    expect(docCurrency).toBe('50.000.000 دج');
    expect(dzdAmountWithSymbol).toBe('50.000.000 دج');
  });
});
