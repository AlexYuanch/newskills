#!/usr/bin/env node

/**
 * Skill Scout CLI
 *
 * 可选离线扫描器：输出检索方向，不核验或安装真实 skills
 *
 * 用法:
 *   skill-scout [path] [options]
 *   skill-scout /path/to/my-project
 *   skill-scout --json
 *   skill-scout --all --limit 5
 *   skill-scout --skill frontend-design
 */
import { Command, InvalidArgumentError } from "commander";
import chalk from "chalk";
import { scanProject } from "./scanner/file-scanner.js";
import { matchSkills } from "./skills/matcher.js";
import { renderTable } from "./output/table.js";
import { renderJson } from "./output/json.js";
import type { CliOptions, ScanResult } from "./types.js";

const VERSION = "1.1.0";

async function main() {
  const program = new Command();

  program
    .name("skill-scout")
    .description("离线扫描项目，提供待核验的 skill 检索方向")
    .version(VERSION)
    .argument("[path]", "项目目录路径", ".")
    .option("--json", "以 JSON 格式输出")
    .option("--all", "显示所有匹配结果（包括低置信度）")
    .option("--limit <n>", "最大结果数量（1–100）", (value: string) => {
      const limit = Number(value);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new InvalidArgumentError("limit 必须是 1–100 的整数");
      return limit;
    }, 10)
    .option("--skill <name>", "只检查特定 skill")
    .option("--verbose", "显示详细匹配原因")
    .action(async (path: string, opts: CliOptions) => {
      try {
        // 扫描项目
        process.stderr.write(chalk.gray("🔍 正在扫描指定项目\n"));
        const projectInfo = await scanProject(path);

        process.stderr.write(
          chalk.gray(`   发现 ${projectInfo.totalFiles} 个文件，正在分析...\n\n`)
        );

        // 匹配 skills
        const matches = matchSkills(projectInfo, {
          skillFilter: opts.skill,
          showAll: opts.all,
        }).slice(0, opts.limit);

        // 构建结果
        const result: ScanResult = {
          projectPath: projectInfo.rootPath,
          totalFiles: projectInfo.totalFiles,
          filesScanned: projectInfo.totalFiles,
          matches,
          scannedAt: new Date().toISOString(),
        };

        // 输出
        if (opts.json) {
          process.stdout.write(renderJson(result) + "\n");
        } else {
          process.stdout.write(renderTable(result, opts.verbose) + "\n");
        }
      } catch (error) {
        if (error instanceof Error) {
          process.stderr.write(chalk.red(`\n❌ 错误: ${error.message}\n`));
        } else {
          process.stderr.write(chalk.red("\n❌ 发生未知错误\n"));
        }
        process.exit(1);
      }
    });

  program.parse();
}

main();
