import type { Message } from '../types';
import { callNirbas, reportClientError } from './backendClient';

export type ChatModel = 'openai' | 'gemini' | 'deepseek';

const SESSION_KEY = 'nirbas-chat-session';
const MODEL_KEY = 'nirbas-chat-model';

export function getChatSessionId(): string {
  let value = localStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function getSavedModel(): ChatModel {
  const value = localStorage.getItem(MODEL_KEY);
  return value === 'gemini' || value === 'deepseek' ? value : 'openai';
}

export function saveModel(model: ChatModel): void {
  localStorage.setItem(MODEL_KEY, model);
}

export async function getInitialMessages(): Promise<Message[]> {
  return [];
}

export async function sendMessage(content: string, model: ChatModel = getSavedModel()): Promise<Message> {
  try {
    const response = await callNirbas('chat', {
      message: content,
      model,
      sessionId: getChatSessionId(),
      userId: 'fahad',
    });

    const reply = String(response.reply ?? response.output ?? '').trim();
    if (!reply) throw new Error('النموذج لم يرجع ردًا فعليًا');

    return {
      id: response.executionId ?? `${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    void reportClientError('chat-ui', error, { model });
    throw error;
  }
}
