/**
 * Claude Code Skill 定义数据库
 *
 * 每个 skill 包含检测规则、权重、置信度阈值和使用示例。
 * 新增 skill 只需在此数组中添加条目即可。
 */
import type { SkillDefinition } from "../types.js";

export const skillDefinitions: SkillDefinition[] = [
  // ==================== 开发类 Skills ====================

  {
    name: "frontend-design",
    description: "前端 UI 组件设计 — 创建优雅、可访问、响应式的前端界面",
    category: "development",
    exampleCommand: '/frontend-design "添加一个用户资料卡片组件"',
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "react", weight: 2, description: "检测到 React 依赖" },
      { type: "dependency", pattern: "react-dom", weight: 1, description: "检测到 React-DOM 依赖" },
      { type: "dependency", pattern: "vue", weight: 2, description: "检测到 Vue 依赖" },
      { type: "dependency", pattern: "svelte", weight: 2, description: "检测到 Svelte 依赖" },
      { type: "dependency", pattern: "angular", weight: 2, description: "检测到 Angular 依赖" },
      { type: "dependency", pattern: "solid-js", weight: 2, description: "检测到 SolidJS 依赖" },
      { type: "dependency", pattern: "next", weight: 2, description: "检测到 Next.js 依赖" },
      { type: "dependency", pattern: "nuxt", weight: 2, description: "检测到 Nuxt 依赖" },
      { type: "dependency", pattern: "tailwindcss", weight: 1, description: "检测到 Tailwind CSS" },
      { type: "dependency", pattern: "styled-components", weight: 1, description: "检测到 styled-components" },
      { type: "dependency", pattern: "emotion", weight: 1, description: "检测到 Emotion 样式库" },
      { type: "dependency", pattern: "radix-ui", weight: 1, description: "检测到 Radix UI" },
      { type: "dependency", pattern: "@headlessui", weight: 1, description: "检测到 Headless UI" },
      { type: "fileExtension", pattern: ".tsx", weight: 1, description: "发现 TSX 文件" },
      { type: "fileExtension", pattern: ".jsx", weight: 1, description: "发现 JSX 文件" },
      { type: "fileExtension", pattern: ".vue", weight: 1, description: "发现 Vue 单文件组件" },
      { type: "fileExtension", pattern: ".svelte", weight: 1, description: "发现 Svelte 组件" },
      { type: "filePattern", pattern: "**/components/**", weight: 1, description: "发现 components 目录" },
      { type: "filePattern", pattern: "**/pages/**", weight: 0.5, description: "发现 pages 目录" },
      { type: "filePattern", pattern: "**/app/**", weight: 0.5, description: "发现 app 目录" },
      { type: "configFile", pattern: "tailwind.config", weight: 1, description: "发现 Tailwind 配置" },
      { type: "configFile", pattern: "vite.config", weight: 0.5, description: "发现 Vite 配置" },
      { type: "configFile", pattern: "next.config", weight: 1, description: "发现 Next.js 配置" },
    ],
  },

  {
    name: "dataviz",
    description: "数据可视化 — 创建图表、仪表盘、数据分析可视化",
    category: "development",
    exampleCommand: '/dataviz "创建一个销售数据仪表盘"',
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "d3", weight: 2, description: "检测到 D3.js" },
      { type: "dependency", pattern: "plotly", weight: 2, description: "检测到 Plotly" },
      { type: "dependency", pattern: "echarts", weight: 2, description: "检测到 ECharts" },
      { type: "dependency", pattern: "recharts", weight: 2, description: "检测到 Recharts" },
      { type: "dependency", pattern: "chart.js", weight: 2, description: "检测到 Chart.js" },
      { type: "dependency", pattern: "vega", weight: 2, description: "检测到 Vega" },
      { type: "dependency", pattern: "matplotlib", weight: 2, description: "检测到 Matplotlib" },
      { type: "dependency", pattern: "seaborn", weight: 1, description: "检测到 Seaborn" },
      { type: "filePattern", pattern: "**/charts/**", weight: 1, description: "发现 charts 目录" },
      { type: "filePattern", pattern: "**/dashboard*/**", weight: 1, description: "发现 dashboard 目录" },
      { type: "filePattern", pattern: "**/visualizations/**", weight: 1, description: "发现 visualizations 目录" },
      { type: "fileContent", pattern: "chart|graph|plot|visualization|dashboard", weight: 0.5, description: "文件含图表相关关键词" },
    ],
  },

  {
    name: "code-review",
    description: "代码审查 — 从正确性、安全、性能、简洁等维度审查代码",
    category: "development",
    exampleCommand: "/code-review",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "fileExtension", pattern: ".ts", weight: 0.5, description: "发现 TypeScript 文件" },
      { type: "fileExtension", pattern: ".js", weight: 0.5, description: "发现 JavaScript 文件" },
      { type: "fileExtension", pattern: ".py", weight: 0.5, description: "发现 Python 文件" },
      { type: "fileExtension", pattern: ".rs", weight: 0.5, description: "发现 Rust 文件" },
      { type: "fileExtension", pattern: ".go", weight: 0.5, description: "发现 Go 文件" },
      { type: "fileExtension", pattern: ".java", weight: 0.5, description: "发现 Java 文件" },
      { type: "fileExtension", pattern: ".cpp", weight: 0.5, description: "发现 C++ 文件" },
      { type: "fileExtension", pattern: ".c", weight: 0.5, description: "发现 C 文件" },
      { type: "fileExtension", pattern: ".rb", weight: 0.5, description: "发现 Ruby 文件" },
      { type: "fileExtension", pattern: ".swift", weight: 0.5, description: "发现 Swift 文件" },
      { type: "filePattern", pattern: "**/*.test.*", weight: 0.5, description: "发现测试文件" },
      { type: "filePattern", pattern: "**/*.spec.*", weight: 0.5, description: "发现 spec 文件" },
      { type: "configFile", pattern: ".github", weight: 0.5, description: "发现 GitHub 目录" },
    ],
  },

  {
    name: "security-review",
    description: "安全审查 — 检查认证、授权、数据泄露、注入等安全问题",
    category: "security",
    exampleCommand: "/security-review",
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "fileContent", pattern: "password|secret|api_key|apikey|token|auth", weight: 1, description: "文件含认证/密钥关键词" },
      { type: "fileContent", pattern: "sql|query|execute|prepare", weight: 0.5, description: "文件含 SQL 查询关键词" },
      { type: "filePattern", pattern: "**/auth/**", weight: 1, description: "发现 auth 目录" },
      { type: "filePattern", pattern: "**/api/**", weight: 0.5, description: "发现 API 目录" },
      { type: "filePattern", pattern: "**/middleware/**", weight: 0.5, description: "发现 middleware 目录" },
      { type: "configFile", pattern: ".env", weight: 1, description: "发现 .env 文件" },
      { type: "dependency", pattern: "passport", weight: 1, description: "检测到 Passport 认证库" },
      { type: "dependency", pattern: "bcrypt", weight: 1, description: "检测到 bcrypt" },
      { type: "dependency", pattern: "jsonwebtoken", weight: 1, description: "检测到 JWT 库" },
      { type: "dependency", pattern: "prisma", weight: 0.5, description: "检测到 Prisma ORM" },
      { type: "dependency", pattern: "sequelize", weight: 0.5, description: "检测到 Sequelize ORM" },
      { type: "dependency", pattern: "typeorm", weight: 0.5, description: "检测到 TypeORM" },
    ],
  },

  {
    name: "simplify",
    description: "代码简化 — 审查修改后的代码，寻找复用、简化和优化机会",
    category: "development",
    exampleCommand: "/simplify",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "filePattern", pattern: "**/*.test.*", weight: 0.5, description: "有测试文件，可能存在重构需求" },
      { type: "configFile", pattern: "package.json", weight: 0.5, description: "发现 package.json" },
    ],
  },

  {
    name: "review",
    description: "通用代码审查 — 广泛的项目代码质量和架构审查",
    category: "development",
    exampleCommand: "/review",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: "package.json", weight: 0.5, description: "发现 package.json" },
      { type: "configFile", pattern: "Cargo.toml", weight: 0.5, description: "发现 Cargo.toml" },
      { type: "configFile", pattern: "go.mod", weight: 0.5, description: "发现 go.mod" },
      { type: "configFile", pattern: "requirements.txt", weight: 0.5, description: "发现 requirements.txt" },
      { type: "configFile", pattern: "pyproject.toml", weight: 0.5, description: "发现 pyproject.toml" },
    ],
  },

  {
    name: "brainstorming",
    description: "头脑风暴 — 在开始新功能或新项目之前探索需求和设计",
    category: "planning",
    exampleCommand: '/brainstorming "设计一个用户管理系统"',
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "fileContent", pattern: "TODO|FIXME|PLAN|DESIGN", weight: 1, description: "文件含 TODO/FIXME/PLAN 标记" },
      { type: "filePattern", pattern: "**/docs/**", weight: 0.5, description: "发现 docs 目录" },
      { type: "filePattern", pattern: "**/README.md", weight: 0.5, description: "发现 README" },
    ],
  },

  // ==================== AI/LLM 类 Skills ====================

  {
    name: "claude-api",
    description: "Claude API 参考 — Anthropic SDK、模型参数、工具调用、Agent、MCP 等",
    category: "ai",
    exampleCommand: "/claude-api",
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "@anthropic-ai", weight: 2, description: "检测到 Anthropic SDK" },
      { type: "dependency", pattern: "langchain", weight: 1, description: "检测到 LangChain" },
      { type: "dependency", pattern: "openai", weight: 1, description: "检测到 OpenAI SDK" },
      { type: "dependency", pattern: "@openai", weight: 1, description: "检测到 OpenAI 包" },
      { type: "filePattern", pattern: "**/prompts/**", weight: 1, description: "发现 prompts 目录" },
      { type: "filePattern", pattern: "**/agents/**", weight: 1, description: "发现 agents 目录" },
      { type: "filePattern", pattern: "**/llm/**", weight: 1, description: "发现 llm 目录" },
      { type: "fileContent", pattern: "anthropic|claude|langchain|openai|llm|prompt|mcp|tool_use|function_calling", weight: 0.5, description: "文件含 LLM 相关关键词" },
      { type: "fileExtension", pattern: ".prompt", weight: 1, description: "发现 .prompt 文件" },
    ],
  },

  {
    name: "agent-browser",
    description: "浏览器自动化 Agent — 网页抓取、浏览器操作、自动化测试",
    category: "automation",
    exampleCommand: "/agent-browser",
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "playwright", weight: 2, description: "检测到 Playwright" },
      { type: "dependency", pattern: "puppeteer", weight: 2, description: "检测到 Puppeteer" },
      { type: "dependency", pattern: "selenium", weight: 2, description: "检测到 Selenium" },
      { type: "dependency", pattern: "cypress", weight: 1, description: "检测到 Cypress" },
      { type: "filePattern", pattern: "**/e2e/**", weight: 1, description: "发现 e2e 目录" },
      { type: "filePattern", pattern: "**/scraper*/**", weight: 1, description: "发现 scraper 目录" },
      { type: "filePattern", pattern: "**/crawler*/**", weight: 1, description: "发现 crawler 目录" },
      { type: "fileContent", pattern: "browser|scrape|crawl|puppeteer|playwright|selenium", weight: 0.5, description: "文件含浏览器/爬虫关键词" },
    ],
  },

  {
    name: "loop",
    description: "循环执行 — 定期运行命令或 skill，轮询状态，持续监控",
    category: "automation",
    exampleCommand: "/loop 5m /code-review",
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "node-cron", weight: 1, description: "检测到 cron 库" },
      { type: "dependency", pattern: "node-schedule", weight: 1, description: "检测到 schedule 库" },
      { type: "dependency", pattern: "cron", weight: 1, description: "检测到 cron 包" },
      { type: "fileContent", pattern: "cron|schedule|interval|setInterval|polling|watcher", weight: 0.5, description: "文件含定时/轮询关键词" },
      { type: "filePattern", pattern: "**/cron/**", weight: 1, description: "发现 cron 目录" },
      { type: "filePattern", pattern: "**/scheduler*/**", weight: 1, description: "发现 scheduler 目录" },
      { type: "filePattern", pattern: "**/monitor*/**", weight: 1, description: "发现 monitor 目录" },
      { type: "scriptKeyword", pattern: "cron|schedule|watch", weight: 1, description: "scripts 含定时任务关键词" },
    ],
  },

  // ==================== 输出类 Skills ====================

  {
    name: "pdf",
    description: "PDF 处理 — 读取、合并、分割、创建、加密 PDF 文件",
    category: "output",
    exampleCommand: '/pdf "合并这些 PDF 并添加目录"',
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "pdf-lib", weight: 2, description: "检测到 pdf-lib" },
      { type: "dependency", pattern: "pdfkit", weight: 2, description: "检测到 pdfkit" },
      { type: "dependency", pattern: "jspdf", weight: 2, description: "检测到 jsPDF" },
      { type: "dependency", pattern: "puppeteer", weight: 0.5, description: "检测到 Puppeteer（可生成 PDF）" },
      { type: "dependency", pattern: "reportlab", weight: 2, description: "检测到 ReportLab" },
      { type: "dependency", pattern: "pdfplumber", weight: 1, description: "检测到 pdfplumber" },
      { type: "fileExtension", pattern: ".pdf", weight: 1, description: "发现 PDF 文件" },
      { type: "fileContent", pattern: "pdf|pdfkit|pdf-lib|jspdf|reportlab", weight: 0.5, description: "文件含 PDF 关键词" },
    ],
  },

  {
    name: "docx",
    description: "Word 文档处理 — 创建、编辑、读取 .docx 文件",
    category: "output",
    exampleCommand: '/docx "生成一份项目报告"',
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "docx", weight: 2, description: "检测到 docx 库" },
      { type: "dependency", pattern: "mammoth", weight: 1, description: "检测到 mammoth" },
      { type: "dependency", pattern: "python-docx", weight: 2, description: "检测到 python-docx" },
      { type: "fileExtension", pattern: ".docx", weight: 1, description: "发现 .docx 文件" },
      { type: "filePattern", pattern: "**/report*/**", weight: 0.5, description: "发现 report 目录" },
      { type: "filePattern", pattern: "**/document*/**", weight: 0.5, description: "发现 document 目录" },
      { type: "fileContent", pattern: "docx|document|report|memo|letter|template", weight: 0.5, description: "文件含文档关键词" },
    ],
  },

  {
    name: "pptx",
    description: "PPT 演示文稿处理 — 创建和编辑 PowerPoint 文件",
    category: "output",
    exampleCommand: '/pptx "创建一个产品发布演示"',
    thresholds: { high: 3, medium: 2 },
    rules: [
      { type: "dependency", pattern: "pptx", weight: 2, description: "检测到 pptx 库" },
      { type: "dependency", pattern: "pptxgenjs", weight: 2, description: "检测到 PptxGenJS" },
      { type: "dependency", pattern: "python-pptx", weight: 2, description: "检测到 python-pptx" },
      { type: "fileExtension", pattern: ".pptx", weight: 1, description: "发现 .pptx 文件" },
      { type: "fileExtension", pattern: ".ppt", weight: 1, description: "发现 .ppt 文件" },
      { type: "filePattern", pattern: "**/presentation*/**", weight: 1, description: "发现 presentation 目录" },
      { type: "filePattern", pattern: "**/slide*/**", weight: 1, description: "发现 slides 目录" },
      { type: "fileContent", pattern: "presentation|slide|deck|pptx|powerpoint", weight: 0.5, description: "文件含演示文稿关键词" },
    ],
  },

  {
    name: "dataviz",
    description: "数据可视化 — 创建图表、图形、仪表盘（已合并到上方）",
    category: "development",
    exampleCommand: '/dataviz "创建销售数据可视化"',
    thresholds: { high: 3, medium: 2 },
    rules: [], // 占位，实际规则已在上方定义
  },

  // ==================== 配置类 Skills ====================

  {
    name: "run",
    description: "启动并驱动项目应用 — 运行服务器、CLI、TUI、Electron 等查看效果",
    category: "development",
    exampleCommand: "/run",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "scriptKeyword", pattern: "start|dev|serve", weight: 1, description: "scripts 含 start/dev/serve" },
      { type: "configFile", pattern: "vite.config", weight: 0.5, description: "发现 Vite 配置" },
      { type: "configFile", pattern: "webpack.config", weight: 0.5, description: "发现 Webpack 配置" },
      { type: "dependency", pattern: "electron", weight: 1, description: "检测到 Electron" },
    ],
  },

  {
    name: "init",
    description: "初始化 CLAUDE.md — 生成项目代码库文档",
    category: "config",
    exampleCommand: "/init",
    thresholds: { high: 1, medium: 1 },
    rules: [
      { type: "configFile", pattern: "package.json", weight: 0.5, description: "发现 package.json" },
    ],
  },

  {
    name: "update-config",
    description: "配置 Claude Code — 修改 settings.json、权限、环境变量",
    category: "config",
    exampleCommand: '/update-config "设置 NODE_ENV=development"',
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: ".claude/settings.json", weight: 1, description: "发现 .claude/settings.json" },
      { type: "configFile", pattern: ".claude", weight: 0.5, description: "发现 .claude 目录" },
      { type: "configFile", pattern: "settings.json", weight: 0.5, description: "发现 settings.json" },
    ],
  },

  {
    name: "keybindings-help",
    description: "键盘快捷键帮助 — 自定义按键绑定和快捷键",
    category: "config",
    exampleCommand: "/keybindings-help",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: "keybindings.json", weight: 2, description: "发现 keybindings.json" },
      { type: "configFile", pattern: ".claude/keybindings.json", weight: 2, description: "发现 .claude/keybindings.json" },
    ],
  },

  {
    name: "fewer-permission-prompts",
    description: "减少权限弹窗 — 为常用只读命令添加白名单",
    category: "config",
    exampleCommand: "/fewer-permission-prompts",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: ".claude/settings.json", weight: 1, description: "发现 .claude/settings.json" },
      { type: "configFile", pattern: ".claude", weight: 0.5, description: "发现 .claude 目录" },
    ],
  },

  {
    name: "find-skills",
    description: "查找 Skills — 搜索和发现可用的 Claude Code skills",
    category: "config",
    exampleCommand: "/find-skills",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: ".claude", weight: 0.5, description: "发现 .claude 目录" },
      { type: "filePattern", pattern: "**/.claude/**/*.md", weight: 1, description: "发现 .claude 下的 skill 文档" },
    ],
  },

  {
    name: "skill-creator",
    description: "Skill 创建器 — 创建和发布自定义 skills",
    category: "config",
    exampleCommand: '/skill-creator "创建一个代码规范 skill"',
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "filePattern", pattern: "**/.claude/skills/**", weight: 2, description: "发现 .claude/skills 目录" },
      { type: "fileContent", pattern: "skill|slash-command|custom-skill", weight: 0.5, description: "文件含 skill 关键词" },
    ],
  },

  {
    name: "claude-hud:configure",
    description: "配置 Claude HUD — 设置 Heads-Up Display",
    category: "config",
    exampleCommand: "/claude-hud:configure",
    thresholds: { high: 2, medium: 1 },
    rules: [
      { type: "configFile", pattern: ".omc", weight: 1, description: "发现 .omc 目录" },
      { type: "fileContent", pattern: "hud|heads-up|display|dashboard", weight: 0.5, description: "文件含 HUD 关键词" },
    ],
  },
];

/**
 * 获取所有 skill 定义（去重，排除空规则占位）
 */
export function getSkillDefinitions(): SkillDefinition[] {
  return skillDefinitions.filter((s) => s.rules.length > 0);
}

/**
 * 按名称获取单个 skill 定义
 */
export function getSkillByName(name: string): SkillDefinition | undefined {
  return getSkillDefinitions().find((s) => s.name === name);
}

/**
 * 按分类获取 skills
 */
export function getSkillsByCategory(category: string): SkillDefinition[] {
  return getSkillDefinitions().filter((s) => s.category === category);
}
