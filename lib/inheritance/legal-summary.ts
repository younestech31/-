// lib/legal-summary.ts
// توليد ملخص نصي قانوني عربي بالصيغة الرسمية لعقود الفريضة والمناسخات
// يستند إلى الأمر 84-11 المتضمن قانون الأسرة الجزائري

import { CalculationResult } from './inheritance-calculator';
import { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import { StageResult } from '@/components/inheritance/ResultsTable';
import Fraction from 'fraction.js';

interface StageSummaryInput {
  stage: MunasakhatStage;
  results: CalculationResult[];
  netEstate: number;
  deceasedGender: 'male' | 'female' | null;
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
}

// ─── مساعدات الصياغة ───────────────────────────────────────────────────────

function formatAmount(n: number): string {
  return n.toLocaleString('ar-DZ') + ' دج';
}

function deceasedLabel(gender: 'male' | 'female' | null, name: string): string {
  const pronoun = gender === 'female' ? 'المرحومة' : 'المرحوم';
  return `${pronoun} / ${name}`;
}

/** تحويل الكسر إلى عبارة فرضية رسمية */
function shareToFardPhrase(share: string): string {
  // أصحاب الفروض الشرعية
  if (share === '1/2' || share === 'النصف') return 'بفرض النصف';
  if (share === '1/4' || share === 'الربع') return 'بفرض الربع';
  if (share === '1/8' || share === 'الثمن') return 'بفرض الثمن';
  if (share === '2/3' || share === 'الثلثان') return 'بفرض الثلثين';
  if (share === '1/3' || share === 'الثلث') return 'بفرض الثلث';
  if (share === '1/6' || share === 'السدس') return 'بفرض السدس';
  // العصبة والتعصيب
  if (share.includes('تعصيب') || share.includes('الباقي') || share.includes('الكل')) return 'تعصيباً';
  // حالات مخصوصة
  if (share.includes('1/6 +')) return 'بفرض السدس والباقي تعصيباً';
  // افتراضي
  return `بنصيب [${share}]`;
}

/** تحويل عدد السهام إلى كتابة بالحروف (مبسّطة للأرقام الشائعة) */
function numberToArabicWords(n: number): string {
  const words: Record<number, string> = {
    1: 'جزء واحد', 2: 'جزءان', 3: 'ثلاثة أجزاء', 4: 'أربعة أجزاء',
    5: 'خمسة أجزاء', 6: 'ستة أجزاء', 7: 'سبعة أجزاء', 8: 'ثمانية أجزاء',
    9: 'تسعة أجزاء', 10: 'عشرة أجزاء', 11: 'أحد عشر جزءاً', 12: 'اثنا عشر جزءاً',
    13: 'ثلاثة عشر جزءاً', 14: 'أربعة عشر جزءاً', 15: 'خمسة عشر جزءاً',
    16: 'ستة عشر جزءاً', 17: 'سبعة عشر جزءاً', 18: 'ثمانية عشر جزءاً',
    19: 'تسعة عشر جزءاً', 20: 'عشرون جزءاً', 24: 'أربعة وعشرون جزءاً',
    28: 'ثمانية وعشرون جزءاً', 32: 'اثنان وثلاثون جزءاً',
    40: 'أربعون جزءاً', 48: 'ثمانية وأربعون جزءاً',
    56: 'ستة وخمسون جزءاً', 64: 'أربعة وستون جزءاً',
    72: 'اثنان وسبعون جزءاً', 80: 'ثمانون جزءاً',
    88: 'ثمانية وثمانون جزءاً', 96: 'ستة وتسعون جزءاً',
    104: 'مائة وأربعة أجزاء', 112: 'مائة واثنا عشر جزءاً',
    120: 'مائة وعشرون جزءاً', 128: 'مائة وثمانية وعشرون جزءاً',
    144: 'مائة وأربعة وأربعون جزءاً', 160: 'مائة وستون جزءاً',
    168: 'مائة وثمانية وستون جزءاً', 176: 'مائة وستة وسبعون جزءاً',
    192: 'مائة واثنان وتسعون جزءاً', 224: 'مائتان وأربعة وعشرون جزءاً',
    240: 'مائتان وأربعون جزءاً', 320: 'ثلاثمائة وعشرون جزءاً',
  };
  return words[n] ?? `${n} جزءاً`;
}

/** أصل المسألة بالحروف */
function baseToArabicWords(n: number): string {
  const words: Record<number, string> = {
    2: 'اثنان', 3: 'ثلاثة', 4: 'أربعة', 6: 'ستة', 8: 'ثمانية',
    12: 'اثنا عشر', 16: 'ستة عشر', 24: 'أربعة وعشرون',
    32: 'اثنان وثلاثون', 36: 'ستة وثلاثون', 40: 'أربعون',
    48: 'ثمانية وأربعون', 56: 'ستة وخمسون', 64: 'أربعة وستون',
    72: 'اثنان وسبعون', 80: 'ثمانون', 88: 'ثمانية وثمانون',
    96: 'ستة وتسعون', 104: 'مائة وأربعة', 112: 'مائة واثنا عشر',
    120: 'مائة وعشرون', 128: 'مائة وثمانية وعشرون',
    144: 'مائة وأربعة وأربعون', 160: 'مائة وستون',
    176: 'مائة وستة وسبعون', 192: 'مائة واثنان وتسعون',
    224: 'مائتان وأربعة وعشرون', 240: 'مائتان وأربعون',
    320: 'ثلاثمائة وعشرون',
  };
  return words[n] ?? `${n}`;
}

// ─── توليد ملخص مرحلة واحدة ────────────────────────────────────────────────

export function generateLegalSummary(
  input: StageSummaryInput,
  isStandalone: boolean = true
): string {
  const { stage, results, netEstate, deceasedGender, estate, debts, funeralCosts, bequest } = input;
  const name = stage.deceasedName || 'المتوفى';
  const lines: string[] = [];

  // ── ديباجة ──
  if (isStandalone) {
    lines.push('بسم الله الرحمن الرحيم');
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push('');
  }

  // ── تسمية الهالك ──
  lines.push(`${deceasedLabel(deceasedGender, name)}`);
  lines.push('');

  // ── جرد التركة ──
  if (estate > 0) {
    lines.push(`إجمالي التركة: ${formatAmount(estate)}`);
    if (funeralCosts > 0) {
      lines.push(`مصاريف التجهيز والدفن (المادة 182-1): ${formatAmount(funeralCosts)}`);
    }
    if (debts > 0) {
      lines.push(`الديون الثابتة في ذمة الهالك (المادة 182-4): ${formatAmount(debts)}`);
    }
    if (bequest > 0) {
      lines.push(`الوصية في حدود الثلث (المادة 182-5): ${formatAmount(bequest)}`);
    }
    lines.push(`صافي التركة الموزَّعة: ${formatAmount(netEstate)}`);
    lines.push('');
  }

  // ── الورثة ──
  const isPureMode = estate === 0;
  const activeHeirs = results.filter(
    r => !r.isBlocked &&
      (isPureMode ? (r.shares > 0 || (r.shareFraction && r.shareFraction.compare(0) > 0)) : r.amount > 0) &&
      r.heirId !== 'treasury' &&
      r.heirId !== 'voluntary_bequest' &&
      r.heirId !== 'mandatory_bequest'
  );
  const blockedHeirs = results.filter(r => r.isBlocked);
  const mandatoryBequest = results.find(r => r.heirId === 'mandatory_bequest' && !r.isBlocked);
  const treasury = results.find(r => r.heirId === 'treasury' && !r.isBlocked);

  // التنزيل (الوصية الواجبة)
  if (mandatoryBequest) {
    if (estate > 0) {
      lines.push(
        `وقد خُصِّص للتنزيل (الوصية الواجبة) طبقاً للمادتين 169-172 من قانون الأسرة مبلغ ${formatAmount(mandatoryBequest.amount)} قبل توزيع سائر التركة.`
      );
    } else {
      const mbPct = mandatoryBequest.shareFraction ? (mandatoryBequest.shareFraction.valueOf() * 100) : 0;
      const mbPctStr = mbPct > 0 ? (mbPct % 1 === 0 ? `${mbPct}%` : `${mbPct.toFixed(2)}%`) : '0%';
      lines.push(
        `وقد خُصِّص للتنزيل (الوصية الواجبة) طبقاً للمادتين 169-172 من قانون الأسرة بنسبة تعادل ${mbPctStr} (${mandatoryBequest.share}) قبل توزيع سائر التركة.`
      );
    }
    lines.push('');
  }

  // التنبيه القضائي للمفقود (المادتان 113 و133)
  const missingHeirsWithheld = results.filter(r => r.isWithheld && r.heirId !== 'unborn_withholding');
  if (missingHeirsWithheld.length > 0) {
    const missingNames = missingHeirsWithheld.map(r => `"${r.nameAr}"`).join(' و');
    const missingWithheldAmount = missingHeirsWithheld.reduce((sum, r) => sum + r.amount, 0);
    if (estate > 0) {
      lines.push(
        `تنبيه قضائي (المادتان 113 و133): نظراً لكون الوارث ${missingNames} مفقوداً، فقد تقرر وقف نصيبه من التركة وقدره إجمالاً ${formatAmount(missingWithheldAmount)}، ووضعه تحت الحيازة القانونية دون تصفية نهائية لصالح باقي الورثة لحين صدور حكم نهائي يثبت وفاته أو حياته.`
      );
    } else {
      const totalFrac = missingHeirsWithheld.reduce((sum, r) => sum.add(r.shareFraction || new Fraction(0)), new Fraction(0));
      const pct = totalFrac.valueOf() * 100;
      const pctStr = pct > 0 ? (pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(2)}%`) : '0%';
      lines.push(
        `تنبيه قضائي (المادتان 113 و133): نظراً لكون الوارث ${missingNames} مفقوداً، فقد تقرر وقف نصيبه من التركة بنسبة تعادل ${pctStr} (بمجموع سهمين/سهام)، ووضعه تحت الحيازة القانونية دون تصفية نهائية لصالح باقي الورثة لحين صدور حكم نهائي يثبت وفاته أو حياته.`
      );
    }
    lines.push('');
  }

  // شهادة الورثة
  lines.push(`وشهد الشهود حسب الشهرة العمومية بأن وفاته/وفاتها كانت عن ورثته/ورثتها وهم:`);
  lines.push('');

  // ── فصحت بعد العمل والحساب ──
  const problemBase = activeHeirs.length > 0 ? activeHeirs[0].problemBase : 0;
  const calcType = activeHeirs.length > 0 ? activeHeirs[0].calculationType : 'normal';

  if (problemBase && problemBase > 1) {
    lines.push(
      `فصحت بعد العمل والحساب من / ${baseToArabicWords(problemBase)} ....${'..'.repeat(10)}... ${problemBase} جزء`
    );
  } else {
    lines.push(`فصحت بعد العمل والحساب:`);
  }

  if (calcType === 'awl') {
    lines.push(`(مسألة عائلة: تمّ تصحيحها بالعول وفق المادة 166 من قانون الأسرة)`);
  } else if (calcType === 'radd') {
    lines.push(`(مسألة فيها رد: تمّ توزيع الفائض بالرد وفق المادة 167 من قانون الأسرة)`);
  }
  lines.push('');

  // ── أسطر "ناب" لكل وارث ──
  activeHeirs.forEach(r => {
    const fardPhrase = shareToFardPhrase(r.share);
    const sharesStr = r.shares > 0 && problemBase
      ? `${numberToArabicWords(r.shares)} من ${baseToArabicWords(problemBase)}`
      : '';

    const countNote = r.count > 1
      ? ` (${r.count} أشخاص، لكل واحد ${Math.round(r.shares / r.count)} جزء)`
      : '';

    const amountNote = netEstate > 0 ? ` (${formatAmount(r.amount)})` : '';

    const dotLine = '.'.repeat(Math.max(3, 50 - r.nameAr.length - fardPhrase.length));

    if (sharesStr) {
      lines.push(
        `ناب منها لـ${r.nameAr}${countNote} ${fardPhrase} ${sharesStr} ${dotLine} ${r.shares}/${problemBase} جزء${amountNote}`
      );
    } else {
      lines.push(
        `ناب منها لـ${r.nameAr}${countNote} ${fardPhrase}${amountNote}`
      );
    }
  });

  // الخزينة العمومية
  if (treasury) {
    if (estate > 0) {
      lines.push(
        `ناب منها لخزينة الدولة (عدم وجود عاصب) طبقاً للمادة 180 من قانون الأسرة ............. ${formatAmount(treasury.amount)}`
      );
    } else {
      const tPct = treasury.shareFraction ? (treasury.shareFraction.valueOf() * 100) : 0;
      const tPctStr = tPct > 0 ? (tPct % 1 === 0 ? `${tPct}%` : `${tPct.toFixed(2)}%`) : '0%';
      lines.push(
        `ناب منها لخزينة الدولة (عدم وجود عاصب) طبقاً للمادة 180 من قانون الأسرة ............. بنسبة تعادل ${tPctStr} (${treasury.share})`
      );
    }
  }

  lines.push('');
  lines.push(
    `التساوي .${'.'.repeat(50)} ${problemBase > 0 ? problemBase + ' جزء/' + problemBase + ' جزء' : '✓'}`
  );
  lines.push('');

  // ── المحجوبون ──
  if (blockedHeirs.length > 0) {
    lines.push(`لا وارث ولا عاصب سوى من سُطِّر أعلاه، وأما من يلي فلا يرثون حجباً:`);
    blockedHeirs.forEach(r => {
      lines.push(`• ${r.nameAr}: ${r.reason || 'محجوب حجب حرمان'}`);
    });
    lines.push('');
  }

  // ── ختام المرحلة المنفردة ──
  if (isStandalone) {
    lines.push('─'.repeat(50));
    lines.push(
      `حُرِّر هذا الملخص وأُنجز استناداً إلى أحكام قانون الأسرة الجزائري (الأمر رقم 84-11) المواد من 126 إلى 183.`
    );
    lines.push(
      `تاريخ التحرير: ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}`
    );
  }

  return lines.join('\n');
}

// ─── توليد المحضر الكامل للمناسخات ────────────────────────────────────────

export function generateFullLegalSummary(
  allStagesResults: StageResult[],
  globalInputs: {
    estate: number;
    debts: number;
    funeralCosts: number;
    bequest: number;
    deceasedGender: 'male' | 'female' | null;
  }
): string {
  const lines: string[] = [];

  lines.push('بسم الله الرحمن الرحيم');
  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('');

  const isMunasakha = allStagesResults.length > 1;

  if (isMunasakha) {
    lines.push('عقد فريضة (مناسخة)');
    lines.push('');
    lines.push(
      `فصحت بعد العمل والحساب وضم الفرائض ${allStagesResults.length > 1 ? `(${allStagesResults.length}) فرائض متتالية` : 'الفريضة'} فصحت المناسخة الشرعية:`
    );
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('');
  } else {
    lines.push('فريضة');
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('');
  }

  // ── كل مرحلة ──
  allStagesResults.forEach(({ stage, results, netEstate }, idx) => {
    const isFirst = idx === 0;
    const stageLabel = isFirst
      ? `المسألة الأولى — تصفية تركة ${deceasedLabel(globalInputs.deceasedGender, stage.deceasedName || 'المتوفى')}:`
      : `ثم توفي / ${stage.deceasedName || 'المتوفى'} — المناسخة رقم ${idx}:`;

    lines.push(stageLabel);
    lines.push('─'.repeat(50));
    lines.push('');

    const singleSummary = generateLegalSummary(
      {
        stage,
        results,
        netEstate,
        deceasedGender: isFirst ? globalInputs.deceasedGender : null,
        estate: isFirst ? globalInputs.estate : stage.estate,
        debts: isFirst ? globalInputs.debts : 0,
        funeralCosts: isFirst ? globalInputs.funeralCosts : 0,
        bequest: isFirst ? globalInputs.bequest : 0,
      },
      false
    );

    lines.push(singleSummary);
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push('');
  });

  // ── خاتمة ──
  lines.push('─────────────────── لا غيـــر ───────────────────');
  lines.push('');
  lines.push('لا وارث ولا عاصب لمن ذُكرت وفاته سوى من سُطِّر أعلاه.');
  lines.push('');
  lines.push(
    `أُنجزت هذه التصفية وقُسِّمت السهام المتعاقبة طبقاً للقواعد المقررة شرعاً وقانوناً في المواريث والمناسخات بالجمهورية الجزائرية، استناداً إلى أحكام الأمر رقم 84-11 المتضمن قانون الأسرة الجزائري المعدل والمتمم (المواد 126–183).`
  );
  lines.push('');
  lines.push(
    `تاريخ تحرير المحضر: ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}`
  );

  return lines.join('\n');
}
