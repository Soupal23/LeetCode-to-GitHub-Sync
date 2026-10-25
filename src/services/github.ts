import { SubmissionPayload, UserSettings, SyncHistoryItem } from '../types';

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

export async function validateGitHubToken(token: string) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid GitHub token. Please verify your token.');
    if (res.status === 403) throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
    throw new Error(`GitHub API error: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    login: data.login,
    avatarUrl: data.avatar_url,
    name: data.name || data.login,
  };
}

export async function fetchUserRepos(token: string) {
  const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to load repositories');
  }

  const data = await res.json();
  return data.map((r: any) => ({
    fullName: r.full_name,
    name: r.name,
    owner: r.owner?.login || '',
    private: r.private,
    defaultBranch: r.default_branch || 'main',
    description: r.description || '',
  }));
}

async function getFileSha(token: string, repo: string, path: string, branch: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.status === 404) return null;
    if (res.ok) {
      const data = await res.json();
      return data.sha || null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function putGitHubFile(
  token: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string
): Promise<{ commitUrl: string; htmlUrl: string }> {
  const sha = await getFileSha(token, repo, path, branch);
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}`;

  const body: any = {
    message,
    content: utf8ToBase64(content),
    branch,
  };
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub error: ${res.statusText}`);
  }

  const result = await res.json();
  return {
    commitUrl: result.commit?.html_url || `https://github.com/${repo}/commit/${result.commit?.sha}`,
    htmlUrl: result.content?.html_url || `https://github.com/${repo}/blob/${branch}/${path}`,
  };
}

export function buildFileHeader(submission: SubmissionPayload): string {
  const isAccepted = submission.status === 'Accepted';
  const commentChar = ['python', 'python3', 'ruby', 'py'].includes(submission.lang.toLowerCase()) ? '#' : '//';

  let header = `${commentChar} Problem: ${submission.questionId}. ${submission.questionTitle}\n`;
  header += `${commentChar} Link: https://leetcode.com/problems/${submission.questionSlug}/\n`;
  header += `${commentChar} Verdict: ${submission.statusDisplay}\n`;

  if (isAccepted) {
    if (submission.runtime) header += `${commentChar} Runtime: ${submission.runtime}${submission.runtimePercentile ? ` (beats ${submission.runtimePercentile.toFixed(2)}%)` : ''}\n`;
    if (submission.memory) header += `${commentChar} Memory: ${submission.memory}${submission.memoryPercentile ? ` (beats ${submission.memoryPercentile.toFixed(2)}%)` : ''}\n`;
  } else {
    if (submission.totalTestcases) {
      header += `${commentChar} Testcases passed: ${submission.totalCorrect ?? 0}/${submission.totalTestcases}\n`;
    }
    if (submission.compileError) {
      header += `${commentChar} Compile Error: ${submission.compileError.replace(/\n/g, ' ')}\n`;
    }
  }

  if (submission.customNote && submission.customNote.trim()) {
    header += `${commentChar}\n${commentChar} Reflection / Notes:\n`;
    submission.customNote.split('\n').forEach(line => {
      header += `${commentChar} ${line}\n`;
    });
  }

  header += `\n`;
  return header;
}

