import { CalculationResult } from './inheritance-calculator';
import { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

export interface StageValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateAllStages(stages: MunasakhatStage[]): StageValidationResult[] {
  return stages.map(stage => {
    const errors: string[] = [];
    
    if (stage.estate !== undefined && stage.estate < 0) {
      errors.push('قيمة التركة لا يمكن أن تكون سالبة');
    }
    
    const deceasedName = stage.deceasedName?.trim() || stage.deceasedNameAr?.trim();
    if (!deceasedName && stage.id !== 'root' && stage.id !== 'stage-0') {
      errors.push('اسم المتوفى مطلوب');
    }
    
    const heirEntries = stage.heirs?.length
      ? stage.heirs
      : Object.values(stage.heirPresence || {});
    const hasAnyHeir = heirEntries.some(h => h.isPresent && h.count > 0);
    const hasSons = (stage.deceasedSonsCount || 0) > 0;
    const hasDaughters = (stage.deceasedDaughtersCount || 0) > 0;
    
    if (!hasAnyHeir && !hasSons && !hasDaughters && stage.id !== 'root') {
      errors.push('يجب تحديد وارث واحد على الأقل');
    }
    
    return { isValid: errors.length === 0, errors };
  });
}

export function resolveNoHeirsPolicy(
  stage: MunasakhatStage,
  net: number,
  __parentResults: CalculationResult[]
): {
  policy: 'treasury';
  amount: number;
  messageAr: string;
  redistributeTo?: CalculationResult[];
} {
  // فى قانون الأسرة الجزائري، إذا لم يوجد للمتوفى الثاني أي ورثة (لا أصحاب فروض ولا عصبة ولا ذوي أرحام)، تؤول تركته للخزينة (بيت المال).
  // إذا كان المستخدم لم يختر ورثته بالخطأ، يجب عليه تصحيح المسألة.
  return {
    policy: 'treasury',
    amount: net,
    messageAr: `تؤول تركة (${stage.deceasedName || stage.deceasedNameAr || 'المتوفى'}) إلى الخزينة العامة (بيت المال) لعدم وجود ورثة.`,
  };
}
