// lib/inheritance/inheritance-calculator.ts

import { HEIRS } from '@/data/heirs';
import { resolveBlocking, BlockingContext } from './blocking-resolver';
import { AWL_RADD_RULES } from '@/data/awl-radd';
import { INHERITANCE_BARS } from '@/data/inheritance-bars';
import { getInterpretationSetting } from './legal-interpretations-registry';
import Fraction from 'fraction.js';

export const IMPEDED_SIBLINGS_COUNT_TOWARDS_MOTHER_REDUCTION = getInterpretationSetting('IMPEDED_SIBLINGS_REDUCTION');
export const AKDARIYYA_EXTENDS_TO_PATERNAL_SISTER = getInterpretationSetting('AKDARIYYA_PATERNAL_SISTER');

export interface HeirPresence {
  heirId: string;
  count: number;
  isPresent: boolean;
  hasMandatoryBequest?: boolean;
  customNames?: string[];
  isImpeded?: boolean; // محروم من الإرث (موانع الإرث)
  impedimentReasonId?: string;
  impededIndexes?: boolean[]; // State for individual impediments (index-based)
  impedimentReasonIds?: (string | undefined)[]; // State for individual impediment reasons
  missingPersonStatus?: 'none' | 'missing_presumed_alive';
}

export interface IndividualResult {
  isBlocked: boolean;
  amount: number;
  share: string;
  shareFraction: Fraction;
  shares: number;
  reason: string;
}

export interface CalculationResult {
  heirId: string;
  nameAr: string;
  share: string;
  shareDecimal: number;
  shareFraction: Fraction;
  shares: number;
  problemBase: number;
  calculationType?: 'normal' | 'awl' | 'radd';
  amount: number;
  reason: string;
  article?: number;
  notes?: string;
  isBlocked: boolean;
  blockedBy?: string;
  count: number;
  individuals?: IndividualResult[]; // Individual results for each of the count heirs
  isWithheld?: boolean;
  hasUnverifiedOverride?: boolean;
}

export interface DeceasedChildGroup {
  type: 'son' | 'daughter';
  count: number;
  hasOwnChildrenWhoAreAlsoDirectHeirs?: boolean; // Art. 171 not_heir
  priorGiftOrBequestAmount?: number; // Art. 171 not_bequeathed
  alreadyInheritedFromParentAmount?: number; // Art. 172 not_inherited
}

export interface PipelineContext {
  heirs: HeirPresence[];
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  hasMandatoryBequest: boolean;
  deceasedChildren: (DeceasedChildGroup | { type: 'son' | 'daughter', count: number })[];
  unbornOutcome: 'pending' | 'born_male' | 'born_female' | 'stillborn';
  hasUnbornHeir: boolean;
}

export interface PipelineState {
  ctx: PipelineContext;
  estateFrac: Fraction;
  debtsFrac: Fraction;
  funeralCostsFrac: Fraction;
  bequestFrac: Fraction;
  netEstateBaseFrac: Fraction;
  netEstateFrac: Fraction;
  activeHeirs: HeirPresence[];
  skipInSiblingSection: Set<string>;

  unbornWithholdingAmountFrac: Fraction;
  unbornWithholdingReason: string;
  unbornWithholdingFraction: Fraction;

  mandatoryBequestAmountFrac: Fraction;
  actualBequestFrac: Fraction;

  netEstate: number;
  unbornWithholdingAmount: number;
  mandatoryBequestAmount: number;
  actualBequest: number;

  results: CalculationResult[];
  presentHeirs: HeirPresence[];
  remainingFraction: Fraction;

  calcType: 'normal' | 'awl' | 'radd';
  traditionalBase: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number): number => Math.abs((a / gcd(a, b)) * b);

export function calculateInheritance(
  heirs: HeirPresence[],
  estate: number,
  debts: number,
  funeralCosts: number,
  bequest: number,
  hasMandatoryBequest: boolean = false,
  deceasedChildren: (DeceasedChildGroup | { type: 'son' | 'daughter', count: number })[] = [],
  unbornOutcome: 'pending' | 'born_male' | 'born_female' | 'stillborn' = 'stillborn',
  hasUnbornHeir: boolean = false
): CalculationResult[] {
  // Pre-process: Map original heirs to active heirs with counts matching non-impeded individuals
  const activeHeirs = heirs.map(h => {
    if (!h.isPresent || h.count <= 0) return { ...h };
    let activeCount = 0;
    for (let i = 0; i < h.count; i++) {
      const isIndImpeded = h.impededIndexes?.[i] ?? h.isImpeded ?? false;
      const impedimentReasonId = h.impedimentReasonIds?.[i] ?? h.impedimentReasonId;
      if (!isIndImpeded || impedimentReasonId === 'involuntary_killer') {
        activeCount++;
      }
    }
    return {
      ...h,
      count: activeCount,
      isImpeded: false // Clear so calculations treat them as active
    };
  });

  // Call internal calculation with active-only counts
  const internalResults = calculateInheritanceInternal(
    activeHeirs,
    estate,
    debts,
    funeralCosts,
    bequest,
    hasMandatoryBequest,
    deceasedChildren,
    unbornOutcome,
    hasUnbornHeir
  );

  // Post-process: Merge internal results back to construct individual levels
  const mergedResults: CalculationResult[] = [];

  // Pass through system/added results that are not in the original heirs input (e.g. bequests, treasury)
  const originalHeirIds = new Set(heirs.map(h => h.heirId));
  internalResults.forEach(r => {
    if (!originalHeirIds.has(r.heirId)) {
      mergedResults.push({
        ...r,
        individuals: [{
          isBlocked: r.isBlocked,
          amount: r.amount,
          share: r.share,
          shareFraction: r.shareFraction,
          shares: r.shares,
          reason: r.reason
        }]
      });
    }
  });

  // Process each original heir from presence list
  heirs.forEach(h => {
    if (!h.isPresent || h.count <= 0) return;

    // Is there an active calculated result?
    const activeRes = internalResults.find(r => r.heirId === h.heirId && !r.isBlocked);
    // Is there a blocked/calculated result from internal calculation?
    const blockedRes = internalResults.find(r => r.heirId === h.heirId && r.isBlocked);

    const activeCount = h.count - (h.impededIndexes?.filter((v, idx) => idx < h.count && v).length ?? (h.isImpeded ? h.count : 0));

    const individuals: IndividualResult[] = [];
    let groupAmount = 0;
    let groupShare = 'محجوب';
    let groupShareFraction = new Fraction(0);
    let groupShares = 0;
    let groupReason = '';
    let groupIsBlocked = true;
    const groupArticle = activeRes?.article ?? blockedRes?.article;

    for (let i = 0; i < h.count; i++) {
      const isIndImpededRaw = h.impededIndexes?.[i] ?? h.isImpeded ?? false;
      const impedimentReasonId = h.impedimentReasonIds?.[i] ?? h.impedimentReasonId;
      const isIndImpeded = isIndImpededRaw && impedimentReasonId !== 'involuntary_killer';
      const bar = impedimentReasonId ? INHERITANCE_BARS.find(b => b.id === impedimentReasonId) : null;
      const impededReason = bar ? `محروم: ${bar.nameAr} (المادة ${bar.article})` : 'ممنوع من الإرث لوجود مانع شرعي';

      if (isIndImpeded) {
        individuals.push({
          isBlocked: true,
          amount: 0,
          share: 'محروم',
          shareFraction: new Fraction(0),
          shares: 0,
          reason: impededReason
        });
      } else if (activeRes) {
        // This individual is active and inherits!
        groupIsBlocked = false;
        groupAmount = activeRes.amount;
        groupShare = activeRes.share;
        groupShareFraction = activeRes.shareFraction;
        groupShares = activeRes.shares;
        groupReason = activeRes.reason;

        const indAmt = activeCount > 0 ? activeRes.amount / activeCount : 0;
        const indShareFrac = activeCount > 0 ? activeRes.shareFraction.div(activeCount) : new Fraction(0);
        const indSharesStr = activeCount > 1 ? indShareFrac.toFraction(true) : activeRes.share;
        const indSharesCount = activeCount > 0 ? Math.round(activeRes.shares / activeCount) : 0;

        individuals.push({
          isBlocked: false,
          amount: indAmt,
          share: indSharesStr,
          shareFraction: indShareFrac,
          shares: indSharesCount,
          reason: activeRes.reason
        });
      } else if (blockedRes) {
        // This individual is blocked by rules (not impediment, e.g. daughter blocks son of son)
        individuals.push({
          isBlocked: true,
          amount: 0,
          share: blockedRes.share,
          shareFraction: blockedRes.shareFraction,
          shares: blockedRes.shares,
          reason: blockedRes.reason
        });
        groupShare = blockedRes.share;
        groupShareFraction = blockedRes.shareFraction;
        groupShares = blockedRes.shares;
        groupReason = blockedRes.reason;
      } else {
        // No result found, default as blocked/not inheriting
        individuals.push({
          isBlocked: true,
          amount: 0,
          share: 'لا يرث',
          shareFraction: new Fraction(0),
          shares: 0,
          reason: 'لا يرث في هذه الحالة'
        });
      }
    }

    const heirInfo = HEIRS.find(hi => hi.id === h.heirId);
    if (heirInfo) {
      const isAllImpeded = h.count > 0 && activeCount === 0;
      const firstBarId = h.impedimentReasonId || h.impedimentReasonIds?.find(r => r !== undefined);
      const firstBar = firstBarId ? INHERITANCE_BARS.find(b => b.id === firstBarId) : null;
      const defaultImpededReason = firstBar
        ? `محروم: ${firstBar.nameAr} (المادة ${firstBar.article})`
        : 'ممنوع من الإرث لوجود مانع شرعي (المادتان 135 و138 من قانون الأسرة)';

      const isMissing = h.missingPersonStatus === 'missing_presumed_alive';
      const finalReason = isAllImpeded
        ? defaultImpededReason
        : isMissing && !groupIsBlocked
          ? 'موقوف للمفقود تحت الحيازة بموجب المادة 133 من قانون الأسرة'
          : (groupReason || (groupIsBlocked ? 'محجوب من الميراث لوجود من يحجبه' : ''));

      mergedResults.push({
        heirId: h.heirId,
        nameAr: heirInfo.nameAr,
        share: isAllImpeded ? 'محروم' : groupShare,
        shareDecimal: groupShareFraction.valueOf(),
        shareFraction: groupShareFraction,
        shares: groupShares,
        problemBase: activeRes?.problemBase ?? blockedRes?.problemBase ?? 0,
        calculationType: activeRes?.calculationType ?? blockedRes?.calculationType,
        amount: groupAmount,
        reason: finalReason,
        article: isAllImpeded ? (firstBar ? firstBar.article : 135) : (isMissing && !groupIsBlocked ? 133 : groupArticle),
        notes: isAllImpeded 
          ? (firstBar ? firstBar.description : 'موانع الإرث محددة بالمادتين 135 و138 من قانون الأسرة الجزائري. الوارث المحروم لوجود مانع شرعي يمنع من الإرث كلياً ولا يحجب غيره.') 
          : isMissing && !groupIsBlocked 
            ? 'تنص المادة 133 من قانون الأسرة على أنه يوضع نصيب المفقود من التركة تحت الحيازة حتى يتبين أمره بصدور حكم بموته طبقاً للمادتين 113 و114.' 
            : undefined,
        isBlocked: groupIsBlocked,
        count: h.count,
        individuals,
        isWithheld: isMissing && !groupIsBlocked,
      });
    }
  });

  return mergedResults;
}

