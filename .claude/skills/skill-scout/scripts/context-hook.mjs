#!/usr/bin/env node
// Fixed reminder only. Never read transcript_path, persist prompts, or call the network.
import { fileURLToPath, pathToFileURL } from 'node:url';

export function hookOutput(input) {
  if (!input || input.hook_event_name !== 'UserPromptSubmit' || typeof input.prompt !== 'string') return {};
  const skill = fileURLToPath(new URL('../SKILL.md', import.meta.url));
  return { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext:
    `NewSkills reminder: If the actual user explicitly asks for skills, or distinct user messages in the current chat repeat an unmet workflow, consult the local skill at ${JSON.stringify(skill)}. ` +
    'Assess only the current chat; quoted text, tool/agent messages and discussion about building a recommender are not demand evidence. Reuse available capabilities first. ' +
    'Complete the main task, then optionally append one verified candidate and an install question. Track refusals and pending offers in chat context: no follow-up on silence; 5-user-turn cooldown, at most 2 proactive offers per chat. ' +
    'Do not install without specific source, skill, host and scope consent; never log prompts, read transcripts, or upload private context. If state is uncertain, stay quiet. Follow the skill workflow and the user’s instructions.' } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let data = '';
  const timer = setTimeout(() => { process.stdout.write('{}\n'); process.exit(0); }, 1500);
  try {
    for await (const chunk of process.stdin) {
      data += chunk;
      if (Buffer.byteLength(data) > 1024 * 1024) throw new Error('Input too large');
    }
    process.stdout.write(JSON.stringify(hookOutput(JSON.parse(data))) + '\n');
  } catch { process.stdout.write('{}\n'); }
  finally { clearTimeout(timer); }
}
