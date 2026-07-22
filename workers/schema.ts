import { z } from 'zod';

export const HeirPresenceItemSchema = z.object({
  heirId: z.string().min(1),
  count: z.number().int().nonnegative().default(0),
  isPresent: z.boolean().default(false),
  hasMandatoryBequest: z.boolean().optional(),
  isImpeded: z.boolean().optional(),
  impedimentReasonId: z.string().nullish().optional(),
  impededIndexes: z.array(z.boolean()).optional(),
  impedimentReasonIds: z.array(z.string().nullish()).optional(),
  customNames: z.array(z.string()).optional(),
}).passthrough();

export const MunasakhatStageSchema = z.object({
  id: z.string().optional(),
  estate: z.number().nonnegative(),
  hasMandatoryBequest: z.boolean(),
  deceasedSonsCount: z.number().int().nonnegative().default(0),
  deceasedDaughtersCount: z.number().int().nonnegative().default(0),
  heirPresence: z.record(z.string(), HeirPresenceItemSchema),
  parentHeirId: z.string().nullish().optional(),
  parentStageId: z.string().nullish().optional(),
  parentHeirIndex: z.number().int().nullish().optional(),
  deceasedName: z.string().nullish().optional(),
  debts: z.number().nonnegative().nullish().optional(),
  funeralCosts: z.number().nonnegative().nullish().optional(),
  bequest: z.number().nonnegative().nullish().optional(),
}).passthrough();

export const WorkerInputSchema = z.object({
  id: z.number().int().nonnegative(),
  args: z.tuple([
    z.array(MunasakhatStageSchema),
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().nonnegative()
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

