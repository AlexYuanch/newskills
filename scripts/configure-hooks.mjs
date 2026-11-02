#!/usr/bin/env node
// Repository convenience entrypoint; the installed skill is self-contained.
import { pathToFileURL } from 'node:url';
import { runCli } from '../.agents/skills/skill-scout/scripts/configure-hooks.mjs';
export { configure, mergeHook } from '../.agents/skills/skill-scout/scripts/configure-hooks.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();
