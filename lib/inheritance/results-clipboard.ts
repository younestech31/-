import type { CalculationResult } from './inheritance-calculator';
import { formatDZDAmount } from './document-branding';

export interface ResultsClipboardOptions {
  title: string;
  problemBase?: number | null;
  results: CalculationResult[];
  customNamesByHeir?: Record<string, Array<string | undefined> | undefined>;
  isPureSharesMode: boolean;
}

/**
 * Build the text summary from the same individual allocations that are shown
 * in the calculation result. A grouped heir can contain both impeded and
 * inheriting individuals, so dividing the group amount by its headcount is
 * not a valid substitute for the per-person result.
 */
export function buildResultsClipboardText({
  title,
  problemBase,
  results,
  customNamesByHeir = {},
  isPureSharesMode,
}: ResultsClipboardOptions): string {
  const lines = [title];
  if (problemBase) lines.push(`أصل المسألة: ${problemBase}`);
  lines.push('--------------------------------------------------');

  const formatPercentage = (fraction: CalculationResult['shareFraction']): string => {
    const percentage = fraction.valueOf() * 100;
    return percentage % 1 === 0 ? `${percentage}%` : `${percentage.toFixed(2)}%`;
  };

  const appendIndividual = (
    result: CalculationResult,
    index: number,
    count: number,
  ) => {
    const individual = result.individuals?.[index];
    const isBlocked = individual?.isBlocked ?? result.isBlocked;
    const shareFraction = individual?.shareFraction ?? (
      count > 1 ? result.shareFraction.div(count) : result.shareFraction
    );
    const amount = individual?.amount ?? (
      count > 1 ? result.amount / count : result.amount
    );
    const customName = customNamesByHeir[result.heirId]?.[index];
    const baseName = count > 1 ? `${result.nameAr} ${index + 1}` : result.nameAr;
    const displayName = customName ? `${customName} (${result.nameAr})` : baseName;
    const shareLabel = isBlocked
      ? (individual?.share === 'محروم' ? 'محروم' : 'محجوب')
      : (individual?.share || result.share);
    const percentage = isBlocked ? '0%' : formatPercentage(shareFraction);

    if (isPureSharesMode) {
      lines.push(`${displayName}: ${shareLabel} - النسبة: ${percentage}`);
    } else {
      lines.push(
        `${displayName}: ${shareLabel} - المبلغ: ${formatDZDAmount(isBlocked ? 0 : amount, 'western', true)} (${percentage})`
      );
    }
  };

  results.forEach(result => {
    const count = Math.max(1, result.count || 1);
    if (count > 1) {
      for (let index = 0; index < count; index++) {
        appendIndividual(result, index, count);
      }
    } else {
      appendIndividual(result, 0, count);
    }
  });

  return lines.join('\\n');
}
