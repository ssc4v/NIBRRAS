import { mockMessages } from '../data/mockData';
import { Message } from '../types';

const CHAT_URL =
  import.meta.env.VITE_NIRBAS_CHAT_URL ||
  'https://sc4v.app.n8n.cloud/webhook/nirbas-chat';

export type NirbasModel = 'openai' | 'gemini' | 'deepseek';

type ChatResponse = {
  ok?: boolean;
  status?: string;
  model?: NirbasModel;
  reply?: string;
  output?: string;
  executionId?: string;
  error?: { message?: string };
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `HTTP ${response.status}`);
  }
  return data as T;
}

export const getInitialMessages = async (): Promise<Message[]> => [...mockMessages];

export const sendMessage = async (
  content: string,
  model: NirbasModel = 'openai',
  sessionId = 'nibrras-app',
): Promise<Message> => {
  const data = await postJson<ChatResponse>(CHAT_URL, {
    message: content,
    model,
    sessionId,
    userId: 'fahad',
  });

  const reply = data.reply?.trim() || data.output?.trim();
  if (!reply) {
    throw new Error(data.error?.message || 'لم يُرجع نموذج نبراس ردًا صالحًا.');
  }

  return {
    id: data.executionId || `${Date.now()}-assistant`,
    role: 'assistant',
    content: reply,
    timestamp: new Date().toISOString(),
  };
};

export const sendMessageMock = sendMessage;
