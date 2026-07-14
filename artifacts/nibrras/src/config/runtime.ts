const DEFAULT_GATEWAY_URL = '/api/nibrras';
const DEFAULT_REQUEST_TIMEOUT_MS = 45_000;
const MIN_REQUEST_TIMEOUT_MS = 5_000;
const MAX_REQUEST_TIMEOUT_MS = 120_000;

function readEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readGatewayUrl(): string {
  const candidate = readEnv('VITE_NIBRRAS_GATEWAY_URL') ?? DEFAULT_GATEWAY_URL;
  if (candidate.startsWith('/')) return candidate;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && import.meta.env.PROD) return DEFAULT_GATEWAY_URL;
    return url.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_GATEWAY_URL;
  }
}

function readBoundedInteger(name: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(readEnv(name) ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const runtimeConfig = Object.freeze({
  gatewayUrl: readGatewayUrl(),
  requestTimeoutMs: readBoundedInteger(
    'VITE_NIBRRAS_REQUEST_TIMEOUT_MS',
    DEFAULT_REQUEST_TIMEOUT_MS,
    MIN_REQUEST_TIMEOUT_MS,
    MAX_REQUEST_TIMEOUT_MS,
  ),
  appVersion: readEnv('VITE_APP_VERSION') ?? 'dev',
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
});

export type RuntimeConfig = typeof runtimeConfig;
