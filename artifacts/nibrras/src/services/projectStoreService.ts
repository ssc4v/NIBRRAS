const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || 'https://sc4v.app.n8n.cloud';

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${N8N_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error?.message || data?.message || `فشل الطلب (${response.status})`);
  }
  return data;
}

export const inspectGithubProject = (url: string) =>
  post('/webhook/nibrras-project-importer', { url });

export const scanGithubProject = (url: string) =>
  post('/webhook/nibrras-security-scanner', { url });

export const sandboxGithubProject = (url: string) =>
  post('/webhook/nibrras-sandbox-tester', { url });

export const listSkills = () =>
  post('/webhook/nibrras-skill-registry', { action: 'list' });

export const registerSkill = (payload: Record<string, unknown>) =>
  post('/webhook/nibrras-skill-registry', { action: 'create', ...payload });
