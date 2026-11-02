import { describe, it, expect } from "vitest";
import { matchSkills, confidenceDisplay } from "../src/skills/matcher.js";
import type { ProjectInfo } from "../src/types.js";

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    rootPath: "/test/project",
    files: [],
    dependencies: [],
    scripts: [],
    configFiles: [],
    fileExtensions: new Map(),
    totalFiles: 0,
    ...overrides,
  };
}

describe("matcher", () => {
  it("recommends frontend-design for React projects", () => {
    const info = makeProjectInfo({
      dependencies: ["react", "react-dom", "tailwindcss"],
      fileExtensions: new Map([[".tsx", 15], [".css", 5]]),
      configFiles: ["tailwind.config.js"],
      files: [
        { path: "src/components/App.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        { path: "src/components/Header.tsx", extension: ".tsx", size: 100, lineCount: 10 },
      ],
      totalFiles: 20,
    });

    const results = matchSkills(info);
    const frontend = results.find((r) => r.skill.name === "frontend-design");

    expect(frontend).toBeDefined();
    expect(frontend!.score).toBeGreaterThan(0);
  });

  it("recommends dataviz for D3 projects", () => {
    const info = makeProjectInfo({
      dependencies: ["d3", "react"],
      files: [
        { path: "src/charts/BarChart.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        { path: "src/dashboard/Main.tsx", extension: ".tsx", size: 100, lineCount: 10 },
      ],
      totalFiles: 10,
    });

    const results = matchSkills(info);
    const dataviz = results.find((r) => r.skill.name === "dataviz");

    expect(dataviz).toBeDefined();
  });

  it("recommends security-review for auth projects", () => {
    const info = makeProjectInfo({
      dependencies: ["jsonwebtoken", "bcrypt"],
      configFiles: [".env", "src/auth/middleware.ts"],
      files: [
        {
          path: "src/auth/login.ts",
          extension: ".ts",
          size: 200,
          lineCount: 20,
          content: "const token = jwt.sign(payload, process.env.SECRET_KEY)",
        },
      ],
      totalFiles: 10,
    });

    const results = matchSkills(info);
    const security = results.find((r) => r.skill.name === "security-review");

    expect(security).toBeDefined();
  });

  it("recommends claude-api for LLM projects", () => {
    const info = makeProjectInfo({
      dependencies: ["@anthropic-ai/sdk", "langchain"],
      files: [
        { path: "src/agents/ChatAgent.ts", extension: ".ts", size: 200, lineCount: 20 },
        { path: "src/prompts/system.prompt", extension: ".prompt", size: 50, lineCount: 5 },
      ],
      totalFiles: 10,
    });

    const results = matchSkills(info);
    const claudeApi = results.find((r) => r.skill.name === "claude-api");

    expect(claudeApi).toBeDefined();
    expect(claudeApi!.score).toBeGreaterThan(0);
  });

  it("recommends agent-browser for Playwright projects", () => {
    const info = makeProjectInfo({
      dependencies: ["playwright", "@playwright/test"],
      files: [
        { path: "tests/e2e/login.spec.ts", extension: ".ts", size: 100, lineCount: 10 },
      ],
      totalFiles: 10,
    });

    const results = matchSkills(info);
    const browser = results.find((r) => r.skill.name === "agent-browser");

    expect(browser).toBeDefined();
  });

  it("recommends run for projects with start scripts", () => {
    const info = makeProjectInfo({
      dependencies: ["express"],
      scripts: ["start", "dev"],
      configFiles: ["package.json"],
      totalFiles: 10,
    });

    const results = matchSkills(info);
    const run = results.find((r) => r.skill.name === "run");

    expect(run).toBeDefined();
  });

  it("filters by specific skill name", () => {
    const info = makeProjectInfo({
      dependencies: ["react"],
      files: [
        { path: "src/App.tsx", extension: ".tsx", size: 100, lineCount: 10 },
      ],
      totalFiles: 5,
    });

    const results = matchSkills(info, { skillFilter: "frontend-design" });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skill.name).toBe("frontend-design");
  });

  it("returns empty for non-existent skill filter", () => {
    const info = makeProjectInfo({
      dependencies: ["react"],
      totalFiles: 5,
    });

    const results = matchSkills(info, { skillFilter: "nonexistent-skill" });

    expect(results.length).toBe(0);
  });

  it("returns results sorted by score", () => {
    const info = makeProjectInfo({
      dependencies: ["react", "d3", "playwright"],
      files: [
        { path: "src/App.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        { path: "src/charts/Line.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        { path: "tests/e2e/test.ts", extension: ".ts", size: 100, lineCount: 10 },
      ],
      totalFiles: 15,
    });

    const results = matchSkills(info);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("confidenceDisplay returns correct labels", () => {
    expect(confidenceDisplay("high")).toBe("★★★ 高");
    expect(confidenceDisplay("medium")).toBe("★★ 中");
    expect(confidenceDisplay("low")).toBe("★ 低");
  });
});
