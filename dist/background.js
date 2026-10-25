function $(e) {
  return btoa(
    encodeURIComponent(e).replace(/%([0-9A-F]{2})/g, (t, a) => String.fromCharCode(parseInt(a, 16)))
  );
}
async function y(e) {
  const t = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${e.trim()}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  if (!t.ok)
    throw t.status === 401 ? new Error("Invalid GitHub token. Please verify your token.") : t.status === 403 ? new Error("GitHub API rate limit exceeded or insufficient permissions.") : new Error(`GitHub API error: ${t.statusText}`);
  const a = await t.json();
  return {
    login: a.login,
    avatarUrl: a.avatar_url,
    name: a.name || a.login
  };
}
async function w(e) {
  const t = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator", {
    headers: {
      Authorization: `Bearer ${e.trim()}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  if (!t.ok)
    throw new Error("Failed to load repositories");
  return (await t.json()).map((r) => {
    var c;
    return {
      fullName: r.full_name,
      name: r.name,
      owner: ((c = r.owner) == null ? void 0 : c.login) || "",
      private: r.private,
      defaultBranch: r.default_branch || "main",
      description: r.description || ""
    };
  });
}
async function S(e, t, a, r) {
  const c = `https://api.github.com/repos/${t}/contents/${encodeURI(a)}?ref=${encodeURIComponent(r)}`;
  try {
    const o = await fetch(c, {
      headers: {
        Authorization: `Bearer ${e.trim()}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (o.status === 404) return null;
    if (o.ok)
      return (await o.json()).sha || null;
  } catch {
  }
  return null;
}
async function m(e, t, a, r, c, o) {
  var h, i, s;
  const l = await S(e, t, r, a), d = `https://api.github.com/repos/${t}/contents/${encodeURI(r)}`, p = {
    message: o,
    content: $(c),
    branch: a
  };
  l && (p.sha = l);
  const n = await fetch(d, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${e.trim()}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(p)
  });
  if (!n.ok) {
    const g = await n.json().catch(() => ({}));
    throw new Error(g.message || `GitHub error: ${n.statusText}`);
  }
  const u = await n.json();
  return {
    commitUrl: ((h = u.commit) == null ? void 0 : h.html_url) || `https://github.com/${t}/commit/${(i = u.commit) == null ? void 0 : i.sha}`,
    htmlUrl: ((s = u.content) == null ? void 0 : s.html_url) || `https://github.com/${t}/blob/${a}/${r}`
  };
}
function T(e) {
  const t = e.status === "Accepted", a = ["python", "python3", "ruby", "py"].includes(e.lang.toLowerCase()) ? "#" : "//";
  let r = `${a} Problem: ${e.questionId}. ${e.questionTitle}
`;
  return r += `${a} Link: https://leetcode.com/problems/${e.questionSlug}/
`, r += `${a} Verdict: ${e.statusDisplay}
`, t ? (e.runtime && (r += `${a} Runtime: ${e.runtime}${e.runtimePercentile ? ` (beats ${e.runtimePercentile.toFixed(2)}%)` : ""}
`), e.memory && (r += `${a} Memory: ${e.memory}${e.memoryPercentile ? ` (beats ${e.memoryPercentile.toFixed(2)}%)` : ""}
`)) : (e.totalTestcases && (r += `${a} Testcases passed: ${e.totalCorrect ?? 0}/${e.totalTestcases}
`), e.compileError && (r += `${a} Compile Error: ${e.compileError.replace(/\n/g, " ")}
`)), e.customNote && e.customNote.trim() && (r += `${a}
${a} Reflection / Notes:
`, e.customNote.split(`
`).forEach((c) => {
    r += `${a} ${c}
`;
  })), r += `
`, r;
}
function A(e) {
  const t = e.status === "Accepted", a = e.difficulty === "Easy" ? "green" : e.difficulty === "Medium" ? "yellow" : "red";
  let r = `# [${e.questionId}. ${e.questionTitle}](https://leetcode.com/problems/${e.questionSlug}/)

`;
  if (r += `![Difficulty](https://img.shields.io/badge/Difficulty-${e.difficulty}-${a}?style=flat-square)
`, t ? (r += `![Status](https://img.shields.io/badge/Status-Accepted-brightgreen?style=flat-square)

`, r += `### Performance
`, e.runtime && (r += `- **Runtime:** \`${e.runtime}\`${e.runtimePercentile ? ` (beats ${e.runtimePercentile.toFixed(2)}%)` : ""}
`), e.memory && (r += `- **Memory:** \`${e.memory}\`${e.memoryPercentile ? ` (beats ${e.memoryPercentile.toFixed(2)}%)` : ""}
`)) : (r += `![Status](https://img.shields.io/badge/Status-${encodeURIComponent(e.statusDisplay)}-critical?style=flat-square)

`, r += `### Attempt Verdict
`, r += `- **Status:** \`${e.statusDisplay}\`
`, e.totalTestcases && (r += `- **Passed Testcases:** \`${e.totalCorrect ?? 0} / ${e.totalTestcases}\`
`)), e.customNote && (r += `
### Personal Notes
> ${e.customNote.replace(/\n/g, `
> `)}
`), e.questionContentHtml) {
    r += `
---

### Problem Description

`;
    let c = e.questionContentHtml.replace(/<pre><code>/g, "```\n").replace(/<\/code><\/pre>/g, "\n```").replace(/<code>/g, "`").replace(/<\/code>/g, "`").replace(/<strong class="example">/g, "**").replace(/<\/strong>/g, "**").replace(/<strong>/g, "**").replace(/<em>/g, "*").replace(/<\/em>/g, "*").replace(/<p>/g, "").replace(/<\/p>/g, `

`).replace(/<ul>/g, "").replace(/<\/ul>/g, "").replace(/<li>/g, "- ").replace(/<\/li>/g, `
`).replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    r += c;
  }
  return r;
}
async function E(e, t) {
  if (!e.githubToken) throw new Error("GitHub token not configured.");
  if (!e.selectedRepo) throw new Error("No target repository selected in extension settings.");
  const a = e.branch || "main", r = t.status === "Accepted";
  let c = "";
  e.folderStructure === "difficulty" && (c = `${t.difficulty}/`), c += `${t.questionId}-${t.questionSlug}`;
  let o = c, l = `solution.${t.langExtension}`;
  if (!r && e.separateAttempts) {
    o = `${c}/attempts`;
    const i = t.status.toLowerCase().replace(/[^a-z0-9]/g, "_"), s = new Date(t.timestamp).toISOString().slice(0, 10);
    l = `${i}_${s}_${t.submissionId.slice(-4)}.${t.langExtension}`;
  }
  const d = `${o}/${l}`, p = e.includeStatsInFile ? T(t) + t.code : t.code;
  let n = t.customCommitMessage;
  n || (r ? (n = `Solve: ${t.questionTitle} [${t.difficulty}]`, t.runtime && (n += ` - Runtime: ${t.runtime}`)) : n = `Attempt: ${t.questionTitle} [${t.statusDisplay}]`);
  const u = await m(
    e.githubToken,
    e.selectedRepo,
    a,
    d,
    p,
    n
  );
  if (e.includeReadme) {
    const i = `${c}/README.md`, s = A(t);
    try {
      await m(
        e.githubToken,
        e.selectedRepo,
        a,
        i,
        s,
        `Docs: Add README for ${t.questionTitle}`
      );
    } catch (g) {
      console.warn("Failed to commit README.md:", g);
    }
  }
  return {
    id: `${t.submissionId}-${Date.now()}`,
    submissionId: t.submissionId,
    questionTitle: t.questionTitle,
    questionSlug: t.questionSlug,
    difficulty: t.difficulty,
    status: t.status,
    lang: t.lang,
    commitUrl: u.commitUrl,
    filePath: d,
    repo: e.selectedRepo,
    branch: a,
    pushedAt: Date.now(),
    userNote: t.customNote
  };
}
const I = {
  githubToken: "",
  selectedRepo: "",
  branch: "main",
  folderStructure: "difficulty",
  separateAttempts: !0,
  includeReadme: !0,
  includeStatsInFile: !0
};
async function f() {
  const e = await chrome.storage.local.get(["user_settings"]);
  return { ...I, ...e.user_settings || {} };
}
async function _(e) {
  const r = ((await chrome.storage.local.get(["recent_submissions"])).recent_submissions || []).filter((o) => o.submissionId !== e.submissionId);
  r.unshift(e);
  const c = r.slice(0, 20);
  await chrome.storage.local.set({ recent_submissions: c });
}
async function R(e) {
  const a = (await chrome.storage.local.get(["sync_history"])).sync_history || [];
  a.unshift(e);
  const r = a.slice(0, 50);
  await chrome.storage.local.set({ sync_history: r });
}
chrome.runtime.onMessage.addListener((e, t, a) => ((async () => {
  switch (e.type) {
    case "GET_SETTINGS":
      return { success: !0, settings: await f() };
    case "SAVE_SETTINGS": {
      const o = { ...await f(), ...e.settings };
      return await chrome.storage.local.set({ user_settings: o }), { success: !0, settings: o };
    }
    case "VALIDATE_TOKEN":
      try {
        return { success: !0, user: await y(e.token) };
      } catch (c) {
        return { success: !1, error: c.message };
      }
    case "GET_REPOS":
      try {
        const c = e.token || (await f()).githubToken;
        if (!c) throw new Error("No token provided.");
        return { success: !0, repos: await w(c) };
      } catch (c) {
        return { success: !1, error: c.message };
      }
    case "RECORD_SUBMISSION":
      return await _(e.submission), { success: !0 };
    case "PUSH_SUBMISSION":
      try {
        const c = await f(), o = await E(c, e.submission);
        return await R(o), { success: !0, historyItem: o };
      } catch (c) {
        return { success: !1, error: c.message || "Push failed" };
      }
    default:
      return { success: !1, error: "Unknown message type" };
  }
})().then(a), !0));
console.log("[LeetCode-GitHub-Sync] Service Worker initialized.");
