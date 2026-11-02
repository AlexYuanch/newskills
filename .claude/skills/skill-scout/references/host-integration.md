# Codex / Claude Code 接入

先复制**整个 skill 目录**到目标项目（scripts 和 references 必须一起复制）。在本仓库根目录运行：

```bash
# Codex
mkdir -p /path/to/project/.agents/skills
cp -R .agents/skills/skill-scout /path/to/project/.agents/skills/
# Claude Code
mkdir -p /path/to/project/.claude/skills
cp -R .claude/skills/skill-scout /path/to/project/.claude/skills/
```

目标目录已有同名 skill 时先检查，避免覆盖第三方同名内容。仅安装 skill 时，Codex 以 `$skill-scout` 调用，Claude Code 以 `/skill-scout` 调用；隐式调用由模型判断。

## 可选逐轮 hook

需要 Node.js 18+（宿主进程也需能找到 `node`）、macOS/Linux 或兼容的 POSIX shell。脚本不依赖 npm 安装。本次不声称已验证 Windows。

在 NewSkills 仓库根目录先预览配置，再应用（根目录命令只是 skill 内脚本的入口）：

```bash
node scripts/configure-hooks.mjs --host both --project /path/to/project
node scripts/configure-hooks.mjs --host both --project /path/to/project --apply
```

若只安装了 skill 文件夹，也可直接调用其 `scripts/configure-hooks.mjs`，传入相同参数；不需要保留 NewSkills 源码仓库。例如，在目标项目里运行 `node .agents/skills/skill-scout/scripts/configure-hooks.mjs --host codex --project .` 先预览。

只用一个宿主时把 both 换成 `codex` 或 `claude-code`。Codex 写入项目 `.codex/hooks.json`；Claude 写入 `.claude/settings.local.json`。脚本保留其他配置、拒绝符号链接，不修改全局设置。预览包含你选定的本地绝对路径，勿把生成配置或终端输出放到公开仓库。

两个宿主使用相同的协议形状，实际 command 由工具生成并引用已安装脚本：

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "node '/path/to/installed/skill/scripts/context-hook.mjs'",
        "timeout": 3
      }]
    }]
  }
}
```

Codex 的项目/非托管 hooks 还要经过宿主信任审核；按宿主提示审查并启用。Claude Code 用 `/hooks` 检查配置。版本不支持该事件时使用纯 skill，不宣传必然逐轮触发。改动后按宿主要求重新加载或新开测试会话。

hook 校验事件、限制输入大小和执行时间，只输出固定提醒，不使用 prompt 内容、不读取 `transcript_path`、不联网、不落盘。它向模型提供流程提示，实际语义判断、候选检索、拒绝状态和最终回复由当前 AI 负责，不能保证下一条回复必然出现建议。

## 移除

在删除或移动已安装 skill 前，使用原项目路径移除 NewSkills 对应的 hook：

```bash
node scripts/configure-hooks.mjs --host both --project /path/to/project --remove
node scripts/configure-hooks.mjs --host both --project /path/to/project --remove --apply
```

这只移除精确匹配的 NewSkills command，保留其他 hooks。随后可自行删除对应 skill 目录；不删除其他 skill，不重置宿主配置。

接口依据（2026-11-02 查阅）：[Codex skills](https://learn.chatgpt.com/docs/build-skills)、[Codex hooks](https://learn.chatgpt.com/docs/hooks)、[Claude hooks](https://code.claude.com/docs/en/hooks)。协议测试与真实宿主/模型测试的区别见 evaluation.md。
