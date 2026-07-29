// lib/blocking-resolver.ts
// Hajb (حجب) resolver — Articles 159–165
// Do not modify blocking conditions without citing the relevant article.

import { BLOCKING_RULES } from '@/data/blocking-rules';

export interface BlockingContext {
  has: (id: string) => boolean;
  getCount: (id: string) => number;
  hasDirectProgeny: boolean;
  siblingsCount: number;
  hasFemaleDirectDescendant?: boolean;
}

export interface BlockingResult {
  isBlocked: boolean;
  reason: string;
  article?: number;
  partialBlocks?: { reason: string; article?: number }[];
}

export function resolveBlocking(heirId: string, ctx: BlockingContext): BlockingResult {
  const hasFemaleDirectDescendant = !!ctx.hasFemaleDirectDescendant;
  
  // الأخت الشقيقة تكون عصبة مع الغير مع البنات عند عدم العاصب لنفسها (الأخ الشقيق) أو حاجبها (الابن، ابن الابن، الأب)
  const isFullSisterAsabaMaaGhayr = ctx.has('full_sister') && hasFemaleDirectDescendant && 
                                    !ctx.has('son') && !ctx.has('son_son') && 
                                    !ctx.has('father') && !ctx.has('full_brother');

  // الأخت لأب تكون عصبة مع الغير مع البنات عند عدم العاصب لنفسها أو حاجبها أو الأخت الشقيقة العصبة أو الأخ الشقيق
  const isPaternalSisterAsabaMaaGhayr = ctx.has('paternal_sister') && hasFemaleDirectDescendant && 
                                        !ctx.has('son') && !ctx.has('son_son') && 
                                        !ctx.has('father') && !ctx.has('full_brother') &&
                                        !ctx.has('full_sister') && !ctx.has('paternal_brother');

  if (isFullSisterAsabaMaaGhayr) {
    if (['paternal_brother', 'paternal_sister', 'full_nephew', 'paternal_nephew', 'full_uncle', 'paternal_uncle', 'full_uncle_son', 'paternal_uncle_son'].includes(heirId)) {
      return { isBlocked: true, reason: 'محجوب بالأخت الشقيقة العصبة مع الغير (مع الفرع الوارث المؤنث)', article: 164 };
    }
  }
  if (isPaternalSisterAsabaMaaGhayr) {
    if (['full_nephew', 'paternal_nephew', 'full_uncle', 'paternal_uncle', 'full_uncle_son', 'paternal_uncle_son'].includes(heirId)) {
      return { isBlocked: true, reason: 'محجوب بالأخت لأب العصبة مع الغير (مع الفرع الوارث المؤنث)', article: 164 };
    }
  }

  // Collect both full and partial rules
  const rules = BLOCKING_RULES.filter(r => r.blocked === heirId);
  
  let isBlocked = false;
  let reason = '';
  let article: number | undefined;
  const partialBlocks: { reason: string; article?: number }[] = [];
  
  for (const rule of rules) {
    let isApplied = false;
    
    // Generic Blocker Handlers
    if (rule.blocker === 'direct_heir') {
      isApplied = ctx.hasDirectProgeny;
    } else if (rule.blocker === 'direct_heir_or_siblings') {
      isApplied = ctx.hasDirectProgeny || ctx.siblingsCount >= 2;
    } else if (rule.blocker === 'two_full_sisters_fard') {
      // م. 164: الأختان الشقيقتان تحجبان الأخت لأب إذا استكملتا الثلثين فرضاً
      // ذلك يعني: وجود أختين، عدم وجود الأخ الشقيق (لم تعصبا)، وعدم وجود حاجب أصلي (أب، ابن)
      const fullSistersCount = ctx.getCount('full_sister');
      const hasFullBrother = ctx.has('full_brother');
      const hasPaternalBrother = ctx.has('paternal_brother');
      const hasSon = ctx.has('son');
      const hasFather = ctx.has('father');
      
      isApplied = fullSistersCount >= 2 && !hasFullBrother && !hasPaternalBrother && !hasSon && !hasFather;
    } else if (rule.blocker === 'two_daughters') {
      isApplied = ctx.getCount('daughter') >= 2;
    } else {
      isApplied = ctx.has(rule.blocker);
    }
    
    if (isApplied) {
      if (rule.type === 'full') {
          isBlocked = true;
          reason = rule.conditionAr;
          article = rule.article;
          // Full blocks override partials
          return { isBlocked: true, reason, article };
      } else if (rule.type === 'partial') {
          partialBlocks.push({ reason: rule.conditionAr, article: rule.article });
      }
    }
  }
  
  return { isBlocked, reason, article, partialBlocks };
}
