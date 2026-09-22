import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';
import { ZodError } from 'zod';
import { TriageRequestBodySchema, IssueTriageSchema, type IssueTriageResult } from './schema.js';
import { triageTools, executeGetComponentOwner } from './tools.js';
import { TRIAGE_SYSTEM_INSTRUCTION, buildUserPrompt } from './prompt.js';

// Load environment variables from .env
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: OPENAI_BASE_URL,
});

export interface TraceStageItem {
  step: number;
  stage: 'tool_call' | 'application_executes' | 'tool_result' | 'final_response';
  title: string;
  subtitle: string;
  timestamp: string;
  payload: Record<string, any>;
}

export interface TokenUsageMetrics {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
}

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Issue Triage Backend API',
    model: OPENAI_MODEL,
    endpoints: {
      triage: 'POST /api/triage',
    },
  });
});

app.options('/api/triage', (_req: Request, res: Response) => {
  res.sendStatus(204);
});

/**
 * Route: POST /api/triage
 * Body: { issue_text: string }
 * Response: { success: true, data: IssueTriageResult, traces: TraceStageItem[], usage: TokenUsageMetrics }
 */
app.post('/api/triage', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const traces: TraceStageItem[] = [];
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    // 1. Validate incoming request body
    const rawBody = {
      issue_text: req.body?.issue_text ?? req.body?.issue ?? req.body?.description ?? '',
    };

    const validationResult = TriageRequestBodySchema.safeParse(rawBody);
    if (!validationResult.success) {
      const issueErrors = validationResult.error.errors.map((e) => e.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Dữ liệu không hợp lệ: ${issueErrors}`,
        traces: [],
      });
    }

    const { issue_text } = validationResult.data;

    // Check if OPENAI_API_KEY is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_key_here') {
      return res.status(500).json({
        success: false,
        error:
          'Chưa cấu hình OPENAI_API_KEY trong file .env của backend. Vui lòng cập nhật API key hợp lệ vào file backend/.env.',
        traces: [],
      });
    }

    // Prepare message history
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: TRIAGE_SYSTEM_INSTRUCTION },
      { role: 'user', content: buildUserPrompt(issue_text) },
    ];

    // Chặng 1: Gửi prompt + khai báo tool tới model
    const response1 = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      tools: triageTools,
      tool_choice: 'auto',
      temperature: 0.1,
    });

    if (response1.usage) {
      promptTokens += response1.usage.prompt_tokens || 0;
      completionTokens += response1.usage.completion_tokens || 0;
    }

    let choice = response1.choices[0];
    let assistantMessage = choice.message;

    // Kiểm tra xem model có gọi tool hay không
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type === 'function') {
          const functionName = toolCall.function.name;
          const functionArgsRaw = toolCall.function.arguments;
          const nowStr = new Date().toLocaleTimeString('vi-VN');

          // BƯỚC 1: MODEL ĐỀ XUẤT TOOL CALL
          traces.push({
            step: 1,
            stage: 'tool_call',
            title: 'BƯỚC 1: MODEL ĐỀ XUẤT TOOL CALL',
            subtitle: `Model đề xuất Tool Call: ${functionName}`,
            timestamp: nowStr,
            payload: {
              call_id: toolCall.id,
              name: functionName,
              arguments: functionArgsRaw,
            },
          });

          if (functionName === 'get_component_owner') {
            let componentParam = '';
            try {
              const parsedArgs = JSON.parse(functionArgsRaw);
              componentParam = parsedArgs.component || '';
            } catch {
              componentParam = functionArgsRaw;
            }

            // BƯỚC 2: APPLICATION RUNTIME THỰC THI
            const lookupResult = executeGetComponentOwner(componentParam);
            traces.push({
              step: 2,
              stage: 'application_executes',
              title: 'BƯỚC 2: APPLICATION RUNTIME THỰC THI',
              subtitle: `Application Runtime thực thi: ${functionName}`,
              timestamp: new Date().toLocaleTimeString('vi-VN'),
              payload: {
                functionName,
                input: functionArgsRaw,
                output: {
                  component: lookupResult.component,
                  owner: lookupResult.owner_team,
                },
                status: 'success',
              },
            });

            // BƯỚC 3: NẠP KẾT QUẢ TOOL VÀO CONTEXT
            const toolResultPayload = {
              component: lookupResult.component,
              owner: lookupResult.owner_team,
            };
            const toolResultString = JSON.stringify(toolResultPayload);

            traces.push({
              step: 3,
              stage: 'tool_result',
              title: 'BƯỚC 3: NẠP KẾT QUẢ TOOL VÀO CONTEXT',
              subtitle: 'Trả kết quả Tool Result về Context Window của LLM',
              timestamp: new Date().toLocaleTimeString('vi-VN'),
              payload: toolResultPayload,
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResultString,
            });
          }
        }
      }

      // Gọi lại model để nhận kết quả cuối sau khi nạp tool results
      const response2 = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.1,
      });

      if (response2.usage) {
        promptTokens += response2.usage.prompt_tokens || 0;
        completionTokens += response2.usage.completion_tokens || 0;
      }

      choice = response2.choices[0];
      assistantMessage = choice.message;
    }

    // BƯỚC 4: TRẢ KẾT QUẢ JSON ĐÃ XÁC THỰC
    const rawContent = assistantMessage.content || '';

    // Clean markdown code blocks
    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedObject: unknown;
    try {
      parsedObject = JSON.parse(cleanedContent);
    } catch (parseErr: any) {
      return res.status(502).json({
        success: false,
        error: `Không thể parse JSON từ phản hồi của model: ${parseErr.message}. Nội dung thô: "${rawContent}"`,
        traces,
      });
    }

    // Validate with Zod
    const validatedData: IssueTriageResult = IssueTriageSchema.parse(parsedObject);

    traces.push({
      step: 4,
      stage: 'final_response',
      title: 'BƯỚC 4: TRẢ KẾT QUẢ JSON ĐÃ XÁC THỰC',
      subtitle: 'Kết quả phân loại sự cố cuối cùng (Structured & Validated Output)',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      payload: validatedData,
    });

    const latencyMs = Date.now() - startTime;
    const usage: TokenUsageMetrics = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      latency_ms: latencyMs,
    };

    return res.status(200).json({
      success: true,
      data: validatedData,
      traces,
      usage,
    });
  } catch (error: any) {
    console.error('Lỗi trong quá trình xử lý Triage:', error);

    const latencyMs = Date.now() - startTime;
    const usage: TokenUsageMetrics = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      latency_ms: latencyMs,
    };

    if (error instanceof ZodError) {
      const formattedZodErrors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res.status(422).json({
        success: false,
        error: `Dữ liệu phân loại từ model không vượt qua kiểm định Zod Schema: ${formattedZodErrors}`,
        traces,
        usage,
      });
    }

    if (error?.status) {
      return res.status(error.status).json({
        success: false,
        error: `Lỗi từ OpenAI API (${error.status}): ${error.message || 'Lỗi không xác định'}`,
        traces,
        usage,
      });
    }

    return res.status(500).json({
      success: false,
      error: error?.message || 'Đã xảy ra lỗi nội bộ hệ thống khi xử lý phân loại sự cố.',
      traces,
      usage,
    });
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`🚀 Issue Triage Backend API running at http://localhost:${PORT}`);
  console.log(`   Health Check: GET http://localhost:${PORT}/`);
  console.log(`   Triage Route: POST http://localhost:${PORT}/api/triage`);
  console.log(`   OpenAI Model: ${OPENAI_MODEL}`);
});
