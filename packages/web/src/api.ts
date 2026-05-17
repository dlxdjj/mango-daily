const SETTINGS_KEY = 'mango-daily-settings';

export interface Settings {
  apiBase: string;
  syncToken: string;
}

const DEFAULT_SETTINGS: Settings = {
  apiBase: import.meta.env.VITE_API_BASE || '',
  syncToken: 'mango-please-change-me'
};

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function buildUrl(path: string): string {
  const settings = getSettings();
  if (!settings.apiBase) return path;
  return settings.apiBase.replace(/\/$/, '') + path;
}

export function mediaUrl(filePathOrUrl: string): string {
  const settings = getSettings();
  const normalized = filePathOrUrl.startsWith('/') ? filePathOrUrl : '/' + filePathOrUrl;
  if (!settings.apiBase) return normalized;
  return settings.apiBase.replace(/\/$/, '') + normalized;
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  isForm = false
): Promise<T> {
  const settings = getSettings();
  const headers: Record<string, string> = {};

  if (!isForm) headers['Content-Type'] = 'application/json';
  if (settings.syncToken) headers.Authorization = `Bearer ${settings.syncToken}`;

  const init: RequestInit = { method, headers };
  if (body) init.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(buildUrl(path), init);
  if (!res.ok) {
    let errMsg = `请求失败 (${res.status})`;
    try {
      const data = await res.json();
      errMsg = data.error || data.detail || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  health: () => request('GET', '/api/health'),

  generateRecommendation: (params: {
    column: string;
    contentGoal: string;
    extraTheme?: string;
  }) => request('POST', '/api/recommendations/generate', params),

  listRecommendations: () => request('GET', '/api/recommendations'),

  listReferences: () => request('GET', '/api/references'),
  uploadReference: (formData: FormData) =>
    request('POST', '/api/references/upload', formData, true),
  updateReference: (id: string, body: { description?: string }) =>
    request('PATCH', `/api/references/${id}`, body),
  setPrimaryReference: (id: string) =>
    request('PATCH', `/api/references/${id}/primary`),
  deleteReference: (id: string) =>
    request('DELETE', `/api/references/${id}`)
};
