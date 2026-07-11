import crypto from 'node:crypto';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const api=async(base,path)=>{const r=await fetch(base+path,{headers:{Authorization:'Bearer '+T}});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;return String(a)===String(bb);}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);if(!dd.length&&c.status===ne.status){pass++;console.log(`  ✅ ${name} (${(c.body||[]).length} res)`);}else{fail++;console.log('  ❌ '+name);dd.slice(0,8).forEach(x=>console.log('     '+x));}}
const qs=['a','in','Pintura','pintura','FAC','COT','NC','OC','23','Distribu','001','&raro','industrial'];
for(const query of qs){const p='/api/search?q='+encodeURIComponent(query);check('search q='+JSON.stringify(query),await api(CI4,p),await api(NEST,p));}
check('search limit=3', await api(CI4,'/api/search?q=in&limit=3'), await api(NEST,'/api/search?q=in&limit=3'));
check('search limit=99 (clamp10)', await api(CI4,'/api/search?q=in&limit=99'), await api(NEST,'/api/search?q=in&limit=99'));
check('search vacío', await api(CI4,'/api/search?q='), await api(NEST,'/api/search?q='));
console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
process.exit(fail?1:0);
