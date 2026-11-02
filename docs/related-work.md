# 同类调研与实现依据

检索于 2026-11-02。公开 GitHub 原项目链接在匿名读取时返回 404，因此本项目分析以用户提供的本地 checkout 为依据，不推测远端可见性。以下功能依据来自维护者仓库和官方文档，未安装或执行第三方候选。

| 项目 | 功能交集 | 本项目选择 |
| --- | --- | --- |
| [find-skills](https://github.com/vercel-labs/skills/blob/92a9a34ac3bf88e695e468b90c7bf32f163d32c8/skills/find-skills/SKILL.md) | 从用户任务/请求中搜索、推荐和提供安装命令 | 复用任务驱动检索思路，移除旧文档对其“只能看依赖”的错误比较 |
| [metaskill](https://github.com/xdm/metaskill/tree/a5d8f1d725357fd02a5a71057fdd6a1b1a22bbd6) | Claude hooks、任务查找、确认安装、拒绝过滤与策略 | 这是“自动发现并询问安装”的直接先例；本项目没有复制其索引或引擎 |
| [Skill Recommender](https://github.com/JasperHye/skill-recommender/tree/a57d228a6cd0b25a524bc74a46be7ea61121baf1) | 手动/每日发现、显式反馈、冷却与外部状态 | 采用对话内最小状态，不引入每日推送或长期画像；不把反馈机制宣称为首创 |
| [ECC skill-scout](https://github.com/affaan-m/ECC/blob/b38be6a7f6350964d59328b52f0624e1d1d552d1/skills/skill-scout/SKILL.md) | 创建技能前搜索本地与远程来源 | 证明名称和检索流程已有近邻；沿用本项目旧调用名以兼容 |

候选特色：在当前对话里同时要求“持续出现”和“尚未满足”，与已有能力比较后再给顺带建议；把证据解释、pending、拒绝与有限打扰预算组合在一个可携带 skill 中。各个单独元素都有近邻，不宣称首次实现或不存在其他相同组合。没有进行穷尽检索、用户实验或效果比较。

## 官方接口

- [Codex skills](https://learn.chatgpt.com/docs/build-skills)：项目 `.agents/skills`、显式和隐式选择；隐式选择依赖模型匹配。
- [Codex hooks](https://learn.chatgpt.com/docs/hooks)：项目 `.codex/hooks.json`、UserPromptSubmit 上下文输出，以及非托管 hooks 的信任要求。
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)：UserPromptSubmit 输入和 `hookSpecificOutput.additionalContext`；hook 自身不会把建议作为可见回复发给用户。

可选配置使用这些协议中共同的字段。文档会变化，真实部署仍需确认宿主版本、PATH 和信任状态。

## 授权与代码来源

上述来源用于功能对照和接口核验；没有复制其代码、索引或 SKILL.md 正文。NewSkills 的代码与说明在现有本项目基础上修改，MIT 许可见根目录 LICENSE。
