# 决策 helper

`scripts/decision.mjs` 是无网络、无状态落盘的纯规则模块。AI 先根据真实用户消息整理语义证据，再调用；不要把“能跑通 helper”当作语义识别或安全审查的证明。内部对象只在当前聊天上下文中维护。

```js
import { evaluate, emptyState, recordFeedback, hasInstallConsent } from './scripts/decision.mjs';
const state = emptyState();
const result = evaluate({
  turn: 4, // 只按真实用户消息计数
  explicitSearch: false,
  contextReliable: true,
  state,
  need: {
    capability: 'document-layout', // 通用代号，不含个人信息
    unmet: true, covered: false, resolved: false,
    evidence: [
      { turn: 2, source: 'user', kind: 'need', capability: 'document-layout' },
      { turn: 4, source: 'user', kind: 'need', capability: 'document-layout' },
    ],
  },
});
// { action: 'search', reason: 'repeated-unmet-need' }
```

没有 candidate 时返回 `search`；有 candidate 时需提供 `id`（真实 owner/repo@skill）、指向同源 GitHub SKILL.md 的 `manifestUrl`、`manifestReviewed: true`、`fitsNeed: true` 和可选 `installed`。布尔值是调用者报告的事实，helper 不替代审查。

`offer` 后，只有实际展示建议才调用 `recordFeedback(state, {type:'shown', id, turn, proactive})`。真实反馈使用 `decline`；`disable` 关闭主动建议；`resume` 仅用于用户明确恢复。沉默或转移话题保留 pending，不调用 `accept` 或 `dismiss`。明确跳过此项才可 `dismiss`。

安装前先调用 `hasInstallConsent(state, {candidateId, host:'codex', scope:'project', confirmed:true})`，把它当作完整性检查，再执行实际安装。必须先有用户对该来源、skill、宿主和范围的明确同意，不能自行填 true。安装处理结束后记录 `accept` 清除 pending。该检查不是权限隔离机制；用户说“不”或未回复时不能调用安装器。

若从 stdin 运行 helper，传上述 evaluate 对象的 JSON；输出只有动作与原因，无原文。原始聊天或秘密不要传给 helper；结构化状态缺失/不可靠时保持安静。