export function createInitialPipelineState(
  heirs: HeirPresence[],
  estate: number,
  debts: number,
  funeralCosts: number,
  bequest: number,
  hasMandatoryBequest: boolean,
  deceasedChildren: (DeceasedChildGroup | { type: 'son' | 'daughter', count: number })[],
  unbornOutcome: 'pending' | 'born_male' | 'born_female' | 'stillborn',
  hasUnbornHeir: boolean
): PipelineState {
  const estateFrac = new Fraction(estate);
  const debtsFrac = new Fraction(debts);
  const funeralCostsFrac = new Fraction(funeralCosts);
  const bequestFrac = new Fraction(bequest);
  const netEstateBaseFrac = estateFrac.sub(debtsFrac).sub(funeralCostsFrac);

  return {
    ctx: {
      heirs,
      estate,
      debts,
      funeralCosts,
      bequest,
      hasMandatoryBequest,
      deceasedChildren,
      unbornOutcome,
      hasUnbornHeir,
    },
    estateFrac,
    debtsFrac,
    funeralCostsFrac,
    bequestFrac,
    netEstateBaseFrac,
    netEstateFrac: netEstateBaseFrac,
    activeHeirs: heirs.map(h => ({ ...h })),
    skipInSiblingSection: new Set<string>(),

    unbornWithholdingAmountFrac: new Fraction(0),
    unbornWithholdingReason: '',
    unbornWithholdingFraction: new Fraction(0),

    mandatoryBequestAmountFrac: new Fraction(0),
    actualBequestFrac: new Fraction(0),

    netEstate: 0,
    unbornWithholdingAmount: 0,
    mandatoryBequestAmount: 0,
    actualBequest: 0,

    results: [],
    presentHeirs: [],
    remainingFraction: new Fraction(1),

    calcType: 'normal',
    traditionalBase: 0,
  };
}

// Stage 1: Al-Haml (Articles 173-174)
export function withholdForUnbornHeir(state: PipelineState): PipelineState {
  const { ctx, activeHeirs } = state;
  let { netEstateFrac, unbornWithholdingAmountFrac, unbornWithholdingReason, unbornWithholdingFraction } = state;

  if (ctx.hasUnbornHeir) {
    if (ctx.unbornOutcome === 'born_male') {
      const existingSon = activeHeirs.find(h => h.heirId === 'son');
      if (existingSon) {
        existingSon.count += 1;
        existingSon.isPresent = true;
      } else {
        activeHeirs.push({ heirId: 'son', count: 1, isPresent: true });
      }
    } else if (ctx.unbornOutcome === 'born_female') {
      const existingDaughter = activeHeirs.find(h => h.heirId === 'daughter');
      if (existingDaughter) {
        existingDaughter.count += 1;
        existingDaughter.isPresent = true;
      } else {
        activeHeirs.push({ heirId: 'daughter', count: 1, isPresent: true });
      }
    } else if (ctx.unbornOutcome === 'pending') {
      const normalResults = calculateInheritance(
        activeHeirs.map(h => ({ ...h })),
        ctx.estate, ctx.debts, ctx.funeralCosts, ctx.bequest, ctx.hasMandatoryBequest, ctx.deceasedChildren, 'stillborn', false
      );

      const sonHeirs = activeHeirs.map(h => ({ ...h }));
      const sExist = sonHeirs.find(h => h.heirId === 'son');
      if (sExist) { sExist.count += 1; sExist.isPresent = true; }
      else { sonHeirs.push({ heirId: 'son', count: 1, isPresent: true }); }
      const sonResults = calculateInheritance(sonHeirs, ctx.estate, ctx.debts, ctx.funeralCosts, 0, false, ctx.deceasedChildren, 'stillborn', false);

      const daughterHeirs = activeHeirs.map(h => ({ ...h }));
      const dExist = daughterHeirs.find(h => h.heirId === 'daughter');
      if (dExist) { dExist.count += 1; dExist.isPresent = true; }
      else { daughterHeirs.push({ heirId: 'daughter', count: 1, isPresent: true }); }
      const daughterResults = calculateInheritance(daughterHeirs, ctx.estate, ctx.debts, ctx.funeralCosts, 0, false, ctx.deceasedChildren, 'stillborn', false);

      let hasFullBlock = false;
      for (const nr of normalResults) {
        if (nr.amount > 0 && !['mandatory_bequest', 'voluntary_bequest'].includes(nr.heirId)) {
          const sr = sonResults.find(r => r.heirId === nr.heirId);
          const dr = daughterResults.find(r => r.heirId === nr.heirId);
          if ((sr && (sr.isBlocked || sr.amount === 0)) || (dr && (dr.isBlocked || dr.amount === 0))) {
            hasFullBlock = true;
            break;
          }
        }
      }

      if (hasFullBlock) {
        unbornWithholdingAmountFrac = netEstateFrac;
        unbornWithholdingFraction = new Fraction(1);
        unbornWithholdingReason = 'توقف التركة بالكامل لترتب حجب حرمان كلي على بعض الورثة في حال وجود الحمل — م.173';
        netEstateFrac = new Fraction(0);
      } else {
        const sonUnbornRes = sonResults.find(r => r.heirId === 'son');
        const daughterUnbornRes = daughterResults.find(r => r.heirId === 'daughter');
        const sonShareFrac = sonUnbornRes ? sonUnbornRes.shareFraction.div(sonUnbornRes.count || 1) : new Fraction(0);
        const daughterShareFrac = daughterUnbornRes ? daughterUnbornRes.shareFraction.div(daughterUnbornRes.count || 1) : new Fraction(0);

        unbornWithholdingFraction = sonShareFrac.compare(daughterShareFrac) > 0 ? sonShareFrac : daughterShareFrac;
        unbornWithholdingAmountFrac = netEstateFrac.mul(unbornWithholdingFraction);
        unbornWithholdingReason = 'موقوف للحمل (الأكبر من نصيب ابن أو بنت) لحجب النقصان — م.173';
        const subUnborn = netEstateFrac.sub(unbornWithholdingAmountFrac);
        netEstateFrac = subUnborn.compare(0) > 0 ? subUnborn : new Fraction(0);
      }
    }
  }

  return {
    ...state,
    netEstateFrac,
    activeHeirs,
    unbornWithholdingAmountFrac,
    unbornWithholdingReason,
    unbornWithholdingFraction,
  };
}

