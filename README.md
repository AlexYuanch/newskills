# NewSkills · Skill Scout

**在与 AI 的正常对话里，发现值得复用的 skill。**

NewSkills 是嵌入 Codex / Claude Code 的 skill：用户明确找技能时立即检索；同一项尚未满足的需求在多轮对话中出现时，AI 可在正常回答末尾简短询问是否安装合适的技能。沿用 `skill-scout` 调用名称，兼容原项目。

无需独立应用、后台服务或额外模型 API。单独使用 skill 即可；可选本地 hook 为每轮对话加入固定提醒。语义判断和最终回复仍由当前 AI 完成。

> “你在这次对话里两次需要复用同一套文档排版流程；找到的技能可以减少这部分重复工作。是否安装到 Codex 的当前项目？”
>
> 这是话术示意。实际建议必须包含经过核验的真实候选与来源链接。

## 安装到 AI 项目

下载项目 ZIP，或克隆你选定的仓库后进入仓库根目录。不需要 `npm install`。

```bash
# Codex：复制整个目录
mkdir -p /path/to/project/.agents/skills
cp -R .agents/skills/skill-scout /path/to/project/.agents/skills/

# Claude Code：复制整个目录
mkdir -p /path/to/project/.claude/skills
cp -R .claude/skills/skill-scout /path/to/project/.claude/skills/
```

目标已有同名 skill 时先检查，避免覆盖。Codex 用 `$skill-scout`，Claude Code 用 `/skill-scout`。例如：“帮我找处理 Word 排版的 skill”或“分析当前项目适合哪些 skills”。按宿主要求重新加载。

## 可选：每次用户发言前加入提醒

需要 Node.js 18+、macOS/Linux 或兼容 POSIX shell；宿主进程必须能找到 `node`。在本仓库根目录先预览，再应用到选定项目：

```bash
node scripts/configure-hooks.mjs --host both --project /path/to/project
node scripts/configure-hooks.mjs --host both --project /path/to/project --apply
```

`--host` 可选 `codex`、`claude-code`、`both`。脚本只合并项目配置，保留其他 hooks，不改全局设置。Codex 写 `.codex/hooks.json`；Claude Code 写 `.claude/settings.local.json`。Codex 还需按界面提示审查并信任 hook，Claude 用 `/hooks` 检查。

hook 只注入固定流程提醒，不使用 prompt 内容，不读取聊天文件、不联网、不保存状态、不自动安装。它不能保证 AI 每轮都加载 skill、理解正确或给出建议。旧宿主不支持时，直接使用纯 skill。

卸载提醒（在移动/删除 skill 目录前执行）：

```bash
node scripts/configure-hooks.mjs --host both --project /path/to/project --remove
node scripts/configure-hooks.mjs --host both --project /path/to/project --remove --apply
```

详见 [宿主接入](.agents/skills/skill-scout/references/host-integration.md)。当前未验证 Windows。

## 推荐规则

- 明确找 skill：当轮搜索、核验，询问是否安装。
- 主动推荐：最近 8 条真实用户消息中至少 2 条表达同一项未满足需求；先检查现有技能、工具与插件。
- 引用、代码、AI 的话、工具输出、单条消息重复词和“设计推荐器”的讨论不作为需求次数。
- 每条回复最多 1 项主动建议，间隔至少 5 条用户消息，每个对话最多 2 次。拒绝后不再主动提同一候选；无回复不追问，“别再推荐”即可关闭。
- 安装需要明确同意具体来源、skill、目标宿主与作用域。默认项目级，不默认全局或批量安装。
- 不保存跨聊天画像。上下文压缩后状态不可靠，就停止主动建议。

规则 helper 只检查 AI 整理的结构化证据，不负责文本语义识别，也不是安装权限隔离器。规则测试通过不代表真实模型行为已经验证，见 [评估场景](.agents/skills/skill-scout/references/evaluation.md)。

## 本项目的设计贡献

把**持续且未被满足的需求、已有能力比较、推荐理由、防打扰预算和安装同意**放进同一个轻量对话工作流，保留文件证据作为补充。该组合是本项目的实现方向，不宣称全球首创。

自动发现和询问安装已有 [metaskill](https://github.com/xdm/metaskill) 等先例；[find-skills](https://github.com/vercel-labs/skills/blob/main/skills/find-skills/SKILL.md) 提供任务驱动检索。完整比较、来源版本和证据限制见 [调研记录](docs/related-work.md)。本项目未复制这些实现。

## 隐私与公开发布

默认只使用当前 AI 已获得的对话上下文，外部搜索只使用去身份化的通用能力词。真实对话不要作为测试数据提交。生成的 hook 配置含本地路径，不要公开。

```bash
npm run privacy:check
# 加查原仓库全部可达提交与身份元数据
node scripts/privacy-check.mjs --history
# 导出到一个尚不存在的外部目录，可选创建全新匿名贡献者 Git 历史
npm run release:public -- --output /path/to/new-public-copy --git
```

导出使用源文件白名单，不携带旧 `.git`、运行状态、聊天文件、依赖目录或本机配置，不配置远端、不推送。发现命中时停止，不打印秘密值。**已有仓库不能仅靠清理当前文件完成历史脱敏；公开前应检查全部可达历史，必要时使用无历史副本或在明确授权后重写历史。** 规则扫描无法保证识别一切个人信息。可通过 `NEWSKILLS_PRIVATE_MARKERS` JSON 数组在本地加查你自己的身份标记，勿将其提交到仓库。

详见 [隐私说明](PRIVACY.md)。公开到个人账号仍会暴露账号归属；文件脱敏不提供账号匿名性。

## 开发与可选离线扫描器

```bash
npm ci
npm run skill:sync
npm run skill:check
npm test
npm run lint
npm run build

# 旧 CLI：只给离线检索方向，不查询注册表或安装
npm run --silent dev -- /path/to/project --json
npm run dev -- . --all --verbose --limit 5
```

离线扫描器读取依赖名、文件名及小型源码。敏感配置只记录存在信息；跳过符号链接、运行状态及二进制内容。静态目录里的名字不是已核验安装候选，分数也不是概率或安全评级。CLI 报告可包含选定项目路径，分享前自行审查。

维护 `.agents/skills/skill-scout` 后运行 `npm run skill:sync` 生成 Claude 入口；CI/本地检查用 `skill:check` 防止两份漂移。安装到目标项目的副本需自行同步更新，本项目不在后台更新用户环境。

## English

NewSkills is a conversation-native skill for Codex and Claude Code. It discovers verified skills for explicit requests or recurring unmet workflows, then adds a brief, optional install question to the normal answer. Existing capabilities come first. Refusals, pending offers and a per-chat suggestion budget reduce interruptions.

Copy the complete skill folder into the host's project skill directory. Optional local `UserPromptSubmit` hooks add a fixed reminder; no service, transcript reader, telemetry or separate model is included. Semantic interpretation and reply generation remain the host model's responsibility. The helper and protocol tests do not establish end-to-end model reliability.

Installation always requires specific source, skill, host and scope consent. Public exports exclude old Git history and runtime state. See [PRIVACY.md](PRIVACY.md), [architecture](ARCHITECTURE.md) and [evaluation cases](.agents/skills/skill-scout/references/evaluation.md).

MIT License · [LICENSE](LICENSE)
