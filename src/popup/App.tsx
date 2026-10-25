import React, { useState, useEffect } from 'react';
import {
  UserSettings,
  SubmissionPayload,
  SyncHistoryItem,
  GitHubRepoOption,
} from '../types';

export default function App() {
  const [tab, setTab] = useState<'submissions' | 'history' | 'settings'>('submissions');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionPayload[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [repos, setRepos] = useState<GitHubRepoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pushingSubId, setPushingSubId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial settings and history
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const stored = await chrome.storage.local.get(['user_settings', 'recent_submissions', 'sync_history']);
        const s: UserSettings = stored.user_settings || {
          githubToken: '',
          selectedRepo: '',
          branch: 'main',
          folderStructure: 'difficulty',
          separateAttempts: true,
          includeReadme: true,
          includeStatsInFile: true,
        };
        setSettings(s);
        setTokenInput(s.githubToken || '');
        setRecentSubmissions(stored.recent_submissions || []);
        setSyncHistory(stored.sync_history || []);

        if (s.githubToken) {
          loadRepositories(s.githubToken);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function loadRepositories(token: string) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_REPOS', token });
      if (res && res.success) {
        setRepos(res.repos || []);
      }
    } catch (e) {
      console.warn('Could not fetch repos:', e);
    }
  }

  async function handleSaveToken() {
    if (!tokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid GitHub token.' });
      return;
    }

    setSavingSettings(true);
    setStatusMessage(null);

    try {
      const validateRes = await chrome.runtime.sendMessage({
        type: 'VALIDATE_TOKEN',
        token: tokenInput.trim(),
      });

      if (!validateRes || !validateRes.success) {
        setStatusMessage({ type: 'error', text: validateRes?.error || 'Invalid token.' });
        setSavingSettings(false);
        return;
      }

      const user = validateRes.user;
      const updatedSettings: UserSettings = {
        ...(settings || {
          githubToken: '',
          selectedRepo: '',
          branch: 'main',
          folderStructure: 'difficulty',
          separateAttempts: true,
          includeReadme: true,
          includeStatsInFile: true,
        }),
        githubToken: tokenInput.trim(),
        username: user.login,
        avatarUrl: user.avatarUrl,
      };

      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: updatedSettings,
      });

      setSettings(updatedSettings);
      setStatusMessage({ type: 'success', text: `Connected as @${user.login}!` });
      await loadRepositories(tokenInput.trim());
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Validation failed.' });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSettingChange(key: keyof UserSettings, value: any) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: updated,
    });
  }

  async function handlePushSubmission(submission: SubmissionPayload) {
    if (!settings?.githubToken || !settings?.selectedRepo) {
      setStatusMessage({ type: 'error', text: 'Please configure your GitHub token and repository first.' });
      setTab('settings');
      return;
    }

    setPushingSubId(submission.submissionId);
    setStatusMessage(null);

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'PUSH_SUBMISSION',
        submission,
      });

      if (res && res.success) {
        // Refresh sync history
        const stored = await chrome.storage.local.get(['sync_history']);
        setSyncHistory(stored.sync_history || []);
        setStatusMessage({ type: 'success', text: `Synced ${submission.questionTitle}!` });
      } else {
        setStatusMessage({ type: 'error', text: res?.error || 'Failed to push to GitHub.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Push failed.' });
    } finally {
      setPushingSubId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Loading LeetCode GitHub Sync...</p>
      </div>
    );
  }

  const isConnected = !!(settings?.githubToken && settings?.username);

  return (
    <div className="flex flex-col min-h-[520px]">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🐙</span>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">LeetCode to GitHub</h1>
              <p className="text-xs text-zinc-400">On-demand code sync</p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center space-x-2 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700">
              {settings?.avatarUrl && (
                <img src={settings.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="text-xs text-zinc-200 font-medium">@{settings?.username}</span>
            </div>
          ) : (
            <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
              Disconnected
            </span>
          )}
        </div>

        {/* Target Repository Pill */}
        {isConnected && settings?.selectedRepo && (
          <div className="mt-3 flex items-center justify-between bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
            <div className="flex items-center space-x-1.5 overflow-hidden">
              <span className="text-zinc-500">Repo:</span>
              <span className="font-semibold text-amber-400 truncate">{settings.selectedRepo}</span>
              <span className="text-zinc-500">({settings.branch || 'main'})</span>
            </div>
            <a
              href={`https://github.com/${settings.selectedRepo}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white ml-2 flex-shrink-0"
              title="Open repo on GitHub"
            >
              ↗
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-900/60 border-b border-zinc-800 px-4 pt-2 space-x-4 text-xs font-medium">
        <button
          onClick={() => setTab('submissions')}
          className={`pb-2 transition border-b-2 ${
            tab === 'submissions'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Recent Submissions ({recentSubmissions.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`pb-2 transition border-b-2 ${
            tab === 'history'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sync History ({syncHistory.length})
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`pb-2 transition border-b-2 ${
            tab === 'settings'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`mx-4 mt-3 p-2.5 rounded text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-teal-950/50 text-teal-300 border border-teal-800'
              : 'bg-red-950/50 text-red-300 border border-red-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tab 1: Submissions */}
      {tab === 'submissions' && (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl">
              <span className="text-2xl mb-2 block">💡</span>
              <p className="text-sm font-medium text-zinc-300">No submissions captured yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Solve or attempt any problem on LeetCode. They will appear here ready to push!
              </p>
            </div>
          ) : (
            recentSubmissions.map((sub) => {
              const isAccepted = sub.status === 'Accepted';
              const isPushing = pushingSubId === sub.submissionId;

              return (
                <div
                  key={sub.submissionId}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          {sub.questionId}. {sub.questionTitle}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            sub.difficulty === 'Easy'
                              ? 'text-teal-400 bg-teal-950/60'
                              : sub.difficulty === 'Medium'
                              ? 'text-yellow-400 bg-yellow-950/60'
                              : 'text-red-400 bg-red-950/60'
                          }`}
                        >
                          {sub.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-zinc-400">
                        <span
                          className={`font-semibold ${
                            isAccepted ? 'text-teal-400' : 'text-red-400'
                          }`}
                        >
                          {sub.statusDisplay}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                          {sub.lang}
                        </span>
                        {isAccepted && sub.runtime && (
                          <>
                            <span>•</span>
                            <span>{sub.runtime}</span>
                          </>
                        )}
                        {!isAccepted && sub.totalTestcases && (
                          <>
                            <span>•</span>
                            <span>{sub.totalCorrect ?? 0}/{sub.totalTestcases} passed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-500">
                      {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={() => handlePushSubmission(sub)}
                      disabled={isPushing}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                        isAccepted
                          ? 'bg-teal-600 hover:bg-teal-500 text-white'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                      } ${isPushing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isPushing ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Pushing...</span>
                        </>
                      ) : (
                        <>
                          <span>{isAccepted ? '🚀' : '📝'}</span>
                          <span>{isAccepted ? 'Push Solution' : 'Push Attempt'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Sync History */}
      {tab === 'history' && (
        <div className="flex-1 p-4 space-y-2.5 overflow-y-auto">
          {syncHistory.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl">
              <span className="text-2xl mb-2 block">📂</span>
              <p className="text-sm font-medium text-zinc-300">No sync history yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Pushed solutions and attempts will be listed here with commit links.
              </p>
            </div>
          ) : (
            syncHistory.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">
                    {item.questionTitle}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.status === 'Accepted'
                        ? 'text-teal-400 bg-teal-950/60'
                        : 'text-amber-400 bg-amber-950/60'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 font-mono truncate">
                  {item.filePath}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800 text-[11px] text-zinc-500">
                  <span>{new Date(item.pushedAt).toLocaleDateString()}</span>
                  <a
                    href={item.commitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View Commit</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {tab === 'settings' && (
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-200 block">
              GitHub Personal Access Token (PAT)
            </label>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Create a token with <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">repo</code> (or fine-grained <em>Contents: Read & Write</em>) permissions.
            </p>
            <div className="flex space-x-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSaveToken}
                disabled={savingSettings}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
              >
                {savingSettings ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Target Repository */}
          {isConnected && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 block">
                Target Repository
              </label>
              {repos.length > 0 ? (
                <select
                  value={settings?.selectedRepo || ''}
                  onChange={(e) => handleSettingChange('selectedRepo', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose a repository --</option>
                  {repos.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName} {r.private ? '(Private)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={settings?.selectedRepo || ''}
                  onChange={(e) => handleSettingChange('selectedRepo', e.target.value)}
                  placeholder="e.g. username/leetcode-solutions"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                />
              )}
            </div>
          )}

          {/* Branch */}
          {isConnected && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200 block">
                Git Branch
              </label>
              <input
                type="text"
                value={settings?.branch || 'main'}
                onChange={(e) => handleSettingChange('branch', e.target.value)}
                placeholder="main"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Options */}
          <div className="pt-2 border-t border-zinc-800 space-y-3">
            <label className="text-xs font-semibold text-zinc-200 block">
              Preferences
            </label>

            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.separateAttempts ?? true}
                onChange={(e) => handleSettingChange('separateAttempts', e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span>Separate failed attempts into <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">/attempts</code> subfolder</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.includeReadme ?? true}
                onChange={(e) => handleSettingChange('includeReadme', e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span>Generate <code className="bg-zinc-800 px-1 py-0.5 rounded text-amber-400">README.md</code> with problem description</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.includeStatsInFile ?? true}
                onChange={(e) => handleSettingChange('includeStatsInFile', e.target.checked)}
                className="rounded border-zinc-700 text-amber-500 focus:ring-0"
              />
              <span>Include performance comments & notes header in source file</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

