import crypto from 'node:crypto';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const g=async base=>{const r=await fetch(base+'/api/salud-sistema',{headers:{Authorization:'Bearer '+T}});return{status:r.status,body:await r.json().catch(()=>null)};};
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
const c=await g(CI4),ne=await g(NEST);
console.log('HTTP',c.status,'/',ne.status);
const dd=diff(c.body,ne.body);
if(!dd.length)console.log('✅ salud-sistema MATCH ('+Object.keys(c.body||{}).length+' claves, score='+c.body?.score+')');
else{console.log('❌ salud-sistema');dd.slice(0,15).forEach(x=>console.log('   '+x));}
process.exit(dd.length?1:0);
