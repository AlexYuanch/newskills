#!/usr/bin/env node
// Pure rules over model-summarized evidence. No text classifier, I/O state or network.
import { pathToFileURL } from 'node:url';

const packagePattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+$/;
const capabilityPattern = /^[a-z][a-z0-9-]{0,63}$/;
export const emptyState = () => ({ disabled: false, declined: [], shown: [], pending: null });

function validState(state) {
  return state && typeof state.disabled === 'boolean' &&
    Array.isArray(state.declined) && state.declined.every(id => typeof id === 'string' && packagePattern.test(id)) &&
    Array.isArray(state.shown) && state.shown.every(row => row && packagePattern.test(row.id) &&
      Number.isInteger(row.turn) && row.turn >= 0 && typeof row.proactive === 'boolean') &&
    (state.pending === null || (state.pending && packagePattern.test(state.pending.id)));
}

export function evaluate(input) {
  const silent = reason => ({ action: 'silent', reason });
  if (!input || !Number.isInteger(input.turn) || input.turn < 0 ||
      !input.need || !capabilityPattern.test(input.need.capability ?? '') ||
      typeof input.explicitSearch !== 'boolean' || !validState(input.state)) return silent('invalid-input');
  const { turn, need, state, candidate, explicitSearch } = input;
  if (input.contextReliable !== true && !explicitSearch) return silent('context-unreliable');
  if (need.covered === true || candidate?.installed === true) return { action: 'reuse', reason: 'capability-available' };
  if (need.resolved === true) return silent('already-resolved');
  if (!explicitSearch) {
    if (state.disabled) return silent('disabled');
    if (state.pending) return silent('pending-feedback');
    if (need.unmet !== true) return silent('no-unmet-need');
    const evidence = Array.isArray(need.evidence) ? need.evidence : [];
    const turns = new Set(evidence.filter(row => row && row.source === 'user' && row.kind === 'need' &&
      row.capability === need.capability && Number.isInteger(row.turn) && row.turn >= 0 &&
      row.turn <= turn && row.turn > turn - 8).map(row => row.turn));
    if (turns.size < 2) return silent('insufficient-evidence');
    const proactive = state.shown.filter(row => row.proactive);
    if (proactive.length >= 2) return silent('session-budget');
    if (state.shown.some(row => row.turn >= turn)) return silent('already-shown-this-turn');
    if (proactive.some(row => turn - row.turn < 5)) return silent('cooldown');
    if (candidate && state.declined.includes(candidate.id)) return silent('declined');
  }
  if (!candidate) return { action: 'search', reason: explicitSearch ? 'explicit-request' : 'repeated-unmet-need' };
  if (!packagePattern.test(candidate.id ?? '') || candidate.manifestReviewed !== true || candidate.fitsNeed !== true) {
    return silent('candidate-unverified');
  }
  try {
    const url = new URL(candidate.manifestUrl);
    const repo = candidate.id.split('@')[0];
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password ||
        !url.pathname.startsWith(`/${repo}/blob/`) || !url.pathname.endsWith('/SKILL.md')) return silent('candidate-unverified');
  } catch { return silent('candidate-unverified'); }
  return { action: 'offer', reason: explicitSearch ? 'explicit-request' : 'repeated-unmet-need',
    candidateId: candidate.id, proactive: !explicitSearch, turn };
}

export function recordFeedback(state, event) {
  if (!validState(state) || !event) throw new Error('Invalid feedback');
  const next = structuredClone(state);
  if (event.type === 'disable') { next.disabled = true; next.pending = null; return next; }
  if (event.type === 'resume') { next.disabled = false; return next; }
  if (!packagePattern.test(event.id ?? '')) throw new Error('Invalid candidate');
  if (event.type === 'shown') {
    if (!Number.isInteger(event.turn) || event.turn < 0 || typeof event.proactive !== 'boolean') throw new Error('Invalid offer');
    if (next.shown.some(row => row.id === event.id && row.turn === event.turn)) return next;
    next.shown.push({ id: event.id, turn: event.turn, proactive: event.proactive });
    next.pending = { id: event.id };
    return next;
  }
  if (next.pending?.id !== event.id) throw new Error('Feedback must match pending candidate');
  if (event.type === 'decline') {
    next.declined = [...new Set([...next.declined, event.id])]; next.pending = null;
  } else if (event.type === 'dismiss' || event.type === 'accept') {
    next.pending = null;
  } else throw new Error('Unknown feedback');
  return next;
}

export function hasInstallConsent(state, consent) {
  return validState(state) && state.pending !== null && consent?.confirmed === true &&
    consent.candidateId === state.pending.id && ['codex', 'claude-code'].includes(consent.host) &&
    ['project', 'user'].includes(consent.scope);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let data = '';
  try {
    for await (const chunk of process.stdin) {
      data += chunk;
      if (Buffer.byteLength(data) > 64 * 1024) throw new Error('Input too large');
    }
    process.stdout.write(JSON.stringify(evaluate(JSON.parse(data))) + '\n');
  } catch {
    process.stdout.write(JSON.stringify({ action: 'silent', reason: 'invalid-input' }) + '\n');
    process.exitCode = 1;
  }
}
