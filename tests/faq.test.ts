import { describe, it, expect } from 'vitest';
import { FAQ_ITEMS } from '@/data/faq';
import fs from 'fs';
import path from 'path';

describe('FAQ & JSON-LD Parity', () => {
  it('FAQ_ITEMS contains valid questions and answers', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(0);
    FAQ_ITEMS.forEach(item => {
      expect(typeof item.question).toBe('string');
      expect(item.question.length).toBeGreaterThan(0);
      expect(typeof item.answer).toBe('string');
      expect(item.answer.length).toBeGreaterThan(0);
    });
  });

  it('app/layout.tsx embeds FAQ_ITEMS in FAQPage JSON-LD and FAQ components consume them', () => {
    const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    expect(layoutContent).toContain('FAQPage');
    expect(layoutContent).toContain('FAQ_ITEMS');

    const faqSectionPath = path.join(process.cwd(), 'components/inheritance/FaqSection.tsx');
    const faqSectionContent = fs.readFileSync(faqSectionPath, 'utf-8');
    expect(faqSectionContent).toContain('FAQ_ITEMS');

    const faqPagePath = path.join(process.cwd(), 'app/faq/page.tsx');
    const faqPageContent = fs.readFileSync(faqPagePath, 'utf-8');
    expect(faqPageContent).toContain('FaqSection');
  });
});
