const DEFAULT_GATEWAY_URL = 'https://sc4v.app.n8n.cloud/webhook/nirbas-api';

function readEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const runtimeConfig = Object.freeze({
  gatewayUrl: readEnv('VITE_NIRBAS_GATEWAY_URL') ?? DEFAULT_GATEWAY_URL,
  requestTimeoutMs: Number(readEnv('VITE_NIRBAS_REQUEST_TIMEOUT_MS') ?? 45_000),
  appVersion: readEnv('VITE_APP_VERSION') ?? 'dev',
  environment: readEnv('MODE') ?? 'development',
});

export type RuntimeConfig = typeof runtimeConfig;
