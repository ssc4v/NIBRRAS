import { mockMessages } from '../data/mockData';
import { Message } from '../types';

const CHAT_URL =
  import.meta.env.VITE_NIRBAS_CHAT_URL ||
  'https://sc4v.app.n8n.cloud/webhook/nirbas-chat';

type BackendError = {
  code?: string;
  message?: string;
};

type ChatResponse = {
  ok?: boolean;
  status?: string;
  reply?: string;
  executionId?: string;
  error?: BackendError;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`استجابة غير صالحة من الخادم (${response.status})`);
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: BackendError }).error?.message || `HTTP ${response.status}`)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const getInitialMessages = async (): Promise<Message[]> => [...mockMessages];

export const sendMessage = async (content: string): Promise<Message> => {
  const data = await postJson<ChatResponse>(CHAT_URL, { message: content });

  if (data.ok !== true || data.status === 'not_implemented' || !data.reply?.trim()) {
    throw new Error(
      data.error?.message ||
        'لم ينفذ خادم نبراس المحادثة فعليًا، لذلك لم تُعرض رسالة نجاح.'
    );
  }

  return {
    id: data.executionId || `${Date.now()}-assistant`,
    role: 'assistant',
    content: data.reply,
    timestamp: new Date().toISOString(),
  };
};

// Compatibility export while old imports are removed gradually.
export const sendMessageMock = sendMessage;
