import crypto from 'node:crypto';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const api=async(base,path)=>{const r=await fetch(base+path,{headers:{Authorization:'Bearer '+T}});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);if(!dd.length&&c.status===ne.status){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name+(c.status!==ne.status?` st ${c.status}/${ne.status}`:''));dd.slice(0,12).forEach(x=>console.log('     '+x));}}
// index (batch)
const ci4=await api(CI4,'/api/costos-produccion'), ne=await api(NEST,'/api/costos-produccion');
check('GET costos-produccion (batch)', ci4, ne);
// pick a product id from the batch to test show
const prods=ci4.body?.productos||(Array.isArray(ci4.body)?ci4.body:[]);
console.log(`  (productos: ${prods.length})`);
const ids=prods.slice(0,5).map(p=>p.id_item_general);
for(const id of ids){ check('GET costos-produccion/'+id+' (detalle)', await api(CI4,'/api/costos-produccion/'+id), await api(NEST,'/api/costos-produccion/'+id)); }
check('GET costos-produccion/999999 (404)', await api(CI4,'/api/costos-produccion/999999'), await api(NEST,'/api/costos-produccion/999999'));
console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
process.exit(fail?1:0);
