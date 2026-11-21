/* Papeles y tinta personales. Las claves antiguas siguen perteneciendo a su folio. */
(() => {
  const guardado = window.guardadoDiario || window.localStorage;
  'use strict';
  const libro = document.querySelector('#libro');
  if (!libro) return;
  const barra = document.querySelector('.barra-lectura');
  const paleta = barra.querySelector('.paleta');
  const indice = libro.querySelector('.pestanas-personales');
  const aplicarTinta = paleta.querySelector('[data-aplicar-tinta]');
  const aviso = document.querySelector('.aviso-lector');
  // Mantiene la clave de las anotaciones cuando el HTML pasa de la raíz a diarios/.
  const rutaDiario = location.pathname.replace(/\/diarios\/([^/]+\/manual\.html)$/, '/$1');
  const prefijo = 'diario:margen:1:' + rutaDiario + ':';
  const registros = new Map(), papeles = new Map(), enlaces = new Map(), sucias = new Set();
  const colores = ['miel','rosa','menta','azul'];
  const claveColor = 'diario:tinta:color';
  let tinta = 'miel', ultimoAviso, seleccionPrevia, arrastre;
  try { const elegida = guardado.getItem(claveColor); if (colores.includes(elegida)) tinta = elegida; } catch {}
  const folios = new Map(Array.from(libro.querySelectorAll('article.hoja'), h => [h.id,h]));
  const visibles = () => Array.from(folios.values()).filter(h => !h.hidden);
  const permite = (h,t) => h && h.dataset.herramientas.split(' ').includes(t);
  const limitar = n => Math.max(0,Math.min(1,n));
  function decir(texto) {
    aviso.textContent = texto; aviso.hidden = false;
    clearTimeout(ultimoAviso); ultimoAviso = setTimeout(()=>{aviso.hidden = true;},2800);
  }
  const pasados=[], futuros=[];
  const deshacer=barra.querySelector('[data-historial="deshacer"]'), rehacer=barra.querySelector('[data-historial="rehacer"]');
  function actualizarHistorial() {
    if(deshacer)deshacer.disabled=!pasados.length;
    if(rehacer)rehacer.disabled=!futuros.length;
  }
  function escribir(k,r) {
    try {
      if (r) guardado.setItem(k, JSON.stringify(r)); else guardado.removeItem(k);
    } catch { decir('El navegador no pudo guardar el cambio.'); return false; }
    if (r) registros.set(k,r); else registros.delete(k);
    return true;
  }
  function guardar(k,r,edicion=null) {
    const antes=registros.get(k) ?? null;
    if(JSON.stringify(antes)===JSON.stringify(r))return true;
    if(!escribir(k,r))return false;
    const ultimo=pasados.at(-1), ahora=performance.now();
    if(edicion && ultimo?.edicion===edicion && ultimo.k===k && ahora-ultimo.t<1000 && !futuros.length){
      ultimo.despues=r; ultimo.t=ahora;
      if(JSON.stringify(ultimo.antes)===JSON.stringify(r))pasados.pop();
    } else {
      pasados.push({k,antes,despues:r,edicion,t:ahora});
      if(pasados.length>100)pasados.shift();
    }
    futuros.length=0; actualizarHistorial(); return true;
  }
  function reflejar(k,antes,r) {
    const hoja=folios.get((r || antes).hoja);
    if((r || antes).tipo==='subrayado'){
      if(hoja.hidden)sucias.add(hoja.id);else pintar(hoja);
    } else if(r){
      ficha(k,r);
      if(!hoja.hidden || papeles.has(k))mostrarPapel(k,r);
    } else {
      papeles.get(k)?.remove();papeles.delete(k);
      enlaces.get(k)?.remove();enlaces.delete(k);indice.hidden=!enlaces.size;
    }
  }
  function recorrerHistorial(accion) {
    const atras=accion==='deshacer';
    const origen=atras?pasados:futuros, destino=atras?futuros:pasados;
    const cambio=origen.at(-1);
    if(!cambio)return;
    const previo=atras?cambio.despues:cambio.antes, nuevo=atras?cambio.antes:cambio.despues;
    try {
      if(JSON.stringify(previo)!==JSON.stringify(interpretar(guardado.getItem(cambio.k)))){
        decir('La anotación cambió en otra pestaña.');return;
      }
    } catch { decir('El navegador no pudo leer la anotación.');return; }
    if(!escribir(cambio.k,nuevo))return;
    cambio.edicion=null; origen.pop();destino.push(cambio);actualizarHistorial();
    reflejar(cambio.k,previo,nuevo);
    const num=folios.get((nuevo || previo).hoja).querySelector('.folio').textContent;
    decir((atras?'Deshecho':'Rehecho')+' · Página '+num);
  }
  const nuevaClave = () => prefijo + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2));
  function interpretar(valor) {
    try {
      const r = JSON.parse(valor);
      if (r && folios.has(r.hoja) && typeof r.texto === 'string' && ['nota','posit','subrayado'].includes(r.tipo)) return r;
    } catch {}
    return null;
  }
  function ficha(k,r) {
    const h = folios.get(r.hoja);
    const titulo = (r.texto.trim() || 'Pósit').split('\n')[0];
    let a = enlaces.get(k);
    if (!a) {
      a = document.createElement('a');
      a.href = '#' + h.id;
      a.addEventListener('click', e => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
        requestAnimationFrame(()=>{
          const p = papeles.get(k);
          if (!p) return;
          p.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
          p.querySelector('textarea').focus({preventScroll:true});
        });
      });
      const numero=Number(h.querySelector('.folio').textContent);
      a.dataset.folio=numero;
      const siguiente=Array.from(indice.children).find(tab=>Number(tab.dataset.folio)>numero);
      enlaces.set(k,a); indice.insertBefore(a,siguiente || null);
    }
    const num = h.querySelector('.folio').textContent;
    a.textContent = num; a.title = 'Página ' + num + ' · ' + titulo;
    a.setAttribute('aria-label',a.title); indice.hidden = false;
  }
  function boton(texto,icono) {
    const b = document.createElement('button'); b.type = 'button'; b.title = texto; b.setAttribute('aria-label',texto);
    b.textContent = icono; return b;
  }
  // x e y expresan la fracción del recorrido disponible dentro del contenido del folio.
  // La traslación porcentual del papel descuenta su propio tamaño y mantiene los bordes dentro del folio.
  function colocar(p,x,y) {
    p.style.left = 100*x+'%'; p.style.top = 100*y+'%';
    p.style.transform = 'translate('+(-100*x)+'%,'+(-100*y)+'%)';
  }
  function limites(capa,p) {
    const c = capa.getBoundingClientRect();
    return {x:c.left,y:c.top,ancho:Math.max(1,c.width-p.offsetWidth),alto:Math.max(1,c.height-p.offsetHeight)};
  }
  function punto(c,clientX,clientY,agarreX=0,agarreY=0) {
    return {x:limitar((clientX-c.x-agarreX)/c.ancho),y:limitar((clientY-c.y-agarreY)/c.alto)};
  }
  function retirar(k) {
    if (!guardar(k,null)) return;
    papeles.get(k)?.remove(); papeles.delete(k);
    enlaces.get(k)?.remove(); enlaces.delete(k); indice.hidden = !enlaces.size;
  }
  function mostrarPapel(k,r) {
    const h = folios.get(r.hoja), capa = h.querySelector('.papeles');
    let p = papeles.get(k);
    if (!p) {
      p = document.createElement('aside'); p.className = 'adhesivo';
      const cab = document.createElement('div'); cab.className = 'banda-adhesiva';
      const asa = boton('Mover pósit','⠿'); asa.className = 'asa-adhesiva'; asa.dataset.mover = '';
      const quitar = boton('Quitar pósit','×'); quitar.addEventListener('click',()=>retirar(k));
      const area = document.createElement('textarea');
      area.placeholder = 'Escribe aquí…'; area.setAttribute('aria-label','Texto del pósit'); area.spellcheck = true;
      let edicion;
      area.addEventListener('focus',()=>{edicion=Symbol();});
      area.addEventListener('input',()=>{
        const previo = registros.get(k);
        if (!previo) return;
        const nuevo = {...previo,tipo:'posit',texto:area.value};
        if (guardar(k,nuevo,edicion)) ficha(k,nuevo);
      });
      asa.addEventListener('pointerdown',e=>{
        if (e.button !== 0 || !e.isPrimary) return;
        e.preventDefault(); const b = p.getBoundingClientRect();
        arrastre = {id:e.pointerId,k,p,limites:limites(capa,p),dx:e.clientX-b.left,dy:e.clientY-b.top};
        asa.setPointerCapture(e.pointerId);
      });
      asa.addEventListener('pointermove',e=>{
        if (arrastre?.id !== e.pointerId || arrastre.k !== k) return;
        const g=arrastre;
        g.pos = punto(g.limites,e.clientX,e.clientY,g.dx,g.dy);
        if(!g.cuadro)g.cuadro=requestAnimationFrame(()=>{g.cuadro=0;colocar(p,g.pos.x,g.pos.y);});
      });
      function soltar(e) {
        if (arrastre?.id !== e.pointerId || arrastre.k !== k) return;
        const pos = arrastre.pos; cancelAnimationFrame(arrastre.cuadro);arrastre = null;
        const anterior = registros.get(k);
        if (!anterior) return;
        if (e.type === 'pointerup' && pos && guardar(k,{...anterior,...pos,tipo:'posit'})) {colocar(p,pos.x,pos.y);return;}
        mostrarPapel(k,anterior);
      }
      for (const ev of ['pointerup','pointercancel','lostpointercapture']) asa.addEventListener(ev,soltar);
      asa.addEventListener('keydown',e=>{
        const delta = {ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]}[e.key];
        if (!delta) return; e.preventDefault();e.stopPropagation();
        const v = registros.get(k);
        const x = limitar((Number.parseFloat(p.style.left)/100)+delta[0]);
        const y = limitar((Number.parseFloat(p.style.top)/100)+delta[1]);
        if (guardar(k,{...v,x,y,tipo:'posit'})) colocar(p,x,y);
      });
      cab.append(asa,quitar); p.append(cab,area); capa.append(p); papeles.set(k,p);
    }
    const orden = Array.prototype.indexOf.call(capa.children,p);
    colocar(p,Number.isFinite(r.x)?limitar(r.x):.14+(orden%3)*.18,Number.isFinite(r.y)?limitar(r.y):.08+(orden%5)*.14);
    const area = p.querySelector('textarea');
    if (area.value !== r.texto) area.value = r.texto;
    return p;
  }
  function pegar(h,x,y) {
    const k = nuevaClave(), r = {tipo:'posit',hoja:h.id,texto:'',x:0,y:0};
    const p = mostrarPapel(k,r);
    Object.assign(r,punto(limites(p.parentElement,p),x,y,10,10));
    if (!guardar(k,r)) {p.remove();papeles.delete(k);return;}
    colocar(p,r.x,r.y);ficha(k,r);p.classList.add('recien-pegado');aviso.hidden=true;
    p.querySelector('textarea').focus({preventScroll:true});
  }

  // Las marcas se indexan exclusivamente sobre el texto del autor. El texto privado no desplaza sus anclajes.
  function mapa(h) {
    const root = h.querySelector('.texto-folio');
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n) {
      return n.parentElement.closest('svg,button,input,select,textarea,[data-sim],[data-contador-estados],[data-checks-de],[data-continuar]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }});
    const tramos=[]; let texto='', n;
    while ((n=walker.nextNode())) {tramos.push({n,i:texto.length});texto+=n.data;}
    return {texto,tramos};
  }
  function seleccion() {
    const s = getSelection(); if (!s?.rangeCount || s.isCollapsed) return null;
    const range = s.getRangeAt(0), anc = range.commonAncestorContainer;
    const root = (anc.nodeType===1?anc:anc.parentElement)?.closest('.texto-folio');
    if (!root) return null;
    const h = root.closest('article');
    if (!permite(h,'subrayado') || h.hidden) return null;
    const m = mapa(h); let a,b;
    for (const {n,i} of m.tramos) {
      if (!range.intersectsNode(n)) continue;
      const inicio = n===range.startContainer?range.startOffset:0, fin = n===range.endContainer?range.endOffset:n.length;
      if (fin<=inicio) continue; a ??= i+inicio;b=i+fin;
    }
    if (a==null || !m.texto.slice(a,b).trim()) return null;
    return {tipo:'subrayado',hoja:h.id,inicio:a,texto:m.texto.slice(a,b)};
  }
  function pintar(h) {
    const root = h.querySelector('.texto-folio');
    for (const m of root.querySelectorAll('mark.trazo-personal')) { const parent=m.parentNode;m.replaceWith(...m.childNodes);parent.normalize(); }
    const marcas = Array.from(registros).filter(([,r])=>r.hoja===h.id && r.tipo==='subrayado' && r.texto)
      .sort((a,b)=>(a[1].orden || 0)-(b[1].orden || 0));
    if (!marcas.length) return;
    const {texto,tramos} = mapa(h);
    for (const [k,r] of marcas) {
      let a = r.inicio;
      if (!Number.isInteger(a) || texto.slice(a,a+r.texto.length)!==r.texto) {
        a=texto.indexOf(r.texto);if(a<0 || a!==texto.lastIndexOf(r.texto))continue;
      }
      const b=a+r.texto.length;
      for (const tramo of tramos) {
        if (tramo.i>=b)break;
        const desde=Math.max(0,a-tramo.i), hasta=Math.min(tramo.n.length,b-tramo.i);
        if (hasta<=desde)continue;
        (tramo.marcas ||= []).push({desde,hasta,k,color:colores.includes(r.color)?r.color:'miel'});
      }
    }
    for(const {n,marcas:m} of tramos) {
      if(!m)continue;
      const cortes=[...new Set([0,n.length,...m.flatMap(v=>[v.desde,v.hasta])])].sort((a,b)=>a-b);
      const frag=document.createDocumentFragment();
      for(let i=1;i<cortes.length;i++){
        const a=cortes[i-1],b=cortes[i], t=n.data.slice(a,b);
        const v=m.findLast(x=>x.desde<=a && x.hasta>=b);
        if(!v){frag.append(t);continue;}
        const marca=document.createElement('mark');marca.className='trazo-personal';marca.dataset.tinta=v.color;
        marca.dataset.clave=v.k;marca.textContent=t;frag.append(marca);
      }
      n.replaceWith(frag);
    }
  }
  function subrayar(r) {
    if(!r)return false;
    const h=folios.get(r.hoja);
    if(!h || h.hidden)return false;
    const previo=Array.from(registros).find(([,v])=>v.tipo==='subrayado' && v.hoja===r.hoja && v.inicio===r.inicio && v.texto===r.texto);
    if(!guardar(previo?.[0]||nuevaClave(),{...r,color:tinta,orden:previo ? (previo[1].orden || 0) : Date.now()}))return false;
    getSelection().removeAllRanges();pintar(h);seleccionPrevia=null;return true;
  }
  function modo(t) {
    libro.dataset.modo=t;
    barra.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));
    paleta.hidden=t!=='subrayado';
    for(const h of visibles()) h.querySelector('.texto-folio').tabIndex=t==='posit' && permite(h,'posit')?0:-1;
  }
  function pagina() {
    const vs=visibles();
    for(const t of ['subrayado','posit'])barra.querySelector('[data-tool="'+t+'"]').disabled=!vs.some(h=>permite(h,t));
    if(!vs.some(h=>permite(h,libro.dataset.modo)))modo('mano');else modo(libro.dataset.modo);
    for(const h of vs) {
      if(sucias.delete(h.id))pintar(h);
      for(const [k,r] of registros)if(r.hoja===h.id && r.tipo!=='subrayado' && !papeles.has(k))mostrarPapel(k,r);
    }
    seleccionPrevia=null;
  }
  function elegir(c) {
    tinta=c;
    paleta.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===c)));
    try{guardado.setItem(claveColor,c);}catch{}
  }
  barra.addEventListener('pointerdown',()=>{seleccionPrevia=seleccion()||seleccionPrevia;});
  barra.addEventListener('mousedown',e=>{if(libro.dataset.modo==='subrayado')e.preventDefault();});
  function activar(b){
    if(!b || b.disabled)return;
    if(b.dataset.historial){recorrerHistorial(b.dataset.historial);return;}
    if(b===aplicarTinta){subrayar(seleccion()||seleccionPrevia);return;}
    if(b.dataset.color){elegir(b.dataset.color);subrayar(seleccion()||seleccionPrevia);return;}
    const t=b.dataset.tool;if(!t)return;
    modo(t);
    if(t==='posit')decir('Pulsa la página donde quieras pegar el pósit.');
    if(t==='subrayado')subrayar(seleccion()||seleccionPrevia);
    else getSelection().removeAllRanges();
    seleccionPrevia=null;
  }
  let toque, ultimoToque;
  document.addEventListener('selectionchange',()=>{
    aplicarTinta.hidden=libro.dataset.modo!=='subrayado' || !matchMedia('(pointer:coarse)').matches ||
      !getSelection()?.anchorNode?.parentElement?.closest('.texto-folio') || getSelection().isCollapsed;
  });
  barra.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')toque={b:e.target.closest('button'),x:e.clientX,y:e.clientY,id:e.pointerId};
  });
  barra.addEventListener('pointercancel',()=>{toque=null;});
  barra.addEventListener('pointerup',e=>{
    if(toque?.id!==e.pointerId)return;
    const t=toque;toque=null;
    if(t.b && Math.hypot(e.clientX-t.x,e.clientY-t.y)<9){
      ultimoToque={b:t.b,t:performance.now()};activar(t.b);
    }
  });
  barra.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(e.detail && ultimoToque && performance.now()-ultimoToque.t<500){ultimoToque=null;return;}
    activar(b);
  });
  libro.addEventListener('pointerdown',()=>{seleccionPrevia=null;});
  libro.addEventListener('pointerup',e=>{
    if(libro.dataset.modo==='subrayado' && e.pointerType!=='touch' && !e.target.closest('.adhesivo'))
      requestAnimationFrame(()=>subrayar(seleccion()));
  });
  libro.addEventListener('click',e=>{
    const t=libro.dataset.modo, el=e.target;
    if(t==='subrayado' && !getSelection().toString()) {
      const marca=el.closest('mark.trazo-personal');
      if(marca && guardar(marca.dataset.clave,null)){e.preventDefault();pintar(marca.closest('article'));}
    }
    const h=el.closest('article.hoja');
    if(t==='posit' && permite(h,t) && el.closest('.hoja-in') && !el.closest('.adhesivo,.lienzo.ampliado,button,input,select,textarea,label')){
      e.preventDefault();e.stopPropagation();pegar(h,e.clientX,e.clientY);
    }
  });
  libro.addEventListener('keydown',e=>{
    if(e.key==='Enter' && libro.dataset.modo==='posit' && e.target.matches('.texto-folio')){
      const box=e.target.closest('.hoja-in').getBoundingClientRect();e.preventDefault();pegar(e.target.closest('article'),box.left+box.width*.35,box.top+box.height*.3);
    }
  });
  window.addEventListener('keydown',e=>{
    if((e.ctrlKey || e.metaKey) && !e.altKey && !e.isComposing && !e.defaultPrevented){
      const textoAjeno=e.target.closest?.('input:not([type=checkbox]),select,textarea,[contenteditable=true]');
      const tecla=e.key.toLowerCase();
      if(!textoAjeno || textoAjeno.closest('.adhesivo')){
        const atras=tecla==='z' && !e.shiftKey;
        const adelante=(tecla==='z' && e.shiftKey) || (!e.shiftKey && (tecla==='r' || tecla==='y'));
        if(atras || adelante){e.preventDefault();recorrerHistorial(atras?'deshacer':'rehacer');return;}
      }
    }
    if(e.key==='Escape' && e.target.closest('.adhesivo')){e.target.blur();modo('mano');}
    if(e.key==='Tab' && libro.dataset.modo==='subrayado')seleccionPrevia=seleccion()||seleccionPrevia;
  });
  function cargar() {
    try{
      for(let i=0;i<guardado.length;i++){
        const k=guardado.key(i);if(!k?.startsWith(prefijo))continue;
        const r=interpretar(guardado.getItem(k));if(!r)continue;
        registros.set(k,r);
        if(r.tipo==='subrayado')sucias.add(r.hoja);else ficha(k,r);
      }
    }catch{}
  }
  window.addEventListener('storage',e=>{
    if(e.key && !e.key.startsWith(prefijo))return;
    for(const pila of [pasados,futuros]){
      for(let i=pila.length-1;i>=0;i--)if(!e.key || pila[i].k===e.key)pila.splice(i,1);
    }
    actualizarHistorial();
    if(!e.key){
      for(const p of papeles.values())p.remove();papeles.clear();enlaces.clear();indice.replaceChildren();indice.hidden=true;
      for(const r of registros.values())if(r.tipo==='subrayado')sucias.add(r.hoja);
      registros.clear();cargar();pagina();return;
    }
    const anterior=registros.get(e.key),r=interpretar(e.newValue);
    if(r)registros.set(e.key,r);else registros.delete(e.key);
    if(r || anterior)reflejar(e.key,anterior,r);
  });
  cargar();elegir(tinta);pagina();libro.addEventListener('pagina',pagina);
})();
