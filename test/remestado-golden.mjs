import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'user',password:'password',database:'gestorpincadb'});
const q=async(s,p=[])=>(await db.query(s,p))[0];
const api=async(base,method,path,body)=>{const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+T,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);if(!dd.length&&c.status===ne.status){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name+(c.status!==ne.status?` st ${c.status}/${ne.status}`:''));dd.slice(0,6).forEach(x=>console.log('     '+x));}}
function checkStatus(name,c,ne){if(c.status===ne.status){pass++;console.log(`  ✅ ${name} (status ${c.status})`);}else{fail++;console.log(`  ❌ ${name}: ${c.status} vs ${ne.status}`);}}
function expect(name,cond,got){if(cond){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name+' → '+JSON.stringify(got));}}
let rid;
async function setEstado(e){await q('UPDATE remisiones SET estado=? WHERE id_remisiones=?',[e,rid]);}
try{
  await q("DELETE FROM remisiones WHERE numero='ZZ-REM-EST'");
  rid=(await q("INSERT INTO remisiones (numero,cliente_id,fecha_remision,estado) VALUES ('ZZ-REM-EST',1,CURDATE(),'Pendiente')")).insertId;
  console.log(`\nFixture remisión ${rid}\n`);
  const trans=async(base,estado)=>{await setEstado('Pendiente');const r=await api(base,'PATCH',`/api/remisiones/${rid}/estado`,{estado});await setEstado('Pendiente');return r;};
  check('estado → Facturada', await trans(CI4,'Facturada'), await trans(NEST,'Facturada'));
  check('estado → Anulada (desde Pendiente)', await trans(CI4,'Anulada'), await trans(NEST,'Anulada'));
  checkStatus('estado inválido (400)', await trans(CI4,'Xyz'), await trans(NEST,'Xyz'));
  // terminal: desde Anulada
  const term=async(base)=>{await setEstado('Anulada');const r=await api(base,'PATCH',`/api/remisiones/${rid}/estado`,{estado:'Facturada'});await setEstado('Pendiente');return r;};
  checkStatus('desde Anulada (terminal, 400)', await term(CI4), await term(NEST));
  checkStatus('remisión inexistente (404)', await api(CI4,'PATCH','/api/remisiones/999999/estado',{estado:'Facturada'}), await api(NEST,'PATCH','/api/remisiones/999999/estado',{estado:'Facturada'}));
  // Despachada: enum no lo tiene. CI4 no-estricto trunca→'' (200 dead); Nest estricto rechaza.
  await setEstado('Pendiente');const dCI4=await api(CI4,'PATCH',`/api/remisiones/${rid}/estado`,{estado:'Despachada'});await setEstado('Pendiente');
  const dNest=await api(NEST,'PATCH',`/api/remisiones/${rid}/estado`,{estado:'Despachada'});await setEstado('Pendiente');
  expect('Despachada: CI4 dead (200 con estado truncado) vs Nest rechaza (doc)', dCI4.status===200 && dNest.status>=400, {ci4:dCI4.status,nest:dNest.status});
  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{ if(rid)await q('DELETE FROM remisiones WHERE id_remisiones=?',[rid]).catch(()=>{}); await db.end(); }
process.exit(fail?1:0);
