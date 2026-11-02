/**
 * Skill Scout - TypeScript 类型定义
 */

/** 置信度等级 */
export type ConfidenceLevel = "high" | "medium" | "low";

/** 检测规则类型 */
export type RuleType =
  | "dependency"     // package.json 中的依赖
  | "fileExtension"  // 文件扩展名
  | "filePattern"    // 文件/目录路径模式
  | "fileContent"    // 文件内容中的关键词
  | "configFile"     // 配置文件名
  | "scriptKeyword"; // package.json scripts 中的关键词

/** 单条检测规则 */
export interface DetectionRule {
  type: RuleType;
  pattern: string;       // 匹配模式（依赖名、扩展名、glob 模式、正则等）
  weight: number;        // 权重分数
  description: string;   // 检测到的描述（用于输出原因）
}

/** Skill 定义 */
export interface SkillDefinition {
  name: string;                  // Skill 名称（如 "frontend-design"）
  description: string;           // Skill 简要描述
  category: string;              // 分类（如 "development", "output", "ai"）
  rules: DetectionRule[];        // 检测规则
  exampleCommand: string;        // 使用示例（如 "/frontend-design \"添加用户组件\""）
  thresholds: {
    high: number;   // 高置信度阈值
    medium: number; // 中置信度阈值
  };
}

/** 扫描到的项目信息 */
export interface ProjectInfo {
  rootPath: string;
  files: FileInfo[];
  dependencies: string[];       // package.json 中的所有依赖名
  scripts: string[];            // package.json scripts 中的关键词
  configFiles: string[];        // 检测到的配置文件
  fileExtensions: Map<string, number>;  // 扩展名 → 文件数
  totalFiles: number;
}

/** 单个文件信息 */
export interface FileInfo {
  path: string;         // 相对路径
  extension: string;    // 扩展名（含点，如 ".tsx"）
  size: number;         // 文件大小（字节）
  lineCount: number;    // 行数
  content?: string;     // 文件内容（仅对小文件）
}

/** Skill 匹配结果 */
export interface SkillMatch {
  skill: SkillDefinition;
  score: number;
  confidence: ConfidenceLevel;
  reasons: string[];    // 匹配原因列表
}

/** 扫描结果 */
export interface ScanResult {
  projectPath: string;
  totalFiles: number;
  filesScanned: number;
  matches: SkillMatch[];
  scannedAt: string;    // ISO 时间字符串
}

/** CLI 选项 */
export interface CliOptions {
  json: boolean;
  all: boolean;
  limit: number;
  skill: string | undefined;
  verbose: boolean;
}
