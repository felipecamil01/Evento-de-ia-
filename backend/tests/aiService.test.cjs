const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildLayoutInstruction,
  buildLayoutRequestData,
  parseBriefingExtraction,
} = require('../dist/services/aiService');

test('accepts structured briefing text returned as a string', () => {
  const result = parseBriefingExtraction({
    briefing_estruturado: 'Casamento para 80 convidados com buffet lateral.',
    num_convidados: 80,
    requisitos: ['buffet lateral'],
    pendencias: [],
  });

  assert.equal(result.briefing_estruturado, 'Casamento para 80 convidados com buffet lateral.');
});

test('normalizes a JSON object returned in the structured briefing field', () => {
  const result = parseBriefingExtraction({
    briefing_estruturado: {
      resumo: 'Casamento para 80 convidados.',
      estilo: 'clássico',
    },
    num_convidados: 80,
    requisitos: ['buffet lateral'],
    pendencias: [],
  });

  assert.equal(result.briefing_estruturado, JSON.stringify({
    resumo: 'Casamento para 80 convidados.',
    estilo: 'clássico',
  }, null, 2));
});

test('improve mode tells Gemini to preserve existing elements and IDs', () => {
  const instruction = buildLayoutInstruction({ canvasW: 1200, canvasH: 700, mode: 'improve' });
  const currentElements = [{
    id: 'table-1',
    type: 'mesa_redonda',
    label: 'Mesa 1',
    x: 100,
    y: 120,
    w: 80,
    h: 80,
    layer: 'mobiliario',
    order: 0,
  }];
  const request = buildLayoutRequestData('Adicione espaço para dança.', 'Casamento.', {
    mode: 'improve',
    elements: currentElements,
  });

  assert.match(instruction, /MODO MELHORAR/);
  assert.match(instruction, /preserve todos os elementos existentes e seus IDs/);
  assert.deepEqual(request.elementos_atuais, currentElements);
});

test('new layout mode does not include existing elements as improvement context', () => {
  const request = buildLayoutRequestData('Novo layout.', 'Casamento.', {
    mode: 'new',
    elements: [],
  });

  assert.equal('elementos_atuais' in request, false);
});
