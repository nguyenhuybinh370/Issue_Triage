import type { ChatCompletionTool } from 'openai/resources/chat/completions.js';

/**
 * Valid component to owner team lookup table
 */
export const COMPONENT_OWNER_MAP: Record<string, string> = {
  payment: 'checkout-platform',
  identity: 'auth-team',
  search: 'core-search-team',
};

/**
 * OpenAI Tool Specification for get_component_owner
 */
export const triageTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_component_owner',
      description:
        'Tra cứu đội ngũ kỹ thuật phụ trách (owner_team) của một component hệ thống (ví dụ: payment, identity, search). Bắt buộc phải gọi công cụ này khi đã xác định được component bị ảnh hưởng.',
      parameters: {
        type: 'object',
        properties: {
          component: {
            type: 'string',
            description:
              'Tên thành phần hoặc dịch vụ hệ thống nghi vấn gây ra sự cố (ví dụ: "payment", "identity", "search").',
          },
        },
        required: ['component'],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Backend execution logic for get_component_owner
 * Resolves component to team from lookup table, or returns 'unassigned-support'
 */
export function executeGetComponentOwner(componentInput: string): {
  component: string;
  owner_team: string;
  is_recognized: boolean;
} {
  const normalized = (componentInput || '').trim().toLowerCase();

  let matchedKey: string | undefined = undefined;

  if (COMPONENT_OWNER_MAP[normalized]) {
    matchedKey = normalized;
  } else {
    const keys = Object.keys(COMPONENT_OWNER_MAP);
    matchedKey = keys.find((k) => normalized.includes(k));
  }

  if (matchedKey && COMPONENT_OWNER_MAP[matchedKey]) {
    return {
      component: matchedKey,
      owner_team: COMPONENT_OWNER_MAP[matchedKey],
      is_recognized: true,
    };
  }

  return {
    component: componentInput,
    owner_team: 'unassigned-support',
    is_recognized: false,
  };
}
