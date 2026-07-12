import { SearchResult } from '../types';

const DEEP_SEARCH_URL =
  import.meta.env.VITE_NIRBAS_DEEP_SEARCH_URL ||
  'https://sc4v.app.n8n.cloud/webhook/nirbas-deep-search';

type BackendError = {
  code?: string;
  message?: string;
};

type DeepSearchResponse = {
  ok?: boolean;
  status?: string;
  results?: SearchResult[];
  answer?: string;
  citations?: string[];
  searchId?: string;
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
    throw new Error(`فشل الاتصال بخادم البحث (${response.status})`);
  }

  return data as T;
}

export const runDeepSearch = async (
  query: string,
  options: unknown
): Promise<{
  results: SearchResult[];
  answer: string;
  citations: string[];
  searchId?: string;
}> => {
  const data = await postJson<DeepSearchResponse>(DEEP_SEARCH_URL, { query, options });

  const hasRealResult =
    data.ok === true &&
    data.status !== 'queued' &&
    data.status !== 'not_implemented' &&
    Array.isArray(data.results) &&
    typeof data.answer === 'string';

  if (!hasRealResult) {
    throw new Error(
      data.error?.message ||
        'لم يُنفذ بحث فعلي ولم تُنشأ مصادر موثقة، لذلك أُلغي إشعار النجاح.'
    );
  }

  return {
    results: data.results || [],
    answer: data.answer || '',
    citations: data.citations || [],
    searchId: data.searchId || data.executionId,
  };
};

export const saveToMemory = async (searchId: string): Promise<void> => {
  if (!searchId) {
    throw new Error('لا توجد نتيجة بحث حقيقية لحفظها.');
  }

  throw new Error('حفظ البحث في الذاكرة غير مربوط فعليًا بعد.');
};

export const runDeepSearchMock = runDeepSearch;
export const saveToMemoryMock = saveToMemory;
