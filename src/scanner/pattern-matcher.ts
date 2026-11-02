/**
 * 模式匹配器 — 将项目信息与检测规则进行匹配
 */
import type { DetectionRule, ProjectInfo } from "../types.js";

/**
 * 检查单个规则是否匹配
 */
export function matchRule(rule: DetectionRule, projectInfo: ProjectInfo): boolean {
  switch (rule.type) {
    case "dependency":
      return projectInfo.dependencies.some(
        (dep) => dep === rule.pattern || dep.startsWith(`${rule.pattern}/`)
      );

    case "fileExtension":
      return (projectInfo.fileExtensions.get(rule.pattern) || 0) > 0;

    case "filePattern":
      return projectInfo.files.some((f) => matchesGlob(f.path, rule.pattern));

    case "fileContent":
      return projectInfo.files.some((f) => {
        if (!f.content) return false;
        return new RegExp(rule.pattern, "i").test(f.content);
      });

    case "configFile":
      return projectInfo.configFiles.some((f) =>
        f.includes(rule.pattern) || f.split("/").pop()?.startsWith(rule.pattern)
      );

    case "scriptKeyword":
      return projectInfo.scripts.some((script) =>
        new RegExp(rule.pattern, "i").test(script)
      );

    default:
      return false;
  }
}

/**
 * Simple glob matching (supports double-star and single-star wildcards)
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  // 将 glob 模式转换为正则
  const regex = pattern
    .replace(/\*\*/g, ".*")     // ** → .*
    .replace(/\*/g, "[^/]*")     // * → [^/]*（不跨目录）
    .replace(/\?/g, ".");        // ? → .

  const re = new RegExp(`^${regex}$`);
  return re.test(filePath);
}

/**
 * 批量匹配所有规则，返回匹配的规则列表和总权重
 */
export function matchRules(
  rules: DetectionRule[],
  projectInfo: ProjectInfo
): { matched: DetectionRule[]; totalWeight: number } {
  const matched: DetectionRule[] = [];
  let totalWeight = 0;

  for (const rule of rules) {
    if (matchRule(rule, projectInfo)) {
      matched.push(rule);
      totalWeight += rule.weight;
    }
  }

  return { matched, totalWeight };
}
