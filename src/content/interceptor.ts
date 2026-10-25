import {
  parseSubmissionStatus,
  extractSlugFromUrl,
  fetchQuestionDetails,
  fetchSubmissionDetails,
  tryGetCodeFromMonaco,
  LeetCodeCheckResult,
} from '../services/leetcode';
import { SubmissionPayload } from '../types';
import { getFileExtension, padProblemId } from '../utils/languages';

(function () {
  const PROCESSED_SUBMISSIONS = new Set<string>();

  async function handleSubmissionResult(checkResult: LeetCodeCheckResult, slug: string) {
    const subId = String(checkResult.submission_id || '');
    if (!subId || PROCESSED_SUBMISSIONS.has(subId)) return;
    PROCESSED_SUBMISSIONS.add(subId);

    // 1. Fetch submission code and language
    let subDetails = await fetchSubmissionDetails(subId);
    let code = subDetails?.code;
    let lang = subDetails?.lang || 'python3';

    if (!code) {
      code = tryGetCodeFromMonaco() || '';
    }

    // 2. Fetch question info
    const questionInfo = await fetchQuestionDetails(slug);
    const questionId = questionInfo ? padProblemId(questionInfo.frontendId) : '0000';
    const questionTitle = questionInfo ? questionInfo.title : slug;
    const difficulty = questionInfo ? questionInfo.difficulty : 'Medium';
    const status = parseSubmissionStatus(checkResult.status_msg);

    const payload: SubmissionPayload = {
      submissionId: subId,
      questionId,
      questionTitle,
      questionSlug: slug,
      difficulty,
      status,
      statusDisplay: checkResult.status_msg || status,
      lang,
      langExtension: getFileExtension(lang),
      code: code || '',
      runtime: checkResult.status_runtime,
      runtimePercentile: checkResult.runtime_percentile,
      memory: checkResult.status_memory,
      memoryPercentile: checkResult.memory_percentile,
      totalCorrect: checkResult.total_correct,
      totalTestcases: checkResult.total_testcases,
      inputFormatted: checkResult.input_formatted,
      expectedOutput: Array.isArray(checkResult.expected_code_answer) ? checkResult.expected_code_answer.join('\n') : undefined,
      userOutput: Array.isArray(checkResult.code_answer) ? checkResult.code_answer.join('\n') : undefined,
      compileError: checkResult.compile_error,
      runtimeError: checkResult.full_runtime_error,
      questionContentHtml: questionInfo?.contentHtml,
      timestamp: Date.now(),
    };

    // Dispatch event to isolated content script
    window.dispatchEvent(
      new CustomEvent('LEETCODE_GITHUB_SYNC_SUBMISSION', {
        detail: payload,
      })
    );
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';

    // Check if this is a submission check response
    if (url.includes('/submissions/detail/') && url.includes('/check/')) {
      try {
        const clone = response.clone();
        clone.json().then(async (data: LeetCodeCheckResult) => {
          if (data && data.state === 'SUCCESS') {
            const slug = extractSlugFromUrl(window.location.href) || '';
            await handleSubmissionResult(data, slug);
          }
        }).catch(() => {});
      } catch (e) {
        // Ignore clone errors
      }
    }

    return response;
  };

  // Also intercept XMLHttpRequest for legacy endpoints
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: any,
    method: string,
    url: string | URL,
    ...rest: any[]
  ) {
    this._url = typeof url === 'string' ? url : url.toString();
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (this: any, ...args: any[]) {
    this.addEventListener('load', async () => {
      if (this._url && this._url.includes('/submissions/detail/') && this._url.includes('/check/')) {
        try {
          const data = JSON.parse(this.responseText);
          if (data && data.state === 'SUCCESS') {
            const slug = extractSlugFromUrl(window.location.href) || '';
            await handleSubmissionResult(data, slug);
          }
        } catch (e) {}
      }
    });
    return originalSend.apply(this, args as any);
  };

  console.log('[LeetCode-GitHub-Sync] Interceptor initialized in MAIN world.');
})();

