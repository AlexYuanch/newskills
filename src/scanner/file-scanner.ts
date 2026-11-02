/**
 * 文件扫描器 — 遍历项目目录，收集文件信息、依赖、配置文件等
 */
import { globby } from "globby";
import { lstat, readFile, realpath } from "fs/promises";
import { resolve, relative, isAbsolute, extname, basename as baseName } from "path";
import type { ProjectInfo, FileInfo } from "../types.js";

/** 需要跳过的目录 */
const IGNORED_DIRS = [
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".output",
  ".cache",
  ".omc", ".codex", ".claude", ".agents",
  ".ssh", ".aws", ".azure", ".config",
  "secrets", "credentials",
  "__pycache__",
  ".venv",
  "venv",
  ".DS_Store",
];

/** 需要收集的文件扩展名（代码和配置文件） */
const INCLUDED_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".rs", ".go", ".java",
  ".c", ".cpp", ".h", ".hpp",
  ".swift", ".kt", ".kts",
  ".vue", ".svelte",
  ".html", ".css", ".scss", ".sass", ".less",
  ".md", ".mdx",
  ".json", ".yaml", ".yml", ".toml",
  ".prompt",
  ".pdf", ".docx", ".pptx", ".ppt",
  ".env",
];

/** 配置文件模式 */
const CONFIG_FILE_PATTERNS = [
  "package.json",
  "Cargo.toml",
  "go.mod",
  "requirements.txt",
  "pyproject.toml",
  "Gemfile",
  "pom.xml",
  "build.gradle",
  "CMakeLists.txt",
  "Makefile",
  "vite.config.*",
  "webpack.config.*",
  "next.config.*",
  "nuxt.config.*",
  "tailwind.config.*",
  "tsconfig.json",
  ".env",
  ".env.*",
  ".npmrc",
  "credentials.json",
  ".eslintrc*",
  ".prettierrc*",
  "settings.json",
  "keybindings.json",
];

/** 扫描项目 */
export async function scanProject(rootPath: string): Promise<ProjectInfo> {
  const absolutePath = await realpath(resolve(rootPath));
  if (!(await lstat(absolutePath)).isDirectory()) throw new Error("Project must be a directory");

  // 1. 收集所有代码/配置文件
  const filePatterns = [
    ...INCLUDED_EXTENSIONS.map((ext) => `**/*${ext}`),
    ...CONFIG_FILE_PATTERNS.map((p) => `**/${p}`),
  ];

  const files = await globby(filePatterns, {
    cwd: absolutePath,
    ignore: IGNORED_DIRS.map((d) => `**/${d}/**`),
    absolute: false,
    onlyFiles: true,
    dot: true,
    gitignore: true,
    followSymbolicLinks: false,
  });

  // 2. 解析 package.json
  let dependencies: string[] = [];
  let scripts: string[] = [];
  try {
    const pkgPath = resolve(absolutePath, "package.json");
    const pkgStats = await lstat(pkgPath);
    if (!pkgStats.isFile() || pkgStats.isSymbolicLink() || pkgStats.size > 512 * 1024) throw new Error("Skip package");
    const pkgContent = JSON.parse(await readFile(pkgPath, "utf-8"));
    dependencies = [
      ...Object.keys(pkgContent.dependencies || {}),
      ...Object.keys(pkgContent.devDependencies || {}),
    ];
    scripts = Object.keys(pkgContent.scripts || {});
  } catch {
    // 没有 package.json，正常
  }

  // 3. 扫描文件信息
  const fileInfos: FileInfo[] = [];
  const fileExtensions = new Map<string, number>();
  const configFiles: string[] = [];

  for (const filePath of files.sort().slice(0, 500)) { // 限制扫描文件数避免卡顿
    const fullPath = resolve(absolutePath, filePath);

    try {
      const stats = await lstat(fullPath);
      if (!stats.isFile() || stats.isSymbolicLink()) continue;
      const actual = relative(absolutePath, await realpath(fullPath));
      if (actual === ".." || actual.startsWith("../") || actual.startsWith("..\\") || isAbsolute(actual)) continue;
      const ext = extname(filePath);

      // 统计扩展名
      if (ext) {
        fileExtensions.set(ext, (fileExtensions.get(ext) || 0) + 1);
      }

      const fileInfo: FileInfo = {
        path: filePath,
        extension: ext,
        size: stats.size,
        lineCount: 0,
      };

      // 小文件读取内容（< 50KB）
      if (stats.size < 50 * 1024 && mayReadContent(filePath)) {
        try {
          const content = await readFile(fullPath, "utf-8");
          fileInfo.content = content;
          fileInfo.lineCount = content.split("\n").length;
        } catch {
          // 二进制文件读取失败，忽略
        }
      }

      fileInfos.push(fileInfo);

      // 检查是否为配置文件
      const basename = filePath.split("/").pop() || "";
      if (isConfigFile(basename)) {
        configFiles.push(filePath);
      }
    } catch {
      // 文件访问失败，跳过
    }
  }

  return {
    rootPath: absolutePath,
    files: fileInfos,
    dependencies,
    scripts,
    configFiles,
    fileExtensions,
    totalFiles: fileInfos.length,
  };
}

