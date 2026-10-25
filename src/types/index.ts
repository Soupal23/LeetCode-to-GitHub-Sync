export type SubmissionStatus =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'
  | 'Output Limit Exceeded'
  | 'Unknown';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface SubmissionPayload {
  submissionId: string;
  questionId: string;
  questionTitle: string;
  questionSlug: string;
  difficulty: Difficulty;
  status: SubmissionStatus;
  statusDisplay: string;
  lang: string;
  langExtension: string;
  code: string;
  runtime?: string;
  runtimePercentile?: number;
  memory?: string;
  memoryPercentile?: number;
  totalCorrect?: number;
  totalTestcases?: number;
  inputFormatted?: string;
  expectedOutput?: string;
  userOutput?: string;
  compileError?: string;
  runtimeError?: string;
  questionContentHtml?: string;
  timestamp: number;
  customNote?: string;
  customCommitMessage?: string;
}

export interface UserSettings {
  githubToken: string;
  selectedRepo: string; // "owner/repo"
  branch: string; // default "main"
  folderStructure: 'difficulty' | 'flat';
  separateAttempts: boolean; // put failed attempts in /attempts
  includeReadme: boolean;
  includeStatsInFile: boolean;
  username?: string;
  avatarUrl?: string;
}

export interface SyncHistoryItem {
  id: string;
  submissionId: string;
  questionTitle: string;
  questionSlug: string;
  difficulty: Difficulty;
  status: SubmissionStatus;
  lang: string;
  commitUrl: string;
  filePath: string;
  repo: string;
  branch: string;
  pushedAt: number;
  userNote?: string;
}

export interface GitHubRepoOption {
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  description?: string;
}

