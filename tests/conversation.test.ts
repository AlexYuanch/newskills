import { describe, it, expect } from 'vitest';
import { evaluate, emptyState, recordFeedback, hasInstallConsent } from '../.agents/skills/skill-scout/scripts/decision.mjs';

const id = 'example/skills@document-layout';
const candidate = { id, manifestReviewed: true, fitsNeed: true,
  manifestUrl: 'https://github.com/example/skills/blob/main/skills/document-layout/SKILL.md' };
const row = (turn: number, extra = {}) => ({ turn, source: 'user', kind: 'need', capability: 'document-layout', ...extra });
const input = (extra = {}) => ({ turn: 4, explicitSearch: false, contextReliable: true, state: emptyState(),
  need: { capability: 'document-layout', unmet: true, evidence: [row(2), row(4)] }, candidate, ...extra });

describe('conversation decision rules over summarized evidence', () => {
  it('offers one reviewed candidate for distinct repeated unmet needs', () => {
    expect(evaluate(input())).toMatchObject({ action: 'offer', candidateId: id, proactive: true });
  });
  it('requests search before a candidate exists', () => {
    expect(evaluate(input({ candidate: undefined })).action).toBe('search');
  });
  it('explicit search bypasses repetition, disabling and uncertain old state', () => {
    expect(evaluate(input({ explicitSearch: true, contextReliable: false, state: { ...emptyState(), disabled: true },
      need: { capability: 'document-layout', evidence: [] } }))).toMatchObject({ action: 'offer', proactive: false });
  });
  it.each([
    [row(4)], [row(4), row(4)], [row(-5), row(-4)],
    [row(3, { kind: 'quote' }), row(4)], [row(3, { kind: 'meta' }), row(4)],
    [row(3, { kind: 'negated' }), row(4)], [row(3, { source: 'assistant' }), row(4)],
    [row(3, { source: 'tool' }), row(4)], [row(3, { capability: 'other' }), row(4)],
    [row(5), row(6)],
  ].map(evidence => ({ evidence })))('rejects insufficient, stale, non-user or unrelated evidence: %j', ({ evidence }) => {
    expect(evaluate(input({ need: { capability: 'document-layout', unmet: true, evidence } })).action).toBe('silent');
  });
  it('counts only the latest eight distinct user turns', () => {
    expect(evaluate(input({ turn: 10, need: { capability: 'document-layout', unmet: true, evidence: [row(2), row(10)] } })).action).toBe('silent');
    expect(evaluate(input({ turn: 10, need: { capability: 'document-layout', unmet: true, evidence: [row(3), row(10)] } })).action).toBe('offer');
  });
  it('ignores future evidence', () => {
    expect(evaluate(input({ need: { capability: 'document-layout', unmet: true, evidence: [row(4), row(5)] } })).reason).toBe('insufficient-evidence');
  });
  it('reuses existing equivalent capabilities and installed candidates', () => {
    expect(evaluate(input({ need: { capability: 'document-layout', covered: true } })).action).toBe('reuse');
    expect(evaluate(input({ candidate: { ...candidate, installed: true } })).action).toBe('reuse');
  });
  it('does not treat resolved tasks or repetition alone as unmet needs', () => {
    expect(evaluate(input({ need: { capability: 'document-layout', resolved: true } })).reason).toBe('already-resolved');
    expect(evaluate(input({ need: { capability: 'document-layout', evidence: [row(2), row(4)] } })).reason).toBe('no-unmet-need');
  });
  it('does not follow up on pending offers or infer consent from silence', () => {
    const state = recordFeedback(emptyState(), { type: 'shown', id, turn: 2, proactive: true });
    expect(evaluate(input({ state })).reason).toBe('pending-feedback');
    expect(hasInstallConsent(state, undefined)).toBe(false);
    expect(hasInstallConsent(state, { confirmed: false, candidateId: id, host: 'codex', scope: 'project' })).toBe(false);
  });
  it('requires candidate, host, scope and explicit confirmation to agree', () => {
    const state = recordFeedback(emptyState(), { type: 'shown', id, turn: 2, proactive: true });
    expect(hasInstallConsent(state, { confirmed: true, candidateId: id, host: 'codex', scope: 'project' })).toBe(true);
    expect(hasInstallConsent(state, { confirmed: true, candidateId: 'example/other@x', host: 'codex', scope: 'project' })).toBe(false);
    expect(hasInstallConsent(state, { confirmed: true, candidateId: id, host: 'both', scope: 'project' })).toBe(false);
    expect(hasInstallConsent(state, { confirmed: true, candidateId: id, host: 'codex' })).toBe(false);
  });
  it('does not repeat a declined candidate but handles explicit renewed requests', () => {
    let state = recordFeedback(emptyState(), { type: 'shown', id, turn: 0, proactive: true });
    state = recordFeedback(state, { type: 'decline', id });
    expect(evaluate(input({ state, turn: 6, need: { capability: 'document-layout', unmet: true, evidence: [row(5), row(6)] } })).reason).toBe('declined');
    expect(evaluate(input({ state, explicitSearch: true })).action).toBe('offer');
    expect(state.declined).toEqual([id]);
  });
  it('enforces cooldown, per-turn limit and per-chat proactive budget', () => {
    const state = { ...emptyState(), shown: [{ id, turn: 2, proactive: true }] };
    expect(evaluate(input({ state })).reason).toBe('cooldown');
    expect(evaluate(input({ state: { ...state, shown: [{ id, turn: 4, proactive: false }] } })).reason).toBe('already-shown-this-turn');
    expect(evaluate(input({ state: { ...state, shown: [state.shown[0], { id, turn: 0, proactive: true }] } })).reason).toBe('session-budget');
    expect(evaluate(input({ turn: 7, state, need: { capability: 'document-layout', unmet: true, evidence: [row(6), row(7)] } })).action).toBe('offer');
  });
  it('disables future proactive offers and does not mutate the previous state', () => {
    const state = emptyState();
    const next = recordFeedback(state, { type: 'disable' });
    expect(state.disabled).toBe(false);
    expect(evaluate(input({ state: next })).reason).toBe('disabled');
  });
  it('rejects feedback for an unrelated candidate', () => {
    expect(() => recordFeedback(emptyState(), { type: 'accept', id })).toThrow();
  });
  it.each([
    { ...candidate, manifestReviewed: false }, { ...candidate, fitsNeed: false },
    { ...candidate, manifestUrl: 'https://github.com/attacker/other/blob/main/SKILL.md' },
    { ...candidate, manifestUrl: 'https://github.com.evil.test/example/skills/blob/main/SKILL.md' },
    { ...candidate, manifestUrl: 'https://github.com/example/skills/blob/main/README.md' },
    { ...candidate, id: 'example/skills;echo invalid' },
  ])('does not offer unverified or mismatched candidates', bad => {
    expect(evaluate(input({ candidate: bad })).reason).toBe('candidate-unverified');
  });
  it('stays quiet on corrupt evidence state or uncertain proactive context', () => {
    expect(evaluate(input({ state: {} })).reason).toBe('invalid-input');
    expect(evaluate(input({ contextReliable: false })).reason).toBe('context-unreliable');
    expect(evaluate(null).reason).toBe('invalid-input');
  });
});
