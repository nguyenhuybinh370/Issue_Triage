import type { TriageResultData, TraceStageItem, TokenUsageMetrics, TriageApiResponse } from '../types/triage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  isNetworkError: boolean;
  status?: number;
}

/**
 * Normalizes backend response into uniform { result, traces, usage } structure
 */
export function normalizeTriageResponse(raw: any): TriageApiResponse {
  const resObj = raw.data || raw.result || raw;

  const result: TriageResultData = {
    severity: resObj.severity !== undefined ? resObj.severity : null,
    status: resObj.status || 'classified',
    component: resObj.component || resObj.affected_component || null,
    owner_team: resObj.owner_team || resObj.team || null,
    needs_urgent_response: Boolean(resObj.needs_urgent_response),
    reason: resObj.reason || resObj.explanation || 'Không có mô tả chi tiết từ hệ thống.',
  };

  const traces: TraceStageItem[] = Array.isArray(raw.traces) ? raw.traces : [];

  const usage: TokenUsageMetrics = raw.usage || {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    latency_ms: 0,
  };

  return { result, traces, usage };
}

/**
 * Post issue to Backend Express at http://localhost:3001/api/triage
 */
export async function triageIssue(description: string): Promise<TriageApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/triage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issue_text: description,
        issue: description,
        description: description,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Yêu cầu thất bại với mã lỗi HTTP ${response.status} (${response.statusText})`;
      try {
        const errJson = await response.json();
        if (errJson.error || errJson.message) {
          errorMessage = errJson.error || errJson.message;
        }
      } catch {
        // ignore json parsing error
      }
      const error: ApiError = {
        message: errorMessage,
        isNetworkError: false,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();
    return normalizeTriageResponse(data);
  } catch (err: any) {
    if (err.message && err.status !== undefined) {
      throw err;
    }
    const networkError: ApiError = {
      message: `Không thể kết nối tới Backend tại ${API_BASE_URL}/api/triage. Vui lòng kiểm tra server Express có đang chạy không (Port 3001).`,
      isNetworkError: true,
    };
    throw networkError;
  }
}

/**
 * Realistic Mock simulation matching exact 4-stage traces and token metrics
 */
export async function mockTriageIssue(description: string): Promise<TriageApiResponse> {
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 950));

  const lower = description.toLowerCase();
  const now = new Date().toLocaleTimeString('vi-VN');

  let component = 'payment';
  let ownerTeam = 'checkout-platform';
  let severity: any = 'P0';
  let needsUrgent = true;
  let reason = 'Lỗi HTTP 500 tại nút thanh toán với toàn bộ thẻ Visa từ 14:30 làm gián đoạn trực tiếp luồng mua hàng và giao dịch cốt lõi, trực tiếp gây tổn thất doanh thu lớn.';

  if (lower.includes('503') || lower.includes('đăng nhập') || lower.includes('auth')) {
    component = 'identity';
    ownerTeam = 'auth-team';
    severity = 'P0';
    needsUrgent = true;
    reason = 'API đăng nhập trả HTTP 503 cho toàn bộ người dùng từ 09:15. Toàn bộ người dùng không thể đăng nhập hoặc làm mới phiên, gây tê liệt hệ thống diện rộng.';
  } else if (lower.includes('search') || lower.includes('tìm kiếm')) {
    component = 'search';
    ownerTeam = 'core-search-team';
    severity = 'P1';
    needsUrgent = false;
    reason = 'Sự cố tính năng tìm kiếm bị gián đoạn, người dùng gặp độ trễ lớn khi tra cứu dữ liệu.';
  }

  const traces: TraceStageItem[] = [
    {
      step: 1,
      stage: 'tool_call',
      title: 'BƯỚC 1: MODEL ĐỀ XUẤT TOOL CALL',
      subtitle: `Model đề xuất Tool Call: get_component_owner`,
      timestamp: now,
      payload: {
        call_id: `call_get_component_owner_${Date.now()}_0`,
        name: 'get_component_owner',
        arguments: JSON.stringify({ component }),
      },
    },
    {
      step: 2,
      stage: 'application_executes',
      title: 'BƯỚC 2: APPLICATION RUNTIME THỰC THI',
      subtitle: `Application Runtime thực thi: get_component_owner`,
      timestamp: now,
      payload: {
        functionName: 'get_component_owner',
        input: JSON.stringify({ component }),
        output: {
          component,
          owner: ownerTeam,
        },
        status: 'success',
      },
    },
    {
      step: 3,
      stage: 'tool_result',
      title: 'BƯỚC 3: NẠP KẾT QUẢ TOOL VÀO CONTEXT',
      subtitle: 'Trả kết quả Tool Result về Context Window của LLM',
      timestamp: now,
      payload: {
        component,
        owner: ownerTeam,
      },
    },
    {
      step: 4,
      stage: 'final_response',
      title: 'BƯỚC 4: TRẢ KẾT QUẢ JSON ĐÃ XÁC THỰC',
      subtitle: 'Kết quả phân loại sự cố cuối cùng (Structured & Validated Output)',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      payload: {
        status: 'classified',
        severity,
        component,
        needs_urgent_response: needsUrgent,
        reason,
        owner_team: ownerTeam,
      },
    },
  ];

  const result: TriageResultData = {
    severity,
    status: 'classified',
    component,
    owner_team: ownerTeam,
    needs_urgent_response: needsUrgent,
    reason,
  };

  const usage: TokenUsageMetrics = {
    prompt_tokens: 382,
    completion_tokens: 145,
    total_tokens: 527,
    latency_ms: Date.now() - startTime,
  };

  return { result, traces, usage };
}
