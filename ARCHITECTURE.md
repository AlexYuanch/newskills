# 架构与实际能力

NewSkills 的产品入口是 skill；旧 CLI 是可选的离线项目证据工具。没有推荐服务、外部 LLM API、每日任务或聊天数据库扫描。

```text
当前用户消息 + 当前对话上下文
         │
可选 UserPromptSubmit hook ── 固定提醒，不处理原文
         │
当前 AI 加载 skill-scout
         ├─ 判断真实需求、排除引用/已解决/元讨论
         ├─ 比较宿主已有技能、工具、插件
         ├─ 可选项目证据（本地读取）
         ├─ 用通用能力词搜索 → 阅读真实 SKILL.md
         ├─ 在当前上下文维护拒绝、pending、冷却与预算
         └─ 正常回复 + 最多一个主动安装建议
                       │
            具体同意来源/skill/宿主/范围
                       │
               宿主 installer 或 skills CLI
```

| 模块 | 责任 | 不承诺 |
| --- | --- | --- |
| `.agents/skills/skill-scout/SKILL.md` | 共用推荐工作流 | 每轮必然隐式调用 |
| 同目录 `references/` | 项目分析、候选审查、接入、评估 | 远端候选永远可用或安全 |
| `scripts/decision.mjs`（skill 内） | 对 AI 汇总的证据执行确定性规则，无 I/O 状态 | 从原文理解用户意图、替代授权系统 |
| `scripts/context-hook.mjs`（skill 内） | 校验事件，注入固定提醒，超时/异常保持非阻断 | 识别反复需求或直接修改 AI 回复 |
| `.claude/skills/skill-scout/` | 由 canonical source 同步生成的 Claude 入口 | 自动更新已复制到其他项目的版本 |
| 根目录 `scripts/configure-hooks.mjs` | 默认预览，项目级合并/移除，拒绝链接，保留他人配置 | 全局安装、跨宿主事务回滚 |
| `src/scanner/` + `src/skills/` | 旧离线文件扫描与静态方向匹配 | 实时注册表查询或真实候选核验 |
| 根目录隐私/发布脚本 | 白名单、启发式检查、无历史导出 | 识别所有私人信息 |

决策 helper 的状态由调用 AI 提供，在当前对话中维护；不自动写文件。只信任模型根据实际上下文得出的语义证据，输入中的审查布尔值也只是调用者报告，不是安全认证。默认窗口 8 条真实用户消息，至少 2 条独立证据；主动建议间隔 5 条用户消息、每个对话最多 2 次。明确请求独立处理。

根目录脚本用于本地部署和维护，无 npm 依赖；hook 单独复制后也可运行。Codex 和 Claude 的配置位置不同，但共用 `hookSpecificOutput.additionalContext` 协议形状。宿主信任和版本支持是前提，实际遵从性需人工模型评估。

公开文件清单定义在 `scripts/public-files.mjs`；npm 另用 package.json 的 `files` 白名单。默认发布副本不继承开发仓库历史；只有用户明确要求时才另行重写原仓库历史。参见 [隐私说明](PRIVACY.md)。
