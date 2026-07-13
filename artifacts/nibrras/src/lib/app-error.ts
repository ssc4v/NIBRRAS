export type AppErrorCode =
  | 'NETWORK_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'BACKEND_UNAVAILABLE'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;
  readonly retryable: boolean;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; retryable?: boolean }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options?.cause;
    this.retryable = options?.retryable ?? false;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError('REQUEST_TIMEOUT', 'انتهت مهلة الاتصال بخدمات نبراس', { cause: error, retryable: true });
  }
  if (error instanceof TypeError) {
    return new AppError('NETWORK_UNAVAILABLE', 'تعذر الوصول إلى خدمات نبراس', { cause: error, retryable: true });
  }
  return new AppError('UNKNOWN', error instanceof Error ? error.message : 'حدث خطأ غير معروف', { cause: error });
}
