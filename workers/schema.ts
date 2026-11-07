import { z } from 'zod';

export const HeirPresenceItemSchema = z.object({
  heirId: z.string().min(1),
  count: z.number().default(0),
  isPresent: z.boolean().default(false),
  hasMandatoryBequest: z.boolean().optional(),
  isImpeded: z.boolean().optional(),
  impedimentReasonId: z.string().nullish().optional(),
  impededIndexes: z.array(z.boolean()).optional(),
  impedimentReasonIds: z.array(z.string().nullish()).optional(),
  customNames: z.array(z.string()).optional(),
  missingPersonStatus: z.enum(['none', 'missing_presumed_alive']).optional(),
}).passthrough();

export const MunasakhatStageSchema = z.object({
  id: z.string().optional(),
  estate: z.number(),
  hasMandatoryBequest: z.boolean(),
  deceasedSonsCount: z.number().default(0),
  deceasedDaughtersCount: z.number().default(0),
  alreadyInheritedFromParentAmount: z.number().nullish().optional(),
  inheritedFromParentAmount: z.number().nullish().optional(),
  ownSeparateAssets: z.number().nullish().optional().default(0),
  heirPresence: z.record(z.string(), HeirPresenceItemSchema),
  parentHeirId: z.string().nullish().optional(),
  parentStageId: z.string().nullish().optional(),
  parentHeirIndex: z.number().int().nullish().optional(),
  deceasedName: z.string().nullish().optional(),
  debts: z.number().nullish().optional(),
  funeralCosts: z.number().nullish().optional(),
  bequest: z.number().nullish().optional(),
}).passthrough();

export const WorkerInputSchema = z.object({
  id: z.number().int().nonnegative(),
  args: z.tuple([
    z.array(MunasakhatStageSchema),
    z.number(),
    z.number(),
    z.number(),
    z.number()
  ])
});

export const WorkerOutputSchema = z.object({
  id: z.number().int(),
  data: z.array(z.object({
    stage: z.any(),
    results: z.array(z.any()),
    netEstate: z.number().optional(),
    noHeirsRedistribution: z.any().nullable().optional()
  }))
});

