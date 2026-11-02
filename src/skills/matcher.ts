/**
 * Skill 匹配器 — 根据项目信息匹配 skills 并计算置信度
 */
import { getSkillDefinitions } from "../skills/definitions.js";
import { matchRules } from "../scanner/pattern-matcher.js";
import type {
  SkillMatch,
  SkillDefinition,
  ProjectInfo,
  ConfidenceLevel,
} from "../types.js";

/**
 * 匹配所有 skills，返回排序后的结果
 */
export function matchSkills(
  projectInfo: ProjectInfo,
  options?: {
    skillFilter?: string;  // 只匹配指定 skill
    showAll?: boolean;     // 是否显示低置信度结果
  }
): SkillMatch[] {
  let skills = getSkillDefinitions();

  // 如果指定了 skill 过滤
  if (options?.skillFilter) {
    skills = skills.filter(
      (s) =>
        s.name === options.skillFilter ||
        s.name.includes(options.skillFilter!)
    );
  }

  const matches: SkillMatch[] = [];

  for (const skill of skills) {
    const match = matchSkill(skill, projectInfo);
    if (match) {
      // 低置信度默认隐藏
      if (match.confidence === "low" && !options?.showAll) {
        continue;
      }
      matches.push(match);
    }
  }

  // 按分数降序排序
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * 匹配单个 skill
 */
function matchSkill(
  skill: SkillDefinition,
  projectInfo: ProjectInfo
): SkillMatch | null {
  const { matched, totalWeight } = matchRules(skill.rules, projectInfo);

  if (matched.length === 0) return null;

  const confidence = determineConfidence(totalWeight, skill.thresholds);
  const reasons = matched.map((r) => r.description);

  return {
    skill,
    score: Math.round(totalWeight * 10) / 10,
    confidence,
    reasons,
  };
}

/**
 * 根据分数和阈值确定置信度
 */
function determineConfidence(
  score: number,
  thresholds: { high: number; medium: number }
): ConfidenceLevel {
  if (score >= thresholds.high) return "high";
  if (score >= thresholds.medium) return "medium";
  return "low";
}

/**
 * 置信度显示文本
 */
export function confidenceDisplay(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "high":
      return "★★★ 高";
    case "medium":
      return "★★ 中";
    case "low":
      return "★ 低";
  }
}

/**
 * 置信度颜色代码（用于 chalk）
 */
export function confidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "high":
      return "green";
    case "medium":
      return "yellow";
    case "low":
      return "gray";
  }
}
