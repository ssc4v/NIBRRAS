import { mockSearchResults } from '../data/mockData';
import { SearchResult } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const runDeepSearchMock = async (query: string, options: any): Promise<{ results: SearchResult[], answer: string, citations: string[] }> => {
  await delay(1200);
  console.log(`Mock: Deep search executed for query "${query}" with options`, options);
  
  return {
    results: [...mockSearchResults],
    answer: 'بناءً على المصادر المتوفرة، يمكن تقسيم الموضوع إلى عدة محاور رئيسية. الأول يركز على الأساسيات، بينما الثاني يتعمق في التطبيقات العملية والنظرية المتقدمة.',
    citations: ['sr1', 'sr3']
  };
};

export const saveToMemoryMock = async (searchId: string): Promise<void> => {
  await delay(400);
  console.log(`Mock: Search ${searchId} saved to memory.`);
};