// Stage 2: Mandatory Bequest (الوصية الواجبة / التنزيل - Articles 169-172)
export function computeMandatoryBequest(state: PipelineState): PipelineState {
  const { ctx, netEstateBaseFrac } = state;
  let { netEstateFrac, mandatoryBequestAmountFrac } = state;

  const validDeceasedChildren = ctx.deceasedChildren.filter(dc => dc.count > 0);
  if (ctx.hasMandatoryBequest && validDeceasedChildren.length > 0) {
    const eligibleDeceasedChildren = validDeceasedChildren.filter(dc => !(dc as DeceasedChildGroup).hasOwnChildrenWhoAreAlsoDirectHeirs);

    if (eligibleDeceasedChildren.length > 0) {
      const shadowHeirs = state.activeHeirs.map(h => ({ ...h }));
      eligibleDeceasedChildren.forEach(dc => {
        const existing = shadowHeirs.find(h => h.heirId === dc.type);
        if (existing) {
          existing.count += dc.count;
          existing.isPresent = true;
        } else {
          shadowHeirs.push({ heirId: dc.type, count: dc.count, isPresent: true });
        }
      });

      const shadowResults = calculateInheritance(shadowHeirs, ctx.estate, ctx.debts, ctx.funeralCosts, 0, false, [], 'stillborn', false);

      eligibleDeceasedChildren.forEach(dc => {
        const result = shadowResults.find(r => r.heirId === dc.type);
        if (result) {
          const totalForTypeFrac = result.shareFraction.mul(netEstateBaseFrac);
          const shadowHeirEntry = shadowHeirs.find(h => h.heirId === dc.type);
          const totalCountForType = shadowHeirEntry?.count || 1;
          const perPersonFrac = totalForTypeFrac.div(totalCountForType);
          let entitlementFrac = perPersonFrac.mul(dc.count);

          const group = dc as DeceasedChildGroup;
          if (group.priorGiftOrBequestAmount && group.priorGiftOrBequestAmount > 0) {
            const priorFrac = new Fraction(group.priorGiftOrBequestAmount);
            const subPrior = entitlementFrac.sub(priorFrac);
            entitlementFrac = subPrior.compare(0) > 0 ? subPrior : new Fraction(0);
          }

          if (group.alreadyInheritedFromParentAmount && group.alreadyInheritedFromParentAmount > 0) {
            const inheritedFrac = new Fraction(group.alreadyInheritedFromParentAmount);
            const subInherited = entitlementFrac.sub(inheritedFrac);
            entitlementFrac = subInherited.compare(0) > 0 ? subInherited : new Fraction(0);
          }

          mandatoryBequestAmountFrac = mandatoryBequestAmountFrac.add(entitlementFrac);
        }
      });
    }

    const maxMandatoryFrac = netEstateBaseFrac.div(3);
    mandatoryBequestAmountFrac = mandatoryBequestAmountFrac.compare(maxMandatoryFrac) < 0 ? mandatoryBequestAmountFrac : maxMandatoryFrac;
    netEstateFrac = netEstateFrac.sub(mandatoryBequestAmountFrac);
  }

  return {
    ...state,
    netEstateFrac,
    mandatoryBequestAmountFrac,
  };
}

// Stage 3: Voluntary Bequest Capping & Result Setup
export function capVoluntaryBequest(state: PipelineState): PipelineState {
  const { ctx, netEstateBaseFrac, bequestFrac, mandatoryBequestAmountFrac } = state;
  let { netEstateFrac } = state;

  const remainingThirdFrac = netEstateBaseFrac.div(3).sub(mandatoryBequestAmountFrac);
  const maxBequestFrac = remainingThirdFrac.compare(0) > 0 ? remainingThirdFrac : new Fraction(0);
  const actualBequestFrac = bequestFrac.compare(maxBequestFrac) < 0 ? bequestFrac : maxBequestFrac;
  const subBeq = netEstateFrac.sub(actualBequestFrac);
  netEstateFrac = subBeq.compare(0) > 0 ? subBeq : new Fraction(0);

  const netEstate = netEstateFrac.valueOf();
  const unbornWithholdingAmount = state.unbornWithholdingAmountFrac.valueOf();
  const mandatoryBequestAmount = mandatoryBequestAmountFrac.valueOf();
  const actualBequest = actualBequestFrac.valueOf();

  const results: CalculationResult[] = [];

  // Add Unborn Withholding to results if it exists
  if (unbornWithholdingAmount > 0) {
    const initialAvailable = ctx.estate - ctx.debts - ctx.funeralCosts;
    const withholdFraction = initialAvailable > 0 ? new Fraction(unbornWithholdingAmount).div(initialAvailable) : state.unbornWithholdingFraction;
    results.push({
      heirId: 'unborn_withholding',
      nameAr: 'نصيب الحمل الموقوف',
      share: state.unbornWithholdingFraction.toFraction(true),
      shareDecimal: withholdFraction.valueOf(),
      shareFraction: withholdFraction,
      shares: 0,
      problemBase: 0,
      amount: unbornWithholdingAmount,
      reason: state.unbornWithholdingReason,
      isBlocked: false,
      article: 173,
      count: 1,
      isWithheld: true
    });
  }

  // Add Mandatory Bequest to results if it exists
  if (mandatoryBequestAmount > 0) {
    const initialAvailable = ctx.estate - ctx.debts - ctx.funeralCosts;
    const bequestFraction = initialAvailable > 0 ? new Fraction(mandatoryBequestAmount).div(initialAvailable) : new Fraction(0);
    results.push({
      heirId: 'mandatory_bequest',
      nameAr: 'التنزيل (الوصية الواجبة)',
      share: 'في حدود الثلث',
      shareDecimal: bequestFraction.valueOf(),
      shareFraction: bequestFraction,
      shares: 0,
      problemBase: 0,
      amount: mandatoryBequestAmount,
      reason: 'للأحفاد الذين مات أبوهم/أمهم في حياة المتوفى',
      isBlocked: false,
      count: 1
    });
  }

  // Add Voluntary Bequest to results
  if (actualBequest > 0) {
    const initialAvailable = ctx.estate - ctx.debts - ctx.funeralCosts;
    const bequestFraction = initialAvailable > 0 ? new Fraction(actualBequest).div(initialAvailable) : new Fraction(0);
    results.push({
      heirId: 'voluntary_bequest',
      nameAr: 'وصية اختيارية',
      share: 'في حدود الثلث',
      shareDecimal: bequestFraction.valueOf(),
      shareFraction: bequestFraction,
      shares: 0,
      problemBase: 0,
      amount: actualBequest,
      reason: 'وصية اختيارية من المتوفى',
      isBlocked: false,
      count: 1
    });
  }

  return {
    ...state,
    netEstateFrac,
    actualBequestFrac,
    netEstate,
    unbornWithholdingAmount,
    mandatoryBequestAmount,
    actualBequest,
    results,
  };
}

