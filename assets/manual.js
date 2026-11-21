/* Diarios de proyecto · el libro (hojas lineales, 1 o 2 columnas), simuladores y marcas de lectura. Sin dependencias.
   No hay pestañas ni submenús: cada hoja se lee de arriba abajo y se pasa con botones, teclado o deslizando. */
(function () {
  const guardado = window.guardadoDiario || window.localStorage;
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var movimiento = matchMedia('(prefers-reduced-motion: reduce)');
  var base = 'diario:' + location.pathname.split('/').slice(-2).join('/') + ':';

  function leerJSON(id) {
    var el = document.getElementById(id);
    try { return el ? JSON.parse(el.textContent) : {}; } catch (e) { console.error('JSON inválido en #' + id, e); return {}; }
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function guardar(k, v) { try { guardado.setItem(base + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  function cargar(k) { try { return JSON.parse(guardado.getItem(base + k) || 'null'); } catch (e) { return null; } }

  var ICONOS = leerJSON('datos-iconos');
  function icono(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[n] || '') + '</svg>'; }

  // ───────── copiar comandos ─────────
  function copiar(texto, boton) {
    function listo() { boton.textContent = '✓ Copiado'; boton.classList.add('ok'); setTimeout(function () { boton.textContent = 'Copiar'; boton.classList.remove('ok'); }, 1600); }
    function plan() {
      var ta = document.createElement('textarea'); ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); listo(); } catch (e) { /* nada */ } document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(listo, plan); else plan();
  }
  $$('[data-copiar]').forEach(function (b) {
    b.addEventListener('click', function () { var pre = $('pre', b.closest('.cmd')); if (pre) copiar(pre.textContent, b); });
  });

  // ───────── marcas «listo cuando…» (se conservan en este navegador) ─────────
  var marcas = cargar('marcas') || {};
  function resumenMarcas() {
    $$('[data-checks-de]').forEach(function (el) {
      var cap = el.getAttribute('data-checks-de'), cajas = $$('.hoja[data-cap="' + cap + '"] [data-ck]');
      var hechas = cajas.filter(function (c) { return c.checked; }).length;
      el.textContent = cajas.length ? 'Marcaste ' + hechas + ' de ' + cajas.length + ' comprobaciones de este capítulo.' : '';
    });
  }
  $$('[data-ck]').forEach(function (c) {
    c.checked = !!marcas[c.getAttribute('data-ck')];
    c.addEventListener('change', function () { marcas[c.getAttribute('data-ck')] = c.checked; guardar('marcas', marcas); resumenMarcas(); });
  });
  $$('[data-reiniciar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cap = b.getAttribute('data-reiniciar');
      $$('.hoja[data-cap="' + cap + '"] [data-ck]').forEach(function (c) { c.checked = false; delete marcas[c.getAttribute('data-ck')]; });
      guardar('marcas', marcas); resumenMarcas();
    });
  });
  resumenMarcas();

  // ───────── diagramas: pasar el cursor por la leyenda resalta el nodo ─────────
  $$('.fig').forEach(function (f) {
    const lienzo=$('.lienzo',f), svg=lienzo?.querySelector('svg');
    if(svg){
      const boton=document.createElement('button');
      boton.type='button'; boton.className='escala-diagrama';
      boton.textContent='Ampliar diagrama'; boton.setAttribute('aria-pressed','false');
      lienzo.after(boton);
      lienzo.style.setProperty('--ancho-detalle',svg.viewBox.baseVal.width+'px');
      lienzo.setAttribute('role','region');lienzo.setAttribute('aria-label','Detalle del diagrama');
      function cambiarEscala(){
        const ampliar=lienzo.classList.toggle('ampliado');
        boton.setAttribute('aria-pressed',String(ampliar));boton.textContent=ampliar?'Ajustar a la página':'Ampliar diagrama';
        if(ampliar){lienzo.tabIndex=0;lienzo.focus({preventScroll:true});}
        else {lienzo.removeAttribute('tabindex');lienzo.scrollTo(0,0);}
      }
      boton.addEventListener('click',cambiarEscala);
      let primerToque;
      boton.addEventListener('touchstart',e=>{primerToque=e.touches.length===1?e.touches[0]:null;},{passive:true});
      boton.addEventListener('touchcancel',()=>{primerToque=null;});
      boton.addEventListener('touchend',e=>{
        const fin=e.changedTouches[0],inicio=primerToque;primerToque=null;
        if(!inicio || e.touches.length || Math.hypot(fin.clientX-inicio.clientX,fin.clientY-inicio.clientY)>8)return;
        e.preventDefault();cambiarEscala();
      },{passive:false});
      let agarre;
      lienzo.addEventListener('pointerdown',e=>{
        if(e.pointerType!=='mouse' || e.button!==0 || !lienzo.classList.contains('ampliado'))return;
        agarre={id:e.pointerId,x:e.clientX,y:e.clientY,left:lienzo.scrollLeft,top:lienzo.scrollTop};
        lienzo.setPointerCapture(e.pointerId);e.preventDefault();
      });
      lienzo.addEventListener('pointermove',e=>{
        if(agarre?.id===e.pointerId)lienzo.scrollTo(agarre.left+agarre.x-e.clientX,agarre.top+agarre.y-e.clientY);
      });
      lienzo.addEventListener('lostpointercapture',()=>{agarre=null;});
    }
    $$('.ln li[data-nodo]', f).forEach(function (li) {
      var n = $('.nodo[data-nodo="' + li.getAttribute('data-nodo') + '"]', f);
      if (!n) return;
      function on(v) { n.classList.toggle('sel', v); li.classList.toggle('sel', v); }
      li.addEventListener('mouseenter', function () { on(true); }); li.addEventListener('mouseleave', function () { on(false); });
      n.addEventListener('mouseenter', function () { on(true); }); n.addEventListener('mouseleave', function () { on(false); });
    });
  });

  // ───────── simulador de etapas ─────────
  var SIMS = leerJSON('datos-simuladores');
  $$('[data-sim]').forEach(function (cont) {
    var cfg = SIMS[cont.getAttribute('data-sim')]; if (!cfg) return;
    var et = cfg.etapas, token = 0;
    var opciones = '<option value="-1">Sin fallas</option>' + et.map(function (e, i) { return '<option value="' + i + '">Falla en: ' + esc(e.t) + '</option>'; }).join('');
    cont.innerHTML =
      '<div class="sim-barra"><button class="btn solido" type="button" data-play>▶ Reproducir</button><button class="btn suave" type="button" data-reset>↺ Reiniciar</button><span class="espacio"></span>' +
      '<label>Probar qué pasa si…<select data-falla>' + opciones + '</select></label></div>' +
      '<div class="tubo">' + et.map(function (e, i) {
        return '<button type="button" class="etapa" data-e="' + i + '"><span class="linea"></span><span class="bola">' + icono(e.i) + '</span><b>' + esc(e.t) + '</b><small>' + esc(e.s) + '</small></button>';
      }).join('') + '</div><div class="sim-msg" aria-live="polite"><b>Pulsa «Reproducir»</b>Verás cómo avanza el flujo etapa por etapa. Con «Probar qué pasa si…» simulas una falla y ves cómo reacciona el sistema. También puedes tocar cualquier etapa para leer qué hace.</div>';
    var msg = $('.sim-msg', cont), nodos = $$('.etapa', cont), btn = $('[data-play]', cont);
    function texto(cl, t, d) { msg.className = 'sim-msg ' + (cl || ''); msg.innerHTML = '<b>' + t + '</b>' + d; }
    function limpiar() { nodos.forEach(function (n) { n.className = 'etapa'; }); }
    function esperar(ms) { return new Promise(function (r) { setTimeout(r, movimiento.matches ? 60 : ms); }); }
    function reset() { token++; limpiar(); btn.disabled = false; btn.textContent = '▶ Reproducir'; texto('', 'Pulsa «Reproducir»', 'Verás cómo avanza el flujo etapa por etapa.'); }
    async function correr() {
      var mi = ++token; limpiar(); btn.disabled = true; btn.textContent = 'En curso…';
      var f = +$('[data-falla]', cont).value;
      for (var i = 0; i < et.length; i++) {
        if (mi !== token) return;
        nodos[i].classList.add('corre'); texto('', (i + 1) + '. ' + esc(et[i].t) + '…', et[i].d);
        await esperar(1500); if (mi !== token) return;
        nodos[i].classList.remove('corre');
        if (i === f) { nodos[i].classList.add('falla'); texto('mal', 'Falla en «' + esc(et[i].t) + '»', et[i].falla || ''); btn.disabled = false; btn.textContent = '▶ Reproducir de nuevo'; return; }
        nodos[i].classList.add('hecha');
      }
      texto('bien', '✓ ' + esc(cfg.exitoT || 'Terminó bien'), cfg.exito || ''); btn.disabled = false; btn.textContent = '▶ Reproducir de nuevo';
    }
    btn.addEventListener('click', correr);
    $('[data-reset]', cont).addEventListener('click', reset);
    nodos.forEach(function (n, i) { n.style.cursor = 'pointer'; n.addEventListener('click', function () { if (btn.disabled) return; texto('', esc(et[i].t), et[i].d); }); });
    cont.__detener = function () { token++; if (btn.disabled) { limpiar(); btn.disabled = false; btn.textContent = '▶ Reproducir'; } };
  });

  // ───────── contadores de estado ─────────
  function contadores(h) {
    var cont = $('[data-contador-estados]', h);
    if (!cont) return;
    ['ok', 'pend', 'no'].forEach(function (k) {
      var n = $$('.est.' + k, h).length, el = $('[data-n="' + k + '"]', cont);
      if (!el) return;
      el.textContent = n;
    });
  }

  // ───────── el libro ─────────
  var libro = $('#libro');
  if (!libro) return;
  var cont = $('#hojas'), hojas = $$('.hoja', libro), N = hojas.length;
  var pantallaDoble = matchMedia('(min-width: 1000px)');
  const posicion = $('.posicion'), continuar = $('[data-continuar]');
  const vuelta = $('.vuelta', libro), fondo = $('.fondo-giro', libro);
  const indices = new Map(hojas.map((h,i)=>[h.id,i]));
  let visibles = hojas.filter(h => !h.hidden);
  let actual = 0, comienzo = -1, cantidad = 0, gesto, animacion, cuadro, ignorarClic = false;
  const porId = id => indices.get(id) ?? -1;
  function dibujar(destino) {
    const paso = pantallaDoble.matches ? 2 : 1, inicio = destino - destino % paso;
    const siguientes = hojas.slice(inicio,inicio+paso);
    for (const h of visibles) {
      if (siguientes.includes(h)) continue;
      $$('[data-sim]',h).forEach(s=>s.__detener?.());
      h.hidden = true;
    }
    siguientes.forEach((h,i)=>{
      if (h.hidden) {h.hidden=false; $('.hoja-in',h).scrollTop=0;}
      h.dataset.lado = siguientes.length===1 ? 'unica' : i===0 ? 'izquierda' : 'derecha';
      $('[data-prev]',h).disabled = inicio===0;
      $('[data-next]',h).disabled = inicio+paso>=N;
      contadores(h);
    });
    visibles=siguientes; comienzo=inicio; cantidad=paso; actual=destino;
    libro.dataset.pagina=hojas[destino].id;
    libro.dataset.impar=String(paso===2 && inicio+1===N);
    libro.dispatchEvent(new Event('pagina'));
    const fin=Math.min(N,inicio+paso);
    posicion.textContent=fin===inicio+1 ? 'Página '+fin+' de '+N : 'Páginas '+(inicio+1)+'–'+fin+' de '+N;
    const retomar=porId(cargar('ultima'));
    continuar.hidden=retomar<2;
    if(retomar>=2){continuar.href='#'+hojas[retomar].id;continuar.textContent='Retomar en la página '+(retomar+1);}
  }
  // Las dos caras se preparan una vez. Durante el arrastre solo cambia la transformación de la hoja.
  function cara(hoja,lado,clase) {
    const copia=document.createElement('div');
    copia.className='hoja cara-giro '+clase;
    copia.dataset.lado=lado;
    if(!hoja)return copia;
    copia.dataset.columnas=hoja.dataset.columnas;
    for(const hijo of hoja.children)copia.append(hijo.cloneNode(true));
    // Cada diagrama mantiene referencias propias durante el giro.
    const ids=new Map();
    for(const el of copia.querySelectorAll('[id]')){
      const viejo=el.id;el.id='giro-'+clase+'-'+viejo;ids.set(viejo,el.id);
    }
    for(const el of copia.querySelectorAll('use,[marker-end],[fill^="url("],[clip-path]')){
      for(const attr of [...el.attributes]){
        const v=attr.value.replace(/#([^()\s]+)/g,(m,id)=>ids.has(id)?'#'+ids.get(id):m);
        if(v!==attr.value)el.setAttributeNS(attr.namespaceURI,attr.name,v);
      }
    }
    return copia;
  }
  function limpiarGiro(){
    cancelAnimationFrame(cuadro);cuadro=0;
    if(animacion){animacion.onfinish=null;animacion.cancel();animacion=null;}
    vuelta.hidden=true;fondo.hidden=true;
    vuelta.replaceChildren();fondo.replaceChildren();
    vuelta.style.transform='';
  }
  function preparar(inicio,dir){
    limpiarGiro();
    if(movimiento.matches || !vuelta.animate)return;
    const doble=cantidad===2, adelante=dir===1;
    const lado=adelante?'derecha':'izquierda';
    const frente=hojas[comienzo+(doble&&adelante?1:0)];
    const dorso=hojas[inicio+(doble&&!adelante?1:0)];
    const debajo=hojas[inicio+(doble&&adelante?1:0)];
    const anverso=cara(frente,doble?lado:'unica','anverso');
    vuelta.dataset.lado=fondo.dataset.lado=lado;
    vuelta.append(anverso,cara(dorso,doble?(adelante?'izquierda':'derecha'):'unica','reverso'));
    fondo.append(cara(debajo,doble?lado:'unica','debajo'));
    if(doble){
      const quieta=hojas[comienzo+(adelante?0:1)];
      const papel=cara(quieta,adelante?'izquierda':'derecha','quieta');
      fondo.append(papel);
      if(quieta)papel.dataset.desplazamiento=$('.hoja-in',quieta).scrollTop;
    }
    vuelta.hidden=fondo.hidden=false;
    const fija=$('.quieta[data-desplazamiento]',fondo);
    if(fija)$('.hoja-in',fija).scrollTop=Number(fija.dataset.desplazamiento);
    if(frente)$('.hoja-in',anverso).scrollTop=$('.hoja-in',frente).scrollTop;
    vuelta.style.transform=pose(0,dir);
  }
  function pose(p,dir){return 'perspective(1900px) rotateY('+(-180*p*dir)+'deg)';}
  function aplicar(destino,historial){
    if(!historial && destino!==actual){
      try{history.pushState(null,'','#'+hojas[destino].id);}catch{location.hash=hojas[destino].id;}
    }
    if(destino>1)guardar('ultima',hojas[destino].id);
    dibujar(destino);
    $('.hoja-in',hojas[destino]).scrollTop=0;
    $('h1,h2',hojas[destino])?.focus({preventScroll:true});
    window.scrollTo(0,0);
  }
  function completar(p,dir,confirmar){
    cancelAnimationFrame(cuadro);cuadro=0;
    if(vuelta.hidden || movimiento.matches){limpiarGiro();return;}
    const fin=confirmar?1:0;
    animacion=vuelta.animate([{transform:pose(p,dir)},{transform:pose(fin,dir)}],{
      duration:120+Math.abs(fin-p)*290,easing:'cubic-bezier(.22,.64,.25,1)',fill:'both'
    });
    animacion.onfinish=limpiarGiro;
  }
  function ir(destino,historial=false){
    if(destino<0 || destino>=N)return;
    if(gesto)soltar(null,false);
    const inicio=destino-destino%cantidad, dir=Math.sign(inicio-comienzo);
    if(dir)preparar(inicio,dir);else limpiarGiro();
    aplicar(destino,historial);
    if(dir)completar(0,dir,true);
  }
  const inicial=Math.max(0,porId(location.hash.slice(1)));
  if(inicial>1)guardar('ultima',hojas[inicial].id);
  dibujar(inicial);
  pantallaDoble.addEventListener('change',()=>{soltar(null,false);limpiarGiro();dibujar(actual);});
  movimiento.addEventListener('change',()=>{soltar(null,false);limpiarGiro();});
  window.addEventListener('hashchange',()=>ir(porId(location.hash.slice(1)||'portada'),true));
  // Sobre el papel se conserva el scroll nativo. Los márgenes desplazan el folio debajo.
  libro.addEventListener('wheel',e=>{
    if(e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented ||
       !e.deltaY || Math.abs(e.deltaX)>Math.abs(e.deltaY) ||
       e.target.closest('.hoja-in,.pestanas-personales,select,input,textarea'))return;
    const h=e.target.closest('article.hoja') || hojas[actual];
    const cuerpo=$('.hoja-in',h);
    e.preventDefault();
    const unidad=e.deltaMode===1?16:e.deltaMode===2?cuerpo.clientHeight:1;
    cuerpo.scrollTop+=e.deltaY*unidad;
  },{passive:false});
  document.addEventListener('click',e=>{
    if(e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
    const b=e.target.closest('[data-prev],[data-next],[data-ir],a[href^="#"]');
    if(!b)return;
    const i=b.hasAttribute('data-prev')?comienzo-cantidad:b.hasAttribute('data-next')?comienzo+cantidad:porId((b.dataset.ir||b.hash||'').slice(1));
    if(i<0 || i>=N)return;
    e.preventDefault();ir(i);
  });
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.target.closest('input,textarea,select,.adhesivo,.lienzo.ampliado') || getSelection()?.toString())return;
    if(e.key==='ArrowRight' || e.key==='ArrowLeft'){e.preventDefault();ir(comienzo+cantidad*(e.key==='ArrowRight'?1:-1));}
  });
  libro.addEventListener('click',e=>{
    if(ignorarClic && e.detail){ignorarClic=false;e.preventDefault();e.stopImmediatePropagation();}
  },true);
  libro.addEventListener('dragstart',e=>{if(libro.dataset.modo==='mano')e.preventDefault();});
  libro.addEventListener('pointerdown',e=>{
    ignorarClic=false;
    if(gesto || libro.dataset.modo!=='mano' || !e.isPrimary || e.button!==0 || e.target.closest('.adhesivo,.pestanas-personales,.lienzo.ampliado,.escala-diagrama,input,select,textarea'))return;
    const hoja=e.target.closest('article.hoja') ||
      (visibles[1] && e.clientX>=visibles[1].getBoundingClientRect().left ? visibles[1] : visibles[0]);
    const cuerpo=$('.hoja-in',hoja);
    gesto={id:e.pointerId,x:e.clientX,y:e.clientY,ancho:cont.clientWidth/cantidad,dir:0,p:0,t:performance.now(),
      cuerpo,scrollInicial:cuerpo.scrollTop,vertical:false};
  });
  window.addEventListener('pointermove',e=>{
    const g=gesto;
    if(!g || g.id!==e.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.dir && !g.vertical && Math.abs(dy)>7 && Math.abs(dy)>Math.abs(dx)){
      g.vertical=true;
      libro.setPointerCapture(g.id);libro.classList.add('arrastrando');
    }
    if(g.vertical){
      g.cuerpo.scrollTop=g.scrollInicial+dy;
      return;
    }
    if(!g.dir){
      if(Math.abs(dx)<6 || Math.abs(dx)<Math.abs(dy)*1.1)return;
      g.dir=dx<0?1:-1;g.destino=comienzo+cantidad*g.dir;
      if(g.destino<0 || g.destino>=N){gesto=null;return;}
      libro.setPointerCapture(g.id);libro.classList.add('arrastrando');
      preparar(g.destino,g.dir);
    }
    g.p=Math.max(0,Math.min(.99,-dx*g.dir/g.ancho));
    if(!vuelta.hidden && !cuadro)cuadro=requestAnimationFrame(()=>{cuadro=0;vuelta.style.transform=pose(g.p,g.dir);});
  });
  function soltar(e,confirmar){
    const g=gesto;if(!g || (e && g.id!==e.pointerId))return;
    gesto=null;
    if(libro.hasPointerCapture(g.id))libro.releasePointerCapture(g.id);
    libro.classList.remove('arrastrando');
    if(g.vertical){ignorarClic=true;return;}
    if(!g.dir)return;
    ignorarClic=true;
    const ok=confirmar && (g.p>=.16 || (g.p*g.ancho>30 && performance.now()-g.t<280));
    if(ok)aplicar(g.destino,false);
    completar(g.p,g.dir,ok);
  }
  window.addEventListener('pointerup',e=>soltar(e,true));
  window.addEventListener('pointercancel',e=>soltar(e,false));
  libro.addEventListener('lostpointercapture',e=>{if(e.target===libro)soltar(e,false);});
  window.addEventListener('blur',()=>soltar(null,false));
})();

