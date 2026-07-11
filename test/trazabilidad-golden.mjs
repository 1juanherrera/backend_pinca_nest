import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'user',password:'password',database:'gestorpincadb'});
const q=async(s,p=[])=>(await db.query(s,p))[0];
const api=async(base,path)=>{const r=await fetch(base+path,{headers:{Authorization:'Bearer '+T}});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);const st=c.status===ne.status;if(!dd.length&&st){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name+(st?'':` status ${c.status}/${ne.status}`));dd.slice(0,6).forEach(x=>console.log('     '+x));}}
let prep,capa;
try{
  await q("DELETE pcc FROM preparacion_consumo_capas pcc JOIN inventario_capas ic ON ic.id_capa=pcc.capa_id WHERE ic.lote_proveedor='ZZLOTE_TRZ'");
  await q("DELETE FROM inventario_capas WHERE lote_proveedor='ZZLOTE_TRZ'");
  prep=(await q("INSERT INTO preparaciones (item_general_id,unidad_id,cantidad,estado,fecha_creacion) VALUES (1,3,10,1,NOW())")).insertId;
  capa=(await q("INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,lote_proveedor,estado,fecha_ingreso) VALUES (1,1,23,100,100,1000,'ZZLOTE_TRZ',1,NOW())")).insertId;
  await q("INSERT INTO preparacion_consumo_capas (preparacion_id,capa_id,item_general_id,cantidad_consumida,costo_unitario,costo_total) VALUES (?,?,1,10,1000,10000)",[prep,capa]);
  console.log(`\nFixture: prep=${prep} capa=${capa} lote=ZZLOTE_TRZ\n`);

  check('porPreparacion (con consumo)',await api(CI4,`/api/trazabilidad/preparacion/${prep}`),await api(NEST,`/api/trazabilidad/preparacion/${prep}`));
  check('porPreparacion 999999 (404)',await api(CI4,'/api/trazabilidad/preparacion/999999'),await api(NEST,'/api/trazabilidad/preparacion/999999'));
  check('porLote ZZLOTE_TRZ',await api(CI4,'/api/trazabilidad/lote/ZZLOTE_TRZ'),await api(NEST,'/api/trazabilidad/lote/ZZLOTE_TRZ'));
  check('porLote inexistente',await api(CI4,'/api/trazabilidad/lote/NOEXISTE_ZZ'),await api(NEST,'/api/trazabilidad/lote/NOEXISTE_ZZ'));
  check('lotes (autocomplete)',await api(CI4,'/api/trazabilidad/lotes'),await api(NEST,'/api/trazabilidad/lotes'));
  check('lotes?q=ZZLOTE',await api(CI4,'/api/trazabilidad/lotes?q=ZZLOTE'),await api(NEST,'/api/trazabilidad/lotes?q=ZZLOTE'));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{
  if(prep)await q("DELETE FROM preparacion_consumo_capas WHERE preparacion_id=?",[prep]).catch(()=>{});
  if(capa)await q("DELETE FROM inventario_capas WHERE id_capa=?",[capa]).catch(()=>{});
  if(prep)await q("DELETE FROM preparaciones WHERE id_preparaciones=?",[prep]).catch(()=>{});
  await db.end();
}
process.exit(fail?1:0);
