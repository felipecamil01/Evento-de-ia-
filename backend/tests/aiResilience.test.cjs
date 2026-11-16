const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  AIProviderUnavailableError,
  getTextModelCandidates,
  isRetryableProviderError,
  providerStatus,
  withModelFallback,
} = require('../dist/services/aiResilience');

const noWait = async () => {};

test('uses configured text model and unique ordered fallbacks', () => {
  assert.deepEqual(getTextModelCandidates({
    GEMINI_TEXT_MODEL: 'custom-primary',
    GEMINI_TEXT_FALLBACK_MODELS: 'fallback-a, fallback-b,custom-primary,,fallback-a',
  }), ['custom-primary', 'fallback-a', 'fallback-b']);
});

test('defaults to currently documented Gemini Flash model family', () => {
  assert.deepEqual(getTextModelCandidates({}), [
    'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite',
  ]);
});

test('detects provider status from SDK fields and message text', () => {
  assert.equal(providerStatus({ status: 503 }), 503);
  assert.equal(providerStatus(new Error('[429 Too Many Requests] busy')), 429);
  assert.equal(isRetryableProviderError({ status: 503 }), true);
  assert.equal(isRetryableProviderError({ status: 400 }), false);
});

test('bounds transient retries then falls back to another model', async () => {
  const calls = [];
  const delays = [];
  let primaryCount = 0;
  const result = await withModelFallback(async model => {
    calls.push(model);
    if (model === 'primary') {
      primaryCount += 1;
      const error = new Error('busy');
      error.status = 503;
      throw error;
    }
    return { answer: 'ok' };
  }, {
    models: ['primary', 'fallback'],
    maxRetries: 2,
    baseDelayMs: 100,
    sleep: async ms => delays.push(ms),
    random: () => 0,
  });

  assert.deepEqual(calls, ['primary', 'primary', 'fallback']);
  assert.deepEqual(delays, [100]);
  assert.equal(primaryCount, 2);
  assert.equal(result.model, 'fallback');
  assert.equal(result.attempts, 3);
  assert.deepEqual(result.value, { answer: 'ok' });
});


test('never exceeds three upstream calls per logical stage, even with many fallback models', async () => {
  const calls = [];
  const result = await withModelFallback(async model => {
    calls.push(model);
    if (model !== 'fallback-a') {
      const error = new Error('temporarily overloaded');
      error.status = 503;
      throw error;
    }
    return { answer: 'ok' };
  }, {
    models: ['primary', 'fallback-a', 'fallback-b', 'fallback-c'],
    maxRetries: 5,
    sleep: noWait,
  });
  assert.deepEqual(calls, ['primary', 'primary', 'fallback-a']);
  assert.equal(result.attempts, 3);
});

test('does not retry configuration/client errors', async () => {
  let calls = 0;
  await assert.rejects(() => withModelFallback(async () => {
    calls += 1;
    const error = new Error('invalid model');
    error.status = 404;
    throw error;
  }, { models: ['primary', 'fallback'], sleep: noWait }), /configuração do provedor Gemini/i);
  assert.equal(calls, 1);
});

test('returns a controlled unavailable error after all transient failures', async () => {
  let calls = 0;
  await assert.rejects(() => withModelFallback(async () => {
    calls += 1;
    const error = new Error('overloaded');
    error.status = 503;
    throw error;
  }, { models: ['primary', 'fallback'], maxRetries: 1, sleep: noWait }), error => {
    assert.ok(error instanceof AIProviderUnavailableError);
    assert.equal(error.code, 'AI_TEMPORARILY_UNAVAILABLE');
    assert.deepEqual(error.attemptedModels, ['primary', 'primary', 'fallback']);
    assert.equal(error.attempts, 3);
    return true;
  });
  assert.equal(calls, 3);
});
