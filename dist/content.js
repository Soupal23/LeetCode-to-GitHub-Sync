(function(){"use strict";let t=null,a=null,r=null;function b(){return a||(r=document.createElement("div"),r.id="leetcode-github-sync-root",r.style.cssText=`
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `,a=r.attachShadow({mode:"open"}),document.body.appendChild(r),a)}function g(e){return e==="Accepted"?{bg:"#0f382c",border:"#00b8a3",text:"#00b8a3",buttonBg:"#00b8a3",buttonHover:"#009e8c",buttonText:"#ffffff",label:"Push Solution to GitHub",icon:"🚀"}:{bg:"#381a1a",border:"#ef4743",text:"#ef4743",buttonBg:"#ef4743",buttonHover:"#d93a37",buttonText:"#ffffff",label:"Push Attempt to GitHub",icon:"📝"}}function i(e){if(!t)return;const o=b(),n=g(t.status),f=t.status==="Accepted";o.innerHTML=`
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
        background: ${n.bg};
        border: 1px solid ${n.border};
        color: ${n.text};
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
        background: ${n.buttonBg};
        color: ${n.buttonText};
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
        background: ${n.buttonHover};
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
        <span class="problem-title">${t.questionId}. ${t.questionTitle}</span>
        <button class="close-btn" id="close-card-btn">&times;</button>
      </div>
      <div class="card-body">
        <div class="verdict-badge">
          <span>${n.icon}</span>
          <span>${t.statusDisplay}</span>
        </div>

        <div class="stats-text">
          ${f?`Runtime: <strong>${t.runtime||"N/A"}</strong> ${t.runtimePercentile?`(beats ${t.runtimePercentile.toFixed(1)}%)`:""}<br>Memory: <strong>${t.memory||"N/A"}</strong>`:`${t.totalTestcases?`Passed: <strong>${t.totalCorrect??0} / ${t.totalTestcases}</strong> testcases`:"Attempt failed"}`}
        </div>

        ${e.errorMessage?`<div class="error-box">${e.errorMessage}</div>`:""}

        ${e.successUrl?`
          <div class="success-box">
            ✅ Successfully synced to GitHub!
            <div>
              <a href="${e.successUrl}" target="_blank" rel="noopener noreferrer" class="success-link">
                View Commit on GitHub ↗
              </a>
            </div>
          </div>
        `:`
          ${e.showNoteInput?`<textarea class="note-textarea" id="user-note-input" placeholder="Why did this fail? or Notes on approach...">${e.userNote}</textarea>`:'<span class="note-toggle" id="toggle-note-btn">+ Add personal reflection note</span>'}

          <button class="btn-push" id="submit-push-btn" ${e.isPushing?"disabled":""}>
            ${e.isPushing?'<div class="spinner"></div><span>Pushing to GitHub...</span>':`<span>${n.icon}</span><span>${n.label}</span>`}
          </button>
        `}
      </div>
    </div>
  `;const c=o.getElementById("close-card-btn");c==null||c.addEventListener("click",()=>{r&&r.remove(),a=null,r=null});const l=o.getElementById("toggle-note-btn");l==null||l.addEventListener("click",()=>{i({...e,showNoteInput:!0})});const u=o.getElementById("user-note-input");u&&u.addEventListener("input",d=>{e.userNote=d.target.value});const p=o.getElementById("submit-push-btn");p==null||p.addEventListener("click",async()=>{var d;if(!(!t||e.isPushing)){i({...e,isPushing:!0,errorMessage:void 0}),e.userNote.trim()&&(t.customNote=e.userNote.trim());try{const s=await chrome.runtime.sendMessage({type:"PUSH_SUBMISSION",submission:t});s&&s.success?i({...e,isPushing:!1,successUrl:(d=s.historyItem)==null?void 0:d.commitUrl}):i({...e,isPushing:!1,errorMessage:(s==null?void 0:s.error)||"Push failed. Please check extension settings."})}catch(s){i({...e,isPushing:!1,errorMessage:s.message||"Error communicating with background worker."})}}})}window.addEventListener("LEETCODE_GITHUB_SYNC_SUBMISSION",(e=>{const o=e.detail;o&&(t=o,chrome.runtime.sendMessage({type:"RECORD_SUBMISSION",submission:o}).catch(()=>{}),i({isPushing:!1,showNoteInput:!1,userNote:""}))})),console.log("[LeetCode-GitHub-Sync] Content Script active.")})();
