// Judge0 API configurations
export const JUDGE0_API_URL = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
export const JUDGE0_API_KEY = import.meta.env.VITE_JUDGE0_API_KEY || '';
export const JUDGE0_HOST_HEADER = import.meta.env.VITE_JUDGE0_HOST_HEADER || 'judge0-ce.p.rapidapi.com';

export interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

export const LANGUAGE_IDS: Record<string, number> = {
  c: 50,
  cpp: 54,
  java: 91, // JDK 17
  javascript: 93, // Node.js 18
  python: 92 // Python 3.11
};

export function encodeBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return btoa(str);
  }
}

export function decodeBase64(str: string): string {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    try {
      return atob(str);
    } catch {
      return str;
    }
  }
}

export async function executeCode(
  sourceCode: string,
  language: string,
  stdin = '',
  signal?: AbortSignal
): Promise<Judge0Response> {
  const languageId = LANGUAGE_IDS[language.toLowerCase()] || 93; // default JS
  const url = `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (JUDGE0_API_KEY) {
    headers['x-rapidapi-key'] = JUDGE0_API_KEY;
    headers['x-rapidapi-host'] = JUDGE0_HOST_HEADER;
  }

  const payload = {
    source_code: encodeBase64(sourceCode),
    language_id: languageId,
    stdin: encodeBase64(stdin)
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 Execution Failed (${response.status}): ${errorText}`);
  }

  const rawData = await response.json();
  
  return {
    stdout: rawData.stdout ? decodeBase64(rawData.stdout) : null,
    stderr: rawData.stderr ? decodeBase64(rawData.stderr) : null,
    compile_output: rawData.compile_output ? decodeBase64(rawData.compile_output) : null,
    message: rawData.message ? decodeBase64(rawData.message) : null,
    status: rawData.status || { id: 3, description: 'Accepted' },
    time: rawData.time || '0.00',
    memory: rawData.memory || 0
  };
}
