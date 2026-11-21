import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const puerto = Number(process.argv[2] || 4317);
if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) throw new Error('Puerto inválido.');
const carpeta = resolve(raiz, '.manuales');
const archivo = resolve(carpeta, 'estado.json');
const rutaEstado = '/manuales/assets/estado-local.js';
const codigoEstado = await readFile(resolve(raiz, 'assets/estado-local.js'), 'utf8');
let estado = {};
try { estado = JSON.parse(await readFile(archivo, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!estado || typeof estado !== 'object' || Array.isArray(estado)) throw new Error('Estado local inválido.');
let cola = Promise.resolve();
const tipos = {html:'text/html',css:'text/css',js:'text/javascript',json:'application/json',png:'image/png',webp:'image/webp',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',txt:'text/plain'};
function responder(res, status, texto, tipo = 'text/plain') {
  res.writeHead(status, {'Content-Type':tipo+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
  res.end(texto);
}
async function guardar(req, res) {
  if (req.headers.origin !== 'http://' + req.headers.host || !req.headers['content-type']?.startsWith('application/json')) {
    responder(res,403,'Origen no autorizado.');return;
  }
  let cuerpo = '';
  req.setEncoding('utf8');
  for await (const parte of req) {
    cuerpo += parte;
    if (Buffer.byteLength(cuerpo)>64000) { responder(res,413,'Entrada demasiado grande.');return; }
  }
  let cambio;
  try { cambio = JSON.parse(cuerpo); } catch { responder(res,400,'JSON inválido.');return; }
  const {clave, valor} = cambio || {};
  if (typeof clave!=='string' || !clave.startsWith('diario:') || clave.length>1024 ||
      (valor!==null && typeof valor!=='string')) { responder(res,400,'Cambio inválido.');return; }
  const operacion = cola.then(async () => {
    const siguiente = {...estado};
    if (valor===null) delete siguiente[clave];else siguiente[clave]=valor;
    const texto = JSON.stringify(siguiente,null,2)+'\n';
    if (Buffer.byteLength(texto)>4_000_000) throw new Error('Estado local demasiado grande.');
    await mkdir(carpeta,{recursive:true});
    await writeFile(archivo+'.tmp',texto,{mode:0o600});
    await rename(archivo+'.tmp',archivo);
    estado=siguiente;
  });
  cola=operacion.catch(()=>{});
  await operacion;
  responder(res,204,'');
}
async function servir(req,res) {
  if (!['localhost:'+puerto,'127.0.0.1:'+puerto].includes(req.headers.host)) { responder(res,403,'Solo localhost.');return; }
  const ruta = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (req.method==='POST' && ruta==='/manuales/estado') { await guardar(req,res);return; }
  if (req.method!=='GET' && req.method!=='HEAD') { responder(res,405,'Método no permitido.');return; }
  if (ruta==='/' || ruta==='/manuales') {res.writeHead(302,{Location:'/manuales/'});res.end();return;}
  if (ruta===rutaEstado) {
    if (['cross-site','same-site'].includes(req.headers['sec-fetch-site'])) {responder(res,403,'Solo la colección local.');return;}
    const datos=JSON.stringify(estado).replaceAll('<','\\u003c');
    responder(res,200,'window.estadoManualLocal='+datos+';\n'+codigoEstado,'text/javascript');return;
  }
  const relativo=ruta==='/manuales/'?'index.html':ruta.slice('/manuales/'.length);
  if (!ruta.startsWith('/manuales/') || relativo.split('/').some(p=>!p || p.startsWith('.') || p.includes('\\') || p.includes(':'))) {
    responder(res,404,'Archivo no encontrado.');return;
  }
  const permitido=/^(index\.html|assets\/[\w.-]+\.(?:css|js|webp|png|txt)|(?:diarios\/[a-z0-9-]+|_plantilla)\/(?:manual\.html|(?:img|configuracion)\/[\w./-]+))$/;
  if (!permitido.test(relativo)) { responder(res,404,'Archivo no encontrado.');return; }
  let local;
  try { local=await realpath(resolve(raiz,relativo)); }
  catch (error) { if(error.code==='ENOENT'){responder(res,404,'Archivo no encontrado.');return;}throw error; }
  if (!local.startsWith(raiz+sep)) { responder(res,404,'Archivo no encontrado.');return; }
  const info=await stat(local);
  if(!info.isFile()){responder(res,404,'Archivo no encontrado.');return;}
  const ext=relativo.split('.').at(-1);
  const adjunto=relativo.includes('/configuracion/');
  const headers={'Content-Type':adjunto?'application/octet-stream':tipos[ext]||'application/octet-stream',
    'Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
  if(adjunto)headers['Content-Disposition']='attachment';
  res.writeHead(200,headers);
  if(req.method==='HEAD')res.end();else createReadStream(local).on('error',()=>res.destroy()).pipe(res);
}
const servidor=createServer((req,res)=>servir(req,res).catch(error=>{
  if (!res.headersSent) responder(res,error instanceof URIError?400:500,'No se pudo completar la solicitud.');
  else res.destroy();
  if (!(error instanceof URIError)) console.error(error.message);
}));
servidor.listen(puerto,'127.0.0.1',()=>console.log('Manuales · http://127.0.0.1:'+puerto+'/manuales/'));
