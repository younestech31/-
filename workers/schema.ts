import { z } from 'zod';

export const HeirPresenceItemSchema = z.object({
  heirId: z.string().min(1),
  count: z.number().int().nonnegative().default(0),
  isPresent: z.boolean().default(false),
  hasMandatoryBequest: z.boolean().optional(),
  isImpeded: z.boolean().optional(),
  impedimentReasonId: z.string().optional(),
  impededIndexes: z.array(z.boolean()).optional(),
  impedimentReasonIds: z.array(z.string().nullable()).optional(),
  customNames: z.array(z.string()).optional(),
}).strip();

export const MunasakhatStageSchema = z.object({
  id: z.string().optional(),
  estate: z.number().nonnegative(),
  hasMandatoryBequest: z.boolean(),
  deceasedSonsCount: z.number().int().nonnegative().default(0),
  deceasedDaughtersCount: z.number().int().nonnegative().default(0),
  heirPresence: z.record(z.string(), HeirPresenceItemSchema),
  parentHeirId: z.string().nullable().optional(),
  parentStageId: z.string().nullable().optional(),
  parentHeirIndex: z.number().int().optional(),
  deceasedName: z.string().optional(),
  debts: z.number().nonnegative().optional(),
  funeralCosts: z.number().nonnegative().optional(),
  bequest: z.number().nonnegative().optional(),
}).strip();

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
