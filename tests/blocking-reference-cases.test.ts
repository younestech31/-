import { describe, expect, it } from 'vitest';
import {
  resolveBlocking,
  type BlockingContext,
} from '@/lib/inheritance/blocking-resolver';
import {
  calculateInheritance,
  type HeirPresence,
} from '@/lib/inheritance/inheritance-calculator';
import { runInheritanceOrchestration } from '@/lib/inheritance/stage-orchestrator';
import type { MunasakhatStage } from '@/components/inheritance/InheritanceCalculator';

type RuleCase = {
  id: string;
  article: number;
  heir: string;
  blockers: string[];
  counts?: Record<string, number>;
};

const stagePresent = (heirId: string, count = 1): HeirPresence => ({
  heirId,
  count,
  isPresent: true,
});

/**
 * These expectations are deliberately written as a separate statutory
 * fixture. They do not import BLOCKING_RULES or derive expected outcomes
 * from the production rule table.
 */
const statutoryBlockingCases: RuleCase[] = [
  { id: 'art161-mother-blocks-maternal-grandmother', article: 161, heir: 'maternal_grandmother', blockers: ['mother'] },
  { id: 'art161-mother-blocks-paternal-grandmother', article: 161, heir: 'paternal_grandmother', blockers: ['mother'] },
  { id: 'art161-father-blocks-paternal-grandmother', article: 161, heir: 'paternal_grandmother', blockers: ['father'] },
  { id: 'art161-grandfather-blocks-paternal-grandmother', article: 161, heir: 'paternal_grandmother', blockers: ['grandfather'] },

  { id: 'art162-father-blocks-true-grandfather', article: 162, heir: 'grandfather', blockers: ['father'] },
  { id: 'art163-son-blocks-grandson', article: 163, heir: 'son_son', blockers: ['son'] },
  { id: 'art162-son-blocks-full-nephew', article: 162, heir: 'full_nephew', blockers: ['son'] },
  { id: 'art162-grandson-blocks-paternal-nephew', article: 162, heir: 'paternal_nephew', blockers: ['son_son'] },
  { id: 'art162-father-blocks-paternal-nephew', article: 162, heir: 'paternal_nephew', blockers: ['father'] },
  { id: 'art162-grandfather-blocks-full-nephew', article: 162, heir: 'full_nephew', blockers: ['grandfather'] },
  { id: 'art162-grandfather-blocks-paternal-nephew', article: 162, heir: 'paternal_nephew', blockers: ['grandfather'] },
  { id: 'art153-grandfather-blocks-full-uncle', article: 153, heir: 'full_uncle', blockers: ['grandfather'] },
  { id: 'art153-grandfather-blocks-paternal-uncle', article: 153, heir: 'paternal_uncle', blockers: ['grandfather'] },
  { id: 'art153-grandfather-blocks-full-uncle-son', article: 153, heir: 'full_uncle_son', blockers: ['grandfather'] },
  { id: 'art153-grandfather-blocks-paternal-uncle-son', article: 153, heir: 'paternal_uncle_son', blockers: ['grandfather'] },
  { id: 'art163-two-daughters-block-lower-granddaughter', article: 163, heir: 'granddaughter', blockers: ['daughter'], counts: { daughter: 2 } },

  { id: 'art164-father-blocks-full-sister', article: 164, heir: 'full_sister', blockers: ['father'] },
  { id: 'art164-son-blocks-full-sister', article: 164, heir: 'full_sister', blockers: ['son'] },
  { id: 'art164-grandson-blocks-full-sister', article: 164, heir: 'full_sister', blockers: ['son_son'] },
  { id: 'art164-full-brother-blocks-paternal-brother', article: 164, heir: 'paternal_brother', blockers: ['full_brother'] },
  { id: 'art164-full-brother-blocks-paternal-sister', article: 164, heir: 'paternal_sister', blockers: ['full_brother'] },
  { id: 'art164-two-full-sisters-block-paternal-sister', article: 164, heir: 'paternal_sister', blockers: ['full_sister'], counts: { full_sister: 2 } },
  { id: 'art148-maternal-siblings-blocked-by-granddaughter', article: 148, heir: 'maternal_siblings', blockers: ['granddaughter'] },
  { id: 'art148-maternal-siblings-blocked-by-grandson', article: 148, heir: 'maternal_siblings', blockers: ['son_son'] },

  { id: 'art165-paternal-brother-blocks-full-nephew', article: 165, heir: 'full_nephew', blockers: ['paternal_brother'] },
  { id: 'art165-paternal-brother-blocks-paternal-nephew', article: 165, heir: 'paternal_nephew', blockers: ['paternal_brother'] },
  { id: 'art165-full-nephew-blocks-paternal-nephew', article: 165, heir: 'paternal_nephew', blockers: ['full_nephew'] },
  { id: 'art165-full-nephew-blocks-full-uncle', article: 165, heir: 'full_uncle', blockers: ['full_nephew'] },
  { id: 'art165-paternal-nephew-blocks-full-uncle', article: 165, heir: 'full_uncle', blockers: ['paternal_nephew'] },
  { id: 'art165-full-uncle-blocks-paternal-uncle', article: 165, heir: 'paternal_uncle', blockers: ['full_uncle'] },
  { id: 'art165-full-uncle-son-blocks-paternal-uncle-son', article: 165, heir: 'paternal_uncle_son', blockers: ['full_uncle_son'] },
];

