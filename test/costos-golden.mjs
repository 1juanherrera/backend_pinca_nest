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
function diff(a,bb,p=''){const d=[];if(p.endsWith('.fecha_actualizacion'))return d;if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);if(!dd.length&&c.status===ne.status){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name+(c.status!==ne.status?` st ${c.status}/${ne.status}`:''));dd.slice(0,6).forEach(x=>console.log('     '+x));}}
function checkObj(name,c,ne){const dd=diff(c,ne);if(!dd.length){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name);dd.slice(0,8).forEach(x=>console.log('     '+x));}}

try{
  await q("DELETE FROM costos_indirectos WHERE nombre LIKE 'ZZ_CI%'");
  const CIT=(await q("SELECT id_costos_item FROM costos_item LIMIT 1"))[0].id_costos_item;
  console.log('');
  // ── COSTOS_INDIRECTOS reads ──
  check('GET costos_indirectos (index)', await api(CI4,'GET','/api/costos_indirectos'), await api(NEST,'GET','/api/costos_indirectos'));
  check('GET costos_indirectos/resumen', await api(CI4,'GET','/api/costos_indirectos/resumen'), await api(NEST,'GET','/api/costos_indirectos/resumen'));
  check('GET costos_indirectos/999999 (404)', await api(CI4,'GET','/api/costos_indirectos/999999'), await api(NEST,'GET','/api/costos_indirectos/999999'));

  // ── CREATE ──
  const createOp=async(base,nombre)=>{
    const r=await api(base,'POST','/api/costos_indirectos',{nombre,categoria:'servicios',valor_mensual:500});
    const iid=r.body?.id;const row=iid?(await q('SELECT nombre,categoria,valor_mensual,activo FROM costos_indirectos WHERE id_costos_indirectos=?',[iid]))[0]:null;
    if(iid)await q('DELETE FROM costos_indirectos WHERE id_costos_indirectos=?',[iid]);
    return {status:r.status,mensaje:r.body?.mensaje,row:row?{...row,valor_mensual:Number(row.valor_mensual),activo:Number(row.activo)}:null};
  };
  checkObj('POST create', await createOp(CI4,'ZZ_CI_NEW'), await createOp(NEST,'ZZ_CI_NEW'));
  check('POST create sin nombre (422)', await api(CI4,'POST','/api/costos_indirectos',{categoria:'x'}), await api(NEST,'POST','/api/costos_indirectos',{categoria:'x'}));
  check('POST create valor negativo (422)', await api(CI4,'POST','/api/costos_indirectos',{nombre:'z',categoria:'x',valor_mensual:-5}), await api(NEST,'POST','/api/costos_indirectos',{nombre:'z',categoria:'x',valor_mensual:-5}));

  // ── SHOW / UPDATE / DELETE ──
  const cudOp=async(base)=>{
    const iid=(await q("INSERT INTO costos_indirectos (nombre,categoria,valor_mensual,activo,fecha_actualizacion) VALUES ('ZZ_CI_CUD','otros',100,1,CURDATE())")).insertId;
    const show=await api(base,'GET',`/api/costos_indirectos/${iid}`);
    const upd=await api(base,'PUT',`/api/costos_indirectos/${iid}`,{valor_mensual:250,nombre:'ZZ_CI_CUD2'});
    const rowU=(await q('SELECT nombre,valor_mensual FROM costos_indirectos WHERE id_costos_indirectos=?',[iid]))[0];
    const del=await api(base,'DELETE',`/api/costos_indirectos/${iid}`);
    const gone=Number((await q('SELECT COUNT(*) n FROM costos_indirectos WHERE id_costos_indirectos=?',[iid]))[0].n);
    await q('DELETE FROM costos_indirectos WHERE id_costos_indirectos=?',[iid]);
    return {showNombre:show.body?.nombre,updMsg:upd.body?.mensaje?.replace(String(iid),'{id}'),dbNombre:rowU.nombre,dbVal:Number(rowU.valor_mensual),delMsg:del.body?.mensaje?.replace(String(iid),'{id}'),gone};
  };
  checkObj('show/update/delete', await cudOp(CI4), await cudOp(NEST));

  // ── ASIGNAR A ITEM ──
  const asigOp=async(base)=>{
    const ci=(await q("INSERT INTO costos_indirectos (nombre,categoria,valor_mensual,activo,fecha_actualizacion) VALUES ('ZZ_CI_ASIG','otros',300,1,CURDATE())")).insertId;
    await q("DELETE FROM costos_indirectos_item WHERE item_general_id=1 AND costos_indirectos_id=?",[ci]);
    const asig=await api(base,'POST','/api/costos_indirectos/item/1',{costos_indirectos_id:ci,valor_asignado:77});
    const list=await api(base,'GET','/api/costos_indirectos/item/1');
    const mine=(list.body?.costos||[]).find(x=>Number(x.id_costos_indirectos)===ci);
    await q("DELETE FROM costos_indirectos_item WHERE costos_indirectos_id=?",[ci]);
    await q('DELETE FROM costos_indirectos WHERE id_costos_indirectos=?',[ci]);
    return {asigMsg:asig.body?.mensaje,valorAsignado:mine?Number(mine.valor_asignado):null};
  };
  checkObj('asignar a item + costosItem', await asigOp(CI4), await asigOp(NEST));
  check('asignar sin costos_indirectos_id (422)', await api(CI4,'POST','/api/costos_indirectos/item/1',{}), await api(NEST,'POST','/api/costos_indirectos/item/1',{}));

  // ── COSTOS_ITEM update ──
  const citOp=async(base)=>{
    const orig=(await q('SELECT envase,etiqueta,volumen FROM costos_item WHERE id_costos_item=?',[CIT]))[0];
    const r=await api(base,'PUT',`/api/costos_item/${CIT}`,{envase:99,etiqueta:88,volumen:5,noexiste:1});
    const row=(await q('SELECT envase,etiqueta,volumen FROM costos_item WHERE id_costos_item=?',[CIT]))[0];
    await q('UPDATE costos_item SET envase=?,etiqueta=?,volumen=? WHERE id_costos_item=?',[orig.envase,orig.etiqueta,orig.volumen,CIT]);
    return {status:r.status,success:r.body?.success,mensaje:r.body?.mensaje?.replace(String(CIT),'{id}'),data:r.body?.data,dbEnvase:Number(row.envase),dbEtiqueta:Number(row.etiqueta),dbVol:Number(row.volumen)};
  };
  checkObj('PUT costos_item (whitelist)', await citOp(CI4), await citOp(NEST));
  check('PUT costos_item/999999 (404)', await api(CI4,'PUT','/api/costos_item/999999',{envase:1}), await api(NEST,'PUT','/api/costos_item/999999',{envase:1}));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{ await q("DELETE FROM costos_indirectos WHERE nombre LIKE 'ZZ_CI%'").catch(()=>{}); await db.end(); }
process.exit(fail?1:0);
