(function(){"use strict";const f={python:"py",python3:"py",cpp:"cpp","c++":"cpp",java:"java",c:"c",csharp:"cs","c#":"cs",javascript:"js",typescript:"ts",ruby:"rb",swift:"swift",golang:"go",go:"go",scala:"scala",kotlin:"kt",rust:"rs",php:"php",racket:"rkt",erlang:"erl",elixir:"ex",dart:"dart",sql:"sql",mysql:"sql",mssql:"sql",oraclesql:"sql",postgresql:"sql",pythondata:"py"};function y(i){const e=i.toLowerCase().trim();return f[e]||"txt"}function g(i){const e=(i||"").toLowerCase();return e.includes("easy")?"Easy":e.includes("hard")?"Hard":"Medium"}function S(i){return String(i).padStart(4,"0")}function w(i){const e=(i||"").trim();return/accepted/i.test(e)?"Accepted":/wrong answer/i.test(e)?"Wrong Answer":/time limit/i.test(e)?"Time Limit Exceeded":/memory limit/i.test(e)?"Memory Limit Exceeded":/runtime error/i.test(e)?"Runtime Error":/compile error/i.test(e)?"Compile Error":/output limit/i.test(e)?"Output Limit Exceeded":"Unknown"}function m(i){const e=i.match(/\/problems\/([^/]+)/);return e?e[1]:null}async function h(i){var s;const e=`
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
  `;try{const a=await fetch("/graphql",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({query:e,variables:{titleSlug:i}})});if(!a.ok)return null;const o=await a.json(),t=(s=o==null?void 0:o.data)==null?void 0:s.question;return t?{questionId:t.questionId,frontendId:t.questionFrontendId||t.questionId,title:t.title,difficulty:g(t.difficulty),contentHtml:t.content||"",topicTags:(t.topicTags||[]).map(n=>n.name)}:null}catch(a){return console.error("Failed to fetch question details from GraphQL:",a),null}}async function q(i){var s,a;const e=`
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
  `;try{const o=await fetch("/graphql",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({query:e,variables:{submissionId:Number(i)}})});if(!o.ok)return null;const t=await o.json(),n=(s=t==null?void 0:t.data)==null?void 0:s.submissionDetails;return!n||!n.code?null:{code:n.code,lang:((a=n.lang)==null?void 0:a.name)||"unknown",timestamp:n.timestamp?n.timestamp*1e3:Date.now()}}catch(o){return console.error("Failed to fetch submissionDetails from GraphQL:",o),null}}function _(){var i;try{const e=window;if((i=e.monaco)!=null&&i.editor){const s=e.monaco.editor.getModels();if(s&&s.length>0)for(const a of s){const o=a.getValue();if(o&&o.trim().length>0&&!o.includes("// Type your code here"))return o}}}catch{}return null}(function(){const i=new Set;async function e(t,n){const r=String(t.submission_id||"");if(!r||i.has(r))return;i.add(r);let u=await q(r),d=u==null?void 0:u.code,l=(u==null?void 0:u.lang)||"python3";d||(d=_()||"");const c=await h(n),b=c?S(c.frontendId):"0000",I=c?c.title:n,E=c?c.difficulty:"Medium",p=w(t.status_msg),C={submissionId:r,questionId:b,questionTitle:I,questionSlug:n,difficulty:E,status:p,statusDisplay:t.status_msg||p,lang:l,langExtension:y(l),code:d||"",runtime:t.status_runtime,runtimePercentile:t.runtime_percentile,memory:t.status_memory,memoryPercentile:t.memory_percentile,totalCorrect:t.total_correct,totalTestcases:t.total_testcases,inputFormatted:t.input_formatted,expectedOutput:Array.isArray(t.expected_code_answer)?t.expected_code_answer.join(`
`):void 0,userOutput:Array.isArray(t.code_answer)?t.code_answer.join(`
`):void 0,compileError:t.compile_error,runtimeError:t.full_runtime_error,questionContentHtml:c==null?void 0:c.contentHtml,timestamp:Date.now()};window.dispatchEvent(new CustomEvent("LEETCODE_GITHUB_SYNC_SUBMISSION",{detail:C}))}const s=window.fetch;window.fetch=async function(...t){var u;const n=await s.apply(this,t),r=typeof t[0]=="string"?t[0]:((u=t[0])==null?void 0:u.url)||"";if(r.includes("/submissions/detail/")&&r.includes("/check/"))try{n.clone().json().then(async l=>{if(l&&l.state==="SUCCESS"){const c=m(window.location.href)||"";await e(l,c)}}).catch(()=>{})}catch{}return n};const a=XMLHttpRequest.prototype.open,o=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(t,n,...r){return this._url=typeof n=="string"?n:n.toString(),a.apply(this,[t,n,...r])},XMLHttpRequest.prototype.send=function(...t){return this.addEventListener("load",async()=>{if(this._url&&this._url.includes("/submissions/detail/")&&this._url.includes("/check/"))try{const n=JSON.parse(this.responseText);if(n&&n.state==="SUCCESS"){const r=m(window.location.href)||"";await e(n,r)}}catch{}}),o.apply(this,t)},console.log("[LeetCode-GitHub-Sync] Interceptor initialized in MAIN world.")})()})();
