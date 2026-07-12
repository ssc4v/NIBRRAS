import { callNirbas, reportClientError } from './backendClient';

export interface DeepSearchResult {
  query: string;
  result: string;
  executionId: string;
}

export async function deepSearch(query: string): Promise<DeepSearchResult> {
  try {
    const response = await callNirbas<string>('deepSearch', { query });
    const result = String(response.result ?? response.output ?? '').trim();
    if (!result) throw new Error('لم يرجع البحث العميق نتيجة فعلية');
    return {
      query,
      result,
      executionId: response.executionId as string,
    };
  } catch (error) {
    void reportClientError('deep-search-ui', error, { query });
    throw error;
  }
}
