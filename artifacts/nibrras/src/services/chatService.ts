import { mockMessages } from '../data/mockData';
import { Message } from '../types';
import { callNirbas } from './backendClient';

export const getInitialMessages = async (): Promise<Message[]> => [...mockMessages];

export const sendMessageMock = async (content: string): Promise<Message> => {
  const response = await callNirbas<{ reply?: string }>('nirbas-chat', { message: content });

  return {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: response.reply || 'تم استلام رسالتك في نبراس.',
    timestamp: new Date().toISOString(),
  };
};
