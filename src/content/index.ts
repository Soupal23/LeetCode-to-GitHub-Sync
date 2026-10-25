import { SubmissionPayload, SubmissionStatus } from '../types';

let currentSubmission: SubmissionPayload | null = null;
let shadowRoot: ShadowRoot | null = null;
let containerEl: HTMLElement | null = null;

function createOrGetShadowContainer(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  containerEl = document.createElement('div');
  containerEl.id = 'leetcode-github-sync-root';
  containerEl.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;

  shadowRoot = containerEl.attachShadow({ mode: 'open' });
  document.body.appendChild(containerEl);
  return shadowRoot;
}

function getVerdictTheme(status: SubmissionStatus) {
  if (status === 'Accepted') {
    return {
      bg: '#0f382c',
      border: '#00b8a3',
      text: '#00b8a3',
      buttonBg: '#00b8a3',
      buttonHover: '#009e8c',
      buttonText: '#ffffff',
      label: 'Push Solution to GitHub',
      icon: '🚀',
    };
  }
  return {
    bg: '#381a1a',
    border: '#ef4743',
    text: '#ef4743',
    buttonBg: '#ef4743',
    buttonHover: '#d93a37',
    buttonText: '#ffffff',
    label: 'Push Attempt to GitHub',
    icon: '📝',
  };
}

