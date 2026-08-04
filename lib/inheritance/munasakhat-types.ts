// lib/inheritance/munasakhat-types.ts

import { HeirPresence, DeceasedChildGroup } from './inheritance-calculator';

export interface MunasakhatStage {
  id: string;
  titleAr?: string;
  deceasedNameAr?: string;
  deceasedName?: string;
  deceasedGender?: 'male' | 'female';
  deceasedHeirId?: string;
  parentHeirId?: string;
  parentStageId?: string;
  parentHeirIndex?: number;
  estate?: number;
  inheritedAmount?: number;
  inheritedFromParentAmount?: number;
  alreadyInheritedFromParentAmount?: number;
  ownSeparateAssets?: number;
  ownAssets?: number;
  debts?: number;
  funeralCosts?: number;
  bequest?: number;
  heirs?: HeirPresence[];
  heirPresence?: Record<string, HeirPresence>;
  hasMandatoryBequest: boolean;
  deceasedSonsCount?: number;
  deceasedDaughtersCount?: number;
  deceasedChildren?: DeceasedChildGroup[];
  unbornOutcome?: 'stillborn' | 'born_male' | 'born_female' | 'twins_male_female' | 'twins_males' | 'twins_females';
  hasUnbornHeir?: boolean;
  hasChildrenFromOtherUnion?: boolean;
  secondDeceasedHasChildrenFromOtherUnion?: boolean;
  acknowledgedExclusions?: string[];
}

export interface SavedCase {
  id: string;
  name: string;
  date: string;
  deceasedGender: 'male' | 'female' | null;
  estate: number;
  debts: number;
  funeralCosts: number;
  bequest: number;
  stages: MunasakhatStage[];
  createdAt?: string;
  updatedAt?: string;
  munasakhatStages?: MunasakhatStage[];
}
