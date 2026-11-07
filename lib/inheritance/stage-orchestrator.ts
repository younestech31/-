import { calculateInheritance, type DeceasedChildGroup } from '@/lib/inheritance/inheritance-calculator';
import { resolveNoHeirsPolicy } from '@/lib/inheritance/munasakhat-resolver';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';
import type { StageResult } from '@/components/inheritance/ResultsTable';
import { isHeirExcludedInMunasakhat } from '@/data/munasakhat-exclusions';
import { HEIRS } from '@/data/heirs';

export function runInheritanceOrchestration(
  args: [MunasakhatStage[], number, number, number, number]
): StageResult[] {
  const [munasakhatStages, debouncedEstate, debouncedDebts, debouncedFuneralCosts, debouncedBequest] = args;
  const stagesData: StageResult[] = [];

  for (let index = 0; index < munasakhatStages.length; index++) {
    const stage = munasakhatStages[index];
    const inheritedAmount = stage.inheritedFromParentAmount ?? stage.alreadyInheritedFromParentAmount ?? stage.inheritedAmount ?? stage.estate ?? 0;
    const ownAssets = stage.ownSeparateAssets ?? 0;
    const stageEstate = index === 0 ? debouncedEstate : (inheritedAmount + ownAssets);
    const stageDebts   = index === 0 ? debouncedDebts        : (stage.debts || 0);
    const stageFuneral = index === 0 ? debouncedFuneralCosts : (stage.funeralCosts || 0);
    const stageBequest = index === 0 ? debouncedBequest      : (stage.bequest || 0);

    // Normalize presence array / record
    const presenceList = stage.heirs?.length ? stage.heirs : (stage.heirPresence ? Object.values(stage.heirPresence) : []);
    const parentHeirId = stage.parentHeirId || stage.deceasedHeirId;
    const hasOtherUnion = stage.secondDeceasedHasChildrenFromOtherUnion ?? stage.hasChildrenFromOtherUnion ?? false;

    // First pass: identify all present heirs that would be excluded by default
    const excludedHeirWarnings: Array<{ heirId: string; heirNameAr: string; reason: string; source?: string }> = [];
    const heirsToCheck = presenceList.filter(h => h.isPresent && h.count > 0 && !h.isImpeded);
    const manualClassificationIds = new Set(['distant_kindred', 'maternal_grandfather']);
    const manualClassificationHeirs = heirsToCheck.filter(h => manualClassificationIds.has(h.heirId));
    const hasGrandfather = heirsToCheck.some(h => h.heirId === 'grandfather');
    const hasMaternalGrandmother = heirsToCheck.some(h => h.heirId === 'maternal_grandmother');
    const hasPaternalGrandmother = heirsToCheck.some(h => h.heirId === 'paternal_grandmother');
    const grandmotherDegreeNeedsManualReview =
      (hasMaternalGrandmother && hasPaternalGrandmother) ||
      heirsToCheck.some(h =>
        ['maternal_grandmother', 'paternal_grandmother'].includes(h.heirId) && h.count > 1
      );
    const hasFullSiblingLine = heirsToCheck.some(h => ['full_brother', 'full_sister'].includes(h.heirId));
    const hasPaternalSiblingLine = heirsToCheck.some(h => ['paternal_brother', 'paternal_sister'].includes(h.heirId));
    const hasUnresolvedGrandfatherMuadadah = hasGrandfather && hasFullSiblingLine && hasPaternalSiblingLine;
    const hasGranddaughter = heirsToCheck.some(h => h.heirId === 'granddaughter');
    const hasSonSon = heirsToCheck.some(h => h.heirId === 'son_son');
    const hasPotentialGranddaughterCousinAsaba = heirsToCheck.some(h =>
      ['full_nephew', 'paternal_nephew', 'full_uncle_son', 'paternal_uncle_son'].includes(h.heirId)
    );
    const granddaughterCousinDegreeNeedsManualReview =
      hasGranddaughter && hasPotentialGranddaughterCousinAsaba;
    // The input model groups every degree of son's son/daughter under one ID.
    // Arts. 155 and 163 make the effect of a male descendant degree-dependent;
    // never assume that every recorded son's son can make every son's daughter
    // an asaba or block her. Hold the production result until the UI captures
    // the exact branch and degree of each descendant.
    const granddaughterSonSonDegreeNeedsManualReview =
      hasGranddaughter && hasSonSon;
    const requiresManualClassification =
      manualClassificationHeirs.length > 0 ||
      hasUnresolvedGrandfatherMuadadah ||
      granddaughterCousinDegreeNeedsManualReview ||
      granddaughterSonSonDegreeNeedsManualReview ||
      grandmotherDegreeNeedsManualReview;

    if (grandmotherDegreeNeedsManualReview) {
      excludedHeirWarnings.push({
        heirId: 'grandmother_degree',
        heirNameAr: 'الجدة',
        reason: 'المادتان 149(4) و161: تقسيم السدس يتوقف على درجة كل جدة؛ فإذا اجتمعت جدتان في درجة واحدة اشتركتا فيه، وإذا كانت إحداهما أبعد اختصت الأقرب به. النموذج لا يسجل درجة الجدة أو كونها جدة مباشرة/أبعد؛ لذلك عُلّق الحساب الآلي عند إدخال جدتين أو أكثر.',
        source: 'المادتان 149(4) و161 من قانون الأسرة الجزائري — النص المرفق.',
      });
    }

    if (granddaughterCousinDegreeNeedsManualReview) {
      excludedHeirWarnings.push({
        heirId: 'granddaughter',
        heirNameAr: 'بنت الابن',
        reason: 'المادة 155: قد تصبح بنت الابن عصبة بغيرها مع ابن عمها المساوي لها في الدرجة أو ابن ابن عمها الأنزل درجة. لا يسجل النموذج الحالي درجة هذا القريب وجهة الإدلاء بدقة؛ لذلك أوقف الحساب الآلي لهذه الصورة إلى أن تُراجع القرابة والدرجة.',
        source: 'المادة 155 من قانون الأسرة الجزائري — النص المرفق.',
      });
    }

    if (granddaughterSonSonDegreeNeedsManualReview) {
      excludedHeirWarnings.push({
        heirId: 'granddaughter_son_son_degree',
        heirNameAr: 'درجة ابن الابن وبنت الابن',
        reason: 'المادتان 155 و163: لا تسجل المدخلات الحالية درجة ابن الابن وبنت الابن ولا فرع كل منهما. لا يجوز افتراض أن كل ابن ابن يعصّب كل بنت ابن أو يحجبها؛ فقد يختلف الحكم باختلاف الدرجة وجهة الإدلاء. عُلّق الحساب الآلي إلى حين توثيق درجة كل فرع ومراجعته.',
        source: 'المادتان 155 و163 من قانون الأسرة الجزائري — النص المرفق.',
      });
    }

    for (const h of manualClassificationHeirs) {
      const heirDetails = HEIRS.find(x => x.id === h.heirId);
      excludedHeirWarnings.push({
        heirId: h.heirId,
        heirNameAr: heirDetails?.nameAr || h.heirId,
        reason: 'هذا المدخل لا يحدد صلة ذي الرحم ودرجة القرابة وجهة الإدلاء. ترتب المادة 168 المستحقين وفق هذه التفاصيل؛ لذلك لا يمكن اعتماد القسمة الآلية للفئة العامة.',
        source: 'المادة 168 من قانون الأسرة — بوابة وزارة العدل: https://droit.mjustice.gov.dz/ar/content/قوانين-أساسية-2',
      });
    }

    for (const h of heirsToCheck) {
      if (manualClassificationIds.has(h.heirId)) continue;
      if (index === 0 || !parentHeirId) continue;
      
      const { requiresReview, reason, source } = isHeirExcludedInMunasakhat(
        h.heirId,
        parentHeirId,
        hasOtherUnion
      );
      
      if (requiresReview) {
        const heirDetails = HEIRS.find(x => x.id === h.heirId);
        excludedHeirWarnings.push({
          heirId: h.heirId,
          heirNameAr: heirDetails?.nameAr || h.heirId,
          reason,
          source,
        });
      }
    }

    // Review prompts are not legal exclusion decisions. Keep all selected heirs
    // in the calculation, then hold result display until every prompt is reviewed.
    // A user-acknowledged inclusion remains marked as unverified and cannot be exported.
    const hasUnverifiedOverride = heirsToCheck.some(h => {
      if (manualClassificationIds.has(h.heirId)) {
        return Boolean(stage.acknowledgedExclusions?.includes(h.heirId));
      }
      if (index === 0 || !parentHeirId) return false;
      const { requiresReview } = isHeirExcludedInMunasakhat(
        h.heirId,
        parentHeirId,
        hasOtherUnion
      );
      return requiresReview && Boolean(stage.acknowledgedExclusions?.includes(h.heirId));
    });
    const sanitizedPresence = presenceList
      .map(({ customNames: _customNames, ...rest }) => rest);

    const sonsCount = stage.deceasedSonsCount ?? (stage.deceasedChildren?.filter(c => c.type === 'son').reduce((sum, c) => sum + c.count, 0) || 0);
    const daughtersCount = stage.deceasedDaughtersCount ?? (stage.deceasedChildren?.filter(c => c.type === 'daughter').reduce((sum, c) => sum + c.count, 0) || 0);
    // Article 169–172 requires branch-level descendant eligibility, direct-heir
    // status, gifts/wills, prior inheritance, and the distribution among each
    // grandchild. The current aggregate son/daughter counters cannot capture
    // those facts, so do not emit a misleading automatic tanzil amount.
    const tanzilNeedsManualReview = Boolean(
      stage.hasMandatoryBequest && sonsCount + daughtersCount > 0
    );

    // Preserve Article 171/172 metadata for each deceased-child group.
    // The UI keeps the legacy count fields separately, so use those counts
    // while carrying the matching group's gift / prior-inheritance metadata.
    const deceasedChildrenForCalculation: DeceasedChildGroup[] = ([
      { type: 'son' as const, count: sonsCount },
      { type: 'daughter' as const, count: daughtersCount },
    ]).filter(group => group.count > 0).map((group): DeceasedChildGroup => {
      const configuredGroup = stage.deceasedChildren?.find(child => child.type === group.type);
      return configuredGroup ? { ...configuredGroup, count: group.count } : group;
    });

    // Older saved cases may store one stage-level offset. Apply it once only;
    // never duplicate the same amount across both the son and daughter groups.
    if (
      stage.alreadyInheritedFromParentAmount &&
      stage.alreadyInheritedFromParentAmount > 0 &&
      deceasedChildrenForCalculation.length > 0 &&
      !deceasedChildrenForCalculation.some(child => child.alreadyInheritedFromParentAmount !== undefined)
    ) {
      deceasedChildrenForCalculation[0] = {
        ...deceasedChildrenForCalculation[0],
        alreadyInheritedFromParentAmount: stage.alreadyInheritedFromParentAmount,
      };
    }

    const minorHeirNeedsJudicialPartition = stage.hasMinorHeir === true;
    const hasSpouseHeir = presenceList.some(heir =>
      heir.isPresent && heir.count > 0 &&
      (heir.heirId === 'husband' || heir.heirId === 'wife')
    );
    const spouseEligibilityNeedsReview =
      hasSpouseHeir && stage.confirmedSpouseEligibility !== true;
    const missingHeirNeedsManualReview = presenceList.some(heir =>
      heir.isPresent && heir.count > 1 && heir.missingPersonStatus === 'missing_presumed_alive'
    );
    const deathOrderNeedsManualReview = stage.deathOrderUncertain === true;
    const hasInvoluntaryKiller = presenceList.some(heir =>
      heir.isPresent && heir.count > 0 && (
        heir.impedimentReasonId === 'involuntary_killer' ||
        heir.impedimentReasonIds?.some(reasonId => reasonId === 'involuntary_killer') ||
        heir.impededIndexes?.some((isImpeded, index) =>
          isImpeded &&
          (heir.impedimentReasonIds?.[index] ?? heir.impedimentReasonId) === 'involuntary_killer'
        )
      )
    );
    const involuntaryKillerNeedsCompensationReview =
      hasInvoluntaryKiller && stage.confirmedDiyahExcluded !== true;
    const pregnancyNeedsManualReview = Boolean(
      stage.pregnancyDisputed ||
      (stage.hasUnbornHeir &&
        (!stage.unbornOutcome || stage.unbornOutcome === 'pending' ||
          ['twins_male_female', 'twins_males', 'twins_females'].includes(stage.unbornOutcome)))
    );

    const res = requiresManualClassification || tanzilNeedsManualReview || pregnancyNeedsManualReview || deathOrderNeedsManualReview || involuntaryKillerNeedsCompensationReview || missingHeirNeedsManualReview || spouseEligibilityNeedsReview
      ? []
      : calculateInheritance(
          sanitizedPresence,
          stageEstate,
          stageDebts,
          stageFuneral,
          stageBequest,
          stage.hasMandatoryBequest && !tanzilNeedsManualReview,
          deceasedChildrenForCalculation,
          stage.unbornOutcome === 'twins_male_female' || stage.unbornOutcome === 'twins_males' || stage.unbornOutcome === 'twins_females'
            ? 'stillborn'
            : (stage.unbornOutcome || 'stillborn'),
          stage.hasUnbornHeir ?? false,
          stage.confirmedNoDistantKindred === true,
        );

    if (hasUnverifiedOverride) {
      res.forEach(r => {
        r.hasUnverifiedOverride = true;
      });
    }

    const mandatoryBequest = res.find(r => r.heirId === 'mandatory_bequest')?.amount ?? 0;
    const actualBequest = res.find(r => r.heirId === 'voluntary_bequest')?.amount ?? 0;
    const net = stageEstate - stageDebts - stageFuneral - actualBequest - mandatoryBequest;

    let noHeirsRedistribution: StageResult['noHeirsRedistribution'] = null;
    const noHeirsNeedsManualReview = res.some(result => result.heirId === 'article_180_review');

    if (index > 0 && stage.parentHeirId) {
      const activeHeirs = res.filter(
        r => !r.isBlocked && r.amount > 0 &&
             r.heirId !== 'mandatory_bequest' &&
             r.heirId !== 'voluntary_bequest' &&
             r.heirId !== 'treasury'
      );

      if (activeHeirs.length === 0 && net > 0 && stage.confirmedNoDistantKindred === true && !pregnancyNeedsManualReview && !tanzilNeedsManualReview) {
        const parentStageData = stagesData.find(
          sd => sd.stage.id === stage.parentStageId
        );
        const parentResults = parentStageData?.results ?? [];

        const redistribution = resolveNoHeirsPolicy(stage, net, parentResults);
        noHeirsRedistribution = redistribution;
      }
    }

    stagesData.push({
      stage,
      results: res,
      netEstate: net,
      noHeirsRedistribution,
      excludedHeirWarnings,
      hasUnverifiedOverride,
      requiresManualClassification,
      tanzilNeedsManualReview,
      noHeirsNeedsManualReview,
      pregnancyNeedsManualReview,
      minorHeirNeedsJudicialPartition,
      deathOrderNeedsManualReview,
      involuntaryKillerNeedsCompensationReview,
      missingHeirNeedsManualReview,
      spouseEligibilityNeedsReview,
    });
  }

  return stagesData;
}
