import { describe, it, expect } from "vitest";
import { matchRule } from "../src/scanner/pattern-matcher.js";
import type { DetectionRule, ProjectInfo } from "../src/types.js";

function makeProjectInfo(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    rootPath: "/test",
    files: [],
    dependencies: [],
    scripts: [],
    configFiles: [],
    fileExtensions: new Map(),
    totalFiles: 0,
    ...overrides,
  };
}

describe("pattern-matcher", () => {
  describe("matchRule - dependency", () => {
    it("matches exact dependency", () => {
      const rule: DetectionRule = {
        type: "dependency",
        pattern: "react",
        weight: 2,
        description: "检测到 React",
      };
      const info = makeProjectInfo({ dependencies: ["react", "react-dom"] });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("matches scoped dependency", () => {
      const rule: DetectionRule = {
        type: "dependency",
        pattern: "@anthropic-ai",
        weight: 2,
        description: "检测到 Anthropic",
      };
      const info = makeProjectInfo({ dependencies: ["@anthropic-ai/sdk"] });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("does not match missing dependency", () => {
      const rule: DetectionRule = {
        type: "dependency",
        pattern: "vue",
        weight: 2,
        description: "检测到 Vue",
      };
      const info = makeProjectInfo({ dependencies: ["react"] });
      expect(matchRule(rule, info)).toBe(false);
    });
  });

  describe("matchRule - fileExtension", () => {
    it("matches existing extension", () => {
      const rule: DetectionRule = {
        type: "fileExtension",
        pattern: ".tsx",
        weight: 1,
        description: "发现 TSX 文件",
      };
      const info = makeProjectInfo({
        fileExtensions: new Map([[".tsx", 10], [".css", 5]]),
      });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("does not match missing extension", () => {
      const rule: DetectionRule = {
        type: "fileExtension",
        pattern: ".vue",
        weight: 1,
        description: "发现 Vue 文件",
      };
      const info = makeProjectInfo({
        fileExtensions: new Map([[".tsx", 10]]),
      });
      expect(matchRule(rule, info)).toBe(false);
    });
  });

  describe("matchRule - filePattern", () => {
    it("matches glob pattern", () => {
      const rule: DetectionRule = {
        type: "filePattern",
        pattern: "**/components/**",
        weight: 1,
        description: "发现 components 目录",
      };
      const info = makeProjectInfo({
        files: [
          { path: "src/components/App.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        ],
        totalFiles: 1,
      });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("does not match non-existent pattern", () => {
      const rule: DetectionRule = {
        type: "filePattern",
        pattern: "**/e2e/**",
        weight: 1,
        description: "发现 e2e 目录",
      };
      const info = makeProjectInfo({
        files: [
          { path: "src/App.tsx", extension: ".tsx", size: 100, lineCount: 10 },
        ],
        totalFiles: 1,
      });
      expect(matchRule(rule, info)).toBe(false);
    });
  });

  describe("matchRule - fileContent", () => {
    it("matches content keyword", () => {
      const rule: DetectionRule = {
        type: "fileContent",
        pattern: "password|token|secret",
        weight: 1,
        description: "文件含密钥关键词",
      };
      const info = makeProjectInfo({
        files: [
          {
            path: "src/auth.ts",
            extension: ".ts",
            size: 200,
            lineCount: 20,
            content: "const token = jwt.sign(payload, secret)",
          },
        ],
        totalFiles: 1,
      });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("does not match empty content", () => {
      const rule: DetectionRule = {
        type: "fileContent",
        pattern: "password",
        weight: 1,
        description: "文件含密码",
      };
      const info = makeProjectInfo({
        files: [
          {
            path: "src/app.ts",
            extension: ".ts",
            size: 50,
            lineCount: 5,
            content: "console.log('hello')",
          },
        ],
        totalFiles: 1,
      });
      expect(matchRule(rule, info)).toBe(false);
    });
  });

  describe("matchRule - configFile", () => {
    it("matches config file", () => {
      const rule: DetectionRule = {
        type: "configFile",
        pattern: "tailwind.config",
        weight: 1,
        description: "发现 Tailwind 配置",
      };
      const info = makeProjectInfo({
        configFiles: ["tailwind.config.js"],
      });
      expect(matchRule(rule, info)).toBe(true);
    });
  });

  describe("matchRule - scriptKeyword", () => {
    it("matches script keyword", () => {
      const rule: DetectionRule = {
        type: "scriptKeyword",
        pattern: "start",
        weight: 1,
        description: "scripts 含 start",
      };
      const info = makeProjectInfo({
        scripts: ["start", "dev", "build"],
      });
      expect(matchRule(rule, info)).toBe(true);
    });

    it("does not match missing script", () => {
      const rule: DetectionRule = {
        type: "scriptKeyword",
        pattern: "serve",
        weight: 1,
        description: "scripts 含 serve",
      };
      const info = makeProjectInfo({
        scripts: ["start", "dev"],
      });
      expect(matchRule(rule, info)).toBe(false);
    });
  });
});
