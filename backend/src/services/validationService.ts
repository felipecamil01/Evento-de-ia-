export interface LayoutElement {
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: string;
}

export function validateLayout(elements: LayoutElement[], CW: number, CH: number) {
  const issues: string[] = [];
  const M = 38;

  // 1. Sobreposição entre elementos da mesma camada
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i], b = elements[j];
      if (a.layer === b.layer &&
          a.x < b.x + b.w && a.x + a.w > b.x &&
          a.y < b.y + b.h && a.y + a.h > b.y) {
        issues.push(`"${a.label}" está sobrepondo "${b.label}"`);
      }
    }
  }

  // 2. Elementos fora dos limites do espaço
  elements.forEach(el => {
    if (el.x < M || el.y < M || el.x + el.w > CW - M || el.y + el.h > CH - M) {
      issues.push(`"${el.label}" está fora dos limites do espaço`);
    }
  });

  // 3. Buffet próximo demais da entrada
  const buffets = elements.filter(e => e.type === 'buffet');
  const entradas = elements.filter(e => e.type === 'entrada');
  buffets.forEach(b => entradas.forEach(en => {
    if (Math.hypot(b.x - en.x, b.y - en.y) < 150) {
      issues.push('Buffet muito próximo da entrada (mínimo 150px recomendado)');
    }
  }));

  // 4. Pista de dança bloqueada por mesas
  const pista = elements.find(e => e.type === 'pista_danca');
  const mesas = elements.filter(e => e.type === 'mesa_redonda' || e.type === 'mesa_retangular');
  if (pista) {
    mesas.forEach(m => {
      const overlap = m.x < pista.x + pista.w && m.x + m.w > pista.x &&
                      m.y < pista.y + pista.h && m.y + m.h > pista.y;
      if (overlap) issues.push(`"${m.label}" está bloqueando a pista de dança`);
    });
  }

  return { passed: issues.length === 0, issues };
}
