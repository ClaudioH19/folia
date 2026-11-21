// Diagramas declarativos: el agente describe nodos en una cuadrícula y enlaces entre ids; el motor calcula coordenadas,
// rutas con codos, numeración y leyenda. No hay que escribir SVG a mano.
export const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CLASE = { caja: 'caja', app: 'azul', dato: 'verde', secreto: 'ambar', oscuro: 'rojo' };
export const TIPOS_NODO = Object.keys(CLASE);
export const TIPOS_ENLACE = ['trafico', 'flujo', 'punteado'];
const LEYENDA_TIPOS = { app: 'Hachurado: aplicación', dato: 'Gris: datos y respaldos', secreto: 'Punteado: secretos o claves', caja: 'Blanco: infraestructura', oscuro: 'Negro: destino crítico' };
const LEYENDA_ENLACES = { trafico: 'Línea fina: tráfico o consulta', flujo: 'Línea gruesa: despliegue, copia o flujo de datos', punteado: 'Punteada: relación indirecta' };

export function renderDiagrama(cfg, idBase) {
  const { nodos = [], enlaces = [], zonas = [], colW = 176, rowH = 62, gapX = 62, gapY = 40 } = cfg;
  if (!nodos.length) throw new Error('diagrama sin nodos');
  const ids = new Set();
  nodos.forEach((n) => {
    if (!n.id || ids.has(n.id)) throw new Error(`diagrama: id de nodo repetido o vacío (${n.id})`);
    if (!TIPOS_NODO.includes(n.tipo || 'caja')) throw new Error(`diagrama: tipo de nodo «${n.tipo}» no existe. Usa: ${TIPOS_NODO.join(', ')}`);
    ids.add(n.id);
  });
  enlaces.forEach((e) => { if (!ids.has(e.de) || !ids.has(e.a)) throw new Error(`diagrama: enlace con nodo inexistente (${e.de} → ${e.a})`); if (e.tipo && !TIPOS_ENLACE.includes(e.tipo)) throw new Error(`diagrama: tipo de enlace «${e.tipo}» no existe. Usa: ${TIPOS_ENLACE.join(', ')}`); });

  const conZonas = zonas.length > 0;
  const mx = conZonas ? 28 : 14, mt = conZonas ? 40 : 14, mb = conZonas ? 28 : 14;
  const ncols = Math.max(...nodos.map((n) => n.c + (n.cs || 1)));
  const nfilas = Math.max(...nodos.map((n) => n.f + (n.fs || 1)));
  const W = mx * 2 + ncols * colW + (ncols - 1) * gapX;
  const H = mt + mb + nfilas * rowH + (nfilas - 1) * gapY;

  const pos = {};
  nodos.forEach((n) => {
    const cs = n.cs || 1, fs = n.fs || 1;
    pos[n.id] = { x: mx + n.c * (colW + gapX), y: mt + n.f * (rowH + gapY), w: cs * colW + (cs - 1) * gapX, h: fs * rowH + (fs - 1) * gapY };
  });

  // lados de cada enlace
  const lado = (a, b, forz) => {
    if (forz) return forz;
    const dx = b.x + b.w / 2 - (a.x + a.w / 2), dy = b.y + b.h / 2 - (a.y + a.h / 2);
    if (Math.abs(dx) * 0.62 >= Math.abs(dy)) return dx >= 0 ? 'der' : 'izq';
    return dy >= 0 ? 'aba' : 'arr';
  };
  const opuesto = { der: 'izq', izq: 'der', aba: 'arr', arr: 'aba' };
  const es = enlaces.map((e) => {
    const a = pos[e.de], b = pos[e.a];
    const s1 = lado(a, b, e.desde), s2 = e.hacia || opuesto[s1];
    return { ...e, s1, s2 };
  });
  const grupos = {};
  es.forEach((e, i) => { (grupos[`${e.de}|${e.s1}`] ||= []).push([i, 'o']); (grupos[`${e.a}|${e.s2}`] ||= []).push([i, 'd']); });
  const ancla = (id, side, k, n) => {
    const p = pos[id], fr = (k + 1) / (n + 1);
    if (side === 'der') return [p.x + p.w, p.y + p.h * fr];
    if (side === 'izq') return [p.x, p.y + p.h * fr];
    if (side === 'aba') return [p.x + p.w * fr, p.y + p.h];
    return [p.x + p.w * fr, p.y];
  };
  es.forEach((e, i) => {
    const go = grupos[`${e.de}|${e.s1}`], gd = grupos[`${e.a}|${e.s2}`];
    e.p1 = ancla(e.de, e.s1, go.findIndex((g) => g[0] === i && g[1] === 'o'), go.length);
    e.p2 = ancla(e.a, e.s2, gd.findIndex((g) => g[0] === i && g[1] === 'd'), gd.length);
    const [x1, y1] = e.p1, [x2, y2] = e.p2;
    let dpath, len;
    if (e.s1 === 'der' || e.s1 === 'izq') {
      if (Math.abs(y1 - y2) < 2) { dpath = `M${x1},${y1} H${x2}`; len = Math.abs(x2 - x1); }
      else { const xm = (x1 + x2) / 2; dpath = `M${x1},${y1} H${xm} V${y2} H${x2}`; len = Math.abs(xm - x1) + Math.abs(y2 - y1) + Math.abs(x2 - xm); }
    } else if (Math.abs(x1 - x2) < 2) { dpath = `M${x1},${y1} V${y2}`; len = Math.abs(y2 - y1); }
    else { const ym = (y1 + y2) / 2; dpath = `M${x1},${y1} V${ym} H${x2} V${y2}`; len = Math.abs(ym - y1) + Math.abs(x2 - x1) + Math.abs(y2 - ym); }
    e.d = dpath; e.len = len;
  });

  // zonas
  const zsvg = zonas.map((z) => {
    const ps = z.nodos.map((id) => { if (!pos[id]) throw new Error(`diagrama: zona con nodo inexistente (${id})`); return pos[id]; });
    const x0 = Math.min(...ps.map((p) => p.x)) - 14, y0 = Math.min(...ps.map((p) => p.y)) - 26;
    const x1 = Math.max(...ps.map((p) => p.x + p.w)) + 14, y1 = Math.max(...ps.map((p) => p.y + p.h)) + 14;
    return `<rect class="zona" x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="12"/><text class="s" x="${x0 + 12}" y="${y0 + 17}">${esc(z.t)}</text>`;
  }).join('');

  const cables = es.map((e, i) => `<path id="${idBase}-e${i}" class="cable flujo ${e.tipo === 'flujo' ? 'v' : e.tipo === 'punteado' ? 'r' : ''}" d="${e.d}"/>`).join('');
  const etiquetas = es.map((e) => {
    if (!e.etiqueta) return '';
    const mxl = (e.p1[0] + e.p2[0]) / 2, myl = (e.p1[1] + e.p2[1]) / 2;
    return `<text class="s etq" x="${mxl}" y="${myl - 6}" text-anchor="middle">${esc(e.etiqueta)}</text>`;
  }).join('');
  let num = 0;
  const numerados = [];
  const nsvg = nodos.map((n) => {
    const p = pos[n.id], t = n.tipo || 'caja';
    const ls = n.ls || [];
    const total = 1 + ls.length, ini = p.y + (p.h - total * 16) / 2 + 12.5, cx = p.x + p.w / 2;
    const maxCh = Math.floor(p.w / 6.1);
    [n.t, ...ls].forEach((x) => { if (String(x).length > maxCh) console.warn(`  ⚠ diagrama: «${x}» (${String(x).length} car.) puede no caber en un nodo de ${p.w}px; acórtalo o usa cs:2.`); });
    const txt = `<text class="t${t === 'oscuro' ? ' claro' : ''}" x="${cx}" y="${ini}" text-anchor="middle">${esc(n.t)}</text>` + ls.map((l, i) => `<text class="s${t === 'oscuro' ? ' claro' : ''}" x="${cx}" y="${ini + 16 * (i + 1)}" text-anchor="middle">${esc(l)}</text>`).join('');
    let badge = '';
    if (n.info) { num += 1; numerados.push({ n: num, t: n.t, info: n.info, id: n.id }); badge = `<g class="nb"><circle cx="${p.x + 4}" cy="${p.y + 4}" r="9.5"/><text x="${p.x + 4}" y="${p.y + 7.6}" text-anchor="middle">${num}</text></g>`; }
    return `<g class="nodo" data-nodo="${n.id}"><rect class="${CLASE[t]}" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="8"/>${txt}${badge}</g>`;
  }).join('');
  const svg = `<svg style="--ancho-diagrama:${W}px" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${idBase}-t"><title id="${idBase}-t">${esc(cfg.alt || cfg.pie || 'Diagrama')}</title>${zsvg}${cables}${etiquetas}${nsvg}</svg>`;

  // leyenda: nodos numerados + estilos usados
  const tiposUsados = [...new Set(nodos.map((n) => n.tipo || 'caja'))].filter((t) => t !== 'caja' || nodos.some((n) => !n.tipo));
  const enlUsados = [...new Set(es.map((e) => e.tipo || 'trafico'))];
  const estilos = [
    ...enlUsados.map((k) => `<li class="le l-${k}">${esc((cfg.leyenda && cfg.leyenda[k]) || LEYENDA_ENLACES[k])}</li>`),
    ...tiposUsados.map((k) => `<li class="le sw sw-${k}">${esc((cfg.leyenda && cfg.leyenda[k]) || LEYENDA_TIPOS[k])}</li>`),
  ].join('');
  const nodosLey = numerados.map((x) => `<li data-nodo="${x.id}"><b>${x.n}. ${esc(x.t)}</b> ${esc(x.info)}</li>`).join('');
  return { svg, leyenda: `${nodosLey ? `<ol class="ln">${nodosLey}</ol>` : ''}<ul class="ls">${estilos}</ul>` };
}
