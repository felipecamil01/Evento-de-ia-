const { test } = require('node:test');
const assert = require('node:assert/strict');

let releaseAI;
let aiStarted = false;
let aiCalls = 0;
const aiGate = new Promise(resolve => { releaseAI = resolve; });
const fakePrisma = {
  event: {
    findFirst: async ({ where }) => ({ id: where.id, userId: where.userId, type: 'WEDDING', guestCount: 100 }),
  },
  briefing: {
    create: async () => ({ id: 'briefing-test-id' }),
  },
};

require.cache[require.resolve('@prisma/client')] = {
  id: require.resolve('@prisma/client'),
  filename: require.resolve('@prisma/client'),
  loaded: true,
  exports: { PrismaClient: class { constructor() { return fakePrisma; } } },
};
const aiPath = require.resolve('../dist/services/aiService');
require.cache[aiPath] = {
  id: aiPath,
  filename: aiPath,
  loaded: true,
  exports: {
    processBriefingWithAI: async () => {
      aiCalls += 1;
      aiStarted = true;
      await aiGate;
      return { structured: {}, processingTimeMs: 10, modelName: 'mock-model' };
    },
  },
};
const { processBriefing } = require('../dist/controllers/briefingController');

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const request = () => ({
  user: { userId: 'same-user' },
  body: { eventId: 'event-1', rawText: 'Casamento para 100 convidados com mesas e pista.', mode: 'new', canvasW: 800, canvasH: 500, elements: [] },
});

test('rejects a second concurrent generation for the same user', async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-only-not-real';
  try {
    const firstResponse = makeResponse();
    const first = processBriefing(request(), firstResponse);
    for (let i = 0; i < 20 && !aiStarted; i += 1) await new Promise(resolve => setImmediate(resolve));
    assert.equal(aiStarted, true, 'first request should have reached mocked AI');

    const secondResponse = makeResponse();
    await processBriefing(request(), secondResponse);
    assert.equal(secondResponse.statusCode, 409);
    assert.equal(secondResponse.body.code, 'AI_GENERATION_ALREADY_RUNNING');
    assert.equal(aiCalls, 1, 'second request must not invoke AI');

    releaseAI();
    await first;
    assert.equal(firstResponse.statusCode, 200);
  } finally {
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});
