import {
  validateGitHubToken,
  fetchUserRepos,
  pushSubmissionToGitHub,
} from '../services/github';
import { UserSettings, SubmissionPayload, SyncHistoryItem } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  githubToken: '',
  selectedRepo: '',
  branch: 'main',
  folderStructure: 'difficulty',
  separateAttempts: true,
  includeReadme: true,
  includeStatsInFile: true,
};

async function getStoredSettings(): Promise<UserSettings> {
  const data = await chrome.storage.local.get(['user_settings']);
  return { ...DEFAULT_SETTINGS, ...(data.user_settings || {}) };
}

async function saveSubmissionToRecent(submission: SubmissionPayload) {
  const data = await chrome.storage.local.get(['recent_submissions']);
  const list: SubmissionPayload[] = data.recent_submissions || [];

  // Remove duplicate submissionId if already present
  const filtered = list.filter((s) => s.submissionId !== submission.submissionId);
  filtered.unshift(submission);

  // Keep last 20
  const trimmed = filtered.slice(0, 20);
  await chrome.storage.local.set({ recent_submissions: trimmed });
}

async function appendSyncHistory(item: SyncHistoryItem) {
  const data = await chrome.storage.local.get(['sync_history']);
  const history: SyncHistoryItem[] = data.sync_history || [];
  history.unshift(item);
  const trimmed = history.slice(0, 50); // Keep last 50
  await chrome.storage.local.set({ sync_history: trimmed });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.type) {
      case 'GET_SETTINGS': {
        const settings = await getStoredSettings();
        return { success: true, settings };
      }

      case 'SAVE_SETTINGS': {
        const current = await getStoredSettings();
        const updated = { ...current, ...message.settings };
        await chrome.storage.local.set({ user_settings: updated });
        return { success: true, settings: updated };
      }

      case 'VALIDATE_TOKEN': {
        try {
          const user = await validateGitHubToken(message.token);
          return { success: true, user };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }

      case 'GET_REPOS': {
        try {
          const token = message.token || (await getStoredSettings()).githubToken;
          if (!token) throw new Error('No token provided.');
          const repos = await fetchUserRepos(token);
          return { success: true, repos };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }

      case 'RECORD_SUBMISSION': {
        await saveSubmissionToRecent(message.submission);
        return { success: true };
      }

      case 'PUSH_SUBMISSION': {
        try {
          const settings = await getStoredSettings();
          const historyItem = await pushSubmissionToGitHub(settings, message.submission);
          await appendSyncHistory(historyItem);
          return { success: true, historyItem };
        } catch (err: any) {
          return { success: false, error: err.message || 'Push failed' };
        }
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  };

  handleAsync().then(sendResponse);
  return true; // Keep channel open for async response
});

console.log('[LeetCode-GitHub-Sync] Service Worker initialized.');

