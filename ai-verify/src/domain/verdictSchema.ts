import { z } from "zod";

export const VerdictSchema = z.object({
  eligible: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().max(500),
  flagged_concerns: z.array(z.string()).default([]),
});
export type Verdict = z.infer<typeof VerdictSchema>;

// additionalProperties:false WAJIB buat strict:true di response_format OpenAI-compatible
export const verdictJsonSchema = {
  type: "object",
  properties: {
    eligible: { type: "boolean" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    reasoning: { type: "string" },
    flagged_concerns: { type: "array", items: { type: "string" } },
  },
  required: ["eligible", "confidence", "reasoning", "flagged_concerns"],
  additionalProperties: false,
};