export function buildReadmeContent(submission: SubmissionPayload): string {
  const isAccepted = submission.status === 'Accepted';
  const badgeColor = submission.difficulty === 'Easy' ? 'green' : submission.difficulty === 'Medium' ? 'yellow' : 'red';

  let md = `# [${submission.questionId}. ${submission.questionTitle}](https://leetcode.com/problems/${submission.questionSlug}/)\n\n`;
  md += `![Difficulty](https://img.shields.io/badge/Difficulty-${submission.difficulty}-${badgeColor}?style=flat-square)\n`;

  if (isAccepted) {
    md += `![Status](https://img.shields.io/badge/Status-Accepted-brightgreen?style=flat-square)\n\n`;
    md += `### Performance\n`;
    if (submission.runtime) md += `- **Runtime:** \`${submission.runtime}\`${submission.runtimePercentile ? ` (beats ${submission.runtimePercentile.toFixed(2)}%)` : ''}\n`;
    if (submission.memory) md += `- **Memory:** \`${submission.memory}\`${submission.memoryPercentile ? ` (beats ${submission.memoryPercentile.toFixed(2)}%)` : ''}\n`;
  } else {
    md += `![Status](https://img.shields.io/badge/Status-${encodeURIComponent(submission.statusDisplay)}-critical?style=flat-square)\n\n`;
    md += `### Attempt Verdict\n`;
    md += `- **Status:** \`${submission.statusDisplay}\`\n`;
    if (submission.totalTestcases) {
      md += `- **Passed Testcases:** \`${submission.totalCorrect ?? 0} / ${submission.totalTestcases}\`\n`;
    }
  }

  if (submission.customNote) {
    md += `\n### Personal Notes\n> ${submission.customNote.replace(/\n/g, '\n> ')}\n`;
  }

  if (submission.questionContentHtml) {
    md += `\n---\n\n### Problem Description\n\n`;
    // Clean up basic html to readable markdown
    let cleanContent = submission.questionContentHtml
      .replace(/<pre><code>/g, '```\n')
      .replace(/<\/code><\/pre>/g, '\n```')
      .replace(/<code>/g, '`')
      .replace(/<\/code>/g, '`')
      .replace(/<strong class="example">/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<strong>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '')
      .replace(/<li>/g, '- ')
      .replace(/<\/li>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    md += cleanContent;
  }

  return md;
}

export async function pushSubmissionToGitHub(
  settings: UserSettings,
  submission: SubmissionPayload
): Promise<SyncHistoryItem> {
  if (!settings.githubToken) throw new Error('GitHub token not configured.');
  if (!settings.selectedRepo) throw new Error('No target repository selected in extension settings.');

  const branch = settings.branch || 'main';
  const isAccepted = submission.status === 'Accepted';

  // Determine Directory Path
  let baseFolder = '';
  if (settings.folderStructure === 'difficulty') {
    baseFolder = `${submission.difficulty}/`;
  }
  baseFolder += `${submission.questionId}-${submission.questionSlug}`;

  // If it's a failed attempt and separateAttempts is true, place in attempts/
  let fileDir = baseFolder;
  let fileName = `solution.${submission.langExtension}`;

  if (!isAccepted && settings.separateAttempts) {
    fileDir = `${baseFolder}/attempts`;
    const safeStatus = submission.status.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timeKey = new Date(submission.timestamp).toISOString().slice(0, 10);
    fileName = `${safeStatus}_${timeKey}_${submission.submissionId.slice(-4)}.${submission.langExtension}`;
  }

  const filePath = `${fileDir}/${fileName}`;

  // Prepare full solution content (with comments)
  const fullCode = settings.includeStatsInFile
    ? buildFileHeader(submission) + submission.code
    : submission.code;

  // Prepare commit message
  let commitMessage = submission.customCommitMessage;
  if (!commitMessage) {
    if (isAccepted) {
      commitMessage = `Solve: ${submission.questionTitle} [${submission.difficulty}]`;
      if (submission.runtime) commitMessage += ` - Runtime: ${submission.runtime}`;
    } else {
      commitMessage = `Attempt: ${submission.questionTitle} [${submission.statusDisplay}]`;
    }
  }

  // 1. Commit Solution Code File
  const codeResult = await putGitHubFile(
    settings.githubToken,
    settings.selectedRepo,
    branch,
    filePath,
    fullCode,
    commitMessage
  );

  // 2. Commit README.md if enabled
  if (settings.includeReadme) {
    const readmePath = `${baseFolder}/README.md`;
    const readmeContent = buildReadmeContent(submission);
    try {
      await putGitHubFile(
        settings.githubToken,
        settings.selectedRepo,
        branch,
        readmePath,
        readmeContent,
        `Docs: Add README for ${submission.questionTitle}`
      );
    } catch (e) {
      console.warn('Failed to commit README.md:', e);
      // Don't fail the entire push if only README failed
    }
  }

  const historyItem: SyncHistoryItem = {
    id: `${submission.submissionId}-${Date.now()}`,
    submissionId: submission.submissionId,
    questionTitle: submission.questionTitle,
    questionSlug: submission.questionSlug,
    difficulty: submission.difficulty,
    status: submission.status,
    lang: submission.lang,
    commitUrl: codeResult.commitUrl,
    filePath,
    repo: settings.selectedRepo,
    branch,
    pushedAt: Date.now(),
    userNote: submission.customNote,
  };

  return historyItem;
}

