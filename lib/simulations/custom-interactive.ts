import { z } from "zod";

const idSchema = z.string().regex(/^[a-z][a-z0-9-]{0,31}$/);

export const customInteractiveConfigSchema = z.object({
  family: z.string().min(1).max(80).default("custom"),
  variables: z.array(z.object({
    id: idSchema,
    label: z.string().min(1).max(60),
    description: z.string().min(1).max(160),
    initial: z.number().finite(),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
  })).min(1).max(4),
  stages: z.array(z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(300),
    choices: z.array(z.object({
      label: z.string().min(1).max(100),
      feedback: z.string().min(1).max(300),
      effects: z.array(z.object({ variableId: idSchema, delta: z.number().finite() })).max(4),
    })).min(2).max(4),
  })).min(3).max(5),
}).superRefine((config, ctx) => {
  const ids = new Set<string>();
  config.variables.forEach((variable, index) => {
    if (ids.has(variable.id)) ctx.addIssue({ code:"custom",message:`Duplicate variable ${variable.id}`,path:["variables",index,"id"] });
    ids.add(variable.id);
    if (variable.min >= variable.max) ctx.addIssue({ code:"custom",message:"Minimum must be below maximum.",path:["variables",index,"min"] });
    if (variable.initial < variable.min || variable.initial > variable.max) ctx.addIssue({ code:"custom",message:"Initial value must be within the variable range.",path:["variables",index,"initial"] });
  });
  config.stages.forEach((stage, stageIndex) => stage.choices.forEach((choice, choiceIndex) => choice.effects.forEach((effect, effectIndex) => {
    if (!ids.has(effect.variableId)) ctx.addIssue({ code:"custom",message:`Unknown variable ${effect.variableId}`,path:["stages",stageIndex,"choices",choiceIndex,"effects",effectIndex,"variableId"] });
  })));
});

export type CustomInteractiveConfig = z.infer<typeof customInteractiveConfigSchema>;
