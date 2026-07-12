import { mockSearchResults } from '../data/mockData';
import { SearchResult } from '../types';
import { callNirbas } from './backendClient';

export const runDeepSearchMock = async (
  query: string,
  options: any,
): Promise<{ results: SearchResult[]; answer: string; citations: string[] }> => {
  const response = await callNirbas<{ message?: string; status?: string }>('nirbas-deep-search', {
    query,
    options,
  });

  return {
    results: [...mockSearchResults],
    answer: response.message || `تم إرسال البحث العميق عن: ${query}`,
    citations: [],
  };
};

export const saveToMemoryMock = async (searchId: string): Promise<void> => {
  await callNirbas('nirbas-learning', { action: 'save-search', searchId });
};
