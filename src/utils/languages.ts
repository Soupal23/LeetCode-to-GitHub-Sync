export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: 'py',
  python3: 'py',
  cpp: 'cpp',
  'c++': 'cpp',
  java: 'java',
  c: 'c',
  csharp: 'cs',
  'c#': 'cs',
  javascript: 'js',
  typescript: 'ts',
  ruby: 'rb',
  swift: 'swift',
  golang: 'go',
  go: 'go',
  scala: 'scala',
  kotlin: 'kt',
  rust: 'rs',
  php: 'php',
  racket: 'rkt',
  erlang: 'erl',
  elixir: 'ex',
  dart: 'dart',
  sql: 'sql',
  mysql: 'sql',
  mssql: 'sql',
  oraclesql: 'sql',
  postgresql: 'sql',
  pythondata: 'py',
};

export function getFileExtension(lang: string): string {
  const normalized = (lang || '').toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized] || 'txt';
}

export function formatDifficulty(diff?: string): 'Easy' | 'Medium' | 'Hard' {
  const d = (diff || '').toLowerCase();
  if (d.includes('easy')) return 'Easy';
  if (d.includes('hard')) return 'Hard';
  return 'Medium';
}

export function padProblemId(id: string | number): string {
  const numStr = String(id).padStart(4, '0');
  return numStr;
}