function makeContext(
  present: string[],
  counts: Record<string, number> = {},
): BlockingContext {
  const descendantIds = ['son', 'daughter', 'son_son', 'granddaughter'];
  const siblingIds = [
    'full_brother',
    'full_sister',
    'paternal_brother',
    'paternal_sister',
    'maternal_siblings',
  ];
  return {
    has: id => present.includes(id),
    getCount: id => counts[id] ?? (present.includes(id) ? 1 : 0),
    hasDescendant: present.some(id => descendantIds.includes(id)),
    siblingsCount: siblingIds.reduce(
      (sum, id) => sum + (counts[id] ?? (present.includes(id) ? 1 : 0)),
      0,
    ),
    hasFemaleDirectDescendant: present.includes('daughter') || present.includes('granddaughter'),
  };
}

describe('Independent statutory reference matrix — blocking (Arts. 161–165)', () => {
  for (const testCase of statutoryBlockingCases) {
    it(testCase.id, () => {
      const result = resolveBlocking(
        testCase.heir,
        makeContext(testCase.blockers, testCase.counts),
      );
      expect(result.isBlocked).toBe(true);
      expect(result.article).toBe(testCase.article);
    });
  }

  it('Art. 164: a single full sister does not, by itself, exclude a paternal sister', () => {
    const result = resolveBlocking('paternal_sister', makeContext(['full_sister']));
    expect(result.isBlocked).toBe(false);
  });

  it('Art. 164: two full sisters do not exclude a paternal sister when a paternal brother is present', () => {
    const result = resolveBlocking(
      'paternal_sister',
      makeContext(['full_sister', 'paternal_brother'], { full_sister: 2 }),
    );
    expect(result.isBlocked).toBe(false);
  });

  it('Art. 164: a full sister with a daughter blocks the lower agnatic sibling line as asaba ma\u2019al-ghayr', () => {
    const ctx = makeContext(['full_sister', 'daughter']);
    for (const heir of ['paternal_brother', 'paternal_sister', 'full_nephew', 'paternal_nephew']) {
      const result = resolveBlocking(heir, ctx);
      expect(result.isBlocked, heir).toBe(true);
      expect(result.article, heir).toBe(164);
    }
  });

  it('Arts. 160 and 148: a grandson is a descendant for spouse and mother reduction rules', () => {
    const ctx = makeContext(['son_son']);
    for (const heir of ['husband', 'wife', 'mother']) {
      const result = resolveBlocking(heir, ctx);
      expect(result.isBlocked, heir).toBe(false);
      expect(result.partialBlocks?.some(block => block.article === 160), heir).toBe(true);
    }
  });

  it('Art. 148: two siblings reduce the mother share even without descendants', () => {
    const ctx = makeContext(['full_brother', 'maternal_siblings'], {
      full_brother: 1,
      maternal_siblings: 1,
    });
    const result = resolveBlocking('mother', ctx);
    expect(result.partialBlocks?.some(block => block.article === 160)).toBe(true);
  });
});

describe('End-to-end descendant share references', () => {
  const present = (heirId: string, count = 1): HeirPresence => ({
    heirId,
    count,
    isPresent: true,
  });

  it('Art. 160: a son\u2019s son reduces the wife from one quarter to one eighth', () => {
    const results = calculateInheritance(
      [present('wife'), present('son_son')],
      800_000,
      0,
      0,
      0,
      false,
    );
    const wife = results.find(row => row.heirId === 'wife');
    const grandson = results.find(row => row.heirId === 'son_son');

    expect(wife?.share).toBe('1/8');
    expect(wife?.amount).toBe(100_000);
    expect(grandson?.amount).toBe(700_000);
  });

  it('Art. 149: a son\u2019s son reduces the mother to one sixth', () => {
    const results = calculateInheritance(
      [present('mother'), present('son_son')],
      600_000,
      0,
      0,
      0,
      false,
    );
    const mother = results.find(row => row.heirId === 'mother');
    expect(mother?.share).toBe('1/6');
    expect(mother?.amount).toBe(100_000);
  });
});

describe('Fail-closed guard for unmodelled grandson / granddaughter degrees', () => {
  it('holds the whole stage for manual review when both generic descendant IDs are present', () => {
    const stage: MunasakhatStage = {
      id: 'degree-ambiguous-descendants',
      deceasedName: 'اختبار درجات الأحفاد',
      parentHeirId: '',
      parentStageId: '',
      heirPresence: {
        son_son: stagePresent('son_son'),
        granddaughter: stagePresent('granddaughter'),
      },
      hasMandatoryBequest: false,
      confirmedSpouseEligibility: true,
      debts: 0,
      funeralCosts: 0,
      bequest: 0,
    };

    const [result] = runInheritanceOrchestration([[stage], 120_000, 0, 0, 0]);
    expect(result.requiresManualClassification).toBe(true);
    expect(result.results).toHaveLength(0);
    expect(
      result.excludedHeirWarnings?.some(
        warning => warning.heirId === 'granddaughter_son_son_degree',
      ),
    ).toBe(true);
  });
});
