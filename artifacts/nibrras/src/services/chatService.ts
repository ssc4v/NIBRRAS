import type { Message } from '../types';
import { callNibrras, reportClientError } from './backendClient';

export type ChatModel = 'openai' | 'gemini' | 'deepseek';

const SESSION_KEY = 'nibrras-chat-session';
const USER_KEY = 'nibrras-user-id';
const MODEL_KEY = 'nibrras-chat-model';
const MAX_MESSAGE_LENGTH = 12_000;

function createId(prefix: string): string {
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${value}`;
}

export function getChatSessionId(): string {
  let value = localStorage.getItem(SESSION_KEY);
  if (!value) {
    value = createId('web');
    localStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function getAnonymousUserId(): string {
  let value = localStorage.getItem(USER_KEY);
  if (!value) {
    value = createId('user');
    localStorage.setItem(USER_KEY, value);
  }
  return value;
}

export function resetChatSession(): void {
  localStorage.setItem(SESSION_KEY, createId('web'));
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
  const message = content.trim();
  if (!message) throw new Error('اكتب رسالة قبل الإرسال');
  if (message.length > MAX_MESSAGE_LENGTH) throw new Error(`الرسالة طويلة جدًا. الحد الأقصى ${MAX_MESSAGE_LENGTH.toLocaleString('ar-SA')} حرف.`);
  if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');

  try {
    const response = await callNibrras('chat', {
      message,
      model,
      sessionId: getChatSessionId(),
      userId: getAnonymousUserId(),
      client: 'nibrras-web',
      locale: 'ar-SA',
    });

    const reply = String(response.reply ?? response.output ?? '').trim();
    if (!reply) throw new Error('النموذج لم يرجع ردًا فعليًا');

    return {
      id: response.executionId ?? createId('message'),
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    void reportClientError('chat-ui', error, { model, messageLength: message.length });
    throw error;
  }
}