function renderUI(state: {
  isPushing: boolean;
  successUrl?: string;
  errorMessage?: string;
  showNoteInput: boolean;
  userNote: string;
}) {
  if (!currentSubmission) return;

  const root = createOrGetShadowContainer();
  const theme = getVerdictTheme(currentSubmission.status);
  const isAccepted = currentSubmission.status === 'Accepted';

  root.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .sync-card {
        background: #1e1e1e;
        border: 1px solid #333333;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
        color: #ffffff;
        width: 320px;
        overflow: hidden;
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .card-header {
        padding: 12px 14px;
        background: #252525;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #333;
      }
      .problem-title {
        font-size: 13px;
        font-weight: 600;
        color: #eaeaea;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }
      .close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .close-btn:hover { color: #fff; background: #333; }
      .card-body {
        padding: 14px;
      }
      .verdict-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 10px;
        background: ${theme.bg};
        border: 1px solid ${theme.border};
        color: ${theme.text};
      }
      .stats-text {
        font-size: 12px;
        color: #a0a0a0;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      .note-textarea {
        width: 100%;
        height: 60px;
        background: #141414;
        border: 1px solid #3c3c3c;
        border-radius: 6px;
        color: #e0e0e0;
        padding: 8px;
        font-size: 12px;
        font-family: inherit;
        resize: none;
        margin-bottom: 10px;
      }
      .note-textarea:focus {
        outline: none;
        border-color: #ffa116;
      }
      .note-toggle {
        font-size: 11px;
        color: #888;
        cursor: pointer;
        display: inline-block;
        margin-bottom: 10px;
        text-decoration: underline;
      }
      .note-toggle:hover { color: #ccc; }
      .btn-push {
        width: 100%;
        padding: 9px 14px;
        background: ${theme.buttonBg};
        color: ${theme.buttonText};
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background 0.2s;
      }
      .btn-push:hover {
        background: ${theme.buttonHover};
      }
      .btn-push:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .success-box {
        padding: 10px;
        background: rgba(0, 184, 163, 0.1);
        border: 1px solid #00b8a3;
        border-radius: 6px;
        font-size: 12px;
        color: #00b8a3;
        text-align: center;
      }
      .success-link {
        color: #00b8a3;
        font-weight: 600;
        text-decoration: underline;
        margin-top: 4px;
        display: inline-block;
      }
      .error-box {
        padding: 8px 10px;
        background: rgba(239, 71, 67, 0.15);
        border: 1px solid #ef4743;
        border-radius: 6px;
        font-size: 12px;
        color: #ef4743;
        margin-bottom: 10px;
      }
      .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>

    <div class="sync-card">
      <div class="card-header">
        <span class="problem-title">${currentSubmission.questionId}. ${currentSubmission.questionTitle}</span>
        <button class="close-btn" id="close-card-btn">&times;</button>
      </div>
      <div class="card-body">
        <div class="verdict-badge">
          <span>${theme.icon}</span>
          <span>${currentSubmission.statusDisplay}</span>
        </div>

        <div class="stats-text">
          ${
            isAccepted
              ? `Runtime: <strong>${currentSubmission.runtime || 'N/A'}</strong> ${
                  currentSubmission.runtimePercentile
                    ? `(beats ${currentSubmission.runtimePercentile.toFixed(1)}%)`
                    : ''
                }<br>Memory: <strong>${currentSubmission.memory || 'N/A'}</strong>`
              : `${
                  currentSubmission.totalTestcases
                    ? `Passed: <strong>${currentSubmission.totalCorrect ?? 0} / ${
                        currentSubmission.totalTestcases
                      }</strong> testcases`
                    : 'Attempt failed'
                }`
          }
        </div>

        ${
          state.errorMessage
            ? `<div class="error-box">${state.errorMessage}</div>`
            : ''
        }

        ${
          state.successUrl
            ? `
          <div class="success-box">
            ✅ Successfully synced to GitHub!
            <div>
              <a href="${state.successUrl}" target="_blank" rel="noopener noreferrer" class="success-link">
                View Commit on GitHub ↗
              </a>
            </div>
          </div>
        `
            : `
          ${
            state.showNoteInput
              ? `<textarea class="note-textarea" id="user-note-input" placeholder="Why did this fail? or Notes on approach...">${state.userNote}</textarea>`
              : `<span class="note-toggle" id="toggle-note-btn">+ Add personal reflection note</span>`
          }

          <button class="btn-push" id="submit-push-btn" ${state.isPushing ? 'disabled' : ''}>
            ${
              state.isPushing
                ? `<div class="spinner"></div><span>Pushing to GitHub...</span>`
                : `<span>${theme.icon}</span><span>${theme.label}</span>`
            }
          </button>
        `
        }
      </div>
    </div>
  `;

  // Event handlers
  const closeBtn = root.getElementById('close-card-btn');
  closeBtn?.addEventListener('click', () => {
    if (containerEl) containerEl.remove();
    shadowRoot = null;
    containerEl = null;
  });

  const toggleNoteBtn = root.getElementById('toggle-note-btn');
  toggleNoteBtn?.addEventListener('click', () => {
    renderUI({ ...state, showNoteInput: true });
  });

  const noteInput = root.getElementById('user-note-input') as HTMLTextAreaElement | null;
  if (noteInput) {
    noteInput.addEventListener('input', (e) => {
      state.userNote = (e.target as HTMLTextAreaElement).value;
    });
  }

  const pushBtn = root.getElementById('submit-push-btn');
  pushBtn?.addEventListener('click', async () => {
    if (!currentSubmission || state.isPushing) return;

    renderUI({ ...state, isPushing: true, errorMessage: undefined });

    if (state.userNote.trim()) {
      currentSubmission.customNote = state.userNote.trim();
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PUSH_SUBMISSION',
        submission: currentSubmission,
      });

      if (response && response.success) {
        renderUI({
          ...state,
          isPushing: false,
          successUrl: response.historyItem?.commitUrl,
        });
      } else {
        renderUI({
          ...state,
          isPushing: false,
          errorMessage: response?.error || 'Push failed. Please check extension settings.',
        });
      }
    } catch (err: any) {
      renderUI({
        ...state,
        isPushing: false,
        errorMessage: err.message || 'Error communicating with background worker.',
      });
    }
  });
}

// Listen for submission events emitted by the MAIN world interceptor
window.addEventListener('LEETCODE_GITHUB_SYNC_SUBMISSION', ((event: CustomEvent<SubmissionPayload>) => {
  const submission = event.detail;
  if (!submission) return;

  currentSubmission = submission;

  // Record submission in extension storage
  chrome.runtime.sendMessage({
    type: 'RECORD_SUBMISSION',
    submission,
  }).catch(() => {});

  // Show the on-demand Push card
  renderUI({
    isPushing: false,
    showNoteInput: false,
    userNote: '',
  });
}) as EventListener);

console.log('[LeetCode-GitHub-Sync] Content Script active.');

