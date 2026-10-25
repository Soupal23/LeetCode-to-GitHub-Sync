import { SubmissionPayload, SubmissionStatus, Difficulty } from '../types';
import { getFileExtension, formatDifficulty, padProblemId } from '../utils/languages';

export interface LeetCodeCheckResult {
  state: string; // 'SUCCESS' | 'PENDING'
  status_code?: number;
  status_msg?: string; // 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
  status_runtime?: string;
  runtime_percentile?: number;
  status_memory?: string;
  memory_percentile?: number;
  total_correct?: number;
  total_testcases?: number;
  input_formatted?: string;
  expected_code_answer?: string[];
  code_answer?: string[];
  compile_error?: string;
  full_runtime_error?: string;
  question_id?: string;
  submission_id?: string | number;
}

export function parseSubmissionStatus(statusMsg?: string): SubmissionStatus {
  const msg = (statusMsg || '').trim();
  if (/accepted/i.test(msg)) return 'Accepted';
  if (/wrong answer/i.test(msg)) return 'Wrong Answer';
  if (/time limit/i.test(msg)) return 'Time Limit Exceeded';
  if (/memory limit/i.test(msg)) return 'Memory Limit Exceeded';
  if (/runtime error/i.test(msg)) return 'Runtime Error';
  if (/compile error/i.test(msg)) return 'Compile Error';
  if (/output limit/i.test(msg)) return 'Output Limit Exceeded';
  return 'Unknown';
}

export function extractSlugFromUrl(url: string): string | null {
  const match = url.match(/\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

export async function fetchQuestionDetails(slug: string): Promise<{
  questionId: string;
  frontendId: string;
  title: string;
  difficulty: Difficulty;
  contentHtml: string;
  topicTags: string[];
} | null> {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        difficulty
        content
        topicTags {
          name
        }
      }
    }
  `;

  try {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables: { titleSlug: slug },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.data?.question;
    if (!q) return null;

    return {
      questionId: q.questionId,
      frontendId: q.questionFrontendId || q.questionId,
      title: q.title,
      difficulty: formatDifficulty(q.difficulty),
      contentHtml: q.content || '',
      topicTags: (q.topicTags || []).map((t: { name: string }) => t.name),
    };
  } catch (err) {
    console.error('Failed to fetch question details from GraphQL:', err);
    return null;
  }
}

export async function fetchSubmissionDetails(submissionId: string | number): Promise<{
  code: string;
  lang: string;
  timestamp: number;
} | null> {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        timestamp
        lang {
          name
          verboseName
        }
      }
    }
  `;

  try {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables: { submissionId: Number(submissionId) },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const sub = data?.data?.submissionDetails;
    if (!sub || !sub.code) return null;

    return {
      code: sub.code,
      lang: sub.lang?.name || 'unknown',
      timestamp: sub.timestamp ? sub.timestamp * 1000 : Date.now(),
    };
  } catch (err) {
    console.error('Failed to fetch submissionDetails from GraphQL:', err);
    return null;
  }
}

export function tryGetCodeFromMonaco(): string | null {
  try {
    const win = window as any;
    if (win.monaco?.editor) {
      const models = win.monaco.editor.getModels();
      if (models && models.length > 0) {
        // Find non-empty model
        for (const m of models) {
          const val = m.getValue();
          if (val && val.trim().length > 0 && !val.includes('// Type your code here')) {
            return val;
          }
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

