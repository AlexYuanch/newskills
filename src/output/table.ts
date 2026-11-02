/**
 * 终端表格输出 — 彩色、格式化的技能推荐表格
 */
import Table from "cli-table3";
import chalk from "chalk";
import type { ScanResult, SkillMatch } from "../types.js";
import { confidenceDisplay, confidenceColor } from "../skills/matcher.js";
import { getProjectTypeDescription } from "../scanner/file-scanner.js";

export function renderTable(result: ScanResult, verbose: boolean = false): string {
  const { projectPath, totalFiles, matches } = result;

  let output = "";

  // 标题
  output += chalk.bold("\n🔍 Skill Scout — 项目技能扫描报告\n");
  output += chalk.gray("━".repeat(60) + "\n");
  output += chalk.cyan(`📁 项目路径: ${projectPath}\n`);
  output += chalk.cyan(`📄 文件扫描: ${totalFiles} 个文件\n`);
  output += chalk.gray("━".repeat(60) + "\n\n");

  if (matches.length === 0) {
    output += chalk.yellow("  未发现匹配的 skills。请检查项目路径是否正确。\n");
    return output;
  }

  // 构建表格
  const table = new Table({
    head: [
      chalk.bold("Skill"),
      chalk.bold("匹配度"),
      chalk.bold("原因"),
      chalk.bold("使用示例"),
    ],
    colWidths: [22, 12, 28, 30],
    style: {
      head: [],
      border: ["gray"],
    },
    wordWrap: true,
  });

  for (const match of matches) {
    const colorName = confidenceColor(match.confidence);
    const colorFn = chalk[colorName as keyof typeof chalk] as (s: string) => string;

    const reasonsText = verbose
      ? match.reasons.join("\n")
      : match.reasons.slice(0, 2).join(" + ");

    table.push([
      chalk.bold(match.skill.name),
      colorFn(confidenceDisplay(match.confidence)),
      reasonsText,
      match.skill.exampleCommand,
    ]);
  }

  output += table.toString();

  // 底部提示
  output += "\n\n" + chalk.gray("━".repeat(60) + "\n");
  output += chalk.green("\n💡 静态标签仅供检索；使用前核验真实 SKILL.md 和已有能力。\n");
  output += chalk.gray("   此报告不证明候选存在、安全或已安装。\n");
  output += chalk.gray("   使用 --json 可输出 JSON 格式结果\n");
  output += chalk.gray("   使用 --all 可查看低置信度匹配\n");

  return output;
}