/** Secret-bearing configs and binary documents are presence-only signals. */
function mayReadContent(filePath: string): boolean {
  const name = baseName(filePath).toLowerCase();
  if (/^(?:\.env(?:\..*)?|\.npmrc|\.netrc|credentials(?:\..*)?|secrets?(?:\..*)?|settings(?:\.local)?\.json|keybindings\.json)$/.test(name)) return false;
  return ![".pdf", ".docx", ".pptx", ".ppt", ".pem", ".key", ".p12", ".pfx"].includes(extname(name));
}

/** 判断是否为配置文件 */
function isConfigFile(basename: string): boolean {
  const configPatterns = [
    "package.json", "Cargo.toml", "go.mod", "requirements.txt",
    "pyproject.toml", "tsconfig.json", "settings.json", "keybindings.json",
    "vite.config", "webpack.config", "next.config", "nuxt.config",
    "tailwind.config", ".env", ".eslintrc", ".prettierrc",
  ];

  return configPatterns.some(
    (pattern) => basename === pattern || basename.startsWith(pattern)
  );
}

/** 获取项目类型描述 */
export function getProjectTypeDescription(projectInfo: ProjectInfo): string {
  const { dependencies, fileExtensions } = projectInfo;

  const frameworks: string[] = [];
  if (dependencies.includes("react")) frameworks.push("React");
  if (dependencies.includes("vue")) frameworks.push("Vue");
  if (dependencies.includes("angular")) frameworks.push("Angular");
  if (dependencies.includes("svelte")) frameworks.push("Svelte");
  if (dependencies.includes("next")) frameworks.push("Next.js");
  if (dependencies.includes("nuxt")) frameworks.push("Nuxt");
  if (dependencies.includes("express")) frameworks.push("Express");
  if (dependencies.includes("fastify")) frameworks.push("Fastify");
  if (dependencies.includes("django")) frameworks.push("Django");
  if (dependencies.includes("flask")) frameworks.push("Flask");
  if (dependencies.includes("prisma")) frameworks.push("Prisma");

  if (frameworks.length > 0) {
    return `${frameworks.join(" + ")} 项目`;
  }

  // 按文件类型推断
  if ((fileExtensions.get(".py") || 0) > 0) return "Python 项目";
  if ((fileExtensions.get(".rs") || 0) > 0) return "Rust 项目";
  if ((fileExtensions.get(".go") || 0) > 0) return "Go 项目";
  if ((fileExtensions.get(".java") || 0) > 0) return "Java 项目";
  if ((fileExtensions.get(".tsx") || 0) > 0 || (fileExtensions.get(".jsx") || 0) > 0) {
    return "前端项目";
  }

  return "通用项目";
}
