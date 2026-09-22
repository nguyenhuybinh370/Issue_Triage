import { z } from 'zod';

/**
 * Zod Schema for incoming request body on POST /api/triage
 */
export const TriageRequestBodySchema = z.object({
  issue_text: z
    .string({
      required_error: 'Trường "issue_text" là bắt buộc.',
      invalid_type_error: '"issue_text" phải là một chuỗi ký tự (string).',
    })
    .trim()
    .min(1, 'Mô tả sự cố ("issue_text") không được để trống.'),
});

export type TriageRequestBody = z.infer<typeof TriageRequestBodySchema>;

/**
 * Zod Schema for Structured LLM Output
 * Strictly validates response fields; severity cannot be parsed via regex.
 */
export const IssueTriageSchema = z.object({
  status: z.enum(['classified', 'insufficient_data', 'out_of_scope'], {
    errorMap: () => ({
      message: 'status phải thuộc một trong các giá trị: classified, insufficient_data, out_of_scope',
    }),
  }),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']).nullable(),
  component: z.string().nullable(),
  needs_urgent_response: z.boolean({
    required_error: 'needs_urgent_response là trường boolean bắt buộc.',
  }),
  reason: z.string({
    required_error: 'reason là trường string giải thích bắt buộc.',
  }),
  owner_team: z.string().nullable().optional(),
});

export type IssueTriageResult = z.infer<typeof IssueTriageSchema>;
