import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const nn=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),dd=b(JSON.stringify({iat:nn,exp:nn+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const A_ADMIN=h+'.'+dd+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+dd).digest());
const doper=b(JSON.stringify({iat:nn,exp:nn+3600,data:{id:2,username:'root',nombre:'root',rol:'operador',modulos:[],token_version:1}}));
const A_OPER=h+'.'+doper+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+doper).digest());
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'user',password:'password',database:'gestorpincadb'});
const q=async(s,p=[])=>(await db.query(s,p))[0];
const api=async(base,method,path,body,tok)=>{const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+(tok||A_ADMIN),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function checkObj(name,c,ne){const d=diff(c,ne);if(!d.length){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name);d.slice(0,8).forEach(x=>console.log('     '+x));}}
function check(name,c,ne){const d=diff(c.body,ne.body);if(!d.length&&c.status===ne.status){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name+(c.status!==ne.status?` st ${c.status}/${ne.status}`:''));d.slice(0,6).forEach(x=>console.log('     '+x));}}
function expect(name,cond,got){if(cond){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name+' → '+JSON.stringify(got));}}

let P,A,B,C,F;
async function setup(){
  await teardown();
  const ins=async(nombre,tipo)=>(await q("INSERT INTO item_general (nombre,tipo,p_kg) VALUES (?,?,'')",[nombre,tipo])).insertId;
  P=await ins('ZZ_RMP_PROD',0); A=await ins('ZZ_RMP_A',1); B=await ins('ZZ_RMP_B',1); C=await ins('ZZ_RMP_C',1);
  F=(await q("INSERT INTO formulaciones (nombre,estado,item_general_id) VALUES ('ZZ_RMP_FORM',1,?)",[P])).insertId;
  await q("INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,porcentaje) VALUES (?,?,5,50)",[F,A]);
  await q("INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,porcentaje) VALUES (?,?,3,30)",[F,C]);
}
async function teardown(){
  const igs=await q("SELECT id_item_general FROM item_general WHERE nombre LIKE 'ZZ_RMP_%'");
  for(const r of igs){ await q("DELETE FROM item_general_formulaciones WHERE item_general_id=?",[r.id_item_general]); }
  const forms=await q("SELECT id_formulaciones FROM formulaciones WHERE nombre='ZZ_RMP_FORM'");
  for(const f of forms) await q("DELETE FROM item_general_formulaciones WHERE formulaciones_id=?",[f.id_formulaciones]);
  await q("DELETE FROM formulaciones WHERE nombre='ZZ_RMP_FORM'");
  await q("DELETE FROM item_reemplazo_log WHERE from_nombre LIKE 'ZZ_RMP_%'");
  await q("DELETE FROM item_general WHERE nombre LIKE 'ZZ_RMP_%'");
}
async function bomOf(){ return (await q("SELECT item_general_id,cantidad,porcentaje FROM item_general_formulaciones WHERE formulaciones_id=? ORDER BY item_general_id",[F])).map(r=>({item:Number(r.item_general_id),c:Number(r.cantidad),p:Number(r.porcentaje)})); }
async function resetBom(){ await q("DELETE FROM item_general_formulaciones WHERE formulaciones_id=?",[F]); await q("INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,porcentaje) VALUES (?,?,5,50)",[F,A]); await q("INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,porcentaje) VALUES (?,?,3,30)",[F,C]); await q("UPDATE item_general SET deleted_at=NULL WHERE id_item_general=?",[A]); await q("DELETE FROM item_reemplazo_log WHERE from_item_id=?",[A]); }

try{
  await setup();
  console.log(`\nFixture: P=${P} A=${A} B=${B} C=${C} F=${F}\n`);

  // uso-formulas
  check('uso-formulas/:A', await api(CI4,'GET',`/api/sincronizacion/uso-formulas/${A}?to=${B}`), await api(NEST,'GET',`/api/sincronizacion/uso-formulas/${A}?to=${B}`));

  // reemplazar A→B (repunta + soft-delete A) — compara resultado + BOM, reset entre corridas
  const reemp=async(base)=>{
    const r=await api(base,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:B});
    const bom=await bomOf(); const aDel=(await q("SELECT deleted_at FROM item_general WHERE id_item_general=?",[A]))[0].deleted_at!=null;
    const body=r.body?{...r.body}:null; if(body)delete body.log_id;
    await resetBom();
    return {status:r.status,body,bom,aDel};
  };
  checkObj('reemplazar A→B (repunta + soft-delete)', await reemp(CI4), await reemp(NEST));

  // forbidden
  check('reemplazar sin admin (403)', await api(CI4,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:B},A_OPER), await api(NEST,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:B},A_OPER));
  check('reemplazar from==to (422)', await api(CI4,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:A}), await api(NEST,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:A}));

  // revertir (per-backend: aplica, revierte, verifica BOM vuelve al original + A restaurado)
  const revert=async(base)=>{
    const rr=await api(base,'POST','/api/sincronizacion/reemplazar-formula',{from_item_id:A,to_item_id:B});
    const logId=rr.body?.log_id;
    const rv=await api(base,'POST',`/api/sincronizacion/reemplazos/${logId}/revertir`);
    const bom=await bomOf(); const aDel=(await q("SELECT deleted_at FROM item_general WHERE id_item_general=?",[A]))[0].deleted_at!=null;
    const logRev=Number((await q("SELECT revertido FROM item_reemplazo_log WHERE id=?",[logId]))[0]?.revertido??-1);
    await resetBom();
    return {rvStatus:rv.status,rvOk:rv.body?.ok,bomTieneA:bom.some(x=>x.item===A),aRestaurado:!aDel,logRev};
  };
  const rC=await revert(CI4), rN=await revert(NEST);
  expect('revertir restaura BOM+A (CI4)', rC.rvStatus===200&&rC.rvOk&&rC.bomTieneA&&rC.aRestaurado&&rC.logRev===1, rC);
  expect('revertir restaura BOM+A (Nest)', rN.rvStatus===200&&rN.rvOk&&rN.bomTieneA&&rN.aRestaurado&&rN.logRev===1, rN);
  checkObj('revertir estructura idéntica', rC, rN);

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{ await teardown().catch(()=>{}); await db.end(); }
process.exit(fail?1:0);
