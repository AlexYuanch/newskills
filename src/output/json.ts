/**
 * JSON 输出格式化
 */
import type { ScanResult } from "../types.js";

export function renderJson(result: ScanResult): string {
  const output = {
    mode: "offline-search-hints",
    candidatesVerified: false,
    project: result.projectPath,
    scannedAt: result.scannedAt,
    totalFiles: result.totalFiles,
    skills: result.matches.map((match) => ({
      name: match.skill.name,
      description: match.skill.description,
      category: match.skill.category,
      confidence: match.confidence,
      score: match.score,
      reasons: match.reasons,
      exampleCommand: match.skill.exampleCommand,
    })),
  };

  return JSON.stringify(output, null, 2);
}