// Stage 4: Fixed Shares (Furud) Resolution
export function resolveFixedShares(state: PipelineState): PipelineState {
  const { activeHeirs, results, netEstate } = state;
  const presentHeirs = activeHeirs.filter(h => h.isPresent && h.count > 0 && !h.isImpeded);

  if (presentHeirs.length === 0) {
    if (!results.some(r => r.heirId === 'treasury')) {
      results.push({
        heirId: 'treasury',
        nameAr: 'بيت المال / الباقي',
        share: 'الباقي',
        shareDecimal: 1,
        shareFraction: new Fraction(1),
        shares: 0,
        problemBase: 0,
        amount: netEstate,
        isBlocked: false,
        reason: 'لعدم وجود مستحق للرد أو عصبة — م.180',
        count: 1
      });
    }
    return {
      ...state,
      presentHeirs,
      remainingFraction: new Fraction(0),
    };
  }

  const has = (id: string) => presentHeirs.some(h => h.heirId === id);
  const getCount = (id: string) => presentHeirs.find(h => h.heirId === id)?.count || 0;

  const addResult = (id: string, shareFraction: Fraction, shareStr: string, reason: string, isBlocked: boolean = false, articleOverride?: number) => {
    const heirInfo = HEIRS.find(h => h.id === id);
    if (!heirInfo) return;

    const count = getCount(id);
    const existingIndex = results.findIndex(r => r.heirId === id);

    const newResult: CalculationResult = {
      heirId: id,
      nameAr: heirInfo.nameAr,
      share: shareStr,
      shareDecimal: shareFraction.valueOf(),
      shareFraction: shareFraction,
      shares: 0,
      problemBase: 0,
      amount: isBlocked ? 0 : netEstate * shareFraction.valueOf(),
      isBlocked,
      reason,
      article: articleOverride || heirInfo.article,
      notes: heirInfo.notes,
      count
    };

    if (existingIndex !== -1) {
      if (results[existingIndex].isBlocked && !isBlocked) {
        results[existingIndex] = newResult;
      } else if (!isBlocked) {
        results[existingIndex] = newResult;
      }
      return;
    }

    results.push(newResult);
  };

  // Basic flags
  const hasSon = has('son');
  const hasDaughter = has('daughter');
  const hasDirectProgeny = hasSon || hasDaughter;
  const hasGrandChildren = has('son_son') || has('granddaughter');
  const hasChildren = hasDirectProgeny || hasGrandChildren;
  const hasMaleChildren = hasSon || has('son_son');
  const hasFather = has('father');
  const hasMother = has('mother');
  const hasHusband = has('husband');
  const hasWife = has('wife');
  const hasGrandfather = has('grandfather');
  const hasMaternalGrandmother = has('maternal_grandmother');
  const hasPaternalGrandmother = has('paternal_grandmother');

  const includeImpededSibs = getInterpretationSetting('IMPEDED_SIBLINGS_REDUCTION');
  const getSiblingCountForMother = (id: string) => {
    const activeCount = getCount(id);
    if (!includeImpededSibs) return activeCount;
    const rawEntry = state.ctx.heirs.find(h => h.heirId === id);
    return rawEntry ? rawEntry.count : activeCount;
  };
  const siblingsCount = getSiblingCountForMother('full_brother') + getSiblingCountForMother('full_sister') + 
                        getSiblingCountForMother('paternal_brother') + getSiblingCountForMother('paternal_sister') + 
                        getSiblingCountForMother('maternal_siblings');

  // Blocking Resolver Context
  const hasFemaleDirectDescendant = hasDaughter || has('granddaughter');
  const blockingCtx: BlockingContext = { has, getCount, hasDirectProgeny, siblingsCount, hasFemaleDirectDescendant };
  const checkBlocking = (heirId: string) => resolveBlocking(heirId, blockingCtx);

  // MASHARAKA & AKDARIYA
  const masharakaData = AWL_RADD_RULES.mushtaraka;
  const isMushtaraka = hasHusband && hasMother && getCount('maternal_siblings') >= 2 && has('full_brother') && !hasFather && !hasChildren && !hasGrandfather;

  const akdariyaData = AWL_RADD_RULES.akdariya;
  const isAkdariya = hasHusband && hasMother && hasGrandfather && getCount('full_sister') === 1 && 
                     !hasChildren && getCount('full_brother') === 0 && 
                     getCount('paternal_brother') === 0 && getCount('paternal_sister') === 0 && 
                     getCount('maternal_siblings') === 0 && !hasFather;

  const isAkdariyaPaternalSister = getInterpretationSetting('AKDARIYYA_PATERNAL_SISTER') &&
                                   hasHusband && hasMother && hasGrandfather && getCount('paternal_sister') === 1 &&
                                   !hasChildren && getCount('full_sister') === 0 && getCount('full_brother') === 0 &&
                                   getCount('paternal_brother') === 0 && getCount('maternal_siblings') === 0 && !hasFather;

  const isAnyAkdariya = isAkdariya || isAkdariyaPaternalSister;

  let remainingFraction = new Fraction(1);

  if (isMushtaraka) {
    addResult('husband', new Fraction(1, 2), '1/2', 'لعدم وجود الفرع الوارث');
    addResult('mother', new Fraction(1, 6), '1/6', 'لوجود جمع من الإخوة');

    const maternalSiblingsCount = getCount('maternal_siblings');
    const fullSiblingsCount = getCount('full_brother') + getCount('full_sister');
    const totalSibs = maternalSiblingsCount + fullSiblingsCount;
    const sharePerSib = new Fraction(1, 3).div(totalSibs);

    if (maternalSiblingsCount > 0) addResult('maternal_siblings', sharePerSib.mul(maternalSiblingsCount), '1/3 مشترك', masharakaData.nameAr, false, masharakaData.article);
    if (fullSiblingsCount > 0) {
      if (has('full_brother')) {
        addResult('full_brother', sharePerSib.mul(getCount('full_brother')), '1/3 مشترك بالتساوي', masharakaData.nameAr, false, masharakaData.article);
      }
      if (has('full_sister')) {
        addResult('full_sister', sharePerSib.mul(getCount('full_sister')), '1/3 مشترك بالتساوي', masharakaData.nameAr, false, masharakaData.article);
      }
    }
    remainingFraction = new Fraction(0);
  } else if (isAnyAkdariya) {
    const sisterId = isAkdariyaPaternalSister ? 'paternal_sister' : 'full_sister';
    addResult('husband', new Fraction(9, 27), '9/27 (عول)', akdariyaData.nameAr, false, akdariyaData.article);
    addResult('mother', new Fraction(6, 27), '6/27 (عول)', akdariyaData.nameAr, false, akdariyaData.article);
    addResult('grandfather', new Fraction(8, 27), '8/27 (تعصيب)', akdariyaData.nameAr, false, akdariyaData.article);
    addResult(sisterId, new Fraction(4, 27), '4/27 (تعصيب)', akdariyaData.nameAr, false, akdariyaData.article);
    remainingFraction = new Fraction(0);
  }

  // SPOUSES
  if (hasHusband && !isMushtaraka && !isAnyAkdariya) {
    const blocking = checkBlocking('husband');
    if (blocking.isBlocked) {
      addResult('husband', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else {
      if (hasChildren) {
        addResult('husband', new Fraction(1, 4), '1/4', 'لوجود الفرع الوارث');
        remainingFraction = remainingFraction.sub(new Fraction(1, 4));
      } else {
        addResult('husband', new Fraction(1, 2), '1/2', 'لعدم وجود الفرع الوارث');
        remainingFraction = remainingFraction.sub(new Fraction(1, 2));
      }
    }
  }

  if (hasWife) {
    const wifeShare = hasChildren ? new Fraction(1, 8) : new Fraction(1, 4);
    const wifeCount = getCount('wife');
    let wifeReason = hasChildren ? 'لوجود الفرع الوارث' : 'لعدم وجود الفرع الوارث';
    if (wifeCount > 1) {
      wifeReason += ' (الزوجات يتقاسمن النصيب بالتساوي — م.146)';
    }
    addResult('wife', wifeShare, hasChildren ? '1/8' : '1/4', wifeReason);
    remainingFraction = remainingFraction.sub(wifeShare);
  }

  // PARENTS
  if (hasFather) {
    if (hasMaleChildren) {
      addResult('father', new Fraction(1, 6), '1/6', 'لوجود الفرع الوارث المذكر');
      remainingFraction = remainingFraction.sub(new Fraction(1, 6));
    } else if (hasChildren) {
      addResult('father', new Fraction(1, 6), '1/6 + الباقي تعصيباً', 'لوجود الفرع الوارث المؤنث');
      remainingFraction = remainingFraction.sub(new Fraction(1, 6));
    }
  }

  if (hasMother && !isMushtaraka && !isAnyAkdariya) {
    if (hasChildren || siblingsCount >= 2) {
      addResult('mother', new Fraction(1, 6), '1/6', 'لوجود الفرع الوارث أو جمع من الإخوة');
      remainingFraction = remainingFraction.sub(new Fraction(1, 6));
    } else {
      if ((hasHusband || hasWife) && hasFather && !hasChildren && siblingsCount < 2) {
        const motherShare = remainingFraction.div(3);
        const gharawainData = AWL_RADD_RULES.gharawain;
        addResult('mother', motherShare, '1/3 الباقي', gharawainData.nameAr, false, gharawainData.article);
        remainingFraction = remainingFraction.sub(motherShare);
      } else {
        addResult('mother', new Fraction(1, 3), '1/3', 'لعدم وجود الفرع الوارث ولا جمع من الإخوة');
        remainingFraction = remainingFraction.sub(new Fraction(1, 3));
      }
    }
  }

  // GRANDPARENTS
  if (hasGrandfather && !isAnyAkdariya) {
    const blocking = checkBlocking('grandfather');
    if (blocking.isBlocked) {
      addResult('grandfather', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else {
      if (hasMaleChildren) {
        addResult('grandfather', new Fraction(1, 6), '1/6', 'لوجود الفرع الوارث المذكر');
        remainingFraction = remainingFraction.sub(new Fraction(1, 6));
      } else if (hasChildren) {
        addResult('grandfather', new Fraction(1, 6), '1/6 + الباقي تعصيباً', 'لوجود الفرع الوارث المؤنث');
        remainingFraction = remainingFraction.sub(new Fraction(1, 6));
      }
    }
  }

  if (has('full_sister')) {
    const blocking = checkBlocking('full_sister');
    const willBeAsabaMaaGhayr = hasFemaleDirectDescendant && !hasSon && !has('son_son') && !has('full_brother') && !blocking.isBlocked;
    if (blocking.isBlocked && !isAnyAkdariya && !willBeAsabaMaaGhayr) {
      addResult('full_sister', new Fraction(0), '-', blocking.reason, true, blocking.article);
    }
  }
  if (has('full_brother')) {
    const blocking = checkBlocking('full_brother');
    if (blocking.isBlocked) {
      addResult('full_brother', new Fraction(0), '-', blocking.reason, true, blocking.article);
    }
  }
  if (has('paternal_sister')) {
    const blocking = checkBlocking('paternal_sister');
    if (blocking.isBlocked && !isAnyAkdariya) {
      addResult('paternal_sister', new Fraction(0), '-', blocking.reason, true, blocking.article);
    }
  }
  if (has('paternal_brother')) {
    const blocking = checkBlocking('paternal_brother');
    if (blocking.isBlocked) {
      addResult('paternal_brother', new Fraction(0), '-', blocking.reason, true, blocking.article);
    }
  }
  if (hasMaternalGrandmother || hasPaternalGrandmother) {
    const blockingMaternal = checkBlocking('maternal_grandmother');
    const blockingPaternal = checkBlocking('paternal_grandmother');

    if (hasMother) {
      if (hasMaternalGrandmother) addResult('maternal_grandmother', new Fraction(0), '-', blockingMaternal.reason || 'محجوبة بالأم', true, blockingMaternal.article);
      if (hasPaternalGrandmother) addResult('paternal_grandmother', new Fraction(0), '-', blockingPaternal.reason || 'محجوبة بالأم', true, blockingPaternal.article);
    } else {
      const gms = [];
      if (hasMaternalGrandmother) gms.push('maternal_grandmother');
      if (hasPaternalGrandmother) {
        if (blockingPaternal.isBlocked) {
          addResult('paternal_grandmother', new Fraction(0), '-', blockingPaternal.reason, true, blockingPaternal.article);
        } else {
          gms.push('paternal_grandmother');
        }
      }

      if (gms.length > 0) {
        const totalShare = new Fraction(1, 6);
        const individualShare = totalShare.div(gms.length);
        gms.forEach(id => addResult(id, individualShare, gms.length === 1 ? '1/6' : '1/6 مشترك', 'فرضاً لعدم وجود الأم'));
        remainingFraction = remainingFraction.sub(totalShare);
      }
    }
  }

  // SIBLINGS (Maternal)
  if (has('maternal_siblings') && !isMushtaraka) {
    const blocking = checkBlocking('maternal_siblings');
    if (blocking.isBlocked) {
      addResult('maternal_siblings', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else {
      const count = getCount('maternal_siblings');
      if (count === 1) {
        addResult('maternal_siblings', new Fraction(1, 6), '1/6', 'منفرد(ة)');
        remainingFraction = remainingFraction.sub(new Fraction(1, 6));
      } else {
        addResult('maternal_siblings', new Fraction(1, 3), '1/3', 'جمع من الإخوة لأم');
        remainingFraction = remainingFraction.sub(new Fraction(1, 3));
      }
    }
  }

  // DAUGHTERS & GRANDDAUGHTERS
  if (hasDaughter && !hasSon) {
    const count = getCount('daughter');
    let daughtersShare = new Fraction(0);
    if (count === 1) {
      daughtersShare = new Fraction(1, 2);
      addResult('daughter', daughtersShare, '1/2', 'منفردة وعدم وجود المعصب (الابن)');
    } else {
      daughtersShare = new Fraction(2, 3);
      addResult('daughter', daughtersShare, '2/3', 'تعدد البنات وعدم وجود المعصب');
    }
    remainingFraction = remainingFraction.sub(daughtersShare);
  }

  if (has('granddaughter') && !hasSon) {
    const gCount = getCount('granddaughter');
    const sonSonCount = getCount('son_son');
    const blocking = checkBlocking('granddaughter');

    if (sonSonCount > 0) {
      // Asaba bil-ghayr - handled in Ta'seeb
    } else if (blocking.isBlocked) {
      addResult('granddaughter', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else {
      if (!hasDaughter) {
        const share = gCount === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
        addResult('granddaughter', share, gCount === 1 ? '1/2' : '2/3', gCount === 1 ? 'الانفراد وعدم وجود الفرع الوارث المباشر' : 'تعدد بنات الابن وعدم وجود الفرع الوارث المباشر - م.144');
        remainingFraction = remainingFraction.sub(share);
      } else if (getCount('daughter') === 1) {
        const share = new Fraction(1, 6);
        addResult('granddaughter', share, '1/6', 'تكملة الثلثين مع البنت الواحدة — م.144');
        remainingFraction = remainingFraction.sub(share);
      }
    }
  }

  return {
    ...state,
    presentHeirs,
    results,
    remainingFraction,
  };
}

// Stage 5: Residue (Ta'seeb) Resolution
export function resolveResidue(state: PipelineState): PipelineState {
  const { presentHeirs, results, netEstate, skipInSiblingSection } = state;
  let { remainingFraction } = state;

  if (presentHeirs.length === 0) return state;

  const has = (id: string) => presentHeirs.some(h => h.heirId === id);
  const getCount = (id: string) => presentHeirs.find(h => h.heirId === id)?.count || 0;

  const addResult = (id: string, shareFraction: Fraction, shareStr: string, reason: string, isBlocked: boolean = false, articleOverride?: number) => {
    const heirInfo = HEIRS.find(h => h.id === id);
    if (!heirInfo) return;

    const count = getCount(id);
    const existingIndex = results.findIndex(r => r.heirId === id);

    const newResult: CalculationResult = {
      heirId: id,
      nameAr: heirInfo.nameAr,
      share: shareStr,
      shareDecimal: shareFraction.valueOf(),
      shareFraction: shareFraction,
      shares: 0,
      problemBase: 0,
      amount: isBlocked ? 0 : netEstate * shareFraction.valueOf(),
      isBlocked,
      reason,
      article: articleOverride || heirInfo.article,
      notes: heirInfo.notes,
      count
    };

    if (existingIndex !== -1) {
      if (results[existingIndex].isBlocked && !isBlocked) {
        results[existingIndex] = newResult;
      } else if (!isBlocked) {
        results[existingIndex] = newResult;
      }
      return;
    }

    results.push(newResult);
  };

  const hasSon = has('son');
  const hasDaughter = has('daughter');
  const hasDirectProgeny = hasSon || hasDaughter;
  const hasMaleChildren = hasSon || has('son_son');
  const hasFather = has('father');
  const hasGrandfather = has('grandfather');
  const hasFemaleDirectDescendant = hasDaughter || has('granddaughter');

  const includeImpededSibs = getInterpretationSetting('IMPEDED_SIBLINGS_REDUCTION');
  const getSiblingCountForMother = (id: string) => {
    const activeCount = getCount(id);
    if (!includeImpededSibs) return activeCount;
    const rawEntry = state.ctx.heirs.find(h => h.heirId === id);
    return rawEntry ? rawEntry.count : activeCount;
  };
  const siblingsCount = getSiblingCountForMother('full_brother') + getSiblingCountForMother('full_sister') + 
                        getSiblingCountForMother('paternal_brother') + getSiblingCountForMother('paternal_sister') + 
                        getSiblingCountForMother('maternal_siblings');

  const blockingCtx: BlockingContext = { has, getCount, hasDirectProgeny, siblingsCount, hasFemaleDirectDescendant };
  const checkBlocking = (heirId: string) => resolveBlocking(heirId, blockingCtx);

  const isMushtaraka = has('husband') && has('mother') && getCount('maternal_siblings') >= 2 && has('full_brother') && !hasFather && !has('daughter') && !hasSon && !has('son_son') && !has('granddaughter') && !hasGrandfather;

  const isAkdariya = has('husband') && has('mother') && hasGrandfather && getCount('full_sister') === 1 && 
                     !hasDirectProgeny && !has('son_son') && !has('granddaughter') && getCount('full_brother') === 0 && 
                     getCount('paternal_brother') === 0 && getCount('paternal_sister') === 0 && 
                     getCount('maternal_siblings') === 0 && !hasFather;

  const isAkdariyaPaternalSister = getInterpretationSetting('AKDARIYYA_PATERNAL_SISTER') &&
                                   has('husband') && has('mother') && hasGrandfather && getCount('paternal_sister') === 1 &&
                                   !hasDirectProgeny && !has('son_son') && !has('granddaughter') && getCount('full_sister') === 0 && getCount('full_brother') === 0 &&
                                   getCount('paternal_brother') === 0 && getCount('maternal_siblings') === 0 && !hasFather;

  const isAnyAkdariya = isAkdariya || isAkdariyaPaternalSister;

  // Asaba ma'a al-ghayr (Sister with daughter or granddaughter) logic
  if (has('full_sister') && hasFemaleDirectDescendant && !hasSon && !has('son_son') && !has('full_brother') && remainingFraction.compare(0) > 0) {
    const fsBlocking = checkBlocking('full_sister');
    const alreadyAdded = results.some(r => r.heirId === 'full_sister');
    if (!fsBlocking.isBlocked && !alreadyAdded) {
      const relationName = hasDaughter ? 'مع البنت' : 'مع بنت الابن';
      addResult('full_sister', remainingFraction, 'الباقي تعصيباً', `عصبة مع الغير (${relationName})`);
      remainingFraction = new Fraction(0);
    }
  }

  if (hasSon) {
    const sonCount = getCount('son');
    const daughterCount = getCount('daughter');

    if (remainingFraction.compare(0) > 0) {
      const totalParts = new Fraction(sonCount).mul(2).add(daughterCount);
      const partShare = remainingFraction.div(totalParts);

      addResult('son', partShare.mul(2).mul(sonCount), 'الباقي تعصيباً (للذكر مثل حظ الأنثيين)', 'عصبة بالنفس');
      if (hasDaughter) {
        addResult('daughter', partShare.mul(daughterCount), 'الباقي تعصيباً (للذكر مثل حظ الأنثيين)', 'عصبة بالغير');
      }
      remainingFraction = new Fraction(0);
    }
  } else if (has('son_son')) {
    const sonSonCount = getCount('son_son');
    const granddaughterCount = getCount('granddaughter');

    if (remainingFraction.compare(0) > 0) {
      const totalParts = new Fraction(sonSonCount).mul(2).add(granddaughterCount);
      const partShare = remainingFraction.div(totalParts);

      addResult('son_son', partShare.mul(2).mul(sonSonCount), 'الباقي تعصيباً (للذكر مثل حظ الأنثيين)', 'عصبة بالنفس');
      if (granddaughterCount > 0) {
        addResult('granddaughter', partShare.mul(granddaughterCount), 'الباقي تعصيباً (للذكر مثل حظ الأنثيين)', 'عصبة بالغير');
      }
      remainingFraction = new Fraction(0);
    }
  } else if (hasFather) {
    if (remainingFraction.compare(0) > 0) {
      const existingFather = results.find(r => r.heirId === 'father');
      if (existingFather) {
        existingFather.shareDecimal = existingFather.shareFraction.add(remainingFraction).valueOf();
        existingFather.shareFraction = existingFather.shareFraction.add(remainingFraction);
        existingFather.amount = existingFather.shareFraction.valueOf() * netEstate;
        existingFather.share = '1/6 + الباقي';
      } else {
        const shareStr = remainingFraction.equals(1) ? 'الكل تعصيباً' : 'الباقي تعصيباً';
        addResult('father', remainingFraction, shareStr, 'عصبة بالنفس — م.152');
      }
      remainingFraction = new Fraction(0);
    }
  } else if (hasGrandfather && !hasFather) {
    const hasSiblings = has('full_brother') || has('full_sister') || 
                       has('paternal_brother') || has('paternal_sister');

    if (hasSiblings && !hasMaleChildren) {
      // ART. 158: Grandfather with Siblings
      let broCount = 0;
      let sisCount = 0;
      let isFullPriority = false;

      if (has('full_brother') || has('full_sister')) {
        broCount = getCount('full_brother');
        sisCount = getCount('full_sister');
        isFullPriority = true;
      } else {
        broCount = getCount('paternal_brother');
        sisCount = getCount('paternal_sister');
        isFullPriority = false;
      }

      const oneSixthTotal = new Fraction(1, 6);
      let bestShare = oneSixthTotal;
      let reason = "الأحظ للجد (السدس) - م.158";

      const sisterId = isFullPriority ? 'full_sister' : 'paternal_sister';

      if (broCount > 0) {
        const oneThirdRemaining = remainingFraction.div(3);
        const totalParts = new Fraction(2).add(new Fraction(broCount).mul(2)).add(sisCount);
        const muqasamaShare = remainingFraction.div(totalParts).mul(2);

        if (oneThirdRemaining.compare(bestShare) > 0) {
          bestShare = oneThirdRemaining;
          reason = "الأحظ للجد (ثلث الباقي) - م.158";
        }
        if (muqasamaShare.compare(bestShare) > 0) {
          bestShare = muqasamaShare;
          reason = "الأحظ للجد (المقاسمة) - م.158";
        }

        const otherHeirsExist = results.some(r => 
          !r.isBlocked && 
          !['grandfather', 'full_brother', 'full_sister', 
            'paternal_brother', 'paternal_sister',
            'mandatory_bequest', 'voluntary_bequest'].includes(r.heirId));
        if (!otherHeirsExist) {
          const oneThirdTotal = new Fraction(1, 3);
          if (oneThirdTotal.compare(bestShare) > 0) {
            bestShare = oneThirdTotal;
            reason = "الأحظ للجد (ثلث التركة) - م.158";
          }
        }
      } else if (sisCount > 0) {
        const sisterFardShare = sisCount === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
        const actualSisterShare = (sisterFardShare.compare(remainingFraction) > 0 ? remainingFraction : sisterFardShare);

        const effectiveShare = actualSisterShare.compare(remainingFraction) > 0
          ? remainingFraction.compare(new Fraction(0)) > 0 ? remainingFraction : new Fraction(0)
          : actualSisterShare;

        if (!results.some(r => r.heirId === sisterId)) {
          addResult(sisterId, effectiveShare, effectiveShare.compare(sisterFardShare) === 0 ? 'فرضاً مع الجد' : 'فرضاً مع الجد (عالت المسألة)', 'فرضاً مع الجد — م.158', false, 158);
          remainingFraction = remainingFraction.sub(effectiveShare);
        }

        const safeRemaining = remainingFraction.compare(new Fraction(0)) > 0 ? remainingFraction : new Fraction(0);

        if (safeRemaining.compare(oneSixthTotal) > 0) {
          bestShare = safeRemaining;
          reason = "الأحظ للجد (الباقي بعد فرض الأخوات) - م.158";
        } else {
          bestShare = oneSixthTotal;
          reason = "الأحظ للجد (السدس) - م.158";
        }

        skipInSiblingSection.add(sisterId);
      }

      const existingGF = results.find(r => r.heirId === 'grandfather');
      if (existingGF) {
        if (bestShare.compare(existingGF.shareFraction) > 0) {
          remainingFraction = remainingFraction.add(existingGF.shareFraction).sub(bestShare);
          existingGF.shareFraction = bestShare;
          existingGF.shareDecimal = bestShare.valueOf();
          existingGF.amount = bestShare.valueOf() * netEstate;
          existingGF.reason = reason;
          existingGF.share = 'نصيب الأفضل';
        }
      } else {
        addResult('grandfather', bestShare, 'نصيب الأفضل', reason);
        remainingFraction = remainingFraction.sub(bestShare);
      }
    } else {
      const existingGF = results.find(r => r.heirId === 'grandfather');
      if (remainingFraction.compare(0) > 0) {
        if (existingGF) {
          existingGF.shareDecimal = existingGF.shareFraction.add(remainingFraction).valueOf();
          existingGF.shareFraction = existingGF.shareFraction.add(remainingFraction);
          existingGF.amount = existingGF.shareFraction.valueOf() * netEstate;
          existingGF.share = '1/6 + الباقي';
        } else {
          addResult('grandfather', remainingFraction, 'الباقي تعصيباً', 'عصبة بالنفس');
        }
        remainingFraction = new Fraction(0);
      }
    }
  }

  if (!hasSon && !has('son_son') && !hasFather) {
    if (!isMushtaraka && !isAnyAkdariya && (has('full_brother') || has('full_sister')) && !(skipInSiblingSection.has('full_sister') && skipInSiblingSection.has('full_brother'))) {
      const fbBlocking = checkBlocking('full_brother');
      const fsBlocking = checkBlocking('full_sister');

      if ((fbBlocking.isBlocked || !has('full_brother')) && (fsBlocking.isBlocked || !has('full_sister')) && !isAnyAkdariya) {
        if (has('full_brother') && fbBlocking.isBlocked) addResult('full_brother', new Fraction(0), '-', fbBlocking.reason, true, fbBlocking.article);
        if (has('full_sister') && fsBlocking.isBlocked) addResult('full_sister', new Fraction(0), '-', fsBlocking.reason, true, fsBlocking.article);
      } else {
        const broCount = getCount('full_brother');
        const sisCount = getCount('full_sister');

        if (broCount > 0) {
          const totalParts = new Fraction(broCount).mul(2).add(sisCount);
          const partShare = remainingFraction.div(totalParts);

          if (!skipInSiblingSection.has('full_brother')) addResult('full_brother', partShare.mul(2).mul(broCount), 'الباقي تعصيباً', 'عصبة بالنفس');
          if (sisCount > 0 && !skipInSiblingSection.has('full_sister')) {
            addResult('full_sister', partShare.mul(sisCount), 'الباقي تعصيباً', 'عصبة بالغير');
          }
          remainingFraction = new Fraction(0);
        } else if (sisCount > 0 && !skipInSiblingSection.has('full_sister')) {
          const share = sisCount === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
          addResult('full_sister', share, sisCount === 1 ? '1/2' : '2/3', 'فرضاً لعدم وجود الفرع الوارث والأصل المذكر');
          remainingFraction = remainingFraction.sub(share);
        }
      }
    }

    const fullSisterAlreadyAsaba = results.some(
      r => r.heirId === 'full_sister' && r.reason.includes('تعصيباً')
    );

    if ((has('paternal_brother') || has('paternal_sister')) && !isAnyAkdariya) {
      const pbBlocking = checkBlocking('paternal_brother');
      const psBlocking = checkBlocking('paternal_sister');

      if ((pbBlocking.isBlocked || !has('paternal_brother')) && (psBlocking.isBlocked || !has('paternal_sister'))) {
        if (has('paternal_brother') && pbBlocking.isBlocked) addResult('paternal_brother', new Fraction(0), '-', pbBlocking.reason, true, pbBlocking.article);
        if (has('paternal_sister') && psBlocking.isBlocked) addResult('paternal_sister', new Fraction(0), '-', psBlocking.reason, true, psBlocking.article);
      } else {
        const broCount = getCount('paternal_brother');
        const sisCount = getCount('paternal_sister');

        if (broCount > 0) {
          const totalParts = new Fraction(broCount).mul(2).add(sisCount);
          const partShare = remainingFraction.div(totalParts);

          addResult('paternal_brother', partShare.mul(2).mul(broCount), 'الباقي تعصيباً', 'عصبة بالنفس');
          if (sisCount > 0) {
            addResult('paternal_sister', partShare.mul(sisCount), 'الباقي تعصيباً', 'عصبة بالغير');
          }
          remainingFraction = new Fraction(0);
        } else if (sisCount > 0) {
          if (hasFemaleDirectDescendant) {
            const relationName = hasDaughter ? 'مع البنت' : 'مع بنت الابن';
            addResult('paternal_sister', remainingFraction, 'الباقي تعصيباً', `عصبة مع الغير (${relationName})`);
            remainingFraction = new Fraction(0);
          } else {
            let share = new Fraction(0);
            let reason = '';
            let shareStr = '';
            if (has('full_sister') && getCount('full_sister') === 1 && !checkBlocking('full_sister').isBlocked && !fullSisterAlreadyAsaba) {
              share = new Fraction(1, 6);
              shareStr = '1/6';
              reason = 'تكملة الثلثين مع الأخت الشقيقة';
            } else {
              share = sisCount === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
              shareStr = sisCount === 1 ? '1/2' : '2/3';
              reason = 'فرضاً لعدم وجود الشقيق أو الفرع أو الأصل';
            }
            addResult('paternal_sister', share, shareStr, reason);
            remainingFraction = remainingFraction.sub(share);
          }
        }
      }
    }
  }

  // NEPHEWS
  if (has('full_nephew')) {
    const blocking = checkBlocking('full_nephew');
    if (blocking.isBlocked) {
      addResult('full_nephew', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('full_nephew', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه (الأقرب من الحواشي) - م.153');
      remainingFraction = new Fraction(0);
    }
  }
  if (has('paternal_nephew')) {
    const blocking = checkBlocking('paternal_nephew');
    if (blocking.isBlocked) {
      addResult('paternal_nephew', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('paternal_nephew', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه (الأقرب من الحواشي) - م.153');
      remainingFraction = new Fraction(0);
    }
  }

  // UNCLES
  if (has('full_uncle')) {
    const blocking = checkBlocking('full_uncle');
    if (blocking.isBlocked) {
      addResult('full_uncle', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('full_uncle', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه (جهة العمومة) - م.153');
      remainingFraction = new Fraction(0);
    }
  }
  if (has('paternal_uncle')) {
    const blocking = checkBlocking('paternal_uncle');
    if (blocking.isBlocked) {
      addResult('paternal_uncle', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('paternal_uncle', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه - م.153');
      remainingFraction = new Fraction(0);
    }
  }

  // UNCLE SONS
  if (has('full_uncle_son')) {
    const blocking = checkBlocking('full_uncle_son');
    if (blocking.isBlocked) {
      addResult('full_uncle_son', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('full_uncle_son', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه - م.153');
      remainingFraction = new Fraction(0);
    }
  }
  if (has('paternal_uncle_son')) {
    const blocking = checkBlocking('paternal_uncle_son');
    if (blocking.isBlocked) {
      addResult('paternal_uncle_son', new Fraction(0), '-', blocking.reason, true, blocking.article);
    } else if (remainingFraction.compare(0) > 0) {
      addResult('paternal_uncle_son', remainingFraction, 'الباقي تعصيباً', 'عصبة بنفسه - م.153');
      remainingFraction = new Fraction(0);
    }
  }

  // DISTANT KINDRED (Dhu al-Arham)
  if (has('distant_kindred') || has('maternal_grandfather')) {
    const hasLegalHeirs = results.some(r => !r.isBlocked && r.heirId !== 'husband' && r.heirId !== 'wife' && r.shareFraction.compare(0) > 0);

    if (hasLegalHeirs) {
      if (has('distant_kindred'))
        addResult('distant_kindred', new Fraction(0), '-', 'محجوبون بوجود أصحاب فروض أو عصبات — م.168', true);
      if (has('maternal_grandfather'))
        addResult('maternal_grandfather', new Fraction(0), '-', 'محجوبون بوجود أصحاب فروض أو عصبات — م.168', true);
    } else if (remainingFraction.compare(0) > 0) {
      if (has('distant_kindred')) {
        addResult('distant_kindred', remainingFraction, 'الباقي توريثاً', 'من ذوي الأرحام عند انعدام العصبة وأصحاب الفروض — م.168');
        remainingFraction = new Fraction(0);
      }
      if (has('maternal_grandfather')) {
        addResult('maternal_grandfather', remainingFraction, 'الباقي توريثاً', 'من ذوي الأرحام (الجد لأم) — م.168');
        remainingFraction = new Fraction(0);
      }
    }
  }

  return {
    ...state,
    results,
    remainingFraction,
  };
}

// Stage 6: Awl (العول) Application
export function applyAwlIfNeeded(state: PipelineState): PipelineState {
  const { results, netEstate } = state;
  const inheritanceResults = results.filter(r => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');

  let traditionalBase = inheritanceResults.filter(r => !r.isBlocked && r.shareFraction.compare(0) > 0)
    .reduce((acc, r) => lcm(acc, Number(r.shareFraction.d)), 1);

  const totalShares = inheritanceResults.reduce((sum, r) => sum.add(r.isBlocked ? new Fraction(0) : r.shareFraction), new Fraction(0));

  let calcType: 'normal' | 'awl' | 'radd' = state.calcType;

  if (totalShares.compare(1) > 0) {
    calcType = 'awl';
    const awlBaseNumerator = inheritanceResults.reduce((sum, r) => {
      if (r.isBlocked) return sum;
      const termNumerator = Number(r.shareFraction.n) * (traditionalBase / Number(r.shareFraction.d));
      return sum.add(new Fraction(termNumerator));
    }, new Fraction(0));

    traditionalBase = Number(Number(awlBaseNumerator.d) === 1 ? awlBaseNumerator.n : Math.round(awlBaseNumerator.valueOf()));

    inheritanceResults.forEach(r => {
      if (!r.isBlocked) {
        r.shareFraction = r.shareFraction.div(totalShares);
        r.shareDecimal = r.shareFraction.valueOf();
        r.amount = r.shareFraction.valueOf() * netEstate;
        r.reason += ' (عالت المسألة)';
      }
    });
  }

  return {
    ...state,
    calcType,
    traditionalBase,
  };
}

// Stage 7: Radd (الرد), Hamilton Distribution & Tas-hih (Correction)
export function applyRaddIfNeeded(state: PipelineState): PipelineState {
  const { results, netEstate, activeHeirs, remainingFraction } = state;
  let { calcType, traditionalBase } = state;

  const inheritanceResults = results.filter(r => r.heirId !== 'voluntary_bequest' && r.heirId !== 'mandatory_bequest');
  const totalShares = inheritanceResults.reduce((sum, r) => sum.add(r.isBlocked ? new Fraction(0) : r.shareFraction), new Fraction(0));

  if (totalShares.compare(1) < 0 && remainingFraction.compare(0) > 0) {
    const raddHeirs = inheritanceResults.filter(r => !r.isBlocked && r.heirId !== 'husband' && r.heirId !== 'wife' && r.shareFraction.compare(0) > 0);

    if (raddHeirs.length > 0) {
      calcType = 'radd';
      const raddTotalShares = raddHeirs.reduce((sum, r) => sum.add(r.shareFraction), new Fraction(0));
      raddHeirs.forEach(r => {
        const addedShare = remainingFraction.mul(r.shareFraction.div(raddTotalShares));
        r.shareFraction = r.shareFraction.add(addedShare);
        r.amount = r.shareFraction.valueOf() * netEstate;
        r.reason += ' (رداً)';
      });
      traditionalBase = inheritanceResults.filter(r => !r.isBlocked && r.shareFraction.compare(0) > 0)
        .reduce((acc, r) => lcm(acc, Number(r.shareFraction.d)), 1);
    } else {
      const spouses = inheritanceResults.filter(r => !r.isBlocked && (r.heirId === 'husband' || r.heirId === 'wife') && r.shareFraction.compare(0) > 0);

      if (spouses.length > 0) {
        calcType = 'radd';
        spouses.forEach(spouse => {
          spouse.shareFraction = spouse.shareFraction.add(remainingFraction.div(spouses.length));
          spouse.amount = spouse.shareFraction.valueOf() * netEstate;
          spouse.reason += ' (رداً)';
        });
        traditionalBase = inheritanceResults.filter(r => !r.isBlocked && r.shareFraction.compare(0) > 0)
          .reduce((acc, r) => lcm(acc, Number(r.shareFraction.d)), 1);
      } else {
        results.push({
          heirId: 'treasury',
          nameAr: 'بيت المال / الباقي',
          share: 'الباقي',
          shareDecimal: remainingFraction.valueOf(),
          shareFraction: remainingFraction,
          shares: 0,
          problemBase: 0,
          amount: remainingFraction.valueOf() * netEstate,
          isBlocked: false,
          reason: 'لعدم وجود مستحق للرد أو عصبة',
          count: 1
        });
        traditionalBase = results.filter(r => !r.isBlocked && r.shareFraction.compare(0) > 0)
          .reduce((acc, r) => lcm(acc, Number(r.shareFraction.d)), 1);
      }
    }
  }

  // Auto-show blocked heirs
  const presentHeirs = activeHeirs.filter(h => h.isPresent && h.count > 0 && !h.isImpeded);
  const hasInPresent = (id: string) => presentHeirs.some(h => h.heirId === id);
  const getCountFromPresent = (id: string) => presentHeirs.find(h => h.heirId === id)?.count || 0;
  const includeImpededSibs = getInterpretationSetting('IMPEDED_SIBLINGS_REDUCTION');
  const getSiblingCountForMother = (id: string) => {
    const activeCount = getCountFromPresent(id);
    if (!includeImpededSibs) return activeCount;
    const rawEntry = state.ctx.heirs.find(h => h.heirId === id);
    return rawEntry ? rawEntry.count : activeCount;
  };
  const siblingsCount = getSiblingCountForMother('full_brother') + getSiblingCountForMother('full_sister') + 
                        getSiblingCountForMother('paternal_brother') + getSiblingCountForMother('paternal_sister') + 
                        getSiblingCountForMother('maternal_siblings');

  const blockingCtx: BlockingContext = {
    has: hasInPresent,
    getCount: getCountFromPresent,
    hasDirectProgeny: hasInPresent('son') || hasInPresent('daughter'),
    siblingsCount,
    hasFemaleDirectDescendant: hasInPresent('daughter') || hasInPresent('granddaughter'),
  };

  const selectedHeirIds = state.ctx.heirs.map(h => h.heirId);
  HEIRS.filter(h => selectedHeirIds.includes(h.id)).forEach(h => {
    if (!hasInPresent(h.id) && h.id !== 'treasury' && !results.some(r => r.heirId === h.id)) {
      const blocking = resolveBlocking(h.id, blockingCtx);
      if (blocking.isBlocked) {
        const heirInfo = HEIRS.find(hi => hi.id === h.id);
        if (heirInfo) {
          results.push({
            heirId: h.id,
            nameAr: heirInfo.nameAr,
            share: 'محجوب',
            shareDecimal: 0,
            shareFraction: new Fraction(0),
            shares: 0,
            problemBase: 0,
            amount: 0,
            isBlocked: true,
            reason: blocking.reason.startsWith('محجوب') ? blocking.reason : `محجوب بـ: ${blocking.reason}`,
            article: blocking.article || heirInfo.article,
            notes: heirInfo.notes,
            count: getCountFromPresent(h.id),
          });
        }
      }
    }
  });

  // Hamilton Largest-Remainder Method for currency distribution
  distributeAmounts(results, netEstate);

  // Tas-hih (Correction factor)
  const activeCalculatedHeirs = results.filter(r => !r.isBlocked && r.shareFraction.compare(0) !== 0);
  let tasHihFactor = 1;
  activeCalculatedHeirs.forEach(r => {
    const activeCount = Math.max(1, r.count);
    const indFrac = r.shareFraction.div(activeCount);
    const den = Number(indFrac.d);
    if (den > 0) {
      const requiredFactor = den / gcd(traditionalBase, den);
      tasHihFactor = lcm(tasHihFactor, requiredFactor);
    }
  });

  const finalBase = traditionalBase * tasHihFactor;

  results.forEach(r => {
    r.problemBase = finalBase;
    r.shares = Math.round(r.shareFraction.mul(finalBase).valueOf());
    r.calculationType = calcType;
  });

  // Invariant check
  const seenHeirIds = new Set<string>();
  for (const r of results) {
    if (seenHeirIds.has(r.heirId)) {
      const msg = `Invariant violation: heirId '${r.heirId}' appears multiple times in calculation results.`;
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV !== 'production') {
        throw new Error(msg);
      } else {
        console.error(msg);
      }
    }
    seenHeirIds.add(r.heirId);
  }

  return {
    ...state,
    calcType,
    traditionalBase,
    results,
  };
}

function distributeAmounts(res: CalculationResult[], totalNetEstate: number) {
  const heirsToDistribute = res.filter(r => r.heirId !== 'mandatory_bequest' && r.heirId !== 'voluntary_bequest' && !r.isBlocked);

  const totalSharesFraction = heirsToDistribute.reduce((sum, r) => sum.add(r.shareFraction), new Fraction(0));
  if (totalSharesFraction.compare(0) === 0) return;

  const exactValues = heirsToDistribute.map(r => r.shareFraction.valueOf() * totalNetEstate);
  const floors = exactValues.map(v => Math.floor(v));
  const remainders = exactValues.map((v, i) => v - floors[i]);

  const allocated = floors.reduce((a, b) => a + b, 0);
  const undistributed = Math.round(totalNetEstate - allocated);

  const remainderIndices = remainders.map((r, i) => ({ remainder: r, index: i }));
  remainderIndices.sort((a, b) => b.remainder - a.remainder);

  const finalAmounts = [...floors];
  for (let i = 0; i < undistributed && i < remainderIndices.length; i++) {
    finalAmounts[remainderIndices[i].index] += 1;
  }

  heirsToDistribute.forEach((r, i) => {
    r.amount = finalAmounts[i];
  });
}

export function calculateInheritanceInternal(
  heirs: HeirPresence[],
  estate: number,
  debts: number,
  funeralCosts: number,
  bequest: number,
  hasMandatoryBequest: boolean = false,
  deceasedChildren: (DeceasedChildGroup | { type: 'son' | 'daughter', count: number })[] = [],
  unbornOutcome: 'pending' | 'born_male' | 'born_female' | 'stillborn' = 'stillborn',
  hasUnbornHeir: boolean = false
): CalculationResult[] {
  let state = createInitialPipelineState(
    heirs,
    estate,
    debts,
    funeralCosts,
    bequest,
    hasMandatoryBequest,
    deceasedChildren,
    unbornOutcome,
    hasUnbornHeir
  );

  state = withholdForUnbornHeir(state);
  state = computeMandatoryBequest(state);
  state = capVoluntaryBequest(state);
  state = resolveFixedShares(state);
  state = resolveResidue(state);
  state = applyAwlIfNeeded(state);
  state = applyRaddIfNeeded(state);

  return state.results;
}
