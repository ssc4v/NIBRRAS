import { mockMessages } from '../data/mockData';
import { Message } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_REPLIES = [
  'أفهم طلبك. جاري العمل على ذلك.',
  'تم تسجيل الملاحظة.',
  'هل تحتاج إلى تفاصيل أكثر؟',
  'تم.',
];

export const getInitialMessages = async (): Promise<Message[]> => {
  await delay(150);
  return [...mockMessages];
};

export const sendMessageMock = async (content: string): Promise<Message> => {
  await delay(1500);
  return {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
    timestamp: new Date().toISOString(),
  };
};
