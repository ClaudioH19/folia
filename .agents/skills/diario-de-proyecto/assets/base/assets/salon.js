/* Sala de lectura. Geometría y texturas locales; los libros proceden del índice de la colección. */
(() => {
  const T=window.Sala3D, escenario=document.querySelector('.escenario-sala');
  if(!escenario)return;
  const mueble=escenario.closest('.mueble'), lienzo=escenario.querySelector('canvas');
  const enlaces=Array.from(mueble.querySelectorAll('.acceso-libros a'));
  const entrada=escenario.querySelector('.entrada-sala'), visor=mueble.querySelector('.diario-en-sala');
  const acceso=mueble.querySelector('.acceso-libros'), botonSonido=mueble.querySelector('.sonido-sala');
  const etiqueta=escenario.querySelector('.titulo-lomo');
  const abrir=etiqueta.querySelector('.abrir-lomo'), titulo=etiqueta.querySelector('strong'), detalle=etiqueta.querySelector('.nombre-manual');
  const quieto=matchMedia('(prefers-reduced-motion:reduce)');
  function mostrarAccesoDirecto(){
    mueble.dataset.salon='alternativa';
    escenario.hidden=true;
    acceso.inert=false;
  }
  if(!T){mostrarAccesoDirecto();return;}
  let motor;
  try{
    motor=new T.WebGLRenderer({canvas:lienzo,alpha:true,antialias:true,powerPreference:'low-power'});
  }catch{mostrarAccesoDirecto();return;}
  const sala=new T.Scene(), muebles=new T.Group(), biblioteca=new T.Group(), libros=[];
  sala.add(muebles,biblioteca);
  const camara=new T.PerspectiveCamera(65,1,.05,34);
  motor.setPixelRatio(Math.min(devicePixelRatio || 1,1.65));
  motor.outputColorSpace=T.SRGBColorSpace;
  motor.toneMapping=T.ACESFilmicToneMapping;motor.toneMappingExposure=1.18;
  motor.shadowMap.enabled=true;motor.shadowMap.type=T.PCFSoftShadowMap;
  motor.shadowMap.autoUpdate=false;motor.shadowMap.needsUpdate=true;
  const cache=new Map(), cajaUnidad=new T.BoxGeometry(1,1,1), TAU=2*Math.PI;
  let semilla=4591;
  const animarAmbiente=[];
  function azar(){semilla=(Math.imul(1664525,semilla)+1013904223)>>>0;return semilla/4294967296;}
  function mate(color){
    if(typeof color!=='string')return color;
    if(!cache.has(color))cache.set(color,new T.MeshStandardMaterial({color,roughness:.83}));
    return cache.get(color);
  }
  function luz(color){return new T.MeshBasicMaterial({color,toneMapped:false});}
  const oro=new T.MeshStandardMaterial({color:'#c09855',roughness:.42,metalness:.45});
  function grupo(p,x,y,z,angulo=0){const g=new T.Group();p.add(g);g.position.set(x,y,z);g.rotation.y=angulo;return g;}
  function pieza(p,geo,material,x,y,z){
    const mesh=new T.Mesh(geo,mate(material));mesh.position.set(x,y,z);
    mesh.castShadow=mesh.receiveShadow=true;p.add(mesh);return mesh;
  }
  function caja(p,x,y,z,a,h,f,m,r=0){
    if(r)return pieza(p,new T.RoundedBoxGeometry(a,h,f,2,r),m,x,y,z);
    const obj=pieza(p,cajaUnidad,m,x,y,z);obj.scale.set(a,h,f);return obj;
  }
  function cilindro(p,x,y,z,arriba,abajo,h,m,n=24){
    return pieza(p,new T.CylinderGeometry(arriba,abajo,h,n),m,x,y,z);
  }
  const esferaUnidad=new T.SphereGeometry(1,12,8);
  function ovalo(p,x,y,z,a,h,f,m){
    const obj=pieza(p,esferaUnidad,m,x,y,z);obj.scale.set(a,h,f);return obj;
  }
  function vara(p,a,b,radio,m,n=8){
    const desde=new T.Vector3(...a),hasta=new T.Vector3(...b),d=hasta.clone().sub(desde);
    const v=cilindro(p,0,0,0,radio,radio,d.length(),m,n);
    v.position.copy(desde).lerp(hasta,.5);v.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return v;
  }
  function textura(w,h,pintar){
    const c=document.createElement('canvas');c.width=w;c.height=h;pintar(c.getContext('2d'),w,h);
    const mapa=new T.CanvasTexture(c);mapa.colorSpace=T.SRGBColorSpace;mapa.anisotropy=4;return mapa;
  }
  // Conservar los dos lienzos pequeños y reutilizarlos durante toda la visita.
  function texturaAnimada(w,h,dibujar){
    const mapa=textura(w,h,c=>dibujar(c,0));
    const ctx=mapa.image.getContext('2d');
    mapa.generateMipmaps=false;mapa.minFilter=mapa.magFilter;
    animarAmbiente.push(t=>{dibujar(ctx,t);mapa.needsUpdate=true;});
    return mapa;
  }
  function tejido(){
    return textura(768,512,(c,w,h)=>{
      c.fillStyle='#923e35';c.fillRect(0,0,w,h);
      for(const [d,color,grosor] of [[10,'#d7b582',7],[22,'#393f34',13],[36,'#cea76e',4],[51,'#5f302c',15],[62,'#dec495',3]]){
        c.strokeStyle=color;c.lineWidth=grosor;c.strokeRect(d,d,w-2*d,h-2*d);
      }
      function rombo(x,y,a,b,color){c.fillStyle=color;c.beginPath();c.moveTo(x-a,y);c.lineTo(x,y-b);c.lineTo(x+a,y);c.lineTo(x,y+b);c.closePath();c.fill();}
      for(let y=94;y<h-68;y+=54)for(let x=87+(Math.round(y/54)%2)*24;x<w-65;x+=50)rombo(x,y,7,10,'#c29b64');
      for(const x of [181,384,587]){
        rombo(x,256,100,136,'#dec08b');rombo(x,256,93,128,'#454a3d');rombo(x,256,68,98,'#bd8654');
        rombo(x,256,56,83,'#833e34');rombo(x,256,34,51,'#d8b780');rombo(x,256,20,29,'#495044');
      }
      for(let i=0;i<h;i+=3){c.fillStyle=i%2?'#271a1315':'#f3d7ab17';c.fillRect(0,i,w,1);}
    });
  }
  function plano(p,x,y,z,a,h,material){
    return pieza(p,new T.PlaneGeometry(a,h),material,x,y,z);
  }
  const nogal='#634535', moldura='#855f43', borde='#a57b51', pared='#526c5b', panel='#344b40';
  function habitacion(){
    caja(muebles,0,-.29,0,11.18,.46,7.18,'#392e28',.1);
    caja(muebles,0,-.105,0,11.12,.09,7.12,borde,.025);
    const tonos=['#967650','#987456','#a3825c','#8b6c4e','#a07d58'];
    for(let fila=0;fila<12;fila++){
      let x=-5.5;
      while(x<5.49){const ancho=Math.min(11/3*(.63+azar()*.65),5.5-x);
        caja(muebles,x+ancho/2,-.045,-3.5+(fila+.5)*7/12,ancho-.008,.09,7/12-.008,tonos[Math.floor(azar()*tonos.length)]);x+=ancho;}
    }
    for(const signo of [-1,1]){
      caja(muebles,0,2.06,signo*3.52,11.1,4.12,.16,pared);caja(muebles,signo*5.51,2.06,0,.16,4.12,7.15,pared);
    }
    caja(muebles,0,4.21,0,11.2,.16,7.2,'#c5b69b');
    for(const x of [-4.4,-2.2,0,2.2,4.4])caja(muebles,x,4.08,0,.12,.11,6.92,'#967e62');
    for(const [y,h,d,mat] of [[.5,.98,.15,panel],[.12,.16,.24,'#263c32'],[1.05,.11,.21,'#797f65'],[3.98,.15,.22,'#8b8b70'],[4.12,.12,.27,'#ab9877']]){
      for(const signo of [-1,1]){
        caja(muebles,0,y,signo*3.41,11.15,h,d,mat);caja(muebles,signo*5.41,y,0,d,h,7.12,mat);
      }
    }
    for(const signo of [-1,1]){
      for(let x=-5.22;x<5.48;x+=.78)caja(muebles,x,.56,signo*3.30,.045,.78,.035,'#65745f');
      for(let z=-3.25;z<3.48;z+=.78)caja(muebles,signo*5.29,.56,z,.035,.78,.045,'#65745f');
    }
    const puerta=grupo(muebles,2.7,0,3.27,Math.PI);
    caja(puerta,0,1.30,0,1.60,2.60,.15,moldura);
    caja(puerta,0,1.26,.09,1.40,2.49,.09,nogal);
    for(const y of [.67,1.84])for(const x of [-.33,.33]){
      caja(puerta,x,y,.148,.54,.96,.045,borde);caja(puerta,x,y,.183,.47,.87,.035,nogal);
    }
    ovalo(puerta,.55,1.08,.22,.07,.07,.085,oro);
    const cuadro=grupo(muebles,5.35,2.28,.78,-Math.PI/2);
    caja(cuadro,0,0,0,1.90,1.19,.11,nogal);caja(cuadro,0,0,.06,1.80,1.09,.035,oro);
    const bosque=textura(384,216,(c,w,h)=>{
      const cielo=c.createLinearGradient(0,0,0,h);cielo.addColorStop(0,'#405b66');cielo.addColorStop(1,'#eacaa1');
      c.fillStyle=cielo;c.fillRect(0,0,w,h);c.fillStyle='#eddbad';c.beginPath();c.arc(273,53,18,0,TAU);c.fill();
      for(let i=0;i<3;i++){c.fillStyle=['#77867a','#536b60','#344e43'][i];c.beginPath();c.moveTo(0,h);
        for(let x=0;x<=w;x+=8)c.lineTo(x,98+24*i+Math.sin(x/57+i*2)*22+Math.sin(x/34+i)*9);
        c.lineTo(w,h);c.fill();}
    });
    plano(cuadro,0,0,.083,1.69,.98,new T.MeshStandardMaterial({map:bosque}));
    for(const x of [-5.51,5.51])caja(muebles,x,2.02,-3.48,.16,4.12,.23,moldura);
    caja(muebles,-5.48,2.02,3.5,.23,4.12,.16,moldura);
    const alfombra=plano(muebles,.35,.016,.85,6.55,3.36,new T.MeshStandardMaterial({map:tejido(),roughness:1}));alfombra.rotation.x=-Math.PI/2;
    for(const lado of [-1,1])for(let i=0;i<33;i++)caja(muebles,.35+lado*3.31,.02,-.77+i*.1,.10,.012,.026,'#dfc393');
  }
  function ventana(){
    const v=grupo(muebles,-5.34,2.48,-.32,Math.PI/2);
    const noche=textura(480,280,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#162737');g.addColorStop(1,'#6b8a9c');c.fillStyle=g;c.fillRect(0,0,w,h);
      for(let i=0;i<22;i++){c.fillStyle='#becfce';c.fillRect(azar()*w,azar()*h*.42,1,1);}
      c.fillStyle='#ffe9b5';c.beginPath();c.arc(345,60,22,0,TAU);c.fill();
      for(let i=0;i<22;i++){const x=i*26,y=170+azar()*78;c.fillStyle=i%2?'#344e56':'#2b454d';c.beginPath();c.moveTo(x-20,h);c.lineTo(x,y-33);c.lineTo(x+21,h);c.fill();}
      c.fillStyle='#bdccca';c.beginPath();c.moveTo(0,h);c.quadraticCurveTo(125,214,249,251);c.quadraticCurveTo(370,226,w,242);c.lineTo(w,h);c.fill();
    });
    const paisaje=noche.image;noche.dispose();
    const copos=Array.from({length:85},()=>{
      const profundidad=.25+.75*azar();
      return {x:azar()*480,y:azar()*280,ritmo:11+profundidad*32,radio:.8+profundidad*1.5,fase:azar()*TAU,alfa:.32+.59*profundidad};
    });
    const nevada=texturaAnimada(480,280,(c,t)=>{
      c.drawImage(paisaje,0,0);c.fillStyle='#f2f6f5';
      for(const copo of copos){
        const x=(copo.x+t*copo.ritmo*.16+7*Math.sin(t*.68+copo.fase)+480)%488-4;
        const y=(copo.y+t*copo.ritmo)%288-4;
        c.globalAlpha=copo.alfa;c.beginPath();c.arc(x,y,copo.radio,0,TAU);c.fill();
      }
      c.globalAlpha=1;
    });
    caja(v,0,0,0,3.18,1.92,.12,nogal);
    plano(v,0,0,.073,2.98,1.72,new T.MeshBasicMaterial({map:nevada}));
    for(const x of [-1.54,0,1.54])caja(v,x,0,.115,.07,1.88,.09,'#c5b797');
    for(const y of [-.90,.02,.90])caja(v,0,y,.115,3.12,.065,.09,'#c5b797');
    caja(v,0,-1,.14,3.38,.10,.3,borde);
  }
  function estanteria(){
    biblioteca.position.set(-2.85,0,-2.98);
    const w=3.62;
    caja(biblioteca,0,1.64,-.25,w,3.2,.12,'#614a34');
    for(const x of [-w/2,w/2])caja(biblioteca,x,1.64,0,.13,3.22,.70,nogal,.025);
    for(const y of [.20,1.19,2.18,3.20]){
      caja(biblioteca,0,y,0,w+.12,.095,.70,moldura);
      caja(biblioteca,0,y-.04,.365,w+.13,.065,.045,borde);
    }
    caja(biblioteca,0,.12,0,w+.23,.20,.85,nogal,.035);
    caja(biblioteca,0,3.31,0,w+.30,.14,.86,borde,.035);
    caja(biblioteca,0,3.39,-.01,w+.15,.055,.76,nogal);
    const pieles=['#7d4034','#375749','#485368','#79583b','#634257','#455c56'];
    enlaces.forEach((a,i)=>{
      const h=.85-(i%3)*.044, ancho=.33, color=pieles[i%6], x=-1.51+(i%6)*.535,y=2.23-Math.floor(i/6)*.99;
      const libro=grupo(biblioteca,x,y,.03,-.045);
      caja(libro,0,h/2,.016,ancho-.04,h-.035,.48,'#d5bf96');
      for(const k of [-1,1])caja(libro,k*ancho/2,h/2,0,.027,h,.56,color);
      caja(libro,0,h/2,.281,ancho+.02,h,.055,color,.021);
      const nombre=a.textContent;
      const mapa=textura(192,512,(c,w,al)=>{
        c.fillStyle=color;c.fillRect(0,0,w,al);c.strokeStyle='#d3b77d';c.lineWidth=3;
        for(const y of [25,33,al-26,al-34]){c.beginPath();c.moveTo(6,y);c.lineTo(w-6,y);c.stroke();}
        c.translate(w/2,al/2);c.rotate(-Math.PI/2);c.fillStyle='#f7dfac';c.textAlign='center';c.textBaseline='middle';c.font='bold 39px Georgia';c.fillText(nombre,0,0,al-92);
      });
      const cara=new T.MeshStandardMaterial({map:mapa,roughness:.74,emissive:'#e3ad51',emissiveIntensity:0});
      plano(libro,0,h/2,.312,ancho-.01,h-.025,cara);
      const marco=grupo(libro,0,h/2,.314), dorado=luz('#ffe2a0');
      for(const lado of [-1,1]){
        caja(marco,lado*ancho*.5,0,0,.016,h+.013,.012,dorado);
        caja(marco,0,lado*h*.5,0,ancho+.015,.016,.012,dorado);
      }
      marco.visible=false;libro.userData.marco=marco;libro.userData.cara=cara;
      // El hueco original también responde cuando el libro sobresale.
      const hueco=caja(biblioteca,x,y+h/2,.33,ancho+.04,h,.04,color);
      hueco.visible=false;hueco.userData.libro=libro;
      libro.userData.enlace=a;libro.userData.alto=h;libros.push(libro);
    });
  }
  function sofa(){
    const s=grupo(muebles,-3.85,0,1.24,Math.PI/2);
    for(const x of [-1.45,1.45])for(const z of [-.51,.54])cilindro(s,x,.14,z,.09,.07,.27,nogal,8);
    caja(s,0,.38,0,3.42,.45,1.35,'#743e36',.10);
    caja(s,0,.93,-.56,3.25,1.20,.38,'#965446',.17).rotation.x=-.09;
    for(const x of [-.98,0,.98]){
      caja(s,x,.69,.09,.95,.25,1.03,'#ac6954',.10);
      caja(s,x,1.11,-.34,.97,.75,.23,'#a36051',.11).rotation.x=-.13;
      ovalo(s,x,1.16,-.195,.035,.035,.018,'#855142');
    }
    for(const x of [-1.58,1.58])caja(s,x,.76,.03,.37,.75,1.44,'#9b5645',.16);
    const cojin=caja(s,-1.14,1.03,-.06,.64,.61,.19,'#415e4d',.095);cojin.rotation.z=.27;cojin.rotation.x=-.23;
    const manta=caja(s,1.14,.85,.22,.49,.036,.91,'#dccbb0',.013);
    caja(s,manta.position.x,.63,.681,.49,.42,.036,'#d6c3a3');
    for(const x of [.98,1.02,1.25,1.29]){caja(s,x,.873,.22,.022,.014,.91,'#78564a');caja(s,x,.63,.704,.022,.42,.016,'#78564a');}
  }
  function lampara(){
    const p=grupo(muebles,-4.12,0,-1.28);
    cilindro(p,0,.09,0,.29,.34,.15,nogal);cilindro(p,0,.18,0,.22,.26,.07,oro);
    cilindro(p,0,1.15,0,.037,.048,1.94,oro);
    ovalo(p,0,1.88,0,.12,.17,.12,'#927049');
    const pantalla=new T.MeshStandardMaterial({color:'#f2cc8e',emissive:'#f4a650',emissiveIntensity:.48,roughness:.8,side:T.DoubleSide});
    cilindro(p,0,2.23,0,.32,.53,.62,pantalla,24);
    for(let i=0;i<24;i++){const a=i*TAU/24;vara(p,[.53*Math.cos(a),1.92,.53*Math.sin(a)],[.32*Math.cos(a),2.54,.32*Math.sin(a)],.006,'#d9ac70',5);}
    cilindro(p,0,1.92,0,.54,.54,.026,oro);cilindro(p,0,2.55,0,.33,.33,.024,oro);
    ovalo(p,0,2.61,0,.045,.068,.045,oro);
    const bombilla=new T.PointLight('#ffd798',13,7,2);bombilla.position.set(-4.08,2.04,-1.05);sala.add(bombilla);
    animarAmbiente.push(t=>{
      const ondulacion=Math.sin(t*1.3)*.7+Math.sin(t*.76)*.3;
      bombilla.intensity=13+ondulacion*.9;pantalla.emissiveIntensity=.48+ondulacion*.045;
    });
  }
  function mesa(){
    const p=grupo(muebles,-.46,0,1.08,-.14);
    for(const x of [-.92,.92])for(const z of [-.41,.41])vara(p,[x,.09,z],[x*.92,.58,z*.9],.053,nogal);
    caja(p,0,.58,0,2.30,.15,1.14,moldura,.10);
    cilindro(p,.36,.684,-.07,.30,.23,.048,'#ced0af');
    for(const [x,z] of [[.23,-.13],[.45,-.14],[.35,.035]]){
      cilindro(p,x,.732,z,.098,.10,.05,'#b57643',12);
      for(const [dx,dz] of [[-.032,-.027],[.035,-.008],[.002,.038]])
        ovalo(p,x+dx,.759,z+dz,.013,.008,.012,'#643e2d');
    }
    cilindro(p,-.53,.68,.10,.21,.19,.032,'#e4d3b4');cilindro(p,-.54,.79,.10,.137,.105,.21,'#dfb998');
    cilindro(p,-.54,.9,.10,.110,.110,.007,'#573524');
    const asa=pieza(p,new T.TorusGeometry(.069,.02,7,16),'#dfb998',-.39,.81,.10);
    asa.rotation.z=.1;
  }
  const llamaClara=luz('#ffe7a0'), guirnalda=luz('#ffe3a0');
  function intensidadFuego(t){return .55*Math.sin(t*4.2)+.30*Math.sin(t*7.7+.6)+.15*Math.sin(t*1.85);}
  function fuegoEstufa(){
    const w=256,h=160;
    return texturaAnimada(w,h,(c,t)=>{
      c.fillStyle='#381714';c.fillRect(0,0,w,h);
      const brillo=c.createRadialGradient(128,148,6,128,148,157);
      brillo.addColorStop(0,'#ff9430');brillo.addColorStop(.46,'#9c351b');brillo.addColorStop(1,'#381714');
      c.fillStyle=brillo;c.fillRect(0,0,w,h);
      const lengua=(x,y,a,alto,curva,color)=>{
        c.beginPath();c.moveTo(x-a,y);
        c.bezierCurveTo(x-a*1.25,y-alto*.32,x+curva*.5-a*.3,y-alto*.64,x+curva,y-alto);
        c.bezierCurveTo(x+curva+a*.25,y-alto*.60,x+a*1.55,y-alto*.28,x+a,y);
        c.quadraticCurveTo(x,y+a*.42,x-a,y);c.fillStyle=color;c.fill();
      };
      for(let i=0;i<7;i++){
        const fase=i*2.37, x=31+i*32, y=143+4*Math.cos(fase);
        const altura=(64+42*Math.sin(Math.PI*i/6))*(1+.08*intensidadFuego(t)+.14*Math.sin(3.9*t+fase)+.075*Math.sin(6.4*t+fase));
        const curva=11*Math.sin(3.1*t+fase)+5*Math.cos(5.3*t-fase);
        lengua(x,y,23,altura,curva,'#fc7828');
        lengua(x+2,y+1,14,altura*.75,curva*.77,'#ffb743');
        lengua(x-1,y+2,8,altura*.46,curva*.44,'#ffe593');
      }
      for(let i=0;i<6;i++){
        const p=(t*.47+i*.217)%1;c.globalAlpha=Math.sin(p*Math.PI)*.84;c.fillStyle='#ffd485';
        c.fillRect(45+i*32+4*Math.sin(t*2+i),115-100*p,1.6,2.8);
      }
      c.globalAlpha=1;
    });
  }
  function corona(p,x,y,z,r){
    pieza(p,new T.TorusGeometry(r,.068,8,32),'#314a3b',x,y,z);
    for(let i=0;i<32;i++){const a=i*TAU/32;
      const ramita=ovalo(p,x+Math.cos(a)*r,y+Math.sin(a)*r,z+.03,.082,.126,.064,i%3?'#375644':'#506f54');ramita.rotation.z=a-.52;}
    for(const a of [.5,2.4,3.8,5.55])for(let k=0;k<3;k++)ovalo(p,x+r*Math.cos(a)+k*.026,y+r*Math.sin(a)+k%2*.035,z+.11,.032,.032,.032,'#a34335');
    for(const s of [-1,1]){const lazo=ovalo(p,x+s*.11,y-r+.022,z+.13,.14,.072,.045,'#a73f32');lazo.rotation.z=s*.32;}
  }
  function chimenea(){
    const p=grupo(muebles,.91,0,-3.05), piedra='#c7ac8a', claro='#dfc7a4', hierro='#303531';
    caja(p,0,1.15,-.09,2.49,2.29,.55,'#bfa386',.025);
    caja(p,0,.87,.205,1.70,1.46,.09,'#4c3b32');
    for(let fila=0;fila<7;fila++)for(let i=0;i<4;i++){
      const x=-.63+i*.405+(fila%2)*.08;caja(p,x,.25+fila*.18,.265,.38,.16,.045,['#735141','#855e4b','#694e43'][(fila+i)%3]);
    }
    for(const x of [-1.03,1.03]){
      caja(p,x,.9,.285,.42,1.69,.51,piedra,.025);
      caja(p,x,.22,.31,.52,.26,.57,claro);caja(p,x,1.62,.32,.54,.14,.58,claro);
      for(const d of [-.09,0,.09])caja(p,x+d,.95,.549,.021,1.12,.015,'#ad9678');
    }
    caja(p,0,1.84,.29,2.54,.31,.62,claro,.035);
    caja(p,0,2.035,.24,2.79,.14,.81,moldura,.035);caja(p,0,2.13,.25,2.89,.065,.84,borde,.018);
    caja(p,0,.085,.42,2.86,.17,1.27,'#9b8a75',.045);
    // Estufa de hierro, con leños y fuego visibles en la puerta.
    const fundicion=new T.MeshStandardMaterial({color:'#303533',roughness:.58,metalness:.52});
    for(const x of [-.45,.45])for(const z of [.43,.87]){
      vara(p,[x,.37,z],[x*1.16,.205,z+(z>.6?.06:-.035)],.067,fundicion);
      caja(p,x*1.16,.197,z+(z>.6?.06:-.035),.17,.055,.15,hierro,.018);
    }
    caja(p,0,.76,.61,1.17,.77,.64,fundicion,.085);
    caja(p,0,.392,.633,1.24,.11,.68,hierro,.035);
    caja(p,0,1.165,.61,1.26,.10,.72,'#4b504b',.035);
    caja(p,0,1.225,.61,1.18,.04,.65,fundicion,.018);
    for(const x of [-.58,.58])for(const y of [.56,.67,.78,.89,1.0]){
      caja(p,x,y,.59,.029,.035,.47,'#525854',.012);
    }
    cilindro(p,0,1.42,.46,.124,.124,.42,fundicion);
    for(const y of [1.25,1.57])cilindro(p,0,y,.46,.145,.145,.055,'#555b54');
    caja(p,0,.784,.95,1.07,.68,.075,'#53564a',.065);
    caja(p,0,.784,.994,.99,.61,.052,fundicion,.052);
    caja(p,0,.81,1.024,.83,.46,.026,'#927b52',.038);
    caja(p,0,.81,1.042,.775,.415,.023,'#482a22',.03);
    plano(p,0,.81,1.056,.748,.393,new T.MeshBasicMaterial({map:fuegoEstufa(),toneMapped:false}));
    for(const y of [.63,.95]){
      caja(p,-.52,y,1.022,.13,.105,.09,hierro,.020);
      vara(p,[-.54,y-.059,1.079],[-.54,y+.060,1.079],.033,'#6d6e55');
    }
    for(const x of [-.44,.44])for(const y of [.554,1.018])ovalo(p,x,y,1.026,.022,.022,.013,oro);
    caja(p,0,.473,.984,.59,.085,.055,'#242b28',.016);
    for(let i=-5;i<=5;i++)caja(p,i*.039,.473,1.017,.015,.035,.012,'#777967');
    vara(p,[-.32,.626,1.064],[.19,.658,1.064],.030,'#593e30');vara(p,[-.08,.639,1.076],[.31,.617,1.076],.030,'#51382c');
    vara(p,[.46,.86,1.025],[.55,.86,1.13],.024,oro);
    vara(p,[.55,.86,1.13],[.55,.69,1.13],.036,'#8b6748');
    corona(p,0,3.01,.03,.47);
    for(const x of [-.96,-.70,1.03]){const h=x<-.8?.31:.22;cilindro(p,x,2.16+h/2,.29,.074,.074,h,'#f2dfb6');ovalo(p,x,2.19+h,.29,.032,.068,.028,llamaClara);}
    for(const [x,color] of [[-.73,'#9b342c'],[.72,'#466952']]){
      caja(p,x,1.76,.71,.20,.44,.075,color,.047).rotation.z=-.12;
      ovalo(p,x-.055,1.54,.714,.16,.078,.06,color);caja(p,x,1.963,.72,.235,.098,.09,'#e1cfab',.017);
    }
    const rescoldo=new T.PointLight('#ff9b45',10,6,2);rescoldo.position.set(.91,.91,-1.85);sala.add(rescoldo);
    animarAmbiente.push(t=>{rescoldo.intensity=10+2.5*intensidadFuego(t);});
  }
  function arbol(){
    const p=grupo(muebles,3.82,0,-1.92);
    cilindro(p,0,.24,0,.30,.24,.47,'#925e40',12);cilindro(p,0,.57,0,.09,.12,.52,nogal);
    const niveles=[[.49,1.72,1.06],[1.0,2.12,.90],[1.51,2.49,.69],[1.96,2.86,.52],[2.37,3.12,.34]];
    for(const [pie,cima,r] of niveles){
      const n=30, puntos=[];
      const base=Array.from({length:n},(_,i)=>{const a=TAU*i/n,radio=r*(i%2?.86:1);
        return [Math.cos(a)*radio,pie+(i%2?.13:azar()*.055),Math.sin(a)*radio];});
      for(let i=0;i<n;i++){puntos.push(0,cima,0,...base[(i+1)%n],...base[i]);}
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(puntos,3));geo.computeVertexNormals();
      pieza(p,geo,mate(['#2c5140','#315c46','#38654a','#406e51','#527b58'][niveles.findIndex(v=>v[0]===pie)]),0,0,0);
    }
    function radio(y){return Math.max(...niveles.filter(([b,t])=>y>=b && y<=t).map(([b,t,r])=>r*(t-y)/(t-b)),.07);}
    let anterior;
    for(let i=0;i<=130;i++){const y=.60+2.35*i/130,a=i*TAU*4.4/130,r=radio(y)+.025;
      const pt=[Math.cos(a)*r,y,Math.sin(a)*r];if(anterior)vara(p,anterior,pt,.012,oro,5);anterior=pt;
      if(i%3===0)ovalo(p,...pt,.034,.037,.034,guirnalda);}
    for(let i=0;i<33;i++){const y=.63+azar()*2.02,a=i*2.40,r=radio(y)+.015;
      ovalo(p,Math.cos(a)*r,y,Math.sin(a)*r,.077,.09,.077,i%3?'#ad4236':oro);}
    const estrella=[];
    for(let i=0;i<10;i++){const a=Math.PI/2+i*TAU/10,b=a+TAU/10,r=i%2?.105:.245,s=i%2?.245:.105;
      estrella.push(0,0,.065,r*Math.cos(a),r*Math.sin(a),0,s*Math.cos(b),s*Math.sin(b),0);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(estrella,3));geo.computeVertexNormals();
    pieza(p,geo,new T.MeshStandardMaterial({color:'#e5bb62',emissive:'#ab7438',emissiveIntensity:.45,side:T.DoubleSide}),0,3.21,0).rotation.y=.30;
    for(const [x,z,s,c] of [[-.65,.64,.56,'#9e3f37'],[.10,.9,.42,'#d3ae79'],[.62,.41,.50,'#4d6b58']]){
      const regalo=grupo(p,x,s*.33,z,x*.32);caja(regalo,0,0,0,s,s*.66,s*.78,c);
      caja(regalo,0,.003,0,s*.14,s*.67,s*.79,oro);caja(regalo,0,s*.335,0,s,.01,s*.10,oro);
    }
  }
  habitacion();ventana();estanteria();sofa();lampara();mesa();chimenea();arbol();
  // Agrupar los elementos inmóviles reduce las llamadas de dibujo en equipos modestos.
  function agruparEstaticos(grupo){
    grupo.updateMatrixWorld(true);
    const lotes=new Map();
    grupo.traverse(o=>{
      if(!o.isMesh)return;
      const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      // Algunas geometrías de adorno carecen de UV y no usan mapas.
      if(!geo.attributes.uv)geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
      geo.applyMatrix4(o.matrixWorld);
      if(!lotes.has(o.material))lotes.set(o.material,[]);
      lotes.get(o.material).push(geo);
    });
    grupo.clear();
    for(const [m,geos] of lotes){
      const unida=T.mergeGeometries(geos);
      const mesh=new T.Mesh(unida,m);mesh.castShadow=mesh.receiveShadow=true;
      grupo.add(mesh);geos.forEach(g=>g.dispose());
    }
  }
  agruparEstaticos(muebles);
  sala.add(new T.HemisphereLight('#f3e4c9','#9b8172',1.65));
  const principal=new T.DirectionalLight('#ffe1b0',2.65);
  principal.position.set(2.5,3.95,2.8);principal.target.position.set(-1.1,1,-2.3);sala.add(principal.target);principal.castShadow=true;
  Object.assign(principal.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:24});
  principal.shadow.mapSize.set(1024,1024);principal.shadow.normalBias=.025;principal.shadow.bias=-.0003;
  sala.add(principal);
  const relleno=new T.DirectionalLight('#b8d6e3',.85);relleno.position.set(5,5,-2);sala.add(relleno);
  const ojo=1.64, rayos=new T.Raycaster(), ndc=new T.Vector2(), centroLibro=new T.Vector3();
  const teclas=new Set(), pasosTactiles=new Map();
  let giro=0, inclinacion=0, cuadro=0, tiempo=0, arrastre=null, activo=null, elegido=null, salida=0, perdido=false;
  let esperaAmbiente=0, ultimoAmbiente=-Infinity, fase=0, suspendido=false, leyendo=false;
  let anchoEtiqueta=0,altoEtiqueta=0;
  let movimientoX=0, movimientoY=0, distanciaPaso=0, bloqueoDisponible=Boolean(lienzo.requestPointerLock);
  const bloqueado=()=>document.pointerLockElement===lienzo;
  const botones=escenario.querySelectorAll('[data-paso]');
  const limitar=(n,min,max)=>Math.max(min,Math.min(max,n));

  function mirar(){
    camara.rotation.set(inclinacion,giro,0,'YXZ');
    camara.updateMatrixWorld();
  }
  function mirarHacia(x,y,z){
    const dx=x-camara.position.x,dz=z-camara.position.z;
    giro=Math.atan2(-dx,-dz);inclinacion=Math.atan2(y-ojo,Math.hypot(dx,dz));mirar();
  }
  // Huellas de los muebles sobre el suelo, con espacio para el cuerpo de quien camina.
  const obstaculos=[
    [-4.95,-.78,-3.45,-2.35],[-.74,2.55,-3.47,-1.75],
    [2.58,5.12,-3.1,-.68],[-4.8,-2.92,-.72,3.07],
    [-4.58,-3.68,-1.74,-.82],[-1.82,.90,.25,1.94]
  ];
  function libre(x,z){
    return x>=-5.05 && x<=5.05 && z>=-3.09 && z<=3.08 &&
      !obstaculos.some(([izq,der,fondo,frente])=>x>izq && x<der && z>fondo && z<frente);
  }
  function caminar(frente,lado,paso){
    const norma=Math.hypot(frente,lado);if(!norma)return;
    const dx=(-Math.sin(giro)*frente+Math.cos(giro)*lado)*paso/norma;
    const dz=(-Math.cos(giro)*frente-Math.sin(giro)*lado)*paso/norma;
    const p=camara.position;
    const x=p.x,z=p.z;
    if(libre(p.x+dx,p.z))p.x+=dx;
    if(libre(p.x,p.z+dz))p.z+=dz;
    distanciaPaso+=Math.hypot(p.x-x,p.z-z);
    if(distanciaPaso>=.68){
      distanciaPaso-=.68;
      window.sonidoSala?.paso();
    }
    camara.updateMatrixWorld();
  }
  function solicitar(){
    clearTimeout(esperaAmbiente);esperaAmbiente=0;
    if(!cuadro && !suspendido && !leyendo && !perdido && !document.hidden)cuadro=requestAnimationFrame(pintar);
  }
  function pararAmbiente(){
    cancelAnimationFrame(cuadro);cuadro=0;clearTimeout(esperaAmbiente);esperaAmbiente=0;ultimoAmbiente=-Infinity;
  }
  function pintar(ahora){
    cuadro=0;if(perdido || suspendido || leyendo || document.hidden)return;
    if(!quieto.matches && ahora-ultimoAmbiente>=49){
      if(Number.isFinite(ultimoAmbiente))fase+=Math.min(.16,(ahora-ultimoAmbiente)/1000);
      for(const animar of animarAmbiente)animar(fase);
      ultimoAmbiente=ahora;
    }
    const dt=Math.min(.05,(ahora-tiempo)/1000 || .016);tiempo=ahora;
    const frente=Number(teclas.has('w') || teclas.has('arrowup') || [...pasosTactiles.values()].includes(1))-
      Number(teclas.has('s') || teclas.has('arrowdown') || [...pasosTactiles.values()].includes(-1));
    const lado=Number(teclas.has('d'))-Number(teclas.has('a'));
    const vuelta=Number(teclas.has('arrowleft'))-Number(teclas.has('arrowright'));
    let moviendo=Boolean(frente || lado || vuelta || movimientoX || movimientoY);
    if(vuelta || movimientoX || movimientoY){
      giro+=vuelta*dt*1.7-movimientoX*.0015;
      inclinacion=limitar(inclinacion-movimientoY*.0015,-1.13,1.13);
      movimientoX=movimientoY=0;
      mirar();
    }
    if(frente || lado)caminar(frente,lado,dt*2.25);
    for(const libro of libros){
      const fin=libro===elegido ? .89 : libro===activo ? .25 : .03;
      const delta=fin-libro.position.z;
      if(Math.abs(delta)>.002){
        libro.position.z+=quieto.matches?delta:delta*.32;moviendo=true;
        libro.rotation.y=-.045-(libro.position.z-.03)*.35;
      }
    }
    motor.render(sala,camara);
    if(mueble.dataset.salon==='cargando')mueble.dataset.salon='interior';
    if(moviendo && bloqueado() && !elegido)mostrarLibro(bajoLaMira());
    if(activo && moviendo)posicionarEtiqueta();
    if(moviendo)solicitar();
    else if(!quieto.matches)esperaAmbiente=setTimeout(solicitar,50);
  }
  function encuadrar(){
    const w=escenario.clientWidth,h=escenario.clientHeight;
    if(!w || !h || perdido)return;
    motor.setSize(w,h,false);camara.aspect=w/h;
    camara.fov=camara.aspect<.85?76:70;camara.updateProjectionMatrix();
    if(activo){medirEtiqueta();posicionarEtiqueta();}solicitar();
  }
  function medirEtiqueta(){anchoEtiqueta=etiqueta.offsetWidth;altoEtiqueta=etiqueta.offsetHeight;}
  function posicionarEtiqueta(){
    if(!activo)return;
    centroLibro.set(0,activo.userData.alto+.03,.32);
    activo.localToWorld(centroLibro).project(camara);
    const w=lienzo.clientWidth,h=lienzo.clientHeight;
    const x=(centroLibro.x+1)*w/2, y=(1-centroLibro.y)*h/2;
    etiqueta.style.left=limitar(x-anchoEtiqueta/2,8,w-anchoEtiqueta-8)+'px';
    etiqueta.style.top=limitar(y-altoEtiqueta-10,8,h-altoEtiqueta-66)+'px';
  }
  function resaltar(libro,valor){
    libro.userData.marco.visible=valor;libro.userData.cara.emissiveIntensity=valor ? .35 : 0;
  }
  function mostrarLibro(libro,tactil=false){
    if(activo===libro && (!libro || abrir.hidden===!tactil))return;
    if(activo)resaltar(activo,false);
    activo=libro;etiqueta.hidden=!libro;
    if(libro){
      resaltar(libro,true);
      const a=libro.userData.enlace;
      titulo.textContent=a.textContent;detalle.textContent=a.dataset.titulo || '';
      detalle.hidden=!detalle.textContent || detalle.textContent===titulo.textContent;
      abrir.hidden=!tactil;medirEtiqueta();posicionarEtiqueta();
    }
    lienzo.style.cursor=libro?'pointer':'';solicitar();
  }
  function buscarLibro(x,y){
    const rect=lienzo.getBoundingClientRect();
    ndc.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);
    rayos.setFromCamera(ndc,camara);
    const hit=rayos.intersectObject(biblioteca,true)[0];
    if(!hit)return null;
    let obj=hit.object;while(obj && !obj.userData.enlace && !obj.userData.libro)obj=obj.parent;
    if(!obj)return null;
    rayos.far=hit.distance-.001;
    const tapado=rayos.intersectObject(muebles,true).length>0;
    rayos.far=Infinity;return tapado?null:(obj.userData.libro || obj);
  }
  function bajoLaMira(){
    const r=lienzo.getBoundingClientRect();
    return buscarLibro(r.left+r.width/2,r.top+r.height/2);
  }
  function sinBloqueo(){
    bloqueoDisponible=false;
    escenario.dataset.control='alternativo';
  }
  function pedirBloqueo(){
    try {
      lienzo.requestPointerLock()?.catch(sinBloqueo);
    } catch { sinBloqueo(); }
  }
  entrada.querySelector('button').addEventListener('click',()=>{
    entrada.hidden=true;acceso.inert=false;lienzo.tabIndex=0;
    lienzo.focus({preventScroll:true});
    if(bloqueoDisponible && matchMedia('(pointer:fine)').matches)pedirBloqueo();
  });
  document.addEventListener('pointerlockerror',sinBloqueo);
  document.addEventListener('pointerlockchange',()=>{
    soltar();
    if(bloqueado()){
      escenario.dataset.control='capturado';
      mostrarLibro(bajoLaMira());
    } else {
      if(bloqueoDisponible)delete escenario.dataset.control;
      if(!elegido)mostrarLibro(null);
    }
    solicitar();
  });
  document.addEventListener('mousemove',e=>{
    if(!bloqueado() || elegido || perdido)return;
    movimientoX+=e.movementX;movimientoY+=e.movementY;
    solicitar();
  });
  function sacar(libro,e){
    if(elegido || !libro)return;
    const a=libro.userData.enlace;
    // WebGL puede vaciar el búfer al presentar el fotograma. Captúralo en la misma llamada de dibujo.
    motor.render(sala,camara);
    window.fondoSala?.guardar(lienzo);
    if(e.ctrlKey || e.metaKey || e.shiftKey){window.open(a.href,'_blank','noopener');return;}
    window.sonidoSala?.abrirLibro();
    soltar();elegido=libro;mostrarLibro(libro);
    solicitar();salida=setTimeout(()=>{
      leyendo=true;pararAmbiente();visor.src=a.href;
    },quieto.matches?0:320);
  }
  visor.addEventListener('load',()=>{
    if(!leyendo)return;
    if(bloqueado())document.exitPointerLock();
    visor.hidden=false;escenario.inert=true;acceso.inert=true;visor.focus();
  });
  addEventListener('message',e=>{
    if(!leyendo || e.source!==visor.contentWindow || (e.origin!==location.origin && location.origin!=='null'))return;
    if(e.data==='diario:silenciar'){botonSonido.click();return;}
    if(e.data!=='diario:cerrar')return;
    leyendo=false;elegido=null;visor.hidden=true;visor.removeAttribute('src');
    escenario.inert=false;acceso.inert=false;
    mostrarLibro(null);lienzo.focus({preventScroll:true});solicitar();
  });
  lienzo.addEventListener('pointerdown',e=>{
    if(perdido || elegido || arrastre || !e.isPrimary || e.button!==0)return;
    if(e.pointerType==='mouse' && bloqueoDisponible)return;
    lienzo.focus({preventScroll:true});
    arrastre={id:e.pointerId,x:e.clientX,y:e.clientY,inicial:giro,altura:inclinacion,mirando:false,libro:buscarLibro(e.clientX,e.clientY)};
    lienzo.setPointerCapture(e.pointerId);
  });
  lienzo.addEventListener('pointermove',e=>{
    if(elegido || perdido)return;
    if(!arrastre){
      if(e.pointerType==='mouse' && !bloqueoDisponible)mostrarLibro(buscarLibro(e.clientX,e.clientY));
      return;
    }
    if(arrastre.id!==e.pointerId)return;
    const dx=e.clientX-arrastre.x,dy=e.clientY-arrastre.y;
    if(!arrastre.mirando && Math.hypot(dx,dy)<5)return;
    arrastre.mirando=true;mostrarLibro(null);
    giro=arrastre.inicial+dx*.0045;inclinacion=limitar(arrastre.altura+dy*.0045,-1.13,1.13);
    mirar();solicitar();
  });
  lienzo.addEventListener('pointerup',e=>{
    if(arrastre?.id!==e.pointerId)return;
    const gesto=arrastre;arrastre=null;
    if(gesto.mirando || Math.hypot(e.clientX-gesto.x,e.clientY-gesto.y)>=6)return;
    if(e.pointerType==='touch' && (!gesto.libro || gesto.libro!==activo || abrir.hidden))mostrarLibro(gesto.libro,true);
    else sacar(gesto.libro,e);
  });
  abrir.addEventListener('click',e=>sacar(activo,e));
  lienzo.addEventListener('click',e=>{
    if(elegido || perdido || !entrada.hidden || e.pointerType==='touch' || e.pointerType==='pen' || !bloqueoDisponible)return;
    if(bloqueado())sacar(bajoLaMira(),e);
    else {lienzo.focus({preventScroll:true});pedirBloqueo();}
  });
  lienzo.addEventListener('lostpointercapture',()=>{arrastre=null;});
  lienzo.addEventListener('pointerleave',e=>{
    if(e.pointerType!=='touch' && !bloqueado() && !arrastre && !elegido)mostrarLibro(null);
  });
  const comandos=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
  document.addEventListener('keydown',e=>{
    if(perdido || elegido || !entrada.hidden || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented)return;
    const k=e.key.toLowerCase();
    if(k==='m' && bloqueado() && !e.repeat){
      if(!botonSonido.hidden)botonSonido.click();
      return;
    }
    if(!comandos.includes(k) || (e.target!==document.body && e.target!==lienzo && !e.target.matches?.('.sonido-sala')))return;
    e.preventDefault();teclas.add(k);mostrarLibro(null);solicitar();
  });
  document.addEventListener('keyup',e=>teclas.delete(e.key.toLowerCase()));
  botones.forEach(b=>{
    const dir=Number(b.dataset.paso);
    b.addEventListener('pointerdown',e=>{
      if(e.button!==0 || elegido)return;
      e.preventDefault();b.setPointerCapture(e.pointerId);
      pasosTactiles.set(e.pointerId,dir);mostrarLibro(null);solicitar();
    });
    b.addEventListener('lostpointercapture',e=>pasosTactiles.delete(e.pointerId));
    b.addEventListener('click',e=>{if(!e.detail && !elegido){caminar(dir,0,.18);solicitar();}});
  });
  // Tab sitúa al lector delante del volumen físico, y Enter lo saca desde la sala.
  libros.forEach(libro=>{
    const a=libro.userData.enlace;
    a.addEventListener('focus',()=>{
      if(perdido || elegido)return;
      centroLibro.set(0,libro.userData.alto/2,.31);libro.localToWorld(centroLibro);
      movimientoX=movimientoY=0;
      camara.position.set(limitar(centroLibro.x,-2.75,-1.26),ojo,-.66);
      mirarHacia(centroLibro.x,centroLibro.y,centroLibro.z);mostrarLibro(libro);solicitar();
    });
    a.addEventListener('click',e=>{if(!perdido){e.preventDefault();sacar(libro,e);}});
    a.addEventListener('blur',()=>{if(!elegido)mostrarLibro(null);});
  });
  function soltar(){teclas.clear();pasosTactiles.clear();arrastre=null;movimientoX=movimientoY=0;}
  addEventListener('blur',soltar);
  addEventListener('pageshow',()=>{suspendido=false;clearTimeout(salida);elegido=null;mostrarLibro(null);solicitar();});
  addEventListener('pagehide',()=>{if(bloqueado())document.exitPointerLock();suspendido=true;soltar();clearTimeout(salida);pararAmbiente();});
  document.addEventListener('visibilitychange',()=>{soltar();pararAmbiente();if(!document.hidden)solicitar();});
  quieto.addEventListener('change',()=>{pararAmbiente();solicitar();});
  lienzo.addEventListener('webglcontextlost',e=>{
    e.preventDefault();perdido=true;soltar();pararAmbiente();clearTimeout(salida);elegido=null;mostrarLibro(null);
    mostrarAccesoDirecto();
  });
  function entrar(){
    perdido=false;mueble.dataset.salon='cargando';escenario.hidden=false;encuadrar();
  }
  lienzo.addEventListener('webglcontextrestored',entrar);
  const estrecho=matchMedia('(max-width:640px)').matches;
  if(!bloqueoDisponible)sinBloqueo();
  acceso.inert=true;lienzo.tabIndex=-1;
  camara.position.set(estrecho?-.95:1.02,ojo,3.06);
  mirarHacia(estrecho?-4.0:-.88,1.58,-2.8);entrar();
  new ResizeObserver(encuadrar).observe(escenario);
})();
