
(function(){
'use strict';
const GHI={'i-heart':'g-coracao','i-san':'g-cerebro','i-trash':'g-lixo'};
const GI=ic=>GHI[ic]?'<i class="gi '+GHI[ic]+'" aria-hidden="true"></i>':'';
(function(){const p=new Image();p.crossOrigin='anonymous';p.onload=()=>document.documentElement.classList.add('gh');p.src=APP_CONFIG.ASSET_BASE+'configicon.svg'})();

/* =====================================================================
   UTILITÁRIOS
   ===================================================================== */
const {$,$$,wait,rnd,clamp,esc,fmt,cloudError}=Util;
const num=(v,d)=>{v=Number(v);return Number.isFinite(v)?v:(d||0)};
const int=(v,a,b,d)=>clamp(Math.round(num(v,d)),a,b);
const str=(v,n)=>String(v==null?'':v).slice(0,n||200);

/* =====================================================================
   DADOS DO SISTEMA (Call of Cthulhu 7ª edição)
   ===================================================================== */
const CARS=[['FOR','Força'],['CON','Constituição'],['TAM','Tamanho'],['DES','Destreza'],
            ['APA','Aparência'],['EDU','Educação'],['INT','Inteligência'],['POD','Poder']];
const CNAME=Object.fromEntries(CARS);

const CATS=[['ger','Perícias gerais'],['luta','Lutar'],['fogo','Armas de Fogo'],['arte','Arte e Ofício'],
            ['ciencia','Ciências'],['idioma','Línguas'],['pilotar','Pilotar'],['sobrev','Sobrevivência']];

/* S(id, nome, base, grupo, extras). base: número, 'dex2' (metade da Destreza) ou 'edu' (Educação).
   pre: prefixo usado no título da rolagem. slot: especialidade que o jogador nomeia.
   nt: não pode ser marcada para desenvolvimento. my: Mitos de Cthulhu. */
const S=(id,n,b,c,o)=>Object.assign({id,n,b,c},o||{});
const SK0=[
  S('antropologia','Antropologia',1,'ger'),S('arqueologia','Arqueologia',1,'ger'),
  S('arremessar','Arremessar',20,'ger'),S('avaliacao','Avaliação',5,'ger'),
  S('cavalgar','Cavalgar',5,'ger'),S('charme','Charme',15,'ger'),S('chaveiro','Chaveiro',1,'ger'),
  S('contabilidade','Contabilidade',5,'ger'),S('credito','Nível de Crédito',0,'ger',{nt:true}),
  S('direito','Direito',5,'ger'),S('dirigir','Dirigir Automóveis',20,'ger'),S('disfarces','Disfarce',5,'ger'),
  S('encontrar','Encontrar',25,'ger'),S('escalar','Escalar',20,'ger'),S('esquivar','Esquivar','dex2','ger'),
  S('furtividade','Furtividade',20,'ger'),S('historia','História',5,'ger'),S('intimidacao','Intimidação',15,'ger'),
  S('labia','Lábia',5,'ger'),S('medicina','Medicina',1,'ger'),S('mitos','Mythos de Cthulhu',0,'ger',{nt:true,my:true}),
  S('mundo','Mundo Natural',10,'ger'),S('natacao','Natação',20,'ger'),S('navegacao','Navegação',10,'ger'),
  S('ocultismo','Ocultismo',5,'ger'),S('maquinario','Operar Maquinário Pesado',1,'ger'),
  S('ouvir','Escutar',20,'ger'),S('persuasao','Persuasão',10,'ger'),S('prestidigitacao','Prestidigitação',10,'ger'),
  S('primeiros','Primeiros Socorros',30,'ger'),S('psicanalise','Psicanálise',1,'ger'),
  S('psicologia','Psicologia',10,'ger'),S('rastrear','Rastrear',10,'ger'),
  S('reparoselet','Consertos Elétricos',10,'ger'),S('reparosmec','Consertos Mecânicos',10,'ger'),
  S('saltar','Saltar',20,'ger'),S('bibliotecas','Usar Bibliotecas',20,'ger'),
  S('eletronica','Eletrônica',1,'ger',{mod:true}),S('computadores','Usar Computadores',5,'ger',{mod:true}),
  S('briga','Briga',25,'luta',{pre:'Lutar'}),
  S('luta1','',20,'luta',{pre:'Lutar',slot:true}),
  S('pistola','Pistolas',20,'fogo',{pre:'Armas de fogo'}),
  S('rifle','Rifles/Espingardas',25,'fogo',{pre:'Armas de fogo'}),
  S('smg','Submetralhadoras',15,'fogo',{pre:'Armas de fogo'}),
  S('fogo1','',10,'fogo',{pre:'Armas de fogo',slot:true}),
  S('arte1','',5,'arte',{pre:'Arte/Ofício',slot:true}),S('arte2','',5,'arte',{pre:'Arte/Ofício',slot:true}),
  S('ciencia1','',1,'ciencia',{pre:'Ciência',slot:true}),S('ciencia2','',1,'ciencia',{pre:'Ciência',slot:true}),
  S('ciencia3','',1,'ciencia',{pre:'Ciência',slot:true}),
  S('nativo','Nativa','edu','idioma',{pre:'Língua'}),
  S('idioma1','',1,'idioma',{pre:'Língua',slot:true}),S('idioma2','',1,'idioma',{pre:'Língua',slot:true}),
  S('pilotar1','',1,'pilotar',{pre:'Pilotar',slot:true}),
  S('sobrev1','',10,'sobrev',{pre:'Sobrevivência',slot:true})
];
const SKDEF=Object.fromEntries(SK0.map(s=>[s.id,s]));

const DIFFN={reg:'Regular',hard:'Difícil',ext:'Extremo'};
const FLAGS=[['grave','Lesão grave'],['incons','Inconsciente'],['morr','Morrendo'],
             ['insT','Temporária'],['insI','Indefinida'],['insP','Permanente']];

const BKF=[['desc','Descrição pessoal'],['ideo','Ideologia e crenças'],['pess','Pessoas significativas'],
  ['loc','Locais importantes'],['pert','Pertences queridos'],['trac','Características'],
  ['ferm','Ferimentos e cicatrizes'],['fob','Fobias e manias'],['tomo','Tomos arcanos, feitiços e artefatos'],
  ['enc','Encontros com entidades estranhas'],['comp','Companheiros investigadores']];

/* Esquemas das listas editáveis: s = texto, n = número */
const SCH={
  atk:{n:'s',sk:'s',dano:'s',al:'s',nat:'s',mun:'s',mal:'s'},
  mag:{n:'s',pm:'n',san:'s',pod:'s',tmp:'s',d:'s'},
  inv:{n:'s',q:'n',d:'s'}
};

/* =====================================================================
   ESTADO E PERSISTÊNCIA
   ===================================================================== */
const KEY='coc-ficha-v1';
const SUPABASE_URL=APP_CONFIG.SUPABASE_URL;
const SUPABASE_KEY=APP_CONFIG.SUPABASE_KEY;
const CLOUD_TABLE=APP_CONFIG.CLOUD_TABLE;
const cloudClient=Cloud.client;
let cloudUser=null,activeCloudId=null,cloudSaveT=null,cloudSyncBusy=false,cloudSyncAgain=false,cloudRev=null,cloudConflict=false;

function fresh(){
  return{
    app:'coc',made:false,chave:'',
    who:{nome:'',ocup:'',idade:'',gen:'',res:'',nasc:'',av:''},
    car:Object.fromEntries(CARS.map(c=>[c[0],null])),
    cur:{pv:null,san:null,pm:null,sorte:null},
    fl:{grave:false,incons:false,morr:false,insT:false,insI:false,insP:false},
    dia:{ini:null,perd:0},
    sk:{},skx:[],
    atk:[{id:1,n:'Desarmado',sk:'briga',dano:'1D3+DX',al:'Toque',nat:'1',mun:'',mal:''}],
    mag:[],inv:[],
    bk:Object.fromEntries(BKF.map(f=>[f[0],''])),
    din:{gasto:'',cash:'',bens:''},armor:'',
    opt:{diff:'reg',dice:0},
    cfg:{rm:false,tick:true,frac:true,era:'20',sorte:true},
    hist:[],nid:2
  };
}

function cleanList(raw,key){
  const sch=SCH[key],used=new Set(),out=[];
  (Array.isArray(raw)?raw:[]).slice(0,200).forEach(x=>{
    if(!x||typeof x!=='object')return;
    const o={id:int(x.id,1,1e9,0)};
    Object.keys(sch).forEach(f=>{o[f]=sch[f]==='n'?(x[f]===''||x[f]==null?'':int(x[f],0,9999)):str(x[f],f==='d'?2000:120)});
    out.push(o);
  });
  return out;
}

function normalize(raw){
  const f=fresh(),r=(raw&&typeof raw==='object')?raw:{};
  const rw=r.who||{};
  Object.keys(f.who).forEach(k=>{f.who[k]=str(rw[k],k==='av'?600000:60)});
  if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(f.who.av))f.who.av='';
  CARS.forEach(([k])=>{const v=r.car&&r.car[k];f.car[k]=(v==null||v==='')?null:int(v,0,999)});
  Object.keys(f.cur).forEach(k=>{const v=r.cur&&r.cur[k];f.cur[k]=(v==null||v==='')?null:int(v,0,999)});
  Object.keys(f.fl).forEach(k=>{f.fl[k]=!!(r.fl&&r.fl[k])});
  f.dia={ini:(r.dia&&r.dia.ini!=null)?int(r.dia.ini,0,999):null,perd:int(r.dia&&r.dia.perd,0,999)};
  SK0.forEach(s=>{
    const st=r.sk&&r.sk[s.id];
    if(st&&typeof st==='object'){
      f.sk[s.id]={v:(st.v==null||st.v==='')?null:int(st.v,0,999),t:!!st.t,sp:str(st.sp,30)};
    }
  });
  const catIds=CATS.map(c=>c[0]);
  f.skx=(Array.isArray(r.skx)?r.skx:[]).slice(0,100).filter(x=>x&&typeof x==='object').map(x=>({
    id:int(x.id,1,1e9,0),n:str(x.n,40),b:int(x.b,0,99),c:catIds.includes(x.c)?x.c:'ger',
    v:(x.v==null||x.v==='')?null:int(x.v,0,999),t:!!x.t}));
  ['atk','mag','inv'].forEach(k=>{if(Array.isArray(r[k])||k!=='atk')f[k]=cleanList(r[k],k);});
  Object.keys(f.bk).forEach(k=>{f.bk[k]=str(r.bk&&r.bk[k],4000)});
  Object.keys(f.din).forEach(k=>{f.din[k]=str(r.din&&r.din[k],30)});
  f.armor=str(r.armor,80);
  f.opt={diff:['reg','hard','ext'].includes(r.opt&&r.opt.diff)?r.opt.diff:'reg',dice:int(r.opt&&r.opt.dice,-2,2)};
  f.cfg={rm:!!(r.cfg&&r.cfg.rm),tick:!(r.cfg&&r.cfg.tick===false),frac:!(r.cfg&&r.cfg.frac===false),
    era:(r.cfg&&r.cfg.era==='mod')?'mod':'20',sorte:!(r.cfg&&r.cfg.sorte===false)};
  f.made=r.made===undefined?!!((r.who&&r.who.nome)||CARS.some(([k])=>r.car&&r.car[k]!=null)):!!r.made;
  f.chave=['desc','ideo','pess','loc','pert','trac'].includes(r.chave)?r.chave:'';
  f.hist=(Array.isArray(r.hist)?r.hist:[]).slice(0,20).map(h=>({t:str(h&&h.t,80),s:str(h&&h.s,60)}));
  /* ids únicos em todas as listas */
  const used=new Set();let max=0;
  const all=[...f.skx,...f.atk,...f.mag,...f.inv];
  all.forEach(x=>{max=Math.max(max,x.id)});
  all.forEach(x=>{if(!x.id||used.has(x.id))x.id=++max;used.add(x.id)});
  f.nid=max+1;
  return f;
}

function load(){
  try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&typeof j==='object')return normalize(j)}catch(e){}
  return fresh();
}
const IDXK='coc-idx-v1',SLP='coc-slot-v1:';
const idxLoad=()=>{try{const j=JSON.parse(localStorage.getItem(IDXK));if(j&&Array.isArray(j.list))return{v:1,list:j.list.filter(x=>x&&x.id),cur:typeof j.cur==='string'?j.cur:null}}catch(e){}return{v:1,list:[],cur:null}};
const idxSave=x=>{try{localStorage.setItem(IDXK,JSON.stringify(x))}catch(e){}};
const newCocId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
(function(){const x=idxLoad();if(!x.cur){x.cur=newCocId();idxSave(x)}})();
function slotSync(){const x=idxLoad();if(!x.cur)return;try{localStorage.setItem(SLP+x.cur,JSON.stringify(D))}catch(e){}
  const listed=D.made||D.who.nome,i=x.list.findIndex(e=>e.id===x.cur);
  if(listed){const e={id:x.cur,nome:D.who.nome||'Investigador sem nome',ocup:D.who.ocup||'',t:Date.now()};if(i>=0)x.list[i]=e;else x.list.unshift(e)}else if(i>=0)x.list.splice(i,1);
  idxSave(x)}
let D=load(),saveT=null,warnedSave=false;
try{slotSync()}catch(e){}
function save(){clearTimeout(saveT);saveT=setTimeout(flush,250);if(cloudUser&&activeCloudId){clearTimeout(cloudSaveT);Cloud.ui.pending();cloudSaveT=setTimeout(()=>syncCocCloud(false,false),1200)}}
function flush(){flushCore();try{slotSync()}catch(e){}}
function flushCore(){
  clearTimeout(saveT);saveT=null;
  try{localStorage.setItem(KEY,JSON.stringify(D))}
  catch(e){if(!warnedSave){warnedSave=true;toast('Não foi possível salvar','O navegador bloqueou o armazenamento. Exporte um backup para não perder a ficha.')}}
}
window.cocFlush=flush;window.addEventListener('pagehide',flush);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const uid=()=>D.nid++;

const sysRM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
const rm=()=>sysRM||D.cfg.rm;
function applyRM(){document.documentElement.toggleAttribute('data-rm',rm())}

/* =====================================================================
   PERÍCIAS: leitura e valores
   ===================================================================== */
const has=k=>D.car[k]!=null;
const C=k=>num(D.car[k]);

function skBase(s){
  if(typeof s.b==='number')return s.b;
  if(s.b==='dex2')return Math.floor(C('DES')/2);
  if(s.b==='edu')return C('EDU');
  return 0;
}
function getSk(id){
  const d=SKDEF[id];
  if(d){const st=D.sk[id]||{};return Object.assign({},d,{v:st.v==null?null:st.v,t:!!st.t,sp:st.sp||'',custom:false})}
  const x=D.skx.find(k=>k.id===+id);
  return x?Object.assign({},x,{custom:true}):null;
}
function skState(id){
  if(SKDEF[id]){if(!D.sk[id])D.sk[id]={v:null,t:false,sp:''};return D.sk[id]}
  return D.skx.find(k=>k.id===+id);
}
const skVal=s=>s.v!=null?s.v:skBase(s);
const allSk=()=>[...SK0.filter(s=>!s.mod||D.cfg.era==='mod').map(s=>getSk(s.id)),...D.skx.map(x=>getSk(x.id))];
function skTitle(s){
  if(s.slot)return s.pre+' ('+(s.sp||'—')+')';
  if(s.pre)return s.pre+' ('+s.n+')';
  return s.n;
}
function skLabel(s){return s.slot?(s.sp||''):s.n}

/* =====================================================================
   VALORES DERIVADOS
   ===================================================================== */
function dbInfo(){
  if(!has('FOR')||!has('TAM'))return{str:'',label:'—',build:null};
  const t=C('FOR')+C('TAM');
  if(t<=64)return{str:'-2',label:'−2',build:-2};
  if(t<=84)return{str:'-1',label:'−1',build:-1};
  if(t<=124)return{str:'',label:'0',build:0};
  if(t<=164)return{str:'+1D4',label:'+1D4',build:1};
  if(t<=204)return{str:'+1D6',label:'+1D6',build:2};
  const k=Math.floor((t-205)/80)+1;
  return{str:'+'+(1+k)+'D6',label:'+'+(1+k)+'D6',build:2+k};
}
function movInfo(){
  if(!has('FOR')||!has('DES')||!has('TAM'))return null;
  const f=C('FOR'),d=C('DES'),t=C('TAM');
  let m=(f<t&&d<t)?7:(f>t&&d>t)?9:8;
  const age=int(D.who.idade,0,150);
  if(age>=40)m-=Math.min(5,Math.floor(age/10)-3);
  return Math.max(0,m);
}
function barMax(k){
  if(k==='pv')return(has('CON')&&has('TAM'))?Math.floor((C('CON')+C('TAM'))/10):0;
  if(k==='pm')return has('POD')?Math.floor(C('POD')/5):0;
  if(k==='san'){const my=getSk('mitos');return Math.max(0,99-skVal(my))}
  return 99;
}
function barKnown(k){
  if(k==='pv')return has('CON')&&has('TAM');
  if(k==='pm')return has('POD');
  if(k==='san')return has('POD')||D.cur.san!=null;
  return D.cur.sorte!=null;
}
function barCur(k){
  const m=barMax(k),c=D.cur[k];
  if(c==null){
    if(k==='san')return has('POD')?Math.min(C('POD'),m):0;
    if(k==='sorte')return null;
    return m;
  }
  return clamp(c,0,m);
}

/* =====================================================================
   REGRAS DO d100
   ===================================================================== */
function rollD100(dice){
  const units=rnd(0,9),n=1+Math.abs(dice);
  const tens=Array.from({length:n},()=>rnd(0,9)*10);
  const cands=tens.map(t=>{const r=t+units;return r===0?100:r});
  let pick=0;
  cands.forEach((r,i)=>{
    if(dice>0&&r<cands[pick])pick=i;
    if(dice<0&&r>cands[pick])pick=i;
  });
  return{units,tens,cands,pick,total:cands[pick]};
}

function pctRoll(o){
  const v=Math.max(0,o.v|0),half=Math.floor(v/2),fifth=Math.floor(v/5);
  const diff=o.diff||'reg',needed=diff==='ext'?fifth:diff==='hard'?half:v;
  const d=rollD100(o.dice||0);
  return Object.assign({kind:'pct',title:o.title,v,half,fifth,diff,dice:o.dice||0,needed,
    tickId:o.tick||null,mal:o.mal||0,canPush:!!o.push,canLuck:!!o.luck,noAgain:!!o.noAgain,post:o.post||null,
    notes:o.note?[o.note]:[],pushed:false,spent:0,ticked:false},d);
}

function judge(r){
  const t=r.total;
  const lvl=t===1?'crit':t<=r.fifth?'ext':t<=r.half?'hard':t<=r.v?'reg':'fail';
  const fumble=t===100||(t>=96&&r.needed<50&&t>r.needed);
  r.ok=!fumble&&(t===1||t<=r.needed);
  r.lvl=fumble?'fumble':lvl;
  r.label=fumble?'Desastre':!r.ok?'Fracasso':
    lvl==='crit'?'Sucesso Crítico':lvl==='ext'?'Sucesso Extremo':lvl==='hard'?'Sucesso Difícil':'Sucesso Regular';
  r.cls=fumble||!r.ok?'bad':lvl==='crit'||lvl==='ext'?'crit':'ok';
}

/* fórmulas de dano: 2d6+3, 1D8+DB */
function halfDB(db){
  const t=String(db).replace(/^\+/,'');
  if(t[0]==='-'){const n=Math.floor((+t.slice(1)||0)/2);return n?'-'+n:''}
  const m=/^(\d*)D(\d+)$/i.exec(t);
  return m?(+m[1]||1)+'D'+Math.max(2,Math.ceil(+m[2]/2)):'';
}
function expandDB(f){
  f=String(f||'').replace(/\s*([+-]?)\s*meio\s*D[BX]/gi,(m,sg)=>{
    const h=halfDB(dbInfo().str||'');
    return h?((h[0]==='-'?'':(sg==='-'?'-':'+'))+h):'';
  });
  return String(f||'').replace(/\s*([+-]?)\s*D[BX]/gi,(m,sg)=>{
    const db=dbInfo().str;
    if(!db)return'';
    if(db[0]==='-')return db;
    return(sg==='-'?'-':'+')+db.replace(/^\+/,'');
  });
}
function parseF(raw){
  const s=String(raw||'').replace(/\s+/g,'').replace(/[−–]/g,'-').toLowerCase();
  if(!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(s))return null;
  const re=/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g,t=[];let m;
  while((m=re.exec(s))){
    if(m[3])t.push({sg:m[1]==='-'?-1:1,n:Math.min(+m[2]||1,100),s:Math.max(1,+m[3])});
    else t.push({sg:m[4]==='-'?-1:1,k:+m[5]});
  }
  return t.length?t:null;
}
function evalF(t,max){
  let total=0;const flat=[],parts=[];
  t.forEach(x=>{
    if(x.s){
      const res=Array.from({length:x.n},()=>max?x.s:rnd(1,x.s)),sm=res.reduce((a,b)=>a+b,0);
      total+=x.sg*sm;res.forEach(v=>flat.push({v,s:x.s}));
      parts.push((x.sg<0?'− ':'')+x.n+'d'+x.s+' ['+res.join(', ')+']');
    }else{total+=x.sg*x.k;parts.push((x.sg<0?'−':'+')+x.k)}
  });
  return{total,flat,parts};
}
function sumRoll(title,formula,o){
  o=o||{};
  const f=expandDB(formula),t=parseF(f);
  if(!t){toast('Fórmula inválida','Use algo como 1d6+2 ou 1D8+DB.');return null}
  const e=evalF(t,false),shown=e.flat.slice(0,24);
  return{kind:'sum',title,flat:shown,more:e.flat.length-shown.length,total:e.total,
    info:[e.parts.join(' ')],notes:[],noAgain:!!o.noAgain,post:o.post||null,
    sumText:String(formula).toUpperCase()+' = '+e.total};
}

/* Dinheiro e patrimônio por Nível de Crédito (Tabela II do livro) */
function moneyTable(cr,era){
  const f=n=>'$'+n.toLocaleString('pt-BR',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2});
  const m=era==='mod';
  if(cr<=0)return m?[f(10),f(10),'Nenhum']:[f(.5),f(.5),'Nenhum'];
  if(cr<=9)return m?[f(40),f(cr*20),f(cr*200)]:[f(2),f(cr),f(cr*10)];
  if(cr<=49)return m?[f(200),f(cr*40),f(cr*1000)]:[f(10),f(cr*2),f(cr*50)];
  if(cr<=89)return m?[f(1000),f(cr*100),f(cr*10000)]:[f(50),f(cr*5),f(cr*500)];
  if(cr<=98)return m?[f(5000),f(cr*400),f(cr*40000)]:[f(250),f(cr*20),f(cr*2000)];
  return m?[f(100000),'$1 milhão','$100 milhões+']:[f(5000),f(50000),'$5 milhões+'];
}
const LIVING=[[0,'Pobretão','Vive na rua, sem teto garantido.'],[1,'Pobre','Um teto simples e uma refeição modesta por dia.'],
  [10,'Médio','Conforto razoável: casa ou apartamento comum, três refeições e um lazer de vez em quando.'],
  [50,'Abastado','Luxo e conforto: residência grande, talvez criados, viagens de primeira classe.'],
  [90,'Rico','Grande luxo: propriedades, vários empregados e os melhores hotéis.'],[99,'Ricaço','Dinheiro deixou de ser um problema.']];
const livingOf=cr=>LIVING.filter(l=>cr>=l[0]).pop();

/* =====================================================================
   AVISOS, MODAIS E EFEITOS
   ===================================================================== */
let toastT=null,toastAct=null;
function toast(t,m,opt){
  const el=$('#toast'),b=$('#tu');
  $('#tt').textContent=t;$('#tm').textContent=m||'';
  toastAct=(opt&&opt.act)||null;b.hidden=!toastAct;
  if(toastAct)b.textContent=opt.label||'Desfazer';
  el.classList.add('on');clearTimeout(toastT);
  toastT=setTimeout(()=>el.classList.remove('on'),(opt&&opt.ms)||(toastAct?6000:3600));
}
$('#tu').onclick=()=>{if(toastAct){const a=toastAct;toastAct=null;$('#toast').classList.remove('on');a()}};

function openM(id){
  const m=$('#'+id);m._op=document.activeElement;clearTimeout(m._t);m.classList.remove('out');m.hidden=false;
  const b=$('.mbox',m);if(b){b.tabIndex=-1;b.style.outline='0';b.focus({preventScroll:true})}
}
function closeM(id){
  const m=$('#'+id);if(m.hidden||m.classList.contains('out'))return;
  const done=()=>{
    m.hidden=true;m.classList.remove('out');
    if(m._op&&document.contains(m._op)&&!$$('[data-trap]').some(x=>!x.hidden)){try{m._op.focus({preventScroll:true})}catch(e){}}
  };
  if(rm()){done();return}
  m.classList.add('out');m._t=setTimeout(done,170);
}
$$('.modal').forEach(m=>m.addEventListener('click',e=>{
  if(e.target===m||e.target.closest('[data-close]'))closeM(m.id);
}));
document.addEventListener('keydown',e=>{
  const open=$$('[data-trap]').filter(x=>!x.hidden).pop();
  if(!open)return;
  if(e.key==='Escape'){if(open.id==='rov')closeRoll();else closeM(open.id);return}
  if(e.key!=='Tab')return;
  const f=$$('button,input,select,textarea',open).filter(x=>!x.disabled&&!x.hidden&&x.offsetParent!==null);
  if(!f.length)return;
  const first=f[0],last=f[f.length-1],a=document.activeElement,box=$('.mbox,.rbox',open);
  if(e.shiftKey&&(a===first||a===box)){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&a===last){e.preventDefault();first.focus()}
});

function shake(el){
  if(rm()||!el||!el.animate)return;
  el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:300});
}
function edge(color){
  if(rm())return;const h=$('#hit');h.style.setProperty('--hc',color);
  h.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:520});
}
async function copyText(t){
  try{await navigator.clipboard.writeText(t);return true}
  catch(e){
    const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();let ok=false;
    try{ok=document.execCommand('copy')}catch(x){}
    ta.remove();return ok;
  }
}

/* =====================================================================
   ROLAGEM (overlay)
   ===================================================================== */
const rov=$('#rov');
let busy=false,okRes=null,okReady=false,curR=null;
function closeRoll(v){if(okReady){okReady=false;if(okRes)okRes(v)}}
$('#rOk').onclick=()=>closeRoll();
$('#rAgain').onclick=()=>closeRoll('again');
$('#rPush').onclick=()=>closeRoll('push');
rov.addEventListener('click',e=>{if(e.target===rov)closeRoll()});

const dieSvg=(cls,t)=>'<svg class="die '+cls+'" viewBox="0 0 100 100" aria-hidden="true"><use href="#d10"/><text x="50" y="52" text-anchor="middle" dominant-baseline="central">'+t+'</text></svg>';
const setT=(e,t)=>{if(e.namespaceURI.indexOf('svg')>-1)$('text',e).textContent=t;else e.textContent=t};

function rollText(r){
  const who=D.who.nome||'Investigador';
  if(r.kind==='pct')return who+' — '+r.title+': '+r.total+' (alvo '+r.needed+', '+DIFFN[r.diff].toLowerCase()+') → '+r.label;
  return who+' — '+r.title+': '+r.total;
}
function infoLines(r){
  const L=[];
  if(r.kind==='pct'){
    if(r.diff==='reg')L.push('Alvo <b>'+r.needed+'</b>');
    else L.push('Alvo <b>'+r.needed+'</b> ('+DIFFN[r.diff].toLowerCase()+': '+(r.diff==='hard'?'metade':'um quinto')+' de '+r.v+')');
    if(r.dice)L.push('Dezenas: '+r.tens.map(t=>String(t).padStart(2,'0')).join(', ')+' → '+(r.dice>0?'bônus, vale a menor':'penalidade, vale a maior'));
    if(!r.ok&&r.lvl!=='fumble'&&r.total<=r.v&&r.total>r.needed)L.push('Passaria no nível normal, mas o alvo era '+r.needed+'.');
    if(r.spent)L.push('Sorte gasta: <b>'+r.spent+'</b> (resultado original '+(r.total+r.spent)+')');
  }else r.info.forEach(x=>L.push(esc(x)));
  r.notes.forEach(n=>L.push(esc(n)));
  if(r.dyn)(r.dyn(r)||[]).forEach(x=>L.push(x));
  (r.postLines||[]).forEach(x=>L.push(x));
  if(r.autoLine)L.push(r.autoLine);
  return L;
}
function paintResult(r){
  const s=$('#rs'),l=$('#rl');
  s.textContent=r.total;s.className='rs'+(r.cls?' '+r.cls:'');s.style.opacity=1;
  l.className='rl'+(r.cls?' '+r.cls:'');l.textContent=r.kind==='pct'?r.label:'';
  $('#ri').innerHTML=infoLines(r).map(x=>'<div>'+x+'</div>').join('');
}
function refreshRollButtons(r){
  const sorte=barCur('sorte')||0,need=r.total-r.needed;
  /* livro: críticos, desastres e defeitos de arma nunca mudam; nem teste forçado */
  const locked=r.lvl==='fumble'||r.total===1||(r.mal&&r.total>=r.mal)||r.pushed;
  const canL=D.cfg.sorte&&r.kind==='pct'&&r.canLuck&&!locked&&!r.ok&&need>0&&need<=sorte&&r.total-need>=1;
  const lk=$('#rLuck');lk.hidden=!canL;if(canL)lk.textContent='Gastar '+need+' de Sorte';
  $('#rPush').hidden=!(r.kind==='pct'&&r.canPush&&!r.ok&&r.lvl!=='fumble'&&!r.pushed&&!r.spent);
  $('#rAgain').hidden=!!r.noAgain;
  $('#rCopy').hidden=false;$('#rOk').hidden=false;
}
function autoTick(r){
  if(!r.tickId||!r.ok||r.ticked||r.spent||!D.cfg.tick)return;
  const s=getSk(r.tickId);if(!s||s.nt)return;
  r.ticked=true;
  const st=skState(r.tickId);
  if(st&&!st.t){st.t=true;save();updateSkRow(String(r.tickId));r.autoLine='Perícia marcada para desenvolvimento.'}
}
function addHist(r){
  if(r.h)return;
  r.h={t:r.title,s:r.kind==='pct'?(r.total+' · '+r.label):r.sumText};
  D.hist.unshift(r.h);D.hist.length=Math.min(D.hist.length,20);save();
}
function updateHist(r){if(r.h){r.h.s=r.total+' · '+r.label;save()}}

async function present(r){
  curR=r;
  const d=$('#rd'),s=$('#rs'),fast=rm();
  [rov,s].forEach(e=>{if(e.getAnimations)e.getAnimations().forEach(a=>a.cancel())});
  $('#rt').textContent=r.title;s.className='rs';s.textContent='';s.style.opacity=0;
  $('#rl').className='rl';$('#rl').textContent='';$('#ri').innerHTML='';
  ['rOk','rAgain','rPush','rLuck','rCopy'].forEach(id=>{$('#'+id).hidden=true});
  if(rov.hidden)rov._op=document.activeElement;
  rov.hidden=false;
  if(!fast)rov.animate([{opacity:0},{opacity:1}],{duration:140});

  if(r.kind==='pct'){
    d.innerHTML='<div class="dg">'+r.tens.map(()=>dieSvg('tens','00')).join('')+'</div><span class="plus">+</span><div class="dg">'+dieSvg('units','0')+'</div>';
  }else{
    d.innerHTML=r.flat.map(()=>'<span class="chip2">0</span>').join('')+(r.more?'<span class="more">+'+r.more+'</span>':'');
  }
  const els=$$('.die,.chip2',d);
  const finals=r.kind==='pct'?[...r.tens.map(t=>String(t).padStart(2,'0')),String(r.units)]:r.flat.map(x=>String(x.v));
  const rands=r.kind==='pct'
    ?[...r.tens.map(()=>()=>String(rnd(0,9)*10).padStart(2,'0')),()=>String(rnd(0,9))]
    :r.flat.map(x=>()=>String(rnd(1,x.s)));
  const items3=r.kind==='pct'?r.tens.map((t,k)=>({raw:true,N:10,mode:'tens',v:t/10+1,item:k})).concat([{raw:true,N:10,mode:'unit',v:r.units+1,item:r.tens.length}]):r.flat.map(x=>({s:x.s,v:x.v}));
  const d3=!fast&&dice3dOn()&&window.DiceFx&&DiceFx.can(items3)&&!(r.kind!=='pct'&&r.more);let fx=null;
  if(d3){d.innerHTML='';try{fx=DiceFx.mount(d,items3);await fx.roll()}catch(e){fx=null}}
  if(!fast&&els.length&&!d3){
    const iv=setInterval(()=>els.forEach((e,k)=>setT(e,rands[k]())),55);
    await Promise.all(els.map((e,k)=>e.animate(
      [{transform:'translateY(0) rotate(0) scale(.8)'},{transform:'translateY(-24px) rotate(300deg) scale(1.08)',offset:.45},{transform:'translateY(0) rotate(720deg) scale(1)'}],
      {duration:800+k*60,easing:'cubic-bezier(.25,.7,.3,1)'}).finished));
    clearInterval(iv);
  }
  els.forEach((e,k)=>setT(e,finals[k]));
  if(r.kind==='pct'&&r.tens.length>1)els.slice(0,r.tens.length).forEach((e,k)=>e.classList.add(k===r.pick?'pick':'dim'));
  if(fx&&r.kind==='pct'&&r.tens.length>1)fx.pick([r.pick,r.tens.length]);

  if(r.kind==='pct'){judge(r);autoTick(r)}
  if(r.post&&!r.postDone){r.postDone=true;r.postLines=r.post(r)||[]}
  addHist(r);
  paintResult(r);
  if(!fast)s.animate([{opacity:0,transform:'rotate(-2deg) scale(1.8)'},{opacity:1,transform:'rotate(-2deg) scale(1)'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
  if(r.kind==='pct'&&r.lvl==='fumble'){shake($('.rbox',rov));edge('rgba(200,72,59,.5)')}
  refreshRollButtons(r);
  await wait(fast?0:200);
  return new Promise(res=>{okRes=res;okReady=true;try{$('#rOk').focus({preventScroll:true})}catch(x){}});
}

$('#rLuck').onclick=()=>{
  const r=curR;if(!r||r.kind!=='pct')return;
  const need=r.total-r.needed,sorte=barCur('sorte')||0;
  if(need<=0||need>sorte)return;
  setCur('sorte',sorte-need);
  r.total-=need;r.spent+=need;judge(r);r.notes.push('Sorte gasta: esta perícia não ganha marca de desenvolvimento.');updateHist(r);
  paintResult(r);refreshRollButtons(r);
  toast('Sorte gasta','−'+need+' de Sorte. Restam '+barCur('sorte')+'.');
};
$('#rCopy').onclick=async()=>{
  const ok=await copyText(rollText(curR));
  toast(ok?'Resultado copiado':'Não foi possível copiar',ok?'Cole no chat da mesa.':'Selecione e copie manualmente.');
};

async function show(factory){
  if(busy)return;
  let r=factory();if(!r)return;
  busy=true;
  try{
    while(r){
      const a=await present(r);
      if(a==='again')r=factory();
      else if(a==='push'){
        const p=factory();
        if(p){p.pushed=true;p.canPush=false;p.canLuck=false;p.notes.push('Teste forçado: se falhar de novo, a consequência é grave.')}
        r=p;
      }else break;
    }
  }finally{
    if(!rm())await rov.animate([{opacity:1},{opacity:0}],{duration:150}).finished;
    rov.hidden=true;busy=false;
    if(rov._op&&document.contains(rov._op)){try{rov._op.focus({preventScroll:true})}catch(e){}}
  }
}

/* testes */
function testSkill(id){
  const s=getSk(id);if(!s)return;
  show(()=>pctRoll({title:skTitle(s),v:skVal(s),diff:D.opt.diff,dice:D.opt.dice,tick:s.id,push:true,luck:true}));
}
function testCar(k){
  if(!has(k)){toast('Defina o valor',CNAME[k]+' ainda está vazia. Ative o modo de edição para digitar.');return}
  show(()=>pctRoll({title:'Teste de '+CNAME[k],v:C(k),diff:D.opt.diff,dice:D.opt.dice,push:true,luck:true}));
}
function testLuck(){
  if(D.cur.sorte==null){toast('Defina a Sorte','Digite o valor da Sorte antes de testar.');return}
  show(()=>pctRoll({title:'Teste de Sorte',v:barCur('sorte'),diff:D.opt.diff,dice:D.opt.dice}));
}
function rollAttack(w){
  const s=getSk(w.sk)||getSk('briga'),mal=int(w.mal,0,100);
  show(()=>{
    const r=pctRoll({title:'Ataque — '+(w.n||'Arma')+' ('+skTitle(s)+')',v:skVal(s),diff:D.opt.diff,dice:D.opt.dice,tick:s.id,luck:true,mal:mal});
    r.dyn=rr=>{
      const L=[];
      if(mal&&rr.total>=mal)L.push('<span class="warn">Defeito: o resultado chegou a '+mal+' ou mais. A arma pode falhar.</span>');
      if(rr.ok&&rr.lvl==='ext')L.push('Sucesso extremo: armas perfurantes empalam (dano máximo mais uma rolagem de dano).');
      return L;
    };
    return r;
  });
}
function rollDamage(w){show(()=>sumRoll('Dano — '+(w.n||'Arma'),w.dano))}

/* =====================================================================
   BARRAS: PV, SANIDADE, PM, SORTE
   ===================================================================== */
const VK=[['pv','Pontos de vida','i-heart'],['san','Sanidade','i-san'],['pm','Pontos de magia','i-pm'],['sorte','Sorte','i-luck']];
const flagChip=k=>'<button class="chip'+(k.indexOf('ins')===0?' psy':'')+'" type="button" data-fl="'+k+'" aria-pressed="false">'+FLAGS.find(f=>f[0]===k)[1]+'</button>';

function buildVitals(){
  $('#vits').innerHTML=VK.map(([k,n,ic])=>{
    let extra='';
    if(k==='pv')extra='<div class="chips">'+['grave','incons','morr'].map(flagChip).join('')+'</div>';
    if(k==='san')extra='<div class="vx"><span id="sanDia"></span><button class="btn sm" type="button" data-act="santest">Testar</button></div>'+
      '<div class="chips" role="group" aria-label="Insanidade">'+['insT','insI','insP'].map(flagChip).join('')+'</div>';
    if(k==='sorte')extra='<div class="vx"><span>Máx. 99</span><button class="btn sm" type="button" data-act="lucktest">Testar</button></div>';
    return'<div class="vit" data-k="'+k+'" id="v-'+k+'"><div class="vh">'+GI(ic)+'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#'+ic+'"/></svg><span>'+n+'</span></div>'+
      '<button class="vn" type="button" data-adj aria-label="Ajustar '+n+'"><b class="cur">—</b><span class="sl">/</span><span class="mx">—</span></button>'+
      '<div class="vbar"><u class="trail"></u><i class="fill"></i></div>'+
      '<div class="vc"><button class="st" type="button" data-d="-1" aria-label="Diminuir '+n+'">−</button><button class="st" type="button" data-d="1" aria-label="Aumentar '+n+'">+</button></div>'+extra+'</div>';
  }).join('');
  $('#hud').innerHTML=VK.map(([k,n,ic])=>'<button class="pill" type="button" data-k="'+k+'" aria-label="'+n+': ajustar">'+GI(ic)+'<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#'+ic+'"/></svg><b>—</b><span></span></button>').join('');
}

function paintBar(k,old){
  const el=$('#v-'+k);if(!el)return;
  const known=barKnown(k),max=barMax(k),cur=barCur(k);
  const shown=known&&cur!=null?cur:'—';
  $('.cur',el).textContent=shown;
  if(k==='sorte'){$('.mx',el).textContent='';$('.sl',el).textContent=''}
  else{$('.sl',el).textContent='/';$('.mx',el).textContent=known?max:'—'}
  const p=(!known||cur==null)?0:(k==='sorte'?cur:(max?cur/max*100:0));
  $('.fill',el).style.width=p+'%';
  const tr=$('.trail',el);
  if(old!=null&&cur!=null&&cur<old&&!rm()){
    const op=k==='sorte'?old:(max?old/max*100:0);
    if(tr._a)tr._a.cancel();
    tr.style.width=op+'%';
    const a=tr.animate([{width:op+'%'},{width:op+'%',offset:.3},{width:p+'%'}],{duration:800,easing:'ease-out'});
    tr._a=a;a.onfinish=()=>{tr.style.width=p+'%';if(tr._a===a)tr._a=null};
    shake(el);
    if(k==='pv')edge('rgba(200,72,59,.45)');else if(k==='san')edge('rgba(63,159,184,.4)');
  }else{if(tr._a){tr._a.cancel();tr._a=null}tr.style.width=p+'%'}
  el.classList.toggle('low',k==='pv'&&known&&max>0&&cur/max<=.25);
  const pill=$('#hud .pill[data-k='+k+']');
  if(pill){$('b',pill).textContent=shown;$('span',pill).textContent=k==='sorte'?'':(known?'/'+max:'')}
  if(!$('#mAdj').hidden)paintAdj();
}
function paintFlags(){
  $$('[data-fl]').forEach(b=>b.setAttribute('aria-pressed',String(!!D.fl[b.dataset.fl])));
  const t=$('#sanDia');
  if(t){
    const lim=D.dia.ini!=null?Math.floor(D.dia.ini/5):null;
    t.textContent=(D.dia.perd||D.dia.ini!=null)?('Hoje −'+D.dia.perd+(lim?'/'+lim:'')):'Hoje 0';
    t.title='Sanidade perdida hoje e limite de 1/5 para insanidade indefinida';
  }
}
function paintVitals(){VK.forEach(([k])=>paintBar(k,null));paintFlags()}
function setCur(k,v){
  const old=barCur(k);
  D.cur[k]=clamp(Math.round(v),0,barMax(k));
  paintBar(k,old);save();
}

function pvHit(dmg,nv,max){
  const msgs=[];
  if(max>0&&dmg>max)msgs.push('Dano maior que o PV máximo: morte instantânea, a menos que o Keeper decida outra coisa.');
  if(max>0&&dmg*2>=max&&!D.fl.grave){D.fl.grave=true;msgs.push('Lesão grave: o golpe tirou metade do PV máximo ou mais.')}
  if(nv===0){
    if(D.fl.grave){D.fl.morr=true;D.fl.incons=false;msgs.push('PV em 0 com lesão grave: o investigador está morrendo.')}
    else{D.fl.incons=true;msgs.push('PV em 0: o investigador fica inconsciente.')}
  }
  if(msgs.length)toast('Vida',msgs.join(' '),{ms:7000});
  paintFlags();
}
function loseSan(n){
  if(n<=0)return;
  const old=barCur('san')||0,nv=Math.max(0,old-n);
  if(D.dia.ini==null)D.dia.ini=old;
  D.dia.perd+=old-nv;
  setCur('san',nv);
  const msgs=[],lim=Math.floor(D.dia.ini/5);
  if(n>=5)msgs.push('Perda de 5 ou mais de uma vez: faça um teste de Inteligência. Se passar, o investigador entende o horror e fica temporariamente insano.');
  if(lim>0&&D.dia.perd>=lim&&!D.fl.insI){D.fl.insI=true;msgs.push('Perdeu 1/5 da Sanidade do início do dia: insanidade indefinida.')}
  if(nv===0&&!D.fl.insP){D.fl.insP=true;msgs.push('Sanidade em 0: insanidade permanente.')}
  if(msgs.length)toast('Sanidade',msgs.join(' '),{ms:8000});
  paintFlags();save();
}
function applyDelta(k,d){
  if(!barKnown(k)){toast('Defina os valores',k==='pv'?'Informe Constituição e Tamanho primeiro.':k==='sorte'?'Digite a Sorte no ajuste rápido.':'Informe o Poder primeiro.');return}
  const old=barCur(k)||0;
  if(k==='sorte'){setCur(k,old+d);return}
  if(k==='san'&&d<0){loseSan(-d);return}
  const max=barMax(k),nv=clamp(old+d,0,max);
  setCur(k,nv);
  if(k==='pv'&&d<0)pvHit(-d,nv,max);
}

/* toque longo repete os botões − e + */
let hold=null,held=false;
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.vc .st');if(!b)return;
  held=false;const k=b.closest('.vit').dataset.k,d=+b.dataset.d;
  hold=setTimeout(function rep(){held=true;applyDelta(k,d);hold=setTimeout(rep,110)},450);
});
['pointerup','pointercancel','pointerleave'].forEach(t=>document.addEventListener(t,()=>clearTimeout(hold)));
$('#vits').addEventListener('click',e=>{
  const st=e.target.closest('.vc .st'),k=e.target.closest('.vit')&&e.target.closest('.vit').dataset.k;
  if(st){if(held){held=false;return}applyDelta(k,+st.dataset.d);return}
  if(e.target.closest('[data-adj]')){openAdj(k);return}
  const fl=e.target.closest('[data-fl]');
  if(fl){D.fl[fl.dataset.fl]=!D.fl[fl.dataset.fl];paintFlags();save();return}
  const act=e.target.closest('[data-act]');
  if(act){if(act.dataset.act==='santest')openSanTest();else if(act.dataset.act==='lucktest')testLuck()}
});
$('#hud').addEventListener('click',e=>{const p=e.target.closest('.pill');if(p)openAdj(p.dataset.k)});

/* mostra o resumo fixo quando os vitais saem da tela (celular) */
if('IntersectionObserver' in window){
  new IntersectionObserver(([en])=>{
    const on=!en.isIntersecting&&en.boundingClientRect.bottom<0;
    $('#hud').classList.toggle('on',on);
    document.documentElement.style.setProperty('--hudh',on?'56px':'0px');
  }).observe($('#vits'));
}

/* ---------- ajuste rápido ---------- */
let adjK='pv';
const ADJ={pv:['Pontos de vida','Sofrer dano','Curar'],san:['Sanidade','Perder','Recuperar'],pm:['Pontos de magia','Gastar','Recuperar'],sorte:['Sorte','Gastar','Ganhar']};
function paintAdj(){
  const k=adjK,known=barKnown(k),cur=barCur(k);
  $('#adjCur').textContent=known&&cur!=null?cur:'—';
  $('#adjMax').textContent=k==='sorte'?'':(known?'/ '+barMax(k):'');
}
function openAdj(k){
  adjK=k;const a=ADJ[k];
  $('#adjT').textContent=a[0];$('#adjLose').textContent=a[1];$('#adjGain').textContent=a[2];$('#adjN').value='';
  const x=$('#adjX');x.innerHTML='';
  if(k==='san')x.innerHTML='<button class="btn" type="button" data-x="santest">Teste de Sanidade</button><button class="btn" type="button" data-x="newday">Novo dia</button>';
  if(k==='sorte')x.innerHTML='<button class="btn" type="button" data-x="lucktest">Teste de Sorte</button><button class="btn" type="button" data-x="luckgain">Fim da sessão: melhorar Sorte</button>';
  paintAdj();openM('mAdj');
}
$('#adjQ').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(b)applyDelta(adjK,+b.dataset.q)});
$('#adjLose').onclick=()=>{const n=int($('#adjN').value,0,999);if(n){applyDelta(adjK,-n);$('#adjN').value=''}};
$('#adjGain').onclick=()=>{
  const n=int($('#adjN').value,0,999);if(!n)return;
  if(adjK==='sorte'&&D.cur.sorte==null){setCur('sorte',n)}else applyDelta(adjK,n);
  $('#adjN').value='';
};
$('#adjX').addEventListener('click',e=>{
  const b=e.target.closest('[data-x]');if(!b)return;
  if(b.dataset.x==='santest'){closeM('mAdj');openSanTest()}
  else if(b.dataset.x==='lucktest'){closeM('mAdj');testLuck()}
  else if(b.dataset.x==='newday')newDay();
  else if(b.dataset.x==='luckgain')luckImprove();
});
function luckImprove(){
  if(D.cur.sorte==null){toast('Defina a Sorte','Digite o valor da Sorte antes.');return}
  const cur=barCur('sorte'),r=rnd(1,100);
  if(r>cur){const g=rnd(1,10);setCur('sorte',Math.min(99,cur+g));toast('Sorte melhorou','Rolou '+r+' (acima de '+cur+'): +'+g+'. Sorte agora '+barCur('sorte')+'.',{ms:6000})}
  else toast('Sorte não melhorou','Rolou '+r+', que não passa de '+cur+'.',{ms:5000});
}
function newDay(){
  D.dia={ini:barKnown('san')?barCur('san'):null,perd:0};
  paintFlags();save();toast('Novo dia','O limite de 1/5 da Sanidade foi recalculado.');
}

/* ---------- teste de Sanidade ---------- */
function openSanTest(){
  if(!barKnown('san')){toast('Defina o Poder','A Sanidade inicial é igual ao Poder.');return}
  openM('mSan');
}
$('#sanGo').onclick=()=>{
  const fo=$('#sanOk').value.trim()||'0',ff=$('#sanFail').value.trim()||'0';
  const to=parseF(fo),tf=parseF(ff);
  if(!to||!tf){toast('Fórmula inválida','Use números ou dados, como 0, 1 ou 1d6+1.');return}
  closeM('mSan');
  show(()=>pctRoll({title:'Teste de Sanidade',v:barCur('san'),diff:'reg',dice:0,noAgain:true,
    post:r=>{
      const f=r.ok?to:tf,max=r.lvl==='fumble',e=evalF(f,max);
      loseSan(e.total);
      return['Perda de Sanidade: <b>'+e.total+'</b>'+(max?' (desastre: perda máxima)':'')+' <span style="opacity:.7">'+esc(e.parts.join(' '))+'</span>'];
    }}));
};

/* =====================================================================
   INVESTIGADOR (identidade e retrato)
   ===================================================================== */
const WHO=[['w-nome','nome'],['w-ocup','ocup'],['w-idade','idade'],['w-gen','gen'],['w-res','res'],['w-nasc','nasc']];
WHO.forEach(([id,k])=>{
  $('#'+id).addEventListener('input',e=>{
    D.who[k]=str(e.target.value,60);save();
    if(k==='idade')paintCombat();
  });
});
function paintAvatar(){
  const im=$('#avimg');
  if(D.who.av){im.src=D.who.av;im.hidden=false}else{im.removeAttribute('src');im.hidden=true}
}
$('#avatar').onclick=()=>$('#avFile').click();
$('#avFile').onchange=e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{
    const W=240,H=300,c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d'),sc=Math.max(W/img.width,H/img.height),w=img.width*sc,h=img.height*sc;
    x.drawImage(img,(W-w)/2,(H-h)/2,w,h);
    D.who.av=c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(url);paintAvatar();save();
  };
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Imagem inválida','Escolha um arquivo JPG, PNG ou WebP.')};
  img.src=url;
};

/* =====================================================================
   CARACTERÍSTICAS
   ===================================================================== */
function buildCars(){
  $('#cars').innerHTML=CARS.map(([k,n])=>
    '<div class="car" data-k="'+k+'" role="button" tabindex="0" aria-label="Testar '+n+'">'+
    '<span class="ck">'+k+'</span><span class="cn">'+n+'</span>'+
    '<b class="cv only-play">—</b>'+
    '<input class="ci only-edit" type="number" inputmode="numeric" min="0" max="999" aria-label="Valor de '+n+'">'+
    '<span class="cf" aria-hidden="true"><i>½</i><em class="h">—</em><i>⅕</i><em class="f">—</em></span></div>').join('');
}
function paintCarTile(k){
  const t=$('.car[data-k='+k+']');if(!t)return;
  const v=D.car[k];
  $('.cv',t).textContent=v==null?'—':v;
  const inp=$('.ci',t);if(document.activeElement!==inp)inp.value=v==null?'':v;
  $('.h',t).textContent=v==null?'—':Math.floor(v/2);
  $('.f',t).textContent=v==null?'—':Math.floor(v/5);
  t.setAttribute('aria-label','Testar '+CNAME[k]+(v==null?'':', valor '+v));
}
function paintCars(){
  CARS.forEach(([k])=>paintCarTile(k));
  $('#onb').hidden=CARS.some(([k])=>has(k));
  $('#carHint').textContent=document.body.classList.contains('edit')?'Digite os valores':'Toque para testar';
}
function afterCarChange(){
  paintVitals();paintCombat();refreshSkRows();
}
$('#cars').addEventListener('input',e=>{
  const t=e.target.closest('.car'),inp=e.target.closest('.ci');if(!t||!inp)return;
  const k=t.dataset.k;
  D.car[k]=inp.value===''?null:int(inp.value,0,999);
  paintCarTile(k);
  $('#onb').hidden=CARS.some(([c])=>has(c));
  afterCarChange();save();
});
$('#cars').addEventListener('click',e=>{
  const t=e.target.closest('.car');
  if(!t||document.body.classList.contains('edit'))return;
  testCar(t.dataset.k);
});
$('#cars').addEventListener('keydown',e=>{
  const t=e.target.closest('.car');
  if(!t||e.target!==t||document.body.classList.contains('edit'))return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();testCar(t.dataset.k)}
});

function genCars(){
  const r3=()=>(rnd(1,6)+rnd(1,6)+rnd(1,6))*5,r2=()=>(rnd(1,6)+rnd(1,6)+6)*5;
  const v={FOR:r3(),CON:r3(),TAM:r2(),DES:r3(),APA:r3(),EDU:r2(),INT:r2(),POD:r3()};
  CARS.forEach(([k])=>{D.car[k]=v[k]});
  D.cur={pv:null,san:null,pm:null,sorte:r3()};
  Object.keys(D.fl).forEach(k=>{D.fl[k]=false});
  D.dia={ini:null,perd:0};
  paintCars();afterCarChange();save();
  toast('Características roladas','FOR, CON, DES, APA e POD: 3d6×5. TAM, INT e EDU: (2d6+6)×5. Sorte: 3d6×5.',{ms:6000});
}
let genArm=null;
function askGen(btn){
  if(!CARS.some(([k])=>has(k))){genCars();return true}
  if(genArm){clearTimeout(genArm);genArm=null;genCars();btn.textContent=btn._t;return true}
  btn._t=btn.textContent;btn.textContent='Substituir valores? Toque de novo';
  genArm=setTimeout(()=>{genArm=null;btn.textContent=btn._t},3500);
  return false;
}
$('#onbRoll').onclick=()=>genCars();
$('#onbEdit').onclick=()=>setEdit(true);
$('#cfGen').onclick=e=>{if(askGen(e.currentTarget))closeM('mCfg')};

/* =====================================================================
   PERÍCIAS
   ===================================================================== */
let skF='all';
function skMatch(s,q){
  if(skF==='inv'&&!(skVal(s)>skBase(s)))return false;
  if(skF==='tick'&&!s.t)return false;
  if(q&&skTitle(s).toLowerCase().indexOf(q)<0)return false;
  return true;
}
function rowHTML(s){
  const val=skVal(s),base=skBase(s),id=esc(s.id),lab=skLabel(s),title=esc(skTitle(s));
  let name;
  if(s.slot){
    name='<button class="skn only-play'+(lab?'':' empty')+'" type="button" data-roll>'+esc(lab||s.pre+' (definir)')+'</button>'+
      '<input class="skn-in only-edit" data-sp value="'+esc(s.sp)+'" maxlength="30" placeholder="'+esc(s.pre)+': especialidade" aria-label="Especialidade de '+esc(s.pre)+'">';
  }else if(s.custom){
    name='<button class="skn only-play" type="button" data-roll>'+esc(s.n||'Sem nome')+'</button>'+
      '<input class="skn-in only-edit" data-nm value="'+esc(s.n)+'" maxlength="40" aria-label="Nome da perícia">';
  }else name='<button class="skn" type="button" data-roll>'+esc(s.n)+'</button>';
  return'<li class="sk'+(s.t?' mk':'')+(val>base?' inv':'')+(s.custom?' cu':'')+'" data-id="'+id+'">'+
    '<button class="tk" type="button" data-tk aria-pressed="'+(!!s.t)+'" aria-label="Marcar '+title+' para desenvolvimento"'+(s.nt?' disabled':'')+'><i></i></button>'+
    name+
    '<span class="skh" aria-hidden="true">'+Math.floor(val/2)+'<s>/</s>'+Math.floor(val/5)+'</span>'+
    '<button class="skv only-play" type="button" data-roll aria-label="Rolar '+title+', valor '+val+'">'+val+'</button>'+
    '<input class="skv-in only-edit" type="number" inputmode="numeric" min="0" max="999" data-v value="'+val+'" aria-label="Valor de '+title+'">'+
    (s.custom?'<button class="skdel only-edit" type="button" data-del aria-label="Remover '+title+'">'+GI('i-trash')+'<svg viewBox="0 0 11 12"><use href="#i-trash"/></svg></button>':'')+
    '</li>';
}
function paintSkRow(li,s){
  const val=skVal(s),base=skBase(s);
  li.classList.toggle('mk',!!s.t);li.classList.toggle('inv',val>base);
  $('.skv',li).textContent=val;
  const vi=$('.skv-in',li);if(vi&&document.activeElement!==vi)vi.value=val;
  $('.skh',li).innerHTML=Math.floor(val/2)+'<s>/</s>'+Math.floor(val/5);
  $('[data-tk]',li).setAttribute('aria-pressed',String(!!s.t));
  if(s.slot||s.custom){
    const n=$('.skn',li),lab=skLabel(s);
    n.textContent=s.slot?(lab||s.pre+' (definir)'):(s.n||'Sem nome');
    n.classList.toggle('empty',!lab&&!!s.slot);
  }
}
function updateSkRow(id){
  const li=$('#sklist .sk[data-id="'+id+'"]'),s=getSk(id);
  if(li&&s)paintSkRow(li,s);
  paintSkMeta();
}
function refreshSkRows(){
  $$('#sklist .sk').forEach(li=>{const s=getSk(li.dataset.id);if(s)paintSkRow(li,s)});
  paintSkMeta();
}
function paintSkMeta(){
  const n=allSk().filter(s=>s.t&&!s.nt).length;
  $('#devN').textContent=n?'('+n+')':'';
  $('#devBtn').disabled=!n;
  $('#skPts').textContent='Na linha, os números pequenos são os valores Difícil e Extremo.';
}
function renderSkills(){
  const q=$('#skq').value.trim().toLowerCase(),list=allSk().filter(s=>skMatch(s,q));
  const html=CATS.map(([c,t])=>{
    const rows=list.filter(s=>s.c===c);if(!rows.length)return'';
    if(c==='ger')rows.sort((a,b)=>skLabel(a).localeCompare(skLabel(b),'pt-BR'));
    return'<h3 class="sh">'+t+'</h3><ul class="skl">'+rows.map(rowHTML).join('')+'</ul>';
  }).join('');
  $('#sklist').innerHTML=html||'<p class="empty">Nenhuma perícia encontrada.</p>';
  paintSkMeta();
}
$('#skq').addEventListener('input',renderSkills);
$('#skf').addEventListener('click',e=>{
  const b=e.target.closest('[data-f]');if(!b)return;
  skF=b.dataset.f;$$('#skf button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderSkills();
});
$('#sklist').addEventListener('click',e=>{
  const li=e.target.closest('.sk');if(!li)return;
  const id=li.dataset.id;
  if(e.target.closest('[data-tk]')){
    const st=skState(id);st.t=!st.t;save();
    if(skF==='tick'&&!st.t)renderSkills();else updateSkRow(id);
    return;
  }
  if(e.target.closest('[data-del]')){removeWithUndo('skx',id,renderSkills,'Perícia');return}
  if(e.target.closest('[data-roll]')&&!document.body.classList.contains('edit'))testSkill(id);
});
$('#sklist').addEventListener('input',e=>{
  const li=e.target.closest('.sk'),t=e.target;if(!li)return;
  const id=li.dataset.id,st=skState(id);if(!st)return;
  if(t.matches('[data-v]')){
    st.v=t.value===''?null:int(t.value,0,999);
    updateSkRow(id);
    if(id==='mitos')paintVitals();
    if(id==='esquivar')paintCombat();
  }else if(t.matches('[data-sp]')){st.sp=str(t.value,30);updateSkRow(id);renderAtk(true)}
  else if(t.matches('[data-nm]')){st.n=str(t.value,40);updateSkRow(id)}
  save();
});

function removeWithUndo(key,id,render,label){
  const arr=D[key],i=arr.findIndex(x=>x.id===+id);if(i<0)return;
  const it=arr.splice(i,1)[0];save();render();
  toast(label+' removido(a)','',{label:'Desfazer',act:()=>{arr.splice(Math.min(i,arr.length),0,it);save();render()}});
}

/* nova perícia */
$('#ns-c').innerHTML=CATS.map(c=>'<option value="'+c[0]+'">'+c[1]+'</option>').join('');
$('#skAdd').onclick=()=>{$('#ns-n').value='';$('#ns-b').value='1';openM('mSk')};
$('#nsOk').onclick=()=>{
  const n=str($('#ns-n').value.trim(),40);
  if(!n){toast('Dê um nome','Escreva o nome da perícia.');return}
  D.skx.push({id:uid(),n,b:int($('#ns-b').value,0,99),c:$('#ns-c').value,v:null,t:false});
  save();closeM('mSk');renderSkills();atkRefreshSkills();
};

/* fase de desenvolvimento */
function devPhase(){
  const list=allSk().filter(s=>s.t&&!s.nt);
  if(!list.length){toast('Nada marcado','Marque as perícias em que você teve sucesso para desenvolvê-las.');return}
  const rows=[];
  list.forEach(s=>{
    const val=skVal(s),roll=rnd(1,100),up=roll>val||roll>95,st=skState(s.id);
    let line='<b>'+esc(skTitle(s))+'</b>: rolou '+roll+' contra '+val;
    if(up){
      const g=rnd(1,10),nv=Math.min(99,val+g);
      st.v=nv;line+='. Sobe <b>+'+g+'</b> e vai para '+nv+'.';
      if(val<90&&nv>=90){
        const san=rnd(1,6)+rnd(1,6);
        setCur('san',Math.min(barMax('san'),(barCur('san')||0)+san));
        line+=' Chegou a 90%: recupera '+san+' de Sanidade.';
      }
    }else line+='. Não melhora.';
    st.t=false;rows.push('<li class="'+(up?'up':'')+'">'+line+'</li>');
  });
  save();$('#devL').innerHTML=rows.join('');
  renderSkills();paintCombat();paintVitals();openM('mDev');
}
$('#devBtn').onclick=devPhase;

/* =====================================================================
   COMBATE
   ===================================================================== */
function paintCombat(){
  const db=dbInfo(),mv=movInfo(),dodge=getSk('esquivar');
  const b=db.build==null?'—':(db.build<0?'−'+Math.abs(db.build):String(db.build));
  $('#dvs').innerHTML=
    '<div class="dv"><small>Movimento</small><b>'+(mv==null?'—':mv)+'</b></div>'+
    '<div class="dv"><small>Corpo</small><b>'+b+'</b></div>'+
    '<div class="dv"><small>Dano Extra</small><b>'+db.label+'</b></div>'+
    '<button class="dv" type="button" data-act="dodge" aria-label="Testar Esquivar, valor '+skVal(dodge)+'"><small>Esquivar</small><b>'+skVal(dodge)+'</b></button>';
}
$('#dvs').addEventListener('click',e=>{
  if(e.target.closest('[data-act=dodge]')&&!document.body.classList.contains('edit'))testSkill('esquivar');
});
$('#armor').addEventListener('input',e=>{D.armor=str(e.target.value,80);save()});

const fld=(l,f,v,x)=>'<label class="fld"><span>'+l+'</span><input data-f="'+f+'" value="'+esc(v)+'" '+(x||'')+' autocomplete="off"></label>';
function skOptions(sel){
  return allSk().map(s=>'<option value="'+esc(s.id)+'"'+(String(s.id)===String(sel)?' selected':'')+'>'+esc(skTitle(s))+'</option>').join('');
}
function atkHTML(w){
  return'<li class="cc" data-id="'+w.id+'"><div class="g2">'+fld('Arma','n',w.n)+
    '<label class="fld"><span>Perícia</span><select data-f="sk">'+skOptions(w.sk)+'</select></label></div>'+
    '<div class="g3">'+fld('Dano','dano',w.dano,'placeholder="1D8+DX"')+fld('Alcance','al',w.al)+fld('Ataques por rodada','nat',w.nat)+'</div>'+
    '<div class="g2">'+fld('Munição','mun',w.mun,'inputmode="numeric"')+fld('Defeito a partir de','mal',w.mal,'inputmode="numeric" placeholder="100"')+'</div>'+
    '<div class="rowb"><button class="btn pri sm" type="button" data-act="atk">Atacar</button><button class="btn sm" type="button" data-act="dmg">Rolar dano</button><button class="btn dng sm" type="button" data-act="rm">Remover</button></div></li>';
}
function renderAtk(keepFocus){
  const ul=$('#atkList');
  if(keepFocus&&ul.contains(document.activeElement)&&document.activeElement.matches('input'))return;
  ul.innerHTML=D.atk.length?D.atk.map(atkHTML).join(''):'<li class="empty">Nenhuma arma. Toque em “+ Arma” para adicionar.</li>';
}
function atkRefreshSkills(){renderAtk(true)}

const magHTML=m=>'<li class="cc" data-id="'+m.id+'">'+fld('Nome da magia','n',m.n)+
  '<div class="g3">'+fld('Custo em PM','pm',m.pm,'type="number" inputmode="numeric" min="0"')+fld('Custo em Sanidade','san',m.san,'placeholder="1d6"')+fld('Custo em POD','pod',m.pod,'inputmode="numeric"')+'</div>'+
  fld('Tempo de conjuração','tmp',m.tmp)+
  '<label class="fld"><span>Efeito</span><textarea data-f="d" maxlength="2000">'+esc(m.d)+'</textarea></label>'+
  '<div class="rowb"><button class="btn pri sm" type="button" data-act="cast">Conjurar</button><button class="btn dng sm" type="button" data-act="rm">Remover</button></div></li>';
const invHTML=x=>'<li class="cc" data-id="'+x.id+'"><div class="g2" style="grid-template-columns:1fr 90px">'+fld('Item','n',x.n)+fld('Qtd.','q',x.q,'type="number" inputmode="numeric" min="0"')+'</div>'+
  '<label class="fld"><span>Descrição</span><textarea data-f="d" maxlength="2000" style="min-height:60px">'+esc(x.d)+'</textarea></label>'+
  '<div class="rowb"><button class="btn dng sm" type="button" data-act="rm">Remover</button></div></li>';
function renderMag(){$('#magList').innerHTML=D.mag.length?D.mag.map(magHTML).join(''):'<li class="empty">Nenhuma magia conhecida.</li>'}
function renderInv(){$('#invList').innerHTML=D.inv.length?D.inv.map(invHTML).join(''):'<li class="empty">Nenhum item.</li>'}

function bindList(ul,key){
  const h=e=>{
    const li=e.target.closest('[data-id]'),f=e.target.dataset&&e.target.dataset.f;if(!li||!f)return;
    const o=D[key].find(x=>x.id===+li.dataset.id);if(!o)return;
    o[f]=SCH[key][f]==='n'?(e.target.value===''?'':int(e.target.value,0,9999)):str(e.target.value,f==='d'?2000:120);
    save();
  };
  ul.addEventListener('input',h);ul.addEventListener('change',h);
}
bindList($('#atkList'),'atk');bindList($('#magList'),'mag');bindList($('#invList'),'inv');

function addItem(key,obj,render,ul){
  const it=Object.assign({id:uid()},obj);D[key].push(it);save();render();
  const li=$('[data-id="'+it.id+'"]',ul),first=li&&$('input',li);
  if(li){li.scrollIntoView({block:'nearest'});if(!rm()&&li.animate)li.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:200})}
  if(first)first.focus({preventScroll:true});
}
$('#atkAdd').onclick=()=>addItem('atk',{n:'',sk:'pistola',dano:'1D8',al:'',nat:'1',mun:'',mal:''},renderAtk,$('#atkList'));
$('#magAdd').onclick=()=>addItem('mag',{n:'',pm:'',san:'',pod:'',tmp:'',d:''},renderMag,$('#magList'));
$('#invAdd').onclick=()=>addItem('inv',{n:'',q:1,d:''},renderInv,$('#invList'));

function castSpell(m){
  const pm=m.pm===''?0:int(m.pm,0,999),cur=barCur('pm')||0;
  if(pm>cur){toast('PM insuficiente',(m.n||'A magia')+' custa '+pm+' PM e restam '+cur+'. Se o investigador pagar a diferença com PV, ajuste a vida manualmente.',{ms:7000});return}
  if(pm)setCur('pm',cur-pm);
  const extra=[];
  if(m.pod)extra.push('Custo em POD: '+m.pod+'. Reduza o Poder manualmente.');
  const f=(m.san||'').trim(),t=f?parseF(f):null;
  if(f&&!t){toast('Custo de Sanidade inválido','Use números ou dados, como 1d6.');return}
  if(t){
    show(()=>sumRoll('Custo de Sanidade — '+(m.n||'Magia'),f,{noAgain:true,post:r=>{loseSan(r.total);return['Sanidade perdida: <b>'+r.total+'</b>'].concat(extra)}}));
  }else toast((m.n||'Magia')+' conjurada',(pm?'−'+pm+' PM. ':'')+extra.join(' '));
}
function listClick(key,render){
  return e=>{
    const b=e.target.closest('[data-act]'),li=e.target.closest('[data-id]');if(!b||!li)return;
    const o=D[key].find(x=>x.id===+li.dataset.id);if(!o)return;
    const a=b.dataset.act;
    if(a==='atk')rollAttack(o);
    else if(a==='dmg')rollDamage(o);
    else if(a==='cast')castSpell(o);
    else if(a==='rm')removeWithUndo(key,o.id,render,key==='atk'?'Arma':key==='mag'?'Magia':'Item');
  };
}
$('#atkList').addEventListener('click',listClick('atk',renderAtk));
$('#magList').addEventListener('click',listClick('mag',renderMag));
$('#invList').addEventListener('click',listClick('inv',renderInv));

/* =====================================================================
   ANTECEDENTES E POSSES
   ===================================================================== */
const KEYS6=BKF.slice(0,6);
function buildBack(){
  $('#bk').innerHTML=BKF.map(([k,n],i)=>'<label class="fld'+(i===0?' w2':'')+'"><span data-bl="'+k+'">'+n+'</span><textarea data-b="'+k+'" maxlength="4000" spellcheck="true"></textarea></label>').join('');
  $('#bkKey').innerHTML='<option value="">Nenhuma</option>'+KEYS6.map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('');
}
function paintKey(){
  $('#bkKey').value=D.chave;
  $$('[data-bl]').forEach(s=>{const k=s.dataset.bl,n=(BKF.find(b=>b[0]===k)||[])[1];s.textContent=(D.chave===k?'★ ':'')+n});
}
$('#bkKey').addEventListener('change',e=>{D.chave=e.target.value;paintKey();save()});
$('#bk').addEventListener('input',e=>{const k=e.target.dataset.b;if(k){D.bk[k]=str(e.target.value,4000);save()}});
function paintBack(){$$('#bk textarea').forEach(t=>{t.value=D.bk[t.dataset.b]||''});paintKey()}

[['m-gasto','gasto'],['m-cash','cash'],['m-bens','bens']].forEach(([id,k])=>{
  $('#'+id).addEventListener('input',e=>{D.din[k]=str(e.target.value,30);save()});
});
function paintMoney(){$('#m-gasto').value=D.din.gasto;$('#m-cash').value=D.din.cash;$('#m-bens').value=D.din.bens;$('#armor').value=D.armor}
$('#moneyAuto').onclick=()=>{
  const cr=skVal(getSk('credito')),r=moneyTable(cr,D.cfg.era);
  D.din={gasto:r[0],cash:r[1],bens:r[2]};paintMoney();save();
  toast('Valores da Tabela II','Nível de Crédito '+cr+', época '+(D.cfg.era==='mod'?'moderna':'dos anos 1920')+'.');
};

/* =====================================================================
   OPÇÕES DE ROLAGEM (dock)
   ===================================================================== */
function paintDock(){
  $$('#dock [data-diff]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.diff===D.opt.diff)));
  const d=D.opt.dice,o=$('#ddv');
  o.textContent=d===0?'Sem dado':d>0?'Bônus ×'+d:'Penal. ×'+Math.abs(d);
  o.className=d>0?'b':d<0?'p':'';
}
$('#dock').addEventListener('click',e=>{
  const df=e.target.closest('[data-diff]'),dd=e.target.closest('[data-dd]');
  if(df)D.opt.diff=df.dataset.diff;
  if(dd)D.opt.dice=clamp(D.opt.dice+(+dd.dataset.dd),-2,2);
  if(df||dd){paintDock();save()}
});

/* =====================================================================
   DADOS E HISTÓRICO
   ===================================================================== */
function paintHist(){
  $('#hist').innerHTML=D.hist.length?D.hist.map(h=>'<li><span>'+esc(h.t)+'</span><b>'+esc(h.s)+'</b></li>').join(''):'<li><span>Nenhuma rolagem ainda.</span></li>';
}
$('#bDice').onclick=()=>{paintHist();openM('mDice')};
$('#qd').addEventListener('click',e=>{
  const b=e.target.closest('[data-f]');if(!b)return;
  closeM('mDice');show(()=>sumRoll('Rolagem '+b.dataset.f.replace('1d','d'),b.dataset.f));
});
$('#dGo').onclick=()=>{
  const f=$('#dForm').value.trim();if(!f)return;
  const t=sumRoll('Rolagem '+f.toUpperCase(),f);if(!t)return;
  closeM('mDice');show(()=>sumRoll('Rolagem '+f.toUpperCase(),f));
};

/* =====================================================================
   CONFIGURAÇÕES E BACKUP
   ===================================================================== */
function paintCfg(){
  $('#cfRm').checked=D.cfg.rm;$('#cfTick').checked=D.cfg.tick;$('#cfFrac').checked=D.cfg.frac;$('#cfSorte').checked=D.cfg.sorte;$('#cfEra').value=D.cfg.era;
  document.body.classList.toggle('nofrac',!D.cfg.frac);applyRM();
}
$('#cfRm').onchange=e=>{D.cfg.rm=e.target.checked;paintCfg();save()};
$('#cfTick').onchange=e=>{D.cfg.tick=e.target.checked;save()};
$('#cfFrac').onchange=e=>{D.cfg.frac=e.target.checked;paintCfg();save()};
$('#cfSorte').onchange=e=>{D.cfg.sorte=e.target.checked;save()};
$('#cfEra').onchange=e=>{D.cfg.era=e.target.value==='mod'?'mod':'20';save();renderSkills();atkRefreshSkills();toast('Época alterada',D.cfg.era==='mod'?'Perícias modernas e tabela de dinheiro moderna.':'Anos 1920.')};
$('#bCfg').onclick=()=>{$('#cfMsg').textContent='';openM('mCfg')};
$('#cfDay').onclick=()=>{newDay();closeM('mCfg')};
let clearArm=null;
$('#cfClear').onclick=e=>{
  const b=e.currentTarget;
  if(clearArm){
    clearTimeout(clearArm);clearArm=null;b.classList.remove('arm');b.textContent='Apagar esta ficha';
    {const x=idxLoad();x.list=x.list.filter(e=>e.id!==x.cur);try{localStorage.removeItem(SLP+x.cur)}catch(e){}x.cur=newCocId();idxSave(x)}clearTimeout(cloudSaveT);activeCloudId=null;D=fresh();flush();renderAll();closeM('mCfg');toast('Ficha apagada','Uma ficha em branco foi criada.');return;
  }
  b.classList.add('arm');b.textContent='Toque de novo para apagar tudo';
  clearArm=setTimeout(()=>{clearArm=null;b.classList.remove('arm');b.textContent='Apagar esta ficha'},3500);
};
const ioMsg=t=>{$('#ioMsg').textContent=t};
$('#bIO').onclick=()=>{ioMsg('');openM('mIO')};
$('#ioExp').onclick=()=>{
  flush();
  const blob=new Blob([JSON.stringify(D)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=((D.who.nome||'investigador').replace(/[^\w\-]+/g,'_'))+'-cthulhu.json';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  ioMsg('Arquivo exportado.');
};
$('#ioImp').onclick=()=>$('#ioFile').click();
$('#ioFile').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>2e6){ioMsg('O arquivo é grande demais para ser uma ficha.');return}
  try{
    const j=JSON.parse(await f.text());
    if(!j||j.app!=='coc')throw new Error('app');
    D=normalize(j);flush();renderAll();ioMsg('Ficha importada.');
  }catch(x){ioMsg('Esse arquivo não é uma ficha de Call of Cthulhu válida.')}
};

/* =====================================================================
   CONTA E FICHAS NA NUVEM (campanha Call of Cthulhu)
   ===================================================================== */
function cloudSaveLabel(){$('#cloudSave').textContent=activeCloudId?'Salvar alterações desta ficha':'Salvar na nuvem'}
async function loadCocCloudList(){
  if(!cloudClient||!cloudUser)return;
  $('#cloudMsg').textContent='Carregando fichas de Call of Cthulhu…';
  try{
    const {data,error}=await cloudClient.from(CLOUD_TABLE).select('id,name,updated_at').eq('user_id',cloudUser.id).eq('campaign','coc').order('updated_at',{ascending:false});
    if(error)throw error;
    $('#cloudList').innerHTML=data.length?data.map(r=>'<li><span>'+esc(r.name||'Investigador sem nome')+'<br><small>'+ (r.updated_at?new Date(r.updated_at).toLocaleString('pt-BR'):'')+'</small></span><button class="btn sm" type="button" data-cloud-id="'+esc(r.id)+'">'+(r.id===activeCloudId?'Selecionada':'Carregar')+'</button></li>').join(''):'<li><span>Nenhum investigador de Call of Cthulhu na nuvem.</span></li>';
    $('#cloudMsg').textContent=data.length?(activeCloudId?'Ficha selecionada; as alterações seguintes sincronizam automaticamente.':'Escolha uma ficha CoC ou salve esta ficha como nova.'):'Salve o investigador atual para começar a lista na nuvem.';
    cloudSaveLabel();
  }catch(error){$('#cloudMsg').textContent='Não foi possível listar as fichas CoC: '+cloudError(error)}
}
function paintCocCloudSession(user){
  cloudUser=user||null;$('#cloudSignedOut').hidden=!!cloudUser;$('#cloudSignedIn').hidden=!cloudUser;$('#cloudProfile').hidden=!cloudUser;$('#cloudPanel').hidden=!cloudUser;
  if(!cloudUser){$('#cloudAuthMsg').textContent='Entre com o Google ou receba um link de acesso por e-mail (abra-o neste mesmo navegador).';$('#cloudAccount').textContent='';$('#cloudList').innerHTML='';$('#cloudMsg').textContent='';$('#cloudProfileMsg').textContent='';$('#cloudDisplayName').value='';$('#cloudAvatarPreview').hidden=true;$('#cloudAvatarFallback').hidden=false;accountAvatarPath=null;activeCloudId=null;cloudSaveLabel();return}
  $('#cloudProfileEmail').textContent=cloudUser.email||'';$('#cloudAccount').textContent='Conectado como '+(cloudUser.email||'usuário Supabase')+(Cloud.accountInfo(cloudUser).google?' · via Google':'');void loadCocCloudProfile(cloudUser.id);void loadCocCloudList();
}
let accountAvatarPath=null,accountProfileRequest=null;
async function loadCocCloudProfile(userId){
  accountProfileRequest=userId;$('#cloudProfileMsg').textContent='Carregando perfil…';
  try{
    const {data,error}=await cloudClient.from('user_profiles').select('display_name,avatar_path').eq('user_id',userId).maybeSingle();if(error)throw error;
    if(accountProfileRequest!==userId||cloudUser?.id!==userId)return;
    const gi=Cloud.accountInfo(cloudUser);accountAvatarPath=data?.avatar_path||null;$('#cloudDisplayName').value=data?.display_name||gi.name||cloudUser.email?.split('@')[0]||'';
    $('#cloudAccount').textContent='Conectado como '+($('#cloudDisplayName').value||cloudUser.email||'usuário Supabase')+(gi.google?' · via Google':'');
    if(accountAvatarPath){const {data:signed,error:signedError}=await cloudClient.storage.from('account-avatars').createSignedUrl(accountAvatarPath,3600);if(signedError)throw signedError;$('#cloudAvatarPreview').src=signed.signedUrl;$('#cloudAvatarPreview').hidden=false;$('#cloudAvatarFallback').hidden=true}
    else if(gi.avatar){const pv=$('#cloudAvatarPreview');pv.referrerPolicy='no-referrer';pv.onerror=()=>{pv.hidden=true;$('#cloudAvatarFallback').hidden=false};pv.src=gi.avatar;pv.hidden=false;$('#cloudAvatarFallback').hidden=true}
    else{$('#cloudAvatarPreview').hidden=true;$('#cloudAvatarFallback').hidden=false}
    $('#cloudProfileMsg').textContent='O perfil é compartilhado entre as campanhas.';
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível carregar o perfil. Execute o SQL atualizado do Supabase.';console.error('Falha ao carregar perfil CoC:',error)}
}
async function saveCocCloudProfile(){
  if(!cloudUser)return;const name=$('#cloudDisplayName').value.trim(),button=$('#cloudProfileSave');if(!name){$('#cloudProfileMsg').textContent='Digite um nome para o perfil.';return}
  button.disabled=true;$('#cloudProfileMsg').textContent='Salvando perfil…';
  try{const {error}=await cloudClient.from('user_profiles').upsert({user_id:cloudUser.id,display_name:name,avatar_path:accountAvatarPath,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;
    $('#cloudAccount').textContent='Conectado como '+name+' · '+(cloudUser.email||'conta Supabase')+(Cloud.accountInfo(cloudUser).google?' · via Google':'');$('#cloudProfileMsg').textContent='Perfil salvo na sua conta.'
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível salvar o perfil: '+cloudError(error)}finally{button.disabled=false}
}
async function saveCocCloudAvatar(file){
  if(!cloudUser||!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){ $('#cloudProfileMsg').textContent='Escolha uma imagem JPG, PNG ou WebP.';return }
  if(file.size>8*1024*1024){$('#cloudProfileMsg').textContent='A imagem deve ter menos de 8 MB.';return}
  const button=$('#cloudAvatarPick');button.disabled=true;$('#cloudProfileMsg').textContent='Enviando foto…';
  try{const blob=await imageFileToSquareJpeg(file,512,.82),path=cloudUser.id+'/avatar.jpg';const {error}=await cloudClient.storage.from('account-avatars').upload(path,blob,{contentType:'image/jpeg',upsert:true,cacheControl:'3600'});if(error)throw error;
    accountAvatarPath=path;const {data:signed,error:signedError}=await cloudClient.storage.from('account-avatars').createSignedUrl(path,3600);if(signedError)throw signedError;$('#cloudAvatarPreview').src=signed.signedUrl;$('#cloudAvatarPreview').hidden=false;$('#cloudAvatarFallback').hidden=true;await saveCocCloudProfile();
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível enviar a foto: '+cloudError(error)}finally{button.disabled=false}
}
async function syncCocCloud(manual,newCopy){
  if(!cloudClient||!cloudUser){if(manual)$('#cloudMsg').textContent='Entre na conta antes de salvar.';return}
  if(cloudSyncBusy){cloudSyncAgain=true;return}cloudSyncBusy=true;if(manual)$('#cloudMsg').textContent='Salvando investigador na nuvem…';
  try{const payload={campaign:'coc',name:(D.who.nome||'Investigador sem nome').trim()||'Investigador sem nome',sheet:JSON.parse(JSON.stringify(D)),updated_at:new Date().toISOString()};
    if(!manual&&cloudConflict)return;
    const r=await Cloud.saveSheet({client:cloudClient,table:CLOUD_TABLE,campaign:'coc',userId:cloudUser.id,id:newCopy?null:activeCloudId,rev:cloudRev,force:!!(manual&&cloudConflict),payload});
    activeCloudId=r.id;cloudRev=r.rev;cloudConflict=false;Cloud.ui.ok();$('#cloudMsg').textContent='Investigador salvo na nuvem.';if(manual)await loadCocCloudList();
  }catch(error){if(error&&error.conflict){cloudConflict=true;cloudSyncAgain=false;clearTimeout(cloudSaveT);Cloud.ui.conflict();$('#cloudMsg').textContent='A ficha mudou na nuvem (outro aparelho ou aba?). Sincronização pausada. Salvar de novo sobrescreve a nuvem; "Salvar como nova ficha" mantém as duas.'}else{Cloud.ui.fail(error);$('#cloudMsg').textContent='Falha na sincronização; o salvamento local continua ativo. '+cloudError(error)}}
  finally{cloudSyncBusy=false;if(cloudSyncAgain){cloudSyncAgain=false;clearTimeout(cloudSaveT);Cloud.ui.pending();cloudSaveT=setTimeout(()=>syncCocCloud(false,false),350)}}
}
async function initCocCloud(){
  if(!cloudClient){$('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='O cliente Supabase não carregou.';return}
  const authErr=window.parent===window?Cloud.takeAuthError():'';
  try{const {data,error}=await cloudClient.auth.getSession();if(error)throw error;paintCocCloudSession(data?.session?.user||null)}catch(error){$('#cloudAuthMsg').textContent='Não foi possível verificar a sessão: '+cloudError(error)}
  if(authErr)$('#cloudAuthMsg').textContent=authErr;
  const authSub=cloudClient.auth.onAuthStateChange((event,session)=>{const next=session?.user||null;if(next?.id!==cloudUser?.id){clearTimeout(cloudSaveT);activeCloudId=null;cloudRev=null;cloudConflict=false}paintCocCloudSession(next)}).data.subscription;
  addEventListener('pagehide',()=>authSub.unsubscribe())
}
$('#cloudLogin').onclick=async()=>{
  const email=$('#cloudEmail').value.trim();if(!email||!$('#cloudEmail').checkValidity()){$('#cloudAuthMsg').textContent='Informe um endereço de e-mail válido.';return}
  if(location.protocol==='file:'){$('#cloudAuthMsg').textContent='Abra esta ficha por servidor local ou HTTPS para entrar na nuvem.';return}
  $('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='Enviando link de acesso…';
  try{const {error}=await cloudClient.auth.signInWithOtp({email,options:{emailRedirectTo:(window.parent!==window?window.parent.location.href:location.href),shouldCreateUser:true}});$('#cloudAuthMsg').textContent=error?'Não foi possível enviar o link: '+cloudError(error):'Link enviado. Abra-o neste mesmo navegador e confira o spam.'}
  catch(error){$('#cloudAuthMsg').textContent='Falha ao enviar link: '+cloudError(error)}finally{$('#cloudLogin').disabled=false}
};
$('#cloudLogout').onclick=async()=>{const {error}=await cloudClient.auth.signOut();if(error)$('#cloudMsg').textContent='Não foi possível sair: '+cloudError(error)};
$('#cloudGoogle').onclick=async()=>{
  const b=$('#cloudGoogle');b.disabled=true;$('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='Abrindo o login do Google…';
  try{await Cloud.signInGoogle()}
  catch(error){$('#cloudAuthMsg').textContent='Não foi possível entrar com o Google: '+cloudError(error);console.error('Falha no login Google:',error)}
  finally{b.disabled=false;$('#cloudLogin').disabled=false}
};
$('#cloudProfileSave').onclick=saveCocCloudProfile;$('#cloudAvatarPick').onclick=()=>$('#cloudAvatarFile').click();
$('#cloudAvatarFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)void saveCocCloudAvatar(file);e.target.value=''});
$('#cloudSave').onclick=()=>syncCocCloud(true,false);$('#cloudSaveNew').onclick=()=>syncCocCloud(true,true);$('#cloudRefresh').onclick=loadCocCloudList;
$('#cloudList').addEventListener('click',async e=>{
  const button=e.target.closest('[data-cloud-id]');if(!button||!cloudUser)return;if(!confirm('Carregar este investigador? Ele substituirá a ficha aberta neste aparelho. Exporte um backup antes para guardá-la.'))return;
  button.disabled=true;$('#cloudMsg').textContent='Carregando ficha…';
  try{const {data,error}=await cloudClient.from(CLOUD_TABLE).select('id,name,sheet,updated_at').eq('id',button.dataset.cloudId).eq('user_id',cloudUser.id).eq('campaign','coc').single();if(error)throw error;
    if(!data.sheet||data.sheet.app!=='coc')throw new Error('A ficha selecionada não é uma ficha CoC.');
    clearTimeout(cloudSaveT);activeCloudId=data.id;cloudRev=data.updated_at||null;cloudConflict=false;D=normalize(data.sheet);flush();renderAll();closeM('mIO');$('#cloudMsg').textContent='Investigador carregado e vinculado à nuvem.';await loadCocCloudList();
  }catch(error){$('#cloudMsg').textContent='Não foi possível carregar a ficha: '+cloudError(error);button.disabled=false}
});

/* =====================================================================
   ABAS, MODO DE EDIÇÃO E INICIALIZAÇÃO
   ===================================================================== */
$('#tabs').addEventListener('click',e=>{
  const b=e.target.closest('[data-p]');if(!b)return;
  $$('#tabs button').forEach(x=>x.setAttribute('aria-selected',String(x===b)));
  $$('.pane').forEach(p=>{p.hidden=p.id!=='p-'+b.dataset.p});
  if(innerWidth<1000&&$('.stick').getBoundingClientRect().top<=1)$('.right').scrollIntoView({block:'start'});
});
/* indicador deslizante das abas */
function moveInd(smooth){
  const nav=$('#tabs'),ind=$('#tabInd'),b=$('#tabs button[aria-selected="true"]');
  if(!nav||!ind||!b)return;
  ind.style.setProperty('--x',b.offsetLeft+'px');ind.style.setProperty('--w',b.offsetWidth+'px');
  if(!ind.classList.contains('ready'))requestAnimationFrame(()=>requestAnimationFrame(()=>ind.classList.add('ready')));
  if(smooth){const l=b.offsetLeft-(nav.clientWidth-b.offsetWidth)/2;if(nav.scrollWidth>nav.clientWidth)nav.scrollTo({left:Math.max(0,l),behavior:rm()?'auto':'smooth'})}
}
$('#tabs').addEventListener('click',()=>moveInd(true));
addEventListener('resize',()=>moveInd(false));
addEventListener('load',()=>moveInd(false));
moveInd(false);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>moveInd(false));
let editHinted=false;
function setEdit(on){
  document.body.classList.toggle('edit',on);
  $('#bEdit').setAttribute('aria-pressed',String(on));
  if(on&&!editHinted){editHinted=true;toast('Modo de edição','Toque nos números para digitar. Toque no lápis de novo para voltar a rolar.',{ms:4500})}
  paintCars();renderSkills();
}
$('#bEdit').onclick=()=>setEdit(!document.body.classList.contains('edit'));

function renderAll(){
  paintCfg();
  WHO.forEach(([id,k])=>{$('#'+id).value=D.who[k]});
  paintAvatar();paintCars();paintVitals();paintDock();
  renderSkills();paintCombat();renderAtk();renderMag();renderInv();paintBack();paintMoney();
}

(function init(){
  const logo=$('#logo');
  const fb=()=>{const s=document.createElement('span');s.className='logo-fb';s.textContent='Call of Cthulhu';logo.replaceWith(s)};
  logo.addEventListener('error',fb);
  if(logo.complete&&!logo.naturalWidth)fb();
  buildCars();buildVitals();buildBack();
  renderAll();
  void initCocCloud();
})();

/* =====================================================================
   ASSISTENTE DE CRIAÇÃO — dados e regras
   Apenas dados de regra (nomes, listas, números). Os textos de apoio são próprios.
   ===================================================================== */
const ATTRS=CARS.map(c=>c[0]);
const INTER=['charme','labia','intimidacao','persuasao'];
const SLOTS={arte:['arte1','arte2'],ciencia:['ciencia1','ciencia2','ciencia3'],idioma:['idioma1','idioma2'],
             pilotar:['pilotar1'],sobrev:['sobrev1'],luta:['luta1'],fogo:['fogo1']};
const PRE={arte:'Arte/Ofício',ciencia:'Ciência',idioma:'Língua',pilotar:'Pilotar',sobrev:'Sobrevivência',luta:'Lutar',fogo:'Armas de Fogo'};

/* Tokens das perícias de cada ocupação:
   'id'          perícia fixa
   'i'           uma perícia interpessoal (Charme, Lábia, Intimidação ou Persuasão)
   'a'           qualquer outra perícia
   'F' / 'L'     Armas de Fogo / Lutar (escolher a especialização)
   'cat:Nome'    especialização com nome já definido (ex.: arte:Fotografia)
   'cat:*'       especialização que o jogador nomeia
   'p:a|b|c'     escolher uma entre as opções */
const OCC=[
 {id:'advogado',n:'Advogado',cr:[30,80],p:'EDU*4',s:['contabilidade','direito','i','i','psicologia','bibliotecas','a','a']},
 {id:'andarilho',n:'Andarilho',cr:[0,5],p:'EDU*2+APA|DES|FOR*2',s:['escalar','ouvir','furtividade','i','navegacao','saltar','a','a']},
 {id:'antiquario',n:'Antiquário',lv:1,cr:[30,70],p:'EDU*4',s:['arte:*','avaliacao','encontrar','historia','i','idioma:*','bibliotecas','a']},
 {id:'artista',n:'Artista',cr:[9,50],p:'EDU*2+POD|DES*2',s:['arte:*','encontrar','p:historia|mundo','i','idioma:*','psicologia','a','a']},
 {id:'atleta',n:'Atleta',cr:[9,70],p:'EDU*2+DES|FOR*2',s:['arremessar','cavalgar','escalar','i','briga','natacao','saltar','a']},
 {id:'autor',n:'Autor',lv:1,cr:[9,30],p:'EDU*4',s:['arte:Literatura','historia','nativo','p:mundo|ocultismo','idioma:*','psicologia','bibliotecas','a']},
 {id:'bibliotecario',n:'Bibliotecário',lv:1,cr:[9,35],p:'EDU*4',s:['contabilidade','nativo','idioma:*','bibliotecas','a','a','a','a']},
 {id:'clero',n:'Membro do Clero',cr:[9,60],p:'EDU*4',s:['contabilidade','ouvir','historia','i','idioma:*','psicologia','bibliotecas','a']},
 {id:'criminoso',n:'Criminoso',cr:[5,65],p:'EDU*2+DES|FOR*2',s:['encontrar','furtividade','i','psicologia',
   'p:F|avaliacao|chaveiro|reparosmec|disfarces|L|prestidigitacao','p:F|avaliacao|chaveiro|reparosmec|disfarces|L|prestidigitacao',
   'p:F|avaliacao|chaveiro|reparosmec|disfarces|L|prestidigitacao','p:F|avaliacao|chaveiro|reparosmec|disfarces|L|prestidigitacao']},
 {id:'detetive',n:'Detetive Particular',cr:[9,30],p:'EDU*2+DES|FOR*2',s:['arte:Fotografia','direito','disfarces','encontrar','i','psicologia','bibliotecas','a']},
 {id:'diletante',n:'Diletante',lv:1,cr:[50,99],p:'EDU*2+APA*2',s:['F','arte:*','cavalgar','i','idioma:*','a','a','a']},
 {id:'engenheiro',n:'Engenheiro',cr:[30,60],p:'EDU*4',s:['arte:Desenho Técnico','reparoselet','ciencia:Engenharia','ciencia:Física','reparosmec','maquinario','bibliotecas','a']},
 {id:'fanatico',n:'Fanático',cr:[0,30],p:'EDU*2+APA|POD*2',s:['furtividade','historia','i','i','psicologia','a','a','a']},
 {id:'fazendeiro',n:'Fazendeiro',cr:[9,30],p:'EDU*2+DES|FOR*2',s:['arte:Trabalhos de Fazenda','reparosmec','dirigir','i','mundo','maquinario','rastrear','a']},
 {id:'hacker',n:'Hacker',mod:1,cr:[10,70],p:'EDU*4',s:['reparoselet','eletronica','encontrar','i','computadores','bibliotecas','a','a']},
 {id:'invpolicia',n:'Investigador de Polícia',lv:1,cr:[20,50],p:'EDU*2+DES|FOR*2',s:['p:arte:Atuar|disfarces','F','direito','ouvir','i','psicologia','encontrar','a']},
 {id:'jornalista',n:'Jornalista',lv:1,err:1,cr:[9,30],p:'EDU*4',s:['F','p:arte:Atuar|disfarces','direito','encontrar','ouvir','i','psicologia','a']},
 {id:'medico',n:'Médico',lv:1,cr:[30,80],p:'EDU*4',s:['ciencia:Biologia','ciencia:Farmácia','medicina','idioma:Latim','primeiros','psicologia','a','a']},
 {id:'tribo',n:'Membro de Tribo',cr:[0,15],p:'EDU*2+DES|FOR*2',s:['p:arremessar|L','encontrar','escalar','ouvir','mundo','natacao','ocultismo','sobrev:*']},
 {id:'missionario',n:'Missionário',cr:[0,30],p:'EDU*4',s:['arte:*','reparosmec','i','medicina','mundo','primeiros','a','a']},
 {id:'musico',n:'Músico',cr:[9,30],p:'EDU*2+DES|POD*2',s:['arte:Instrumento','ouvir','i','psicologia','a','a','a','a']},
 {id:'oficialpolicia',n:'Oficial de Polícia',cr:[9,30],p:'EDU*2+DES|FOR*2',s:['F','direito','encontrar','i','briga','primeiros','psicologia','p:dirigir|cavalgar']},
 {id:'militar',n:'Oficial Militar',cr:[20,70],p:'EDU*2+DES|FOR*2',s:['F','contabilidade','navegacao','i','i','psicologia','sobrev:*','a']},
 {id:'parapsicologo',n:'Parapsicólogo',lv:1,cr:[9,30],p:'EDU*4',s:['antropologia','arte:Fotografia','historia','bibliotecas','ocultismo','idioma:*','psicologia','a']},
 {id:'piloto',n:'Piloto',err:1,cr:[20,70],p:'EDU*2+DES*2',s:['antropologia','arte:Fotografia','historia','bibliotecas','ocultismo','idioma:*','psicologia','a']},
 {id:'professor',n:'Professor',lv:1,cr:[20,70],p:'EDU*4',s:['nativo','idioma:*','psicologia','bibliotecas','a','a','a','a']},
 {id:'entretenimento',n:'Profissional de Entretenimento',cr:[9,70],p:'EDU*2+APA*2',s:['arte:Atuar','disfarces','ouvir','i','i','psicologia','a','a']},
 {id:'soldado',n:'Soldado',cr:[9,30],p:'EDU*2+DES|FOR*2',s:['F','p:escalar|natacao','esquivar','furtividade','L','sobrev:*',
   'p:reparosmec|idioma:*|primeiros','p:reparosmec|idioma:*|primeiros']},
 {id:'custom',n:'Ocupação personalizada',custom:1,cr:[0,99],p:'EDU*4',s:['a','a','a','a','a','a','a','a']}
];

function ptsTerms(o){
  return o.p.split('+').map(t=>{const i=t.lastIndexOf('*');return{a:t.slice(0,i).split('|'),m:+t.slice(i+1)}});
}
function expandOpt(t){
  if(t==='F')return[{v:'pistola'},{v:'rifle'},{v:'smg'},{v:'fogo:*'}];
  if(t==='L')return[{v:'briga'},{v:'luta:*'}];
  return[{v:t}];
}
function parseSlot(tok){
  if(tok==='i')return{k:'i'};
  if(tok==='a')return{k:'a'};
  if(tok==='F'||tok==='L')return{k:'p',opts:expandOpt(tok)};
  if(tok.indexOf('p:')===0)return{k:'p',opts:tok.slice(2).split('|').reduce((a,t)=>a.concat(expandOpt(t)),[])};
  if(tok.indexOf(':')>0){const c=tok.split(':')[0],n=tok.slice(c.length+1);return{k:'s',cat:c,fixed:n!=='*',name:n==='*'?'':n}}
  return{k:'f',id:tok};
}

/* Idade: ajustes do livro (cap. 3) */
const AGE=[
 {a:[15,19],chk:0,eduMinus:5,red:5,redA:['FOR','TAM'],apa:0,luck2:true},
 {a:[20,39],chk:1,eduMinus:0,red:0,redA:[],apa:0},
 {a:[40,49],chk:2,eduMinus:0,red:5,redA:['FOR','CON','DES'],apa:5},
 {a:[50,59],chk:3,eduMinus:0,red:10,redA:['FOR','CON','DES'],apa:10},
 {a:[60,69],chk:4,eduMinus:0,red:20,redA:['FOR','CON','DES'],apa:15},
 {a:[70,79],chk:4,eduMinus:0,red:40,redA:['FOR','CON','DES'],apa:20},
 {a:[80,90],chk:4,eduMinus:0,red:80,redA:['FOR','CON','DES'],apa:25}
];
const ageRule=a=>AGE.find(r=>a>=r.a[0]&&a<=r.a[1])||null;

/* =====================================================================
   ESTADO DO ASSISTENTE
   ===================================================================== */
const WK='coc-wiz-v1';
let W=null;
const STEPS=['Investigador','Atributos','Ocupação','Perícias da ocupação','Interesses pessoais','Antecedentes','Finanças e equipamento','Revisão'];
const r3=()=>(rnd(1,6)+rnd(1,6)+rnd(1,6))*5;
const r2=()=>(rnd(1,6)+rnd(1,6)+6)*5;
const GENR={FOR:r3,CON:r3,DES:r3,APA:r3,POD:r3,TAM:r2,INT:r2,EDU:r2};

function newW(replace){
  return{step:1,replace:!!replace,era:D.cfg.era,nome:'',idade:'',gen:'',res:'',nasc:'',
    method:'rolar',vals:{},pool:[],assign:{},buy:Object.fromEntries(ATTRS.map(k=>[k,15])),
    age:{red:{},eduGain:0,eduLog:null},luck:null,luckLog:'',
    occ:'',occAttr:{},cname:'',sel:[],names:[],pts:{},cred:0,per:{},sname:{},q:'',oq:'',
    bk:{desc:'',ideo:'',pess:'',loc:'',pert:'',trac:''},chave:'',equip:'',items:{},icat:'inv',iq:''};
}
function saveW(){try{localStorage.setItem(WK,JSON.stringify(W))}catch(e){}}
function loadW(){
  try{const j=JSON.parse(localStorage.getItem(WK));if(j&&typeof j==='object'&&j.step>=1&&j.step<=8&&j.vals&&j.age)return Object.assign(newW(),j)}catch(e){}
  return null;
}

/* ---------- atributos ---------- */
function baseVals(){
  if(W.method==='comprar')return W.buy;
  if(W.method==='rolar')return W.vals;
  const o={};ATTRS.forEach(k=>{const i=W.assign[k];o[k]=(i==null||i==='')?null:W.pool[+i]});return o;
}
const attrsDone=()=>{const b=baseVals();return ATTRS.every(k=>b[k]!=null)};
function resetAge(){W.age={red:{},eduGain:0,eduLog:null};}
function finalAttrs(){
  const b=baseVals(),r=ageRule(+W.idade),o={};
  ATTRS.forEach(k=>{o[k]=b[k]==null?null:b[k]});
  if(!r)return o;
  ATTRS.forEach(k=>{if(o[k]!=null&&W.age.red[k])o[k]-=W.age.red[k]});
  if(o.APA!=null)o.APA-=r.apa;
  if(o.EDU!=null){o.EDU-=r.eduMinus;o.EDU+=W.age.eduGain||0}
  ATTRS.forEach(k=>{if(o[k]!=null)o[k]=clamp(o[k],1,99)});
  return o;
}
function redLeft(){const r=ageRule(+W.idade);if(!r)return 0;return r.red-r.redA.reduce((s,k)=>s+(W.age.red[k]||0),0)}
function redCan(k){const r=ageRule(+W.idade),b=baseVals();return !!r&&b[k]!=null&&redLeft()>=5&&(b[k]-(W.age.red[k]||0)-5)>=1}
function redStuck(){const r=ageRule(+W.idade);return !r||r.redA.every(k=>!redCan(k))}
function doEduChecks(){
  const r=ageRule(+W.idade),b=baseVals();let edu=b.EDU-r.eduMinus,gain=0;const log=[];
  for(let i=1;i<=r.chk;i++){
    const roll=rnd(1,100);
    if(roll>edu){const g=rnd(1,10);const nv=Math.min(99,edu+g);log.push('Verificação '+i+': rolou '+roll+' contra '+edu+', EDU sobe '+(nv-edu)+'.');gain+=nv-edu;edu=nv}
    else log.push('Verificação '+i+': rolou '+roll+' contra '+edu+', sem melhora.');
  }
  W.age.eduGain=gain;W.age.eduLog=log;
}
function rollLuck(){
  const r=ageRule(+W.idade),a=r3();
  if(r&&r.luck2){const b=r3();W.luck=Math.max(a,b);W.luckLog='Duas rolagens: '+a+' e '+b+'. Vale a maior.'}
  else{W.luck=a;W.luckLog='3d6×5 = '+a+'.'}
}

/* ---------- ocupação ---------- */
const occ=()=>OCC.find(o=>o.id===W.occ)||null;
const occName=()=>{const o=occ();return o?(o.custom?(W.cname.trim()||'Personalizada'):o.n):''};
const slotDefs=()=>{const o=occ();return o?o.s.map(parseSlot):[]};
function occFormula(o){return ptsTerms(o).map(t=>(t.a.length>1?'('+t.a.join(' ou ')+')':t.a[0])+'×'+t.m).join(' + ')}
function occTotal(){
  const o=occ();if(!o)return 0;const fa=finalAttrs();
  return ptsTerms(o).reduce((s,t,i)=>{const a=t.a.length>1?(W.occAttr[i]||t.a[0]):t.a[0];return s+(fa[a]||0)*t.m},0);
}
function initSel(){
  const defs=slotDefs();
  W.sel=defs.map(d=>d.k==='f'?{v:d.id}:d.k==='s'?{v:d.cat+':'+(d.fixed?d.name:'*')}:{v:''});
  W.names=defs.map(()=>'');W.pts={};W.cred=0;W.per={};W.sname={};W.occAttr={};
}
const specOf=v=>{const i=v.indexOf(':');return i<0?null:{cat:v.slice(0,i),name:v.slice(i+1)}};
function slotName(i){
  const v=(W.sel[i]||{}).v;if(!v)return'';
  const sp=specOf(v);if(!sp)return'';
  return(sp.name==='*'?(W.names[i]||''):sp.name).trim();
}
function slotResolved(i){
  const v=(W.sel[i]||{}).v;if(!v)return false;
  return specOf(v)?!!slotName(i):true;
}
/* converte as escolhas em ids reais de perícia (usando as vagas de especialização) */
function assignSlots(){
  const defs=slotDefs(),used=new Set(),ids=[],names={},extra=[];
  defs.forEach((d,i)=>{
    const v=(W.sel[i]||{}).v;
    if(!v){ids.push(null);return}
    const sp=specOf(v);
    if(!sp){ids.push(v);return}
    const free=(SLOTS[sp.cat]||[]).find(s=>!used.has(s));
    if(free){used.add(free);ids.push(free);names[free]=slotName(i)}
    else{ids.push('x'+i);extra.push({i,cat:sp.cat,nm:slotName(i)})}
  });
  return{ids,names,extra};
}
function wBase(id){
  if(id[0]==='x'){const c=(assignSlots().extra.find(e=>'x'+e.i===id)||{}).cat;return SKDEF[SLOTS[c][0]].b}
  const s=SKDEF[id],fa=finalAttrs();
  if(typeof s.b==='number')return s.b;
  if(s.b==='dex2')return Math.floor((fa.DES||0)/2);
  return fa.EDU||0;
}
function occById(){
  const a=assignSlots(),m={};
  a.ids.forEach((id,i)=>{if(id)m[id]=(m[id]||0)+(+W.pts[i]||0)});
  if(W.cred)m.credito=(m.credito||0)+(+W.cred||0);
  return m;
}
const sumObj=o=>Object.keys(o).reduce((s,k)=>s+(+o[k]||0),0);
const occUsed=()=>sumObj(W.pts)+(+W.cred||0);
const perTotal=()=>{const fa=finalAttrs();return(fa.INT||0)*2};
const perUsed=()=>sumObj(W.per);
function finalSk(id){return wBase(id)+(occById()[id]||0)+(+W.per[id]||0)}
const finalCredit=()=>(occById().credito||0)+(+W.per.credito||0);

/* rótulos */
function skName(id){
  const s=SKDEF[id];if(!s)return id;
  if(s.slot){const n=assignSlots().names[id]||W.sname[id]||'';return s.pre+' ('+(n||'…')+')'}
  return s.pre?s.pre+' ('+s.n+')':s.n;
}
function vLabel(v,i){
  const sp=specOf(v);
  if(!sp)return skName(v);
  const nm=sp.name==='*'?((i!=null&&W.names[i])||'…'):sp.name;
  return PRE[sp.cat]+' ('+nm+')';
}

/* =====================================================================
   ASSISTENTE DE CRIAÇÃO — telas
   ===================================================================== */
const wz=$('#wz');
const METHODS=[['rolar','Aleatório'],['escolher','Escolher onde colocar'],['comprar','Comprar pontos'],['rapido','Tiro rápido']];
const MDESC={
  rolar:'Role cada atributo: 3d6×5 para FOR, CON, DES, APA e POD, e (2d6+6)×5 para TAM, INT e EDU. Se o resultado ficar fraco demais, muitas mesas deixam refazer tudo.',
  escolher:'Role oito valores (cinco de 3d6×5 e três de (2d6+6)×5) e distribua entre os atributos como preferir.',
  comprar:'Divida 460 pontos entre os oito atributos, de 15 a 90 cada. O livro recomenda pelo menos 40 em INT e TAM.',
  rapido:'Distribua os valores 40, 50, 50, 50, 60, 60, 70 e 80 como preferir. É o caminho mais rápido.'
};
const seg=(items,cur,act)=>'<div class="wz-seg" role="group">'+items.map(([v,l])=>'<button type="button" data-a="'+act+'" data-v="'+v+'" aria-pressed="'+(cur===v)+'">'+l+'</button>').join('')+'</div>';
const ptCtl=(kind,key,val,dis)=>'<div class="pt"><button class="st" type="button" data-a="pt" data-kind="'+kind+'" data-key="'+esc(key)+'" data-d="-5"'+(dis?' disabled':'')+' aria-label="Menos 5">−</button>'+
  '<input type="number" inputmode="numeric" min="0" data-pin data-kind="'+kind+'" data-key="'+esc(key)+'" value="'+(+val||0)+'"'+(dis?' disabled':'')+' aria-label="Pontos">'+
  '<button class="st" type="button" data-a="pt" data-kind="'+kind+'" data-key="'+esc(key)+'" data-d="5"'+(dis?' disabled':'')+' aria-label="Mais 5">+</button></div>';
const cnt=(label,left)=>'<div class="cnt'+(left<0?' bad':'')+'"><span>'+label+'</span><b>'+left+'</b></div>';
const buyLeft=()=>460-sumObj(W.buy);

function dxOf(t){
  if(t<=64)return['−2',-2];if(t<=84)return['−1',-1];if(t<=124)return['0',0];if(t<=164)return['+1D4',1];if(t<=204)return['+1D6',2];
  const k=Math.floor((t-205)/80)+1;return['+'+(1+k)+'D6',2+k];
}
function movOf(f,d,t,age){
  let m=(f<t&&d<t)?7:(f>t&&d>t)?9:8;if(age>=40)m-=Math.min(5,Math.floor(age/10)-3);return Math.max(0,m);
}
function derivedHTML(fa){
  const dx=dxOf(fa.FOR+fa.TAM);
  const cells=[['PV',Math.floor((fa.CON+fa.TAM)/10)],['Sanidade',fa.POD],['PM',Math.floor(fa.POD/5)],['Movimento',movOf(fa.FOR,fa.DES,fa.TAM,+W.idade)],['Dano Extra',dx[0]],['Corpo',dx[1]<0?'−'+Math.abs(dx[1]):dx[1]]];
  return'<div class="wz-der">'+cells.map(c=>'<div><small>'+c[0]+'</small><b>'+c[1]+'</b></div>').join('')+'</div>';
}
function ageText(r){
  const p=[];
  if(r.eduMinus)p.push('EDU −'+r.eduMinus+'.');
  if(r.red)p.push('Reduza '+r.red+' pontos distribuídos entre '+r.redA.join(', ')+'.');
  if(r.apa)p.push('APA −'+r.apa+'.');
  if(r.chk)p.push(r.chk+' verificaç'+(r.chk>1?'ões':'ão')+' de melhoria de EDU.');
  if(r.luck2)p.push('Sorte: duas rolagens, vale a maior.');
  return p.join(' ');
}


/* ---------- utilitários do assistente ---------- */
const norm=t=>String(t==null?'':t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const searchBox=(attr,val,ph,clr)=>'<div class="sw'+(val?' has':'')+'"><svg class="lupa" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lupa"/></svg>'+
  '<input type="text" enterkeyhint="search" data-'+attr+' value="'+esc(val||'')+'" placeholder="'+ph+'" aria-label="'+ph+'" autocomplete="off" autocapitalize="off" spellcheck="false">'+
  '<button type="button" class="x" data-a="qclear" data-w="'+clr+'" aria-label="Limpar busca" tabindex="-1">×</button></div>';

/* Atualiza a tela sem recriar os elementos: o foco, o teclado e a rolagem ficam como estão
   e as transições do CSS (marcação, cores, barras) rodam de verdade. */
const mkey=n=>n.nodeType===1?n.getAttribute('data-id'):null;
function ent(y){y.classList.add('ent');y.addEventListener('animationend',()=>y.classList.remove('ent'),{once:true})}
function syncAttrs(x,y){
  Array.from(x.attributes).forEach(a=>{if(!y.hasAttribute(a.name))x.removeAttribute(a.name)});
  Array.from(y.attributes).forEach(a=>{if(x.getAttribute(a.name)!==a.value)x.setAttribute(a.name,a.value)});
}
function patch(x,y,anim){
  if(x.nodeType!==1){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;return}
  syncAttrs(x,y);
  const tag=x.nodeName;
  if(tag==='INPUT'){
    if(x.type==='checkbox'||x.type==='radio'){x.checked=y.hasAttribute('checked')}
    else if(x!==document.activeElement||x.hasAttribute('data-pin')){const v=y.getAttribute('value')||'';if(x.value!==v)x.value=v}
    return;
  }
  if(tag==='TEXTAREA'){if(x!==document.activeElement){const v=y.textContent;if(x.value!==v)x.value=v}return}
  kids(x,y,anim);
  if(tag==='SELECT'){const i=Array.from(y.options).findIndex(o=>o.hasAttribute('selected'));x.selectedIndex=i<0?0:i}
}
function kids(a,b,anim){
  const an=Array.from(a.childNodes),bn=Array.from(b.childNodes);
  if(bn.length&&bn.every(mkey)&&an.every(mkey)){
    const map=new Map(an.map(n=>[mkey(n),n]));let ref=a.firstChild;
    bn.forEach(y=>{
      const k=mkey(y),x=map.get(k);
      if(x){map.delete(k);if(x===ref)ref=ref.nextSibling;else a.insertBefore(x,ref);patch(x,y,anim)}
      else{if(anim)ent(y);a.insertBefore(y,ref)}
    });
    map.forEach(n=>n.remove());
    return;
  }
  const n=Math.max(an.length,bn.length);
  for(let i=0;i<n;i++){
    const x=an[i],y=bn[i];
    if(!y){x.remove();continue}
    if(!x){if(anim&&y.nodeType===1)ent(y);a.appendChild(y);continue}
    if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){a.replaceChild(y,x);continue}
    patch(x,y,anim);
  }
}
function morph(root,html,anim){const t=document.createElement('template');t.innerHTML=html;kids(root,t.content,anim)}

/* ---------- etapa 1 ---------- */
function s1(){
  const f=(k,l,x)=>'<label class="fld"'+(k==='nome'?' style="grid-column:1/-1"':'')+'><span>'+l+'</span><input data-w1="'+k+'" value="'+esc(W[k])+'" '+(x||'maxlength="60"')+' autocomplete="off"></label>';
  return'<section class="wz-card"><h3>Quem é o investigador?</h3><div class="wz-g2">'+f('nome','Nome')+
    f('idade','Idade (15 a 90)','type="number" inputmode="numeric" min="15" max="90"')+f('gen','Gênero')+f('res','Residência')+f('nasc','Local de nascimento')+'</div>'+
    '<p>A idade mexe nos atributos no próximo passo: jovens perdem um pouco de físico e educação; os mais velhos ganham educação, mas perdem físico e aparência.</p></section>'+
    '<section class="wz-card"><h3>Época do jogo</h3>'+seg([['20','Anos 1920'],['mod','Moderna']],W.era,'era')+
    '<p>Define a tabela de dinheiro e se as ocupações e perícias modernas aparecem.</p></section>';
}

/* ---------- etapa 2 ---------- */
function s2(){
  const b=baseVals(),fa=finalAttrs(),idade=+W.idade,r=ageRule(idade);
  let h='<section class="wz-card"><h3>Como definir os atributos?</h3>'+seg(METHODS,W.method,'method')+'<p>'+MDESC[W.method]+'</p>';
  if(W.method==='rolar')h+='<button class="btn pri" type="button" data-a="rollall">'+(attrsDone()?'Rolar tudo de novo':'Rolar atributos')+'</button>';
  if(W.method==='escolher')h+='<button class="btn pri" type="button" data-a="rollpool">'+(W.pool.length?'Rolar valores de novo':'Rolar valores')+'</button>';
  if(W.method==='comprar')h+=cnt('Pontos restantes',buyLeft());
  h+='</section><section class="wz-card"><h3>Atributos</h3>';
  h+=ATTRS.map(k=>{
    let ctl;
    if(W.method==='rolar')ctl='<span>'+(b[k]==null?'—':b[k])+'</span>';
    else if(W.method==='comprar')ctl='<div class="pt"><button class="st" type="button" data-a="buy" data-k="'+k+'" data-d="-5" aria-label="Menos 5">−</button><span style="min-width:36px;text-align:center;font:600 1rem var(--disp)">'+W.buy[k]+'</span><button class="st" type="button" data-a="buy" data-k="'+k+'" data-d="5" aria-label="Mais 5">+</button></div>';
    else{
      const usedIdx=new Set(Object.keys(W.assign).filter(a=>a!==k&&W.assign[a]!==''&&W.assign[a]!=null).map(a=>+W.assign[a]));
      ctl='<select data-wa="'+k+'"'+(W.pool.length?'':' disabled')+' aria-label="Valor de '+CNAME[k]+'"><option value="">—</option>'+
        W.pool.map((v,i)=>usedIdx.has(i)?'':'<option value="'+i+'"'+(String(W.assign[k])===String(i)?' selected':'')+'>'+v+'</option>').join('')+'</select>';
    }
    const ch=b[k]!=null&&fa[k]!==b[k];
    return'<div class="wz-at"><b>'+k+'</b><span class="nm">'+CNAME[k]+'</span>'+ctl+'<span class="fin">'+(fa[k]==null?'—':fa[k])+(ch?'<small>base '+b[k]+'</small>':'')+'</span></div>';
  }).join('')+'</section>';
  if(!attrsDone()){
    h+='<section class="wz-card"><h3>Ajustes de idade e Sorte</h3><p>Defina os oito atributos para aplicar os ajustes da idade e rolar a Sorte.</p></section>';
    return h;
  }
  if(!r){h+='<section class="wz-card"><h3>Ajustes de idade</h3><p>Volte à etapa 1 e informe uma idade entre 15 e 90 anos.</p></section>';return h}
  h+='<section class="wz-card"><h3>Ajustes de idade ('+idade+' anos)</h3><p>'+ageText(r)+'</p>';
  if(r.red){
    h+=cnt('Pontos a reduzir',redLeft());
    h+=r.redA.map(k=>'<div class="wz-at"><b>'+k+'</b><span class="nm">'+CNAME[k]+((W.age.red[k]||0)?' −'+W.age.red[k]:'')+'</span><div class="pt"><button class="st" type="button" data-a="red" data-k="'+k+'" data-d="-5"'+((W.age.red[k]||0)>0?'':' disabled')+' aria-label="Devolver 5">−</button><button class="st" type="button" data-a="red" data-k="'+k+'" data-d="5"'+(redCan(k)?'':' disabled')+' aria-label="Reduzir 5">+</button></div><span class="fin">'+fa[k]+'</span></div>').join('');
  }
  if(r.chk){
    if(W.age.eduLog===null)h+='<button class="btn" type="button" data-a="edu">Fazer as verificações de melhoria de EDU</button>';
    else h+='<div class="wz-log">'+W.age.eduLog.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>';
  }
  if(W.luck==null)h+='<button class="btn" type="button" data-a="luck">Rolar a Sorte</button>';
  else h+='<p><b>Sorte: '+W.luck+'</b> · '+esc(W.luckLog)+'</p>';
  h+='</section><section class="wz-card"><h3>Como fica</h3>'+derivedHTML(fa)+'</section>';
  return h;
}

/* ---------- etapa 3 ---------- */
function tokLabel(t){
  if(t==='F')return'Armas de Fogo';if(t==='L')return'Lutar';
  const sp=specOf(t);if(sp)return PRE[sp.cat]+' ('+(sp.name==='*'?'à escolha':sp.name)+')';
  return skName(t);
}
function occSummary(o){
  const names=[];let ni=0,na=0;const picks={};
  o.s.forEach(t=>{
    const d=parseSlot(t);
    if(d.k==='i')ni++;else if(d.k==='a')na++;
    else if(d.k==='f')names.push(skName(d.id));
    else if(d.k==='s')names.push(PRE[d.cat]+' ('+(d.fixed?d.name:'à escolha')+')');
    else{picks[t]=(picks[t]||0)+1}
  });
  Object.keys(picks).forEach(t=>{
    const opts=(t[0]==='p'&&t[1]===':'?t.slice(2):t).split('|').map(tokLabel).join(' ou ');
    names.push((picks[t]>1?picks[t]+' entre: ':'')+opts);
  });
  if(ni)names.push(ni>1?ni+' interpessoais':'1 interpessoal');
  if(na)names.push(na>1?na+' à escolha':'1 à escolha');
  return names.join(', ');
}
function ocBtn(o){
  return'<button type="button" class="oc" data-id="o-'+o.id+'" data-a="occ" data-v="'+o.id+'" aria-pressed="'+(W.occ===o.id)+'"><b>'+esc(o.n)+(o.lv?'<span class="tg">Lovecraftiana</span>':'')+(o.mod?'<span class="tg">Moderna</span>':'')+(o.err?'<span class="tg w">Conferir</span>':'')+'</b>'+
    (o.custom?'<small>Monte a sua: até 8 perícias à sua escolha.</small>':'<small>'+esc(occSummary(o))+'</small>')+
    '<small>Nível de Crédito '+o.cr[0]+' a '+o.cr[1]+' · Pontos: '+occFormula(o).replace(/\*/g,'×')+'</small></button>';
}
function ocDetail(o){
  let h='<section class="wz-card ocd" data-id="det"><h3>'+esc(occName())+' · escolhida</h3>';
  if(o.custom)h+='<label class="fld"><span>Nome da ocupação</span><input data-wcn value="'+esc(W.cname)+'" maxlength="40" autocomplete="off"></label>';
  ptsTerms(o).forEach((t,i)=>{
    if(t.a.length>1)h+='<label class="fld"><span>Segundo atributo dos pontos</span><select data-woa="'+i+'">'+t.a.map(a=>'<option value="'+a+'"'+((W.occAttr[i]||t.a[0])===a?' selected':'')+'>'+CNAME[a]+' ('+a+')</option>').join('')+'</select></label>';
  });
  h+='<p>Pontos de ocupação: <b>'+occTotal()+'</b> · Nível de Crédito recomendado: <b>'+o.cr[0]+' a '+o.cr[1]+'</b>.</p>';
  if(o.err)h+='<p style="color:#f0c47a">Na edição brasileira, a lista desta ocupação parece repetir a de outra (provável erro de impressão). Confirme com o Guardião e ajuste no passo seguinte.</p>';
  return h+'</section>';
}
function s3(){
  const q=norm((W.oq||'').trim());
  const all=OCC.filter(o=>!o.custom&&(!o.mod||W.era==='mod')).sort((a,b)=>a.n.localeCompare(b.n,'pt-BR')).concat(OCC.filter(o=>o.custom));
  const list=all.filter(o=>!q||o.id===W.occ||norm(o.n+' '+(o.custom?'personalizada':occSummary(o))).indexOf(q)>=0);
  let h='<section class="wz-card"><h3>Escolha a ocupação</h3><p>Ela define as perícias principais, a faixa de Nível de Crédito e quantos pontos você tem para distribuir. Use a busca para achar mais rápido.</p>'+
    searchBox('woq',W.oq,'Buscar ocupação','oq')+'</section>';
  h+='<div class="wz-occ">'+(list.length?list.map(o=>ocBtn(o)+(W.occ===o.id?ocDetail(o):'')).join(''):'<p class="hint" data-id="none">Nenhuma ocupação encontrada.</p>')+'</div>';
  return h;
}

/* ---------- etapa 4 ---------- */
function allOptions(cur,taken){
  const era=W.era;
  return CATS.map(([c,t])=>{
    const ids=SK0.filter(s=>s.c===c&&!s.slot&&!s.nt&&(!s.mod||era==='mod')).map(s=>s.id);
    const ops=ids.map(id=>'<option value="'+id+'"'+(cur===id?' selected':'')+(taken.has(id)&&cur!==id?' disabled':'')+'>'+esc(skName(id))+'</option>');
    if(SLOTS[c])ops.push('<option value="'+c+':*"'+(cur&&cur.indexOf(c+':')===0?' selected':'')+'>'+PRE[c]+' (outra especialidade)</option>');
    return ops.length?'<optgroup label="'+t+'">'+ops.join('')+'</optgroup>':'';
  }).join('');
}
function slotRowHTML(i,d,as,taken){
  const sel=W.sel[i]||{v:''},v=sel.v,id=as.ids[i],res=slotResolved(i);
  let nm;
  if(d.k==='f')nm='<span class="lb">'+esc(skName(d.id))+'</span>';
  else if(d.k==='s'&&d.fixed)nm='<span class="lb">'+esc(vLabel(v,i))+'</span>';
  else if(d.k==='s')nm='<span class="lb">'+PRE[d.cat]+'<small>Dê um nome à especialização</small></span><input data-wname="'+i+'" value="'+esc(W.names[i]||'')+'" maxlength="30" placeholder="Especialidade" aria-label="Especialidade">';
  else{
    const kind=d.k==='i'?'Interpessoal':d.k==='p'?'Uma das opções':'Qualquer perícia';
    const sp=v&&specOf(v);
    const lbl=v?(sp&&sp.name==='*'?PRE[sp.cat]+' (outra especialidade)':vLabel(v,i)):'';
    nm='<button type="button" class="pkb'+(v?' on':'')+'" data-a="pick" data-i="'+i+'" aria-haspopup="dialog" aria-label="Escolher perícia '+(i+1)+(v?' (atual: '+esc(lbl)+')':'')+'">'+
      '<span class="pkt"><small>'+(i+1)+' · '+kind+'</small><b>'+(v?esc(lbl):'Escolher perícia…')+'</b></span><svg class="lupa" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lupa"/></svg></button>';
    if(sp&&sp.name==='*')nm+='<input data-wname="'+i+'" value="'+esc(W.names[i]||'')+'" maxlength="30" placeholder="Especialidade" aria-label="Especialidade">';
  }
  const rt=res?'<div class="rt">'+ptCtl('o',i,W.pts[i])+'<span class="tot">'+(wBase(id)+(+W.pts[i]||0))+'</span></div>':'<div class="rt"><span class="tot">—</span></div>';
  const stack=(d.k==='i'||d.k==='p'||d.k==='a'||(d.k==='s'&&!d.fixed));
  return'<div class="wz-r'+(res?'':' dim')+(stack?' sel':'')+'" data-id="sl'+i+'"><div class="nm">'+nm+'</div>'+rt+'</div>';
}
function s4(){
  const o=occ(),defs=slotDefs(),as=assignSlots();
  const taken=new Set();defs.forEach((d,i)=>{const v=(W.sel[i]||{}).v;if(v&&!specOf(v))taken.add(v)});
  let h='<section class="wz-card"><h3>Perícias da ocupação</h3><p>Toque numa linha para escolher a perícia (dá para buscar pela lupa) e depois distribua os pontos. Cada perícia soma os pontos ao valor base.</p>'+cnt('Pontos de ocupação restantes',occTotal()-occUsed())+'</section>';
  h+='<section class="wz-card">'+defs.map((d,i)=>slotRowHTML(i,d,as,taken)).join('');
  h+='<div class="wz-r" data-id="cred"><div class="nm"><span class="lb">Nível de Crédito<small>Faixa recomendada: '+o.cr[0]+' a '+o.cr[1]+'</small></span></div><div class="rt">'+ptCtl('c','c',W.cred)+'<span class="tot">'+(+W.cred||0)+'</span></div></div></section>';
  if(as.extra.length)h+='<section class="wz-card"><p>Não há vagas suficientes para todas as especializações; as extras serão criadas como perícias adicionais.</p></section>';
  return h;
}

/* ---------- etapa 5 ---------- */
function s5list(){
  const as=assignSlots(),q=norm((W.q||'').trim()),occMap=occById();
  let h='';
  CATS.forEach(([c,t])=>{
    const rows=SK0.filter(s=>s.c===c&&!s.my&&(!s.mod||W.era==='mod')).filter(s=>{
      const named=as.names[s.id]||W.sname[s.id];
      if(s.slot&&!named&&q)return false;
      return!q||norm(skName(s.id)).indexOf(q)>=0;
    });
    if(!rows.length)return;
    h+='<h3 class="sh" data-id="h-'+c+'" style="margin-top:12px">'+t+'</h3>';
    h+=rows.map(s=>{
      const fixedName=as.names[s.id],named=fixedName||W.sname[s.id];
      let nm;
      if(s.slot&&!fixedName)nm='<span class="lb">'+esc(s.pre)+'</span><input data-wsn="'+s.id+'" value="'+esc(W.sname[s.id]||'')+'" maxlength="30" placeholder="Nomeie para usar" aria-label="Especialidade de '+esc(s.pre)+'">';
      else nm='<span class="lb">'+esc(skName(s.id))+'<small>base '+wBase(s.id)+((occMap[s.id])?' + ocupação '+occMap[s.id]:'')+'</small></span>';
      const ok=!s.slot||named;
      return'<div class="wz-r'+(ok?'':' dim')+'" data-id="r-'+s.id+'"><div class="nm">'+nm+'</div><div class="rt">'+ptCtl('p',s.id,W.per[s.id],!ok)+'<span class="tot">'+(ok?finalSk(s.id):'—')+'</span></div></div>';
    }).join('');
  });
  return h||'<p class="hint" data-id="none">Nenhuma perícia encontrada.</p>';
}
function s5(){
  return'<section class="wz-card"><h3>Interesses pessoais</h3><p>Gaste esses pontos em qualquer perícia, menos Mythos de Cthulhu. Pontos que sobrarem se perdem. Para Armas de Fogo e Lutar, nomeie a especialização nas linhas em branco.</p>'+
    cnt('Pontos de interesse pessoal restantes',perTotal()-perUsed())+
    searchBox('wq',W.q,'Buscar perícia','q')+'</section>'+
    '<section class="wz-card" id="wzList">'+s5list()+'</section>';
}

/* ---------- etapas 6 a 8 ---------- */
const BKP={
  desc:'Como ele é por fora? Roupas, postura, algo que chama atenção.',
  ideo:'No que acredita? Uma fé, uma causa ou uma convicção que guia suas escolhas.',
  pess:'Quem importa e por quê? Um nome e um sentimento (amor, dívida, rancor).',
  loc:'Um lugar que significa algo: onde cresceu, trabalha ou se refugia.',
  pert:'Um objeto de valor sentimental que ele nunca largaria.',
  trac:'Um traço de personalidade: teimoso, galanteador, corajoso, desconfiado…'
};
function s6(){
  const keys=BKF.slice(0,6);
  return'<section class="wz-card"><h3>Antecedentes</h3><p>Preencha pelo menos três das seis categorias. Elas dão ao Guardião ganchos para a história e ajudam você a interpretar o investigador.</p>'+
    keys.map(([k,n])=>'<label class="fld"><span>'+n+'</span><textarea data-wb="'+k+'" maxlength="1500" placeholder="'+esc(BKP[k])+'" style="min-height:70px">'+esc(W.bk[k])+'</textarea></label>').join('')+
    '<label class="fld"><span>Conexão-chave (a mais importante)</span><select data-wkey><option value="">Escolher depois</option>'+keys.map(([k,n])=>'<option value="'+k+'"'+(W.chave===k?' selected':'')+'>'+n+'</option>').join('')+'</select></label></section>';
}
/* ---------- catálogo de equipamento (Apêndice III e Tabela XVII do livro) ---------- */
const ICATS=[['arm','Armas'],['mun','Munição'],['inv','Investigador'],['fer','Ferramentas'],['med','Médico'],['cam','Camping'],['ele','Eletrônicos'],['ent','Câmeras e música'],['rou','Roupas'],['vei','Veículos']];
const ICATN=Object.fromEntries(ICATS);
const ITEMS=[],ITEM_BY={};
function addIt(o){
  const base=o.c+'.'+norm(o.n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.'+o.e;
  let id=base,k=2;while(ITEM_BY[id])id=base+'-'+(k++);
  o.id=id;ITEMS.push(o);ITEM_BY[id]=o;
}
/* e = '2' só anos 1920, 'm' só moderna. Linhas: Nome|preço. Linhas com # abrem um grupo. */
function lst(txt,c,e){
  let g='';
  txt.trim().split('\n').forEach(l=>{
    l=l.trim();if(!l)return;
    if(l[0]==='#'){g=l.slice(1).trim();return}
    const p=l.split('|');
    addIt({c,e,g,n:p[0].trim(),p20:e==='m'?'':(p[1]||'').trim(),pm:e==='m'?(p[1]||'').trim():''});
  });
}
function splitDano(d,al){
  let dn=String(d||''),note='',m=/^(.*?)\s*\+?\s*(queimar|atordoar)$/i.exec(dn);
  if(m){dn=m[1].replace(/\+$/,'');note=m[2].toLowerCase()}
  m=/^(.+?)\/\s*(\d+)\s*metros?$/i.exec(dn);
  if(m){dn=m[1];note+=(note?' · ':'')+'raio '+m[2]+' m'}
  if(/\//.test(dn)&&/D/i.test(dn)){note+=(note?' · ':'')+'dano '+dn.replace(/\//g,' / ');dn=dn.split('/')[0]}
  return{dano:dn,al:String(al||'')+(note?(al?' · ':'')+note:'')};
}
/* Armas: [nome, perícia, dano, alcance, usos/rodada, munição, preço 20s, preço moderno, defeito, era]
   perícia: briga, arr, pis, rif, smg, L:Especialidade, F:Especialidade. era: 2, m ou b; r no fim = raro. */
function wps(g,rows){
  rows.forEach(r=>{
    const rare=/r$/.test(r[9]),e=r[9].replace('r',''),sp=splitDano(r[2],r[3]);
    addIt({c:'arm',e,g,n:r[0],p20:r[6],pm:r[7],rare,w:{sk:r[1],d0:r[2],al0:r[3],dano:sp.dano,al:sp.al,nat:r[4],mun:(/\d+/.exec(r[5])||[''])[0],mal:r[8]}});
  });
}
wps('Armas comuns e corpo a corpo',[
 ['Arco e Flecha','F:Arcos','1D6+meio DX','30 metros','1','1','$7','$75','97','b'],
 ['Soqueira','briga','1D3+1+DX','Toque','1','','$1','$10','','b'],
 ['Chicote','L:Chicotes','1D3+meio DX','3 metros','1','','$5','$50','','2'],
 ['Tocha Acesa','briga','1D6+queimar','Toque','1','','$0,05','$0,50','','b'],
 ['Serra Elétrica','L:Serras Elétricas','2D8','Toque','1','','','$300','95','m'],
 ['Porrete médio (cassetete)','briga','1D8+DX','Toque','1','','$2','$15','','b'],
 ['Porrete grande (bastão de baseball ou de críquete)','briga','1D8+DX','Toque','1','','$3','$35','','b'],
 ['Porrete pequeno (bastão extensível)','briga','1D6+DX','Toque','1','','$3','$35','','b'],
 ['Besta','F:Arcos','1D8+2','50 metros','1/2','1','$10','$100','96','b'],
 ['Garrote','L:Garrotes','1D6+DX','Toque','1','','$0,50','$3','','b'],
 ['Machadinha / Foicinha','L:Machados','1D6+1+DX','Toque','1','','$3','$9','','b'],
 ['Machado de Lenhador','L:Machados','1D8+2+DX','Toque','1','','$5','$10','','b'],
 ['Faca grande (facão, etc.)','briga','1D8+DX','Toque','1','','$4','$50','','b'],
 ['Faca média (faca de cozinha, etc.)','briga','1D4+2+DX','Toque','1','','$2','$15','','b'],
 ['Faca pequena (canivete, etc.)','briga','1D4+DX','Toque','1','','$2','$6','','b'],
 ['Cabo eletrizado (220 volts)','briga','2D8+atordoar','Toque','1','','','','95','m'],
 ['Spray de Pimenta','briga','atordoar','2 metros','1','25 jatos','','$10','','m'],
 ['Nunchaku','L:Manguais','1D8+DX','Toque','1','','$1','$10','','b'],
 ['Pedra arremessada','arr','1D4+meio DX','FOR/5 metros','1','','','','','b'],
 ['Shuriken','arr','1D3+meio DX','FOR/5 metros','2','Uso único','$0,50','$3','100','b'],
 ['Lança (de cavalaria)','L:Lanças','1D8+1','Toque','1','','$25','$150','','b'],
 ['Lança arremessada','arr','1D8+meio DX','FOR/5 metros','1','','$1','$25','','br'],
 ['Bumerangue de Guerra','arr','1D8+meio DX','FOR/5 metros','1','','$2','$4','','br'],
 ['Espada pesada (sabre de cavalaria)','L:Espadas','1D8+1+DX','Toque','1','','$30','$75','','b'],
 ['Espada média (rapieira, florete pesado)','L:Espadas','1D6+1+DX','Toque','1','','$15','$100','','b'],
 ['Espada leve (florete afiado, bengala-espada)','L:Espadas','1D6+DX','Toque','1','','$25','$100','','b'],
 ['Taser (contato)','briga','1D3+atordoar','Toque','1','Varia','','$200','97','m'],
 ['Taser (dardo)','pis','1D3+atordoar','5 metros','1','3','','$400','95','m']
]);
wps('Pistolas',[
 ['Pederneira','pis','1D6+1','10 metros','1/4','1','$30','$300','95','br'],
 ['.22 Curta Automática','pis','1D6','10 metros','1 (3)','6','$25','$190','100','b'],
 ['.25 Derringer (1C)','pis','1D6','3 metros','1','1','$12','$55','100','2'],
 ['Revólver .32 ou 7.65mm','pis','1D8','15 metros','1 (3)','6','$15','$200','100','b'],
 ['.32 Automática ou 7.65mm','pis','1D8','15 metros','1 (3)','8','$20','$350','99','b'],
 ['Revólver .357 Magnum','pis','1D8+1D4','15 metros','1 (3)','6','','$425','100','m'],
 ['Revólver .38 ou 9mm','pis','1D10','15 metros','1 (3)','6','$25','$200','100','b'],
 ['.38 Automática','pis','1D10','15 metros','1 (3)','8','$30','$375','99','b'],
 ['Pistola Sinalizadora','pis','1D10+1D3 queimar','10 metros','1/2','1','$15','$75','100','b']
]);
wps('Rifles',[
 ['Rifle Mosquete .58 Springfield','rif','1D10+4','60 metros','1/4','1','$25','$350','95','br'],
 ['Rifle de Ferrolho .22','rif','1D6+1','30 metros','1','6','$13','$70','99','b'],
 ['Carabina de Alavanca .30','rif','2D6','50 metros','1','6','$19','$150','98','b'],
 ['Rifle Martini-Henry .45','rif','1D8+1D6+3','80 metros','1/3','1','$20','$200','100','2'],
 ['Rifle de Ar do Coronel Moran','rif','2D6+1','20 metros','1/3','1','$200','','88','2'],
 ['Rifle Garand M1, M2','rif','2D6+4','110 metros','1','8','','$400','100','m'],
 ['Carabina SKS','rif','2D6+1','90 metros','1 (2)','10','','$500','97','m'],
 ['Rifle Lee-Enfield .303','rif','2D6+4','110 metros','1','10','$50','$300','100','b'],
 ['Rifle de Ferrolho .30-06','rif','2D6+4','110 metros','1','5','$75','$175','100','b'],
 ['Rifle Semi-Automático .30-06','rif','2D6+4','110 metros','1','5','','$275','100','m'],
 ['Rifle Marlin .444','rif','2D8+4','110 metros','1','5','','$400','98','m'],
 ['Rifle de Elefantes (2C)','rif','3D6+4','100 metros','1 ou 2','2','$400','$1.800','100','b']
]);
wps('Espingardas',[
 ['Espingarda Calibre 20 (2C)','rif','2D6/1D6/1D3','10/20/50 metros','1 ou 2','2','$35','','100','2'],
 ['Espingarda Calibre 16 (2C)','rif','2D6+2/1D6+1/1D4','10/20/50 metros','1 ou 2','2','$40','','100','2'],
 ['Espingarda Calibre 12 (2C)','rif','4D6/2D6/1D6','10/20/50 metros','1 ou 2','2','$40','$200','100','b'],
 ['Espingarda Calibre 10 (2C)','rif','4D6+2/2D6+1/1D4','10/20/50 metros','1 ou 2','2','','','100','2r'],
 ['Escopeta Calibre 12 (2C serrada)','rif','4D6/1D6','5/10 metros','1 ou 2','2','','','100','2'],
 ['Escopeta Calibre 12 (deslizante)','rif','4D6/2D6/1D6','10/20/50 metros','1','5','','$100','100','m'],
 ['Escopeta Calibre 12 (semi-auto)','rif','4D6/2D6/1D6','10/20/50 metros','1 (2)','5','','$100','100','m'],
 ['Benelli M3 Cal. 12 (coronha retrátil)','rif','4D6/2D6/1D6','10/20/50 metros','1 (2)','7','','$895','100','m'],
 ['SPAS Cal. 12 (coronha retrátil)','rif','4D6/2D6/1D6','10/20/50 metros','1','8','','$600','98','m']
]);
wps('Fuzis de assalto',[
 ['AK-47 ou AKM','rif','2D6+1','100 metros','1 (2) ou auto','30','','$200','100','m'],
 ['AK-74','rif','2D6','110 metros','1 (2) ou auto','30','','$1.000','97','m'],
 ['Barrett Model 82','rif','2D10+1D8+6','250 metros','1','11','','$3.000','96','m'],
 ['FN FAL Leve Automática','rif','2D6+4','110 metros','1 (2) ou rajada 3','20','','$1.500','97','m'],
 ['Fuzil de Assalto Galil','rif','2D6','110 metros','1 ou auto','20','','$2.000','98','m'],
 ['M16A2','rif','2D6','110 metros','1 (2) ou rajada 3','30','','N/D','97','m'],
 ['M4','rif','2D6','90 metros','1 ou rajada 3','30','','N/D','97','m'],
 ['Steyr AUG','rif','2D6','110 metros','1 (2) ou auto','30','','$1.100','99','m'],
 ['Beretta M70/90','rif','2D6','110 metros','1 ou auto','30','','$2.800','99','m']
]);
wps('Submetralhadoras',[
 ['Bergmann MP181/MP2811','smg','1D10','20 metros','1 (2) ou auto','20','$1.000','$20.000','96','2'],
 ['Heckler & Koch MP5','smg','1D10','20 metros','1 (2) ou auto','15','','N/D','97','m'],
 ['Ingram MAC-11','smg','1D10','15 metros','1 (3) ou auto','32','','$750','96','m'],
 ['Skorpion SMT','smg','1D8','15 metros','1 (3) ou auto','20','','N/D','96','m'],
 ['Thompson','smg','1D10+2','20 metros','1 ou auto','20','$200+','$1.600','96','2'],
 ['Uzi SMG','smg','1D10','20 metros','1 (2) ou auto','32','','$1.000','98','m']
]);
wps('Metralhadoras',[
 ['Gatling Gun Modelo 1882','F:Metralhadoras','2D6+4','100 metros','auto','200','$2.000','$14.000','96','2r'],
 ['Browning Auto Rifle M1918','F:Metralhadoras','2D6+4','90 metros','1 (2) ou auto','20','$800','$1.500','100','2'],
 ['Browning M1917A1 .30','F:Metralhadoras','2D6+4','150 metros','auto','250','$3.000','$30.000','96','2'],
 ['Bren Gun','F:Metralhadoras','2D6+4','110 metros','1 ou auto','30','$3.000','$50.000','96','2'],
 ['Lewis Gun Mark I','F:Metralhadoras','2D6+4','110 metros','auto','47','$3.000','$20.000','96','2'],
 ['Metralhadora Vickers .303','F:Metralhadoras','2D6+4','110 metros','auto','250','N/D','','99','2'],
 ['Minigun','F:Metralhadoras','2D6+4','200 metros','auto','4000','','N/D','98','m'],
 ['FN Minimi 5.56mm','F:Metralhadoras','2D6','110 metros','auto','30','','N/D','99','m']
]);
wps('Explosivos e armas pesadas',[
 ['Coquetel Molotov','arr','2D6+queimar','FOR/5 metros','1/2','Uso único','N/D','N/D','95','b'],
 ['Banana de Dinamite','arr','4D10/3 metros','FOR/5 metros','1/2','Uso único','$2','$5','99','b'],
 ['Granada de Mão','arr','4D10/3 metros','FOR/5 metros','1/2','Uso único','N/D','N/D','99','b'],
 ['Lança-Chamas','F:Lança-chamas','2D6+queimar','25 metros','1','10','N/D','N/D','93','b'],
 ['Lança Granadas M79','F:Pesadas','3D10/2 metros','20 metros','1/3','1','','N/D','99','m'],
 ['Lança-Foguetes (LAW)','F:Pesadas','8D10/1 metro','150 metros','1','1','','N/D','98','m']
]);
lst(`
# Acessórios e outros
Baioneta|$3,75
Punhal|$2,50
Navalha|65¢ a $5,25
`,'arm','2');
lst(`
# Acessórios e outros
Silenciador Ilegal (Pistola)|$1.000,00+
Mira Laser|$300,00+
Mira Telescópica|$200,00+
Cassetete Elétrico|$65,00
Soqueira de Alumínio|$20,00
Besta Composta|$600,00+
12 Virotes|$38,00
Caneta Zarabatana (com dardos)|$35,00
Bandoleira|$60,00
`,'arm','m');

lst(`
.22 Long Rifle (100)|54¢
.22 Ponta Oca (100)|53¢
.25 Fogo Circular (100)|$1,34
.30-06 Springfield (100)|$7,63
.32 Special (100)|$5,95
.32-20 Winchester (100)|$2,97
.38 Curta (100)|$1,75
.38-55 Winchester (100)|$6,60
.44 Alta Potência (100)|$4,49
.45 Automática (100)|$4,43
Cartucho Cal-10 (25)|$1,00
Cartucho Cal-10 (100)|$3,91
Cartucho Cal-12 (25)|93¢
Cartucho Cal-12 (100)|$3,63
Cartucho Cal-16 (25)|86¢
Cartucho Cal-16 (100)|$3,34
Cartucho Cal-20 (25)|85¢
Cartucho Cal-20 (100)|$3,30
Municiador Extra|$1,90
`,'mun','2');
lst(`
.22 Long Rifle (500)|$21,00
.220 Swift (50)|$24,00
.25 Automática (50)|$15,00
.30 Carbine (50)|$15,00
.30-06 Rifle (50)|$15,00
.357 Magnum (50)|$22,00
.38 Special (50)|$17,00
5.56mm (50)|$24,00
9mm Parabellum (50)|$12,00
.44 Magnum (50)|$39,00
.45 Auto (100)|$23,00
Cartucho Cal-10 (25)|$40,00
Cartucho Cal-12 (25)|$30,00
Cartucho Cal-16 (25)|$26,00
Cartucho Cal-20 (25)|$28,00
`,'mun','m');

lst(`
Algemas|$3,35
Chave Extra de Algema|28¢
Apito de Polícia|30¢
Ditafone|$39,95
Gravador Magnético|$129,95
Relógio de Pulso|$5,95
Relógio de Bolso de Ouro|$35,10
Caneta Tinteiro de Auto-enchimento|$1,80
Lapiseira|85¢
Quadro Negro Portátil|20¢
Camisa de Força|$9,50
Caderno de Rascunho|25¢
Trajes Completos de Mergulho|$1.200,00
Máquina de Escrever Remington|$40,00
Máquina de Escrever Harris|$66,75
Microscópio de Bolso|58¢
Microscópio de Mesa de 110x|$17,50
Cofre de Chão (450 kg)|$62,50
Guarda-chuva|$1,79
Narguilé|99¢
Cigarros (por maço)|10¢
Caixa de Charutos|$2,29
Quatro velas|38¢
Dicionário Completo|$6,75
Enciclopédia de 10 volumes|$49,00
Respirador de Espuma|$1,95
Lupa de Bolso|$1,68
Bíblia|$3,98
Maleta|$1,48
Globo Terrestre em Suporte|$9,95
Mesa de Escrita Dobrável|$16,65
Estante de Carvalho com Porta de Vidro|$24,65
Carrinho de Bebê|$34,45
Extintor de Incêndio Químico|$13,85
Óculos de Relojoeiro|45¢
Jornal|5¢
`,'inv','2');

lst(`
Kit de Ferramentas (20 ferramentas)|$14,90
Broca Manual (mais 8 brocas)|$6,15
Polia Grande de Aço|$1,75
Cadeado|95¢
Corda (15 metros)|$8,60
Corrente Leve (por 0,3 metro)|10¢
Kit de Ferramentas de Relojoeiro|$7,74
Pé-de-cabra|$2,25
Serra de Mão|$1,65
Maçarico a Gasolina|$4,45
Luvas de Eletricista|$1,98
Cinto de Ferramentas e Alça de Segurança|$3,33
Talabarte e Cinto|$2,52
Conjunto de 48 Ferramentas de Joalheria|$15,98
Lixadeira|$6,90
Pá|95¢
Caixa de Ferramentas Caseiras|$14,90
`,'fer','2');
lst(`
Compressor de Ar de 330 Litros|$600,00
Caixa de Ferramentas de Mecânico|$500,00
Kit de Soldador|$1.400,00
Ferramentas de Arrombamento|$90,00
`,'fer','m');

lst(`
Aspirina (12 comprimidos)|10¢
Sais de Epsom (0,5 kg)|9¢
Remédio para Indigestão|25¢
Laxante, Remédios Naturais|25¢
Valise Médica|$10,45
Fórceps|$3,59
Conjunto de Bisturis|$1,39
Seringas Hipodérmicas|$12,50
Atomizador|$1,39
Ataduras de Gaze (5 metros)|69¢
Termômetro Clínico|69¢
Álcool (meio galão)|20¢
Seringa de Borracha|69¢
Penico|$1,79
Cadeira de Rodas|$39,95
Bengala|$1,59
Emplastro Adesivo|29¢
Cinta Anatômica Metálica|$1,98
Tornozeleira de Couro|98¢
`,'med','2');
lst(`
Valise Médica|$100,00
Respirador Descartável|$30,00
Kit Completo de Primeiros Socorros|$60,00
Kit de Queimaduras de Emergência|$160,00
Unidade de Oxigênio Portátil|$70,00
`,'med','m');

lst(`
# Equipamento de camping
Kit de Cozinha|$8,98
Fogão de Acampamento|$6,10
Garrafa Térmica|89¢
Banheira Dobrável|$6,79
Cobertor Impermeável|$5,06
Cama Dobrável|$3,65
Cama para Carro|$8,95
Cantil (1 litro)|$1,69
Tanque Isolado (17,5 litros)|$3,98
Saco de Água (3,5 litros)|80¢
Saco de Água (17,5 litros)|$2,06
Mala de Ombro Pesada|$3,45
# Iluminação
Lâmpada de Carbureto|$2,35
Lata de Carbureto (1 kg)|25¢
Holofote|$5,95
Lanterna a Gasolina|$6,40
Lanterna a Querosene|$1,30
Lanterna Furta-Fogo|$1,68
Lanterna Elétrica|$2,40
Baterias|60¢
Lanterna Caneta Elétrica|$1,00
Sinalizador (descartável)|27¢
Velas de Quinze Horas (12)|62¢
Caixa de Fósforos à Prova d'Água|48¢
# Navegação, caça e pesca
Telescópio|$3,45
Binóculo Simples (3x a 6x)|$8,50-23,00
Binóculos de Qualidade|$28,50
Bússola de Bolso|$3,25
Bússola com Tampa|$2,85
Pedômetro|$1,70
Faca de Caça|$2,35
Faca de Bolso|$1,20
Machadinha|98¢
Armadilha de Captura de Pequenos Animais|$2,48
Armadilha de Mola para Animais|$5,98
Armadilha de Ursos|$11,43
Vara de Pesca e Roldana|$9,35
Barbante de Cânhamo|27¢
# Barracas e barcos
Barraca de 2 x 2 metros|$11,48
Barraca de 3,5 x 4,5 metros|$28,15
Barraca de 4,5 x 7,5 metros|$53,48
Lona Impermeável de 7,5 x 11 metros|$39,35
Barraca Automotiva de 2 x 2 metros|$12,80
Estacas de Ferro (12)|$1,15
Barco a Remo de Aço (4 assentos)|$35,20
2 Motores HP para Barcos a Remo|$79,95
Lona e Canoa de Madeira|$75,00
`,'cam','2');
lst(`
Conjunto de Cozinha para 4 Pessoas|$25,00
Fogão de Acampamento de Propano|$60,00
Banheiro Químico Portátil|$110,00
Saco de Dormir|$30,00
Saco de Dormir Polar|$200,00
Lâmpada Fluorescente de 6 watts|$30,00
Binóculos Estabilizados|$1.300,00
Faca de "Sobrevivência"|$65,00
Canivete do Exército Suíço|$30,00
Facão, Barato|$20,00
Corda de Escalada de 10,5mm (50m)|$250,00
GPS de Mão|$260,00
Equipamento de Escalada (1 pessoa)|$2.000,00
Caiaque (1 pessoa)|$1.000,00
Equipamento de Mergulho, Bom|$2.500,00+
Pistola Sinalizadora (equipamento)|$100,00
Tenda Familiar com 3 Cômodos|$70,00
Tenda Geodésica para 3 Pessoas|$300,00
Trailer Winnebago|$120.000,00+
Gerador Elétrico|$200,00
`,'cam','m');

lst(`
# Comunicação
Receptor de Rádio|$49,95
Receptor Portátil de Rádio|$65,00
Telefone de Mesa|$15,75
Telégrafo Simples|$4,25
`,'ele','2');
lst(`
# Comunicação e informática
Telefone Sem Fio|$50,00
Celular|$50,00
Smartphone|$99,00+
PC Barato|$100,00+
Notebook|$400,00+
PC Bom|$1.500,00+
Notebook Bom|$1.300,00+
Tablet|$400,00
# Vigilância e detecção
Rádio com Scanner de Polícia|$90,00
Walkie-Talkie de três Faixas|$35,00
Detector de Radar|$40,00
Câmera Digital SLR 35mm|$450,00
Câmera de Bolso Descartável|$10,00
Detector de Metais|$240,00
Contador Geiger|$400,00
Conjunto de Alarme Detector de Movimento|$200,00
Alarme de Perímetro sem Fio|$260,00
Modificador de Voz Telefônico|$60,00
Caneta Filmadora|$250,00
Detector de Grampo de Telefone|$400,00
Kit de Varredura de Dispositivos Espiões|$900,00
Câmera Corporal de Espionagem|$200,00
Gravador Digital Oculto|$300,00+
Dispositivo de Escuta|$200,00+
Óculos de Visão Noturna|$600,00+
Software de Monitoramento de E-mail|$200,00
`,'ele','m');

lst(`
Gramofone de Gabinete|$98,00
Disco de Gramofone|75¢
Câmera Box Brownie|$3,15
Filme, 24 Exposições|38¢
Kit de Desenvolvimento de Filmes|$4,95
Câmera Kodak de Fole No.1|$4,29
Câmera Comercial Eastman|$140,00
Câmera de Filmes 16mm e Projetor|$335,00
Acordeão|$8,95
Ukulele (Kit)|$2,75
Guitarra (Kit)|$9,95
Violino (Kit)|$14,95
Corneta Militar|$3,45
Órgão|$127,00
Piano Mecânico|$447,00
Banjo de Jazz de 4 cordas|$7,45
Saxofone de Bronze|$69,75
`,'ent','2');

lst(`
# Roupas masculinas
Terno a Rigor de Lã Penteada|$17,95
Terno a Rigor de Casimira|$18,50
Terno de Mohair|$13,85
Macacão Íntimo (Union Suit), Forest Mills|69¢
Casaco|$9,95-35,00
Sobretudo Chesterfield|$19,95
Sapatos Oxford|$6,95
Bota de Couro|$4,95
Calça Casual, flanela branca|$8,00
Camisa, percal|79¢-$1,25
Camisa Social de qualidade|$1,95
Suéter|$7,69
Fedora de Feltro|$4,95
Boina de Golfe de Lã|79¢
Chapéu de Palha|$1,95
Capacete de Futebol de Couro|$3,65
Camisa Casual|98¢
Gravata, seda|50¢
Gravata Borboleta|55¢
Meia com Liga|39¢
Abotoaduras|40¢
Cinto de Couro|$1,35
Suspensórios|79¢
Botas de Caminhada|$7,25
Roupa de Banho|$3,45
# Roupas femininas
Vestido Chique de Marca|$90,00+
Vestido de Tafetá|$10,95
Vestido de Cetim Charmeuse|$10,95
Vestido Risca de Giz|$2,59
Saia Plissada, Seda|$7,95
Blusa, Algodão|$1,98
Suéter de Lã Penteada|$9,48
Negligée de Algodão|88¢
Sapatos Parisienses de Salto|$4,45
Sandálias com Alça de Couro|98¢
Chapéu Cloché de Veludo|$4,44
Chapéu Turbante de Cetim|$3,69
Espartilho Elástico Rayon|$2,59
Sapatos Bordados|$1,59
Meias de Seda (3 pares)|$2,25
Ceroulas, Seda|$3,98-$4,98
Casaco de Tweed, totalmente forrado|$3,95
Casaco de Veludo com Colarinho de Pelo|$39,75
Casaco de Pele de Raposa|$198,00
Casaco de Chuva com Cinto, Algodão|$3,98
Bolsa de Seda|$4,98
Enfeites para Cabelo|98¢
`,'rou','2');
lst(`
# Roupas masculinas
Terno de Seda Sob Medida|$1.000,00+
Terno de Risca de Giz|$350,00
Terno de Rayon em duas Peças|$200,00
Roupas Folgadas de Jogging|$50,00
Jaqueta de Couro|$200,00
Sobretudo, Couro|$250,00
Camisa Grande em Sarja|$35,00
Calça Social Pregueada|$36,00
Suéter de Gola Alta|$35,00
Jeans|$40,00+
Sapatos de Couro Docksider|$50,00
Sapatos Cross-Trainer|$100,00
Gravata de Seda|$35,00
Cueca Térmica|$15,00
Calção de Banho de Nylon|$15,00
Colete com Bolsos|$60,00
Botas de Caminhada de Qualidade|$200,00
Colete à Prova de Balas|$600,00+
# Roupas femininas
Vestido de Alta Costura, usado uma vez|$500,00+
Vestido de Renda Lateral em Seda Fina|$400,00
Vestido Acrílico em 2 peças|$150,00
Vestido Estilo Sobretudo|$90,00
Calças Plissadas|$25,00
Calça Jeans Lavada|$35,00
Jaqueta de Couro para Motociclista|$260,00
Casaco Longo com Botões|$190,00
Suéter Polo|$35,00
Calça Estampada Tecido Leve|$50,00
Salto Alto Fashion|$100,00
Botas Fashion|$160,00
Shorts de Lycra|$20,00
`,'rou','m');

lst(`
# Automóveis e caminhões
Motocicleta Norton|$95,00
Buick Modelo D-45|$1.020,00
Cadillac Type 55|$2.240,00
Chevrolet Capitol|$695,00
Chevrolet, Conversível|$570,00
Chrysler Modelo F-58|$1.045,00
Dodge Modelo S/1|$985,00
Duesenberg J|$20.000,00
Ford Model T|$360,00
Ford Model A|$450,00
Hudson Coach (8 assentos)|$1.450,00
Hudson Super Six Series J|$1.750,00
Oldsmobile 43-AT|$1.345,00
Packard Twin-Six Touring|$2.950,00
Pierce-Arrow|$6.000,00
Pontiac 6-28 Sedan|$745,00
Studebaker Stnd./Dictator|$1.165,00
Studebaker Touring (5 assentos)|$995,00
Chevrolet F.B. Coupe (usado)|$300,00
Buick 1917 (usado)|$75,00
Chevrolet Camionete|$545,00
Caminhão Dodge de 1/2 tonelada|$1.085,00
Caminhão Ford Modelo TT|$490,00
# Acessórios para veículos
Pneu|$10,95
Kit de Consertos de Pneus|32¢
Correntes de Neve|$4,95
Macaco|$1,00
Bateria de Carro|$14,15
Radiador|$8,69
Farol de Reposição|30¢
Bomba de Ar Portátil|$3,25
Farol Montado|$2,95
Porta Bagagens|$1,35
`,'vei','2');
lst(`
Motocicleta BMW|$23.000,00
Motocicleta Ducati|$13.000,00
Rolls Royce Ghost Sedan|$260.000,00
Aston Martin DB9|$200.500,00
Cadillac Esportivo|$62.000,00
BMW Series 1|$38.000,00
Corvette (Conversível)|$54.000,00
Dodge Esportivo|$33.000,00
Toyota Prius|$27.000,00
Ford Focus|$16.500,00
`,'vei','m');

const avail=it=>it.e==='b'||(it.e==='m')===(W.era==='mod');
const ipr=it=>W.era==='mod'?it.pm:it.p20;
function moneyNum(t){
  const m=/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*(¢)?/.exec(String(t||''));
  if(!m)return 0;
  const n=parseFloat(m[1].replace(/\./g,'')+(m[2]?'.'+m[2]:''));
  return m[3]?n/100:n;
}
const fmtMoney=n=>'$'+n.toLocaleString('pt-BR',{minimumFractionDigits:(Math.round(n*100)%100)?2:0,maximumFractionDigits:2});
const WKL={briga:'Briga',arr:'Arremessar',pis:'Pistolas',rif:'Rifles/Espingardas',smg:'Submetralhadoras'};
const wkLabel=k=>WKL[k]||(k[0]==='L'?'Lutar (':'Armas de fogo (')+k.slice(2)+')';

/* descobre (ou cria) a perícia usada por uma arma, sem duplicar o que a ocupação já deu */
function wpSkill(nd,k){
  const T={briga:'briga',arr:'arremessar',pis:'pistola',rif:'rifle',smg:'smg'};
  if(T[k])return T[k];
  const cat=k[0]==='L'?'luta':'fogo',name=k.slice(2),key=norm(name),full=PRE[cat]+' ('+name+')';
  for(const id of SLOTS[cat]){const st=nd.sk[id];if(st&&norm(st.sp)===key)return id}
  const ex=nd.skx.find(x=>x.c===cat&&norm(x.n)===norm(full));
  if(ex)return String(ex.id);
  for(const id of SLOTS[cat]){
    const st=nd.sk[id];
    if(!st||!st.sp){nd.sk[id]={v:st&&st.v!=null?st.v:null,t:false,sp:name};return id}
  }
  const x={id:nd.nid++,n:full,b:SKDEF[SLOTS[cat][0]].b,c:cat,v:null,t:false};
  nd.skx.push(x);return String(x.id);
}

function itRow(it,pre){
  const q=+W.items[it.id]||0,p=ipr(it),k=esc(it.id);
  const det=it.w?[wkLabel(it.w.sk),it.w.d0,it.w.al0].filter(Boolean).join(' · '):'';
  const ctl=q
    ?'<div class="pt"><button type="button" class="st" data-a="iq" data-k="'+k+'" data-d="-1" aria-label="Tirar um: '+esc(it.n)+'">−</button><span class="qn">'+q+'</span><button type="button" class="st" data-a="iq" data-k="'+k+'" data-d="1"'+(it.w?' disabled':'')+' aria-label="Mais um: '+esc(it.n)+'">+</button></div>'
    :'<button type="button" class="btn sm" data-a="iq" data-k="'+k+'" data-d="1" aria-label="Adicionar '+esc(it.n)+'">Adicionar</button>';
  return'<div class="wz-r it'+(q?' on':'')+'" data-id="'+pre+k+'"><div class="nm"><span class="lb">'+esc(it.n)+(it.rare?' <span class="tg">Raro</span>':'')+
    (det?'<small>'+esc(det)+'</small>':'')+'<small class="ipr">'+(p?esc(p):'—')+(q>1?' × '+q+' = '+fmtMoney(moneyNum(p)*q):'')+'</small></span></div><div class="rt">'+ctl+'</div></div>';
}
function s7(){
  const cr=finalCredit(),lv=livingOf(cr),m=moneyTable(cr,W.era);
  const q=norm((W.iq||'').trim()),vis=ITEMS.filter(avail);
  const chosen=vis.filter(it=>(+W.items[it.id]||0)>0);
  const total=chosen.reduce((t,it)=>t+moneyNum(ipr(it))*(+W.items[it.id]||0),0);
  const cash=/milh/.test(m[1])?1e12:moneyNum(m[1]);
  const cnt={};chosen.forEach(it=>{cnt[it.c]=(cnt[it.c]||0)+(+W.items[it.id]||0)});

  let h='<section class="wz-card" data-id="fin"><h3>Finanças</h3><p>Nível de Crédito <b>'+cr+'</b> · padrão de vida <b>'+lv[1]+'</b>. '+lv[2]+'</p>'+
    '<div class="wz-sum"><div><span>Nível de Gastos</span><b>'+m[0]+'</b></div><div><span>Dinheiro</span><b>'+m[1]+'</b></div><div><span>Patrimônio</span><b>'+m[2]+'</b></div></div>'+
    '<p>Valores da Tabela II do livro ('+(W.era==='mod'?'época moderna':'anos 1920')+').</p></section>';

  h+='<section class="wz-card" data-id="sel"><h3 data-id="t">Sua lista</h3>';
  if(chosen.length){
    h+=chosen.map(it=>itRow(it,'s-')).join('');
    h+='<div class="wz-sum" data-id="sum"><div><span>Valor dos itens</span><b>'+fmtMoney(total)+'</b></div><div><span>Dinheiro disponível</span><b>'+m[1]+'</b></div></div>';
    if(total>cash)h+='<p class="warn" data-id="warn">O valor passa do seu Dinheiro. Combine com o Guardião se estes itens saem do Dinheiro ou do Patrimônio.</p>';
    h+='<p data-id="note">Armas vão para a aba Combate e o resto para Posses.</p>';
  }else h+='<p class="hint" data-id="e">Nada escolhido ainda. Use o catálogo abaixo.</p>';
  h+='</section>';

  const list=q?vis.filter(it=>norm(it.n+' '+(it.g||'')+' '+ICATN[it.c]+' '+(it.w?wkLabel(it.w.sk):'')).indexOf(q)>=0):vis.filter(it=>it.c===W.icat);
  const shown=q?list.slice(0,80):list;
  let rows='',lastG=null;
  shown.forEach(it=>{
    const g=q?ICATN[it.c]:(it.g||'');
    if(g&&g!==lastG)rows+='<h3 class="sh" data-id="g-'+esc(norm(g))+'" style="margin-top:12px">'+esc(g)+'</h3>';
    lastG=g;rows+=itRow(it,'i-');
  });
  if(!shown.length)rows='<p class="hint" data-id="none">Nenhum item encontrado.</p>';
  else if(list.length>shown.length)rows+='<p class="hint" data-id="more">Mostrando '+shown.length+' de '+list.length+'. Refine a busca para ver o resto.</p>';

  h+='<section class="wz-card" data-id="cat"><h3>Catálogo do livro</h3><p>Itens do Apêndice III e da Tabela de Armas do Chamado de Cthulhu. Busque pelo nome ou escolha uma categoria.</p>'+
    searchBox('wiq',W.iq,'Buscar item (ex.: lanterna, rifle)','iq')+
    '<div class="chips" role="group" aria-label="Categorias">'+ICATS.map(([c,t])=>'<button type="button" class="chip" data-a="icat" data-v="'+c+'" aria-pressed="'+(!q&&W.icat===c)+'">'+t+(cnt[c]?' <b>'+cnt[c]+'</b>':'')+'</button>').join('')+'</div>'+
    '<div class="wz-items" id="wzItems">'+rows+'</div></section>';

  h+='<section class="wz-card" data-id="oth"><h3>Outros itens</h3><label class="fld"><span>O que não está no catálogo (um por linha)</span><textarea data-weq maxlength="1500" placeholder="Ex.: caderno e lápis&#10;moeda da sorte" style="min-height:90px">'+esc(W.equip)+'</textarea></label></section>';
  return h;
}
function reviewHTML(){
  const fa=finalAttrs(),occMap=occById(),ids=SK0.filter(s=>!s.my&&(!s.mod||W.era==='mod'));
  const top=ids.map(s=>({id:s.id,v:finalSk(s.id),b:wBase(s.id)})).filter(x=>x.v>x.b).sort((a,b)=>b.v-a.v).slice(0,14);
  const row=(a,b)=>'<div><span>'+a+'</span><b>'+b+'</b></div>';
  return'<section class="wz-card"><h3>'+esc(W.nome.trim()||'Investigador sem nome')+'</h3><div class="wz-sum">'+
    row('Ocupação',esc(occName()))+row('Idade',esc(W.idade)+' anos')+row('Época',W.era==='mod'?'Moderna':'Anos 1920')+
    row('Atributos',ATTRS.map(k=>k+' '+fa[k]).join(' · '))+row('Sorte',W.luck)+(ITEMS.some(it=>avail(it)&&W.items[it.id])?row('Itens do catálogo',ITEMS.filter(it=>avail(it)&&W.items[it.id]).reduce((n,it)=>n+(+W.items[it.id]||0),0)):'')+'</div>'+derivedHTML(fa)+'</section>'+
    '<section class="wz-card"><h3>Principais perícias</h3><div class="wz-sum">'+(top.length?top.map(x=>row(esc(skName(x.id)),x.v+'%')).join(''):'<div><span>Nenhuma ainda</span></div>')+'</div></section>'+
    '<section class="wz-card"><p>'+(W.replace?'<b>Atenção:</b> ao entrar na ficha, esta criação substitui a ficha atual deste aparelho. Exporte um backup antes, se quiser guardá-la.':'Tudo pode ser ajustado depois no modo de edição.')+'</p></section>';
}
const STEPFN=[s1,s2,s3,s4,s5,s6,s7,reviewHTML];

/* ---------- validação ---------- */
function check(n){
  const bad=m=>({ok:false,msg:m,cls:'bad'}),warn=m=>({ok:true,msg:m,cls:''}),ok=m=>({ok:true,msg:m||'',cls:'ok'});
  if(n===1){
    const a=+W.idade;
    if(!(a>=15&&a<=90))return bad('Informe uma idade entre 15 e 90 anos.');
    return W.nome.trim()?ok():warn('O nome pode ficar para depois.');
  }
  if(n===2){
    if(!attrsDone())return bad(W.method==='comprar'?'Distribua os 460 pontos.':'Defina os oito atributos.');
    if(W.method==='comprar'&&buyLeft()!==0)return bad(buyLeft()>0?'Ainda restam '+buyLeft()+' pontos para distribuir.':'Você usou '+(-buyLeft())+' pontos a mais.');
    const r=ageRule(+W.idade);if(!r)return bad('Idade fora da faixa de 15 a 90.');
    if(r.red&&redLeft()>0&&!redStuck())return bad('Reduza mais '+redLeft()+' pontos entre '+r.redA.join(', ')+'.');
    if(r.chk&&W.age.eduLog===null)return bad('Faça as verificações de melhoria de EDU.');
    if(W.luck==null)return bad('Role a Sorte.');
    return ok();
  }
  if(n===3){
    const o=occ();if(!o)return bad('Escolha uma ocupação.');
    if(o.custom&&!W.cname.trim())return warn('Dê um nome à ocupação (opcional).');
    return ok();
  }
  if(n===4){
    const d=slotDefs();
    for(let i=0;i<d.length;i++)if(!slotResolved(i))return bad(specOf((W.sel[i]||{}).v||'')?'Dê um nome à especialização da perícia '+(i+1)+'.':'Escolha a perícia '+(i+1)+'.');
    const left=occTotal()-occUsed();
    if(left<0)return bad('Você usou '+(-left)+' pontos a mais.');
    const o=occ(),cr=+W.cred||0;
    if(cr<o.cr[0]||cr>o.cr[1])return warn('Nível de Crédito fora da faixa recomendada ('+o.cr[0]+' a '+o.cr[1]+'). Você pode seguir se o Guardião permitir.');
    if(left>0)return warn('Sobram '+left+' pontos. Os que não forem usados se perdem.');
    return ok('Todos os pontos usados.');
  }
  if(n===5){
    const left=perTotal()-perUsed();
    if(left<0)return bad('Você usou '+(-left)+' pontos a mais.');
    return left>0?warn('Sobram '+left+' pontos. Os que não forem usados se perdem.'):ok('Todos os pontos usados.');
  }
  if(n===6){
    const f=Object.keys(W.bk).filter(k=>W.bk[k].trim()).length;
    return f>=3?ok():warn('Preencha pelo menos 3 categorias ('+f+' de 6). Dá para continuar.');
  }
  return ok();
}
function wzFoot(){
  const c=check(W.step),m=$('#wzMsg');
  m.textContent=c.msg;m.className='wz-msg'+(c.cls?' '+c.cls:'');
  $('#wzNext').disabled=!c.ok;
  $('#wzNext').textContent=W.step===8?'Entrar na ficha':'Avançar';
  $('#wzBack').disabled=W.step===1;
  $('#wzSkip').textContent=W.replace?'Cancelar':'Pular criação';
}
function wzRender(){
  $('#wzSub').textContent='Etapa '+W.step+' de 8 · '+STEPS[W.step-1];
  morph($('#wzProg'),STEPS.map((n,i)=>'<li class="'+(i+1<W.step?'on':i+1===W.step?'cur':'')+'"><button type="button" data-g="'+(i+1)+'"'+(i+1<W.step?'':' disabled')+' aria-label="Etapa '+(i+1)+': '+n+'"'+(i+1===W.step?' aria-current="step"':'')+'></button></li>').join(''));
  const body=$('#wzBody'),html=STEPFN[W.step-1]();
  if(body._step===W.step)morph(body,html,true);   /* mesma etapa: só ajusta o que mudou */
  else{body.innerHTML=html;body._step=W.step}      /* etapa nova: monta do zero */
  wzFoot();saveW();
}
function wzGo(n){
  W.step=clamp(n,1,8);wzRender();
  const b=$('#wzBody');b.classList.remove('stp');clearTimeout(b._st);
  if(!rm()){void b.offsetWidth;b.classList.add('stp');b._st=setTimeout(()=>b.classList.remove('stp'),900)}
  if(rm())wz.scrollTop=0;else wz.scrollTo({top:0,behavior:'smooth'});
}

/* ---------- abrir e fechar ---------- */
const INERT='.top,.layout,.dock,.hud';
function openWiz(replace){
  const d=loadW();
  if(d&&!!d.replace===!!replace){W=d;toast('Rascunho retomado','Você parou na etapa '+W.step+'. Pode continuar de onde parou.')}
  else W=newW(replace);
  $$(INERT).forEach(e=>{e.inert=true});
  wz.hidden=false;$('#wzBody')._step=0;wzRender();wz.scrollTop=0;
  try{$('#wzSub').tabIndex=-1;$('#wzSub').focus({preventScroll:true})}catch(e){}
}
function closeWiz(){
  wz.hidden=true;$('#wzBody')._step=0;$$(INERT).forEach(e=>{e.inert=false});
  try{localStorage.removeItem(WK)}catch(e){}
}
$('#wzSkip').onclick=()=>{
  if(!W.replace){D.made=true;flush();toast('Ficha em branco','Você pode criar um investigador depois em Configurações.')}
  closeWiz();
};
$('#wzBack').onclick=()=>wzGo(W.step-1);
$('#wzNext').onclick=()=>{
  if(!check(W.step).ok)return;
  if(W.step===8){applyWiz();return}
  if(W.step===3&&!W.sel.length)initSel();
  wzGo(W.step+1);
};
$('#wzProg').addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(b&&!b.disabled)wzGo(+b.dataset.g)});
$('#cfNew').onclick=()=>{closeM('mCfg');flush();clearTimeout(cloudSaveT);activeCloudId=null;const x=idxLoad();x.cur=newCocId();idxSave(x);try{localStorage.removeItem(WK)}catch(e){}D=fresh();flush();renderAll();openWiz(false)};
$('#wzLogo').addEventListener('error',e=>{e.target.style.display='none'});

/* ---------- eventos das telas ---------- */
function setPts(kind,key,val){
  val=Math.max(0,Math.round(+val||0));
  if(kind==='o'){
    const id=assignSlots().ids[+key],base=id?wBase(id):0,other=occUsed()-(+W.pts[key]||0);
    W.pts[key]=Math.min(val,Math.max(0,occTotal()-other),Math.max(0,99-base));
  }else if(kind==='c'){
    const other=occUsed()-(+W.cred||0);
    W.cred=Math.min(val,Math.max(0,occTotal()-other),99);
  }else{
    const other=perUsed()-(+W.per[key]||0),base=wBase(key)+(occById()[key]||0);
    val=Math.min(val,Math.max(0,perTotal()-other),Math.max(0,99-base));
    if(val)W.per[key]=val;else delete W.per[key];
  }
}
function curPts(kind,key){return kind==='o'?(+W.pts[key]||0):kind==='c'?(+W.cred||0):(+W.per[key]||0)}
$('#wzBody').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b||b.disabled)return;
  const a=b.dataset.a,v=b.dataset.v;
  if(a==='pick'){openPicker(+b.dataset.i);return}
  if(a==='era'){W.era=v;if(W.occ&&occ().mod&&v!=='mod'){W.occ='';W.sel=[]}}
  else if(a==='method'){
    W.method=v;W.vals={};W.assign={};resetAge();
    W.pool=v==='rapido'?[40,50,50,50,60,60,70,80]:[];
    W.buy=Object.fromEntries(ATTRS.map(k=>[k,15]));
  }
  else if(a==='rollall'){ATTRS.forEach(k=>{W.vals[k]=GENR[k]()});resetAge()}
  else if(a==='rollpool'){W.pool=[r3(),r3(),r3(),r3(),r3(),r2(),r2(),r2()].sort((x,y)=>y-x);W.assign={};resetAge()}
  else if(a==='buy'){const k=b.dataset.k,d=+b.dataset.d;if(d>0&&buyLeft()<d)return;W.buy[k]=clamp(W.buy[k]+d,15,90);resetAge()}
  else if(a==='red'){
    const k=b.dataset.k,d=+b.dataset.d;
    if(d>0&&redCan(k))W.age.red[k]=(W.age.red[k]||0)+5;
    else if(d<0&&(W.age.red[k]||0)>0)W.age.red[k]-=5;
  }
  else if(a==='edu')doEduChecks();
  else if(a==='luck')rollLuck();
  else if(a==='occ'){if(W.occ!==v){W.occ=v;initSel()}}
  else if(a==='pt'){setPts(b.dataset.kind,b.dataset.key,curPts(b.dataset.kind,b.dataset.key)+(+b.dataset.d))}
  else if(a==='icat'){W.icat=v;W.iq=''}
  else if(a==='iq'){
    const id=b.dataset.k,it=ITEM_BY[id];
    if(it){const nv=Math.max(0,Math.min(it.w?1:99,(+W.items[id]||0)+(+b.dataset.d)));if(nv)W.items[id]=nv;else delete W.items[id]}
  }
  else if(a==='qclear'){
    W[b.dataset.w]='';
    wzRender();
    const inp=$('#wzBody [data-w'+b.dataset.w+']');if(inp)inp.focus({preventScroll:true});
    return;
  }
  wzRender();
  if(a==='occ')requestAnimationFrame(()=>{const d=$('#wzBody .ocd');if(d)d.scrollIntoView({block:'nearest',behavior:rm()?'auto':'smooth'})});
});
$('#wzBody').addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-wa]')){W.assign[t.dataset.wa]=t.value;resetAge()}
  else if(t.matches('[data-woa]')){W.occAttr[t.dataset.woa]=t.value}
  else if(t.matches('[data-wsel]')){const i=+t.dataset.wsel;W.sel[i]={v:t.value};W.names[i]='';W.pts[i]=0}
  else if(t.matches('[data-pin]')){setPts(t.dataset.kind,t.dataset.key,t.value)}
  else if(t.matches('[data-wkey]')){W.chave=t.value}
  else return;
  wzRender();
});
$('#wzBody').addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-w1]')){
    const k=t.dataset.w1,old=ageRule(+W.idade);
    W[k]=str(t.value,60);
    if(k==='idade'){resetAge();if(ageRule(+W.idade)!==old)W.luck=null}
  }
  else if(t.matches('[data-wcn]'))W.cname=str(t.value,40);
  else if(t.matches('[data-wname]'))W.names[+t.dataset.wname]=str(t.value,30);
  else if(t.matches('[data-wsn]')){
    const id=t.dataset.wsn,okn=!!t.value.trim(),row=t.closest('.wz-r');
    W.sname[id]=str(t.value,30);
    row.classList.toggle('dim',!okn);
    $$('button,input[data-pin]',row).forEach(x=>{x.disabled=!okn});
    $('.tot',row).textContent=okn?finalSk(id):'—';
  }
  else if(t.matches('[data-wq]')){W.q=str(t.value,40);t.closest('.sw').classList.toggle('has',!!W.q);morph($('#wzList'),s5list(),true);saveW();return}
  else if(t.matches('[data-wiq]')){W.iq=str(t.value,40);t.closest('.sw').classList.toggle('has',!!W.iq);wzRender();return}
  else if(t.matches('[data-woq]')){W.oq=str(t.value,40);t.closest('.sw').classList.toggle('has',!!W.oq);wzRender();return}
  else if(t.matches('[data-wb]'))W.bk[t.dataset.wb]=str(t.value,1500);
  else if(t.matches('[data-weq]'))W.equip=str(t.value,1500);
  else return;
  wzFoot();saveW();
});

/* ---------- seletor de perícias ---------- */
let pkI=-1,pkQ='';
function pickGroups(i){
  const d=slotDefs()[i],cur=(W.sel[i]||{}).v||'',taken=new Set();
  slotDefs().forEach((x,j)=>{const v=(W.sel[j]||{}).v;if(v&&!specOf(v))taken.add(v)});
  const mk=(v,l)=>({v,l,dis:!specOf(v)&&taken.has(v)&&cur!==v});
  const spl=v=>{const sp=specOf(v);return sp&&sp.name==='*'?PRE[sp.cat]+' (outra especialidade)':vLabel(v)};
  if(d.k==='i')return[['Interpessoais',INTER.map(x=>mk(x,skName(x)))]];
  if(d.k==='p')return[['Opções desta ocupação',d.opts.map(o=>mk(o.v,spl(o.v)))]];
  return CATS.map(([c,t])=>{
    const its=SK0.filter(s=>s.c===c&&!s.slot&&!s.nt&&(!s.mod||W.era==='mod')).map(s=>mk(s.id,skName(s.id)));
    if(SLOTS[c])its.push(mk(c+':*',PRE[c]+' (outra especialidade)'));
    return[t,its];
  }).filter(g=>g[1].length);
}
function pkRender(){
  const cur=(W.sel[pkI]||{}).v||'',q=norm(pkQ.trim());
  const html=pickGroups(pkI).map(([t,its])=>{
    const f=its.filter(x=>!q||norm(x.l).indexOf(q)>=0);
    if(!f.length)return'';
    return'<h4 class="pk-h">'+esc(t)+'</h4>'+f.map(x=>'<button type="button" class="po" data-v="'+esc(x.v)+'" aria-pressed="'+(x.v===cur)+'"'+(x.dis?' disabled':'')+'><span class="pn">'+esc(x.l)+(x.dis?'<small>já escolhida em outra linha</small>':'')+'</span><i class="pc"></i></button>').join('');
  }).join('')||'<p class="hint" style="padding:18px 8px;text-align:center">Nenhuma perícia encontrada.</p>';
  $('#pkList').innerHTML=html;
}
function openPicker(i){
  const d=slotDefs()[i];if(!d)return;
  pkI=i;pkQ='';
  const q=$('#pkQ');q.value='';$('#pkSW').classList.remove('has');
  $('#pkT').textContent='Perícia '+(i+1);
  $('#pkS').textContent=(d.k==='i'?'Interpessoal':d.k==='p'?'Uma das opções':'Qualquer perícia')+' · '+occName();
  const total=pickGroups(i).reduce((n,g)=>n+g[1].length,0);
  $('#pkSW').hidden=total<=8;
  $('#pkF').hidden=!((W.sel[i]||{}).v);
  pkRender();openM('mPk');
  requestAnimationFrame(()=>{
    const l=$('#pkList'),c=$('.po[aria-pressed="true"]',l);
    if(c)l.scrollTop=Math.max(0,c.offsetTop-l.clientHeight/2+c.offsetHeight/2);
    if(!$('#pkSW').hidden&&window.matchMedia('(hover:hover)').matches)q.focus({preventScroll:true});
  });
}
function pkSet(v){
  const i=pkI,cur=(W.sel[i]||{}).v||'';
  if(v!==cur){W.sel[i]={v:v};W.names[i]='';W.pts[i]=0}
  closeM('mPk');wzRender();
}
$('#pkQ').addEventListener('input',e=>{pkQ=e.target.value;$('#pkSW').classList.toggle('has',!!pkQ);pkRender()});
$('#pkSW .x').addEventListener('click',()=>{pkQ='';const q=$('#pkQ');q.value='';$('#pkSW').classList.remove('has');pkRender();q.focus({preventScroll:true})});
$('#pkList').addEventListener('click',e=>{
  const b=e.target.closest('.po');if(!b||b.disabled)return;
  $$('.po',$('#pkList')).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));   /* o visto aparece antes de fechar */
  const v=b.dataset.v;
  if(rm())pkSet(v);else setTimeout(()=>pkSet(v),200);
});
$('#pkClr').addEventListener('click',()=>{
  const i=pkI;W.sel[i]={v:''};W.names[i]='';W.pts[i]=0;closeM('mPk');wzRender();
});

/* ---------- aplicar na ficha ---------- */
function applyWiz(){
  const fa=finalAttrs(),as=assignSlots(),occMap=occById();
  const nd=fresh();
  nd.cfg=Object.assign({},D.cfg,{era:W.era});
  nd.made=true;
  nd.who={nome:W.nome.trim(),ocup:occName(),idade:String(+W.idade),gen:W.gen.trim(),res:W.res.trim(),nasc:W.nasc.trim(),av:''};
  ATTRS.forEach(k=>{nd.car[k]=fa[k]});
  nd.cur.sorte=W.luck;
  SK0.forEach(s=>{
    const occp=occMap[s.id]||0,per=+W.per[s.id]||0,tot=occp+per;
    const nm=as.names[s.id]||W.sname[s.id]||'';
    if(tot>0||(s.slot&&nm))nd.sk[s.id]={v:tot>0?wBase(s.id)+tot:null,t:false,sp:s.slot?nm:''};
  });
  as.extra.forEach(x=>{
    nd.skx.push({id:nd.nid++,n:PRE[x.cat]+' ('+x.nm+')',b:SKDEF[SLOTS[x.cat][0]].b,c:x.cat,v:wBase('x'+x.i)+(+W.pts[x.i]||0),t:false});
  });
  Object.keys(nd.bk).forEach(k=>{if(W.bk[k]!==undefined)nd.bk[k]=W.bk[k]});
  nd.chave=W.chave;
  const m=moneyTable(finalCredit(),W.era);nd.din={gasto:m[0],cash:m[1],bens:m[2]};
  W.equip.split('\n').map(l=>l.trim()).filter(Boolean).slice(0,30).forEach(l=>{nd.inv.push({id:nd.nid++,n:str(l,120),q:1,d:''})});
  Object.keys(W.items||{}).forEach(id=>{
    const it=ITEM_BY[id],qn=Math.min(99,Math.max(0,+W.items[id]||0));
    if(!it||!qn||!avail(it))return;
    if(it.w){nd.atk.push({id:nd.nid++,n:str(it.n,120),sk:wpSkill(nd,it.w.sk),dano:str(it.w.dano,120),al:str(it.w.al,120),nat:str(it.w.nat,120),mun:str(it.w.mun,120),mal:str(it.w.mal,120)});return}
    const pr=ipr(it);
    nd.inv.push({id:nd.nid++,n:str(it.n,120),q:qn,d:pr?'Preço: '+pr:''});
  });
  D=nd;flush();renderAll();closeWiz();
  $('#tabs [data-p=skills]').click();window.scrollTo(0,0);
  toast('Investigador criado','Bem-vindo à ficha de '+(nd.who.nome||'seu investigador')+'. Tudo pode ser ajustado no modo de edição.',{ms:5000});
}

/* ---------- biblioteca de itens (ficha principal) ---------- */
const availE=(it,era)=>it.e==='b'||(it.e==='m')===(era==='mod');
let libCat='all',libEra='20',libQ='',libLimit=50,libMode='inv';
const libBase=()=>ITEMS.filter(it=>availE(it,libEra)&&(libMode==='combat'?!!it.w:!it.w));
function libChips(){
  if(libMode==='combat'){const gs=[];libBase().forEach(it=>{if(it.g&&gs.indexOf(it.g)<0)gs.push(it.g)});return[['all','Todas']].concat(gs.map(g=>[g,g==='Armas comuns e corpo a corpo'?'Armas comuns':g]))}
  const cs=[];libBase().forEach(it=>{if(cs.indexOf(it.c)<0)cs.push(it.c)});
  return[['all','Todos']].concat(ICATS.filter(c=>cs.indexOf(c[0])>=0).map(([c,t])=>[c,c==='arm'?'Acessórios de armas':t]));
}
function libHave(it){return it.w?D.atk.filter(a=>a.n===it.n).length:(+(D.inv.find(x=>x.n===it.n)||{}).q||0)}
function libCard(it){
  const p=libEra==='mod'?it.pm:it.p20,have=libHave(it);
  let det;
  if(it.w){const w=it.w;det='Perícia: '+wkLabel(w.sk)+'\nDano: '+w.d0+' · Alcance: '+w.al0+'\nUsos por rodada: '+w.nat+(w.mun?' · Munição: '+w.mun:'')+(w.mal?' · Defeito: '+w.mal:'')}
  else det=(it.g?it.g+' · ':'')+ICATN[it.c];
  return'<article class="ilc t-'+it.c+'" data-id="c-'+esc(it.id)+'"><div class="ilh"><b>'+esc(it.n)+(it.rare?'<span class="tg">Raro</span>':'')+'</b><span class="ilp">'+(p?esc(p):'—')+'</span></div><p>'+esc(det)+'</p>'+
    '<div class="ila">'+(have?'<span class="tg ok">Na ficha: '+have+'</span>':'')+'<button type="button" class="btn sm pri" data-act="add" data-k="'+esc(it.id)+'">'+(it.w?'Adicionar em Combate':'Adicionar em Posses')+'</button></div></article>';
}
function libRender(){
  const q=norm(libQ.trim());
  const chips=libChips();if(!chips.some(x=>x[0]===libCat))libCat='all';
  const all=libBase().filter(it=>(libCat==='all'||(libMode==='combat'?it.g===libCat:it.c===libCat))&&(!q||norm(it.n+' '+(it.g||'')+' '+ICATN[it.c]+' '+(it.w?wkLabel(it.w.sk):'')).indexOf(q)>=0));
  const list=all.slice(0,libLimit);
  let html=list.map(libCard).join('');
  if(all.length>list.length)html+='<button type="button" class="btn" data-act="more" data-id="more">Mostrar mais ('+(all.length-list.length)+')</button>';
  if(!list.length)html='<p class="hint" data-id="none" style="padding:18px 8px;text-align:center">Nenhum item encontrado.</p>';
  morph($('#itList'),html,true);
  morph($('#itEra'),[['20','Anos 1920'],['mod','Moderna']].map(([e,t])=>'<button type="button" data-e="'+e+'" aria-pressed="'+(libEra===e)+'">'+t+'</button>').join(''));
  morph($('#itCat'),chips.map(([c,t])=>'<button type="button" data-c="'+esc(c)+'" aria-pressed="'+(libCat===c)+'">'+esc(t)+'</button>').join(''));
  $('#itS').textContent=all.length+(libMode==='combat'?(all.length===1?' arma':' armas'):(all.length===1?' item':' itens'))+' · '+(libEra==='mod'?'época moderna':'anos 1920');
}
function openLib(mode){
  libMode=mode==='combat'?'combat':'inv';libCat='all';libEra=D.cfg.era==='mod'?'mod':'20';libQ='';libLimit=50;
  $('#itQ').value='';$('#itSW').classList.remove('has');
  $('#itT').textContent=libMode==='combat'?'Biblioteca de armas':'Biblioteca de itens';
  $('#itQ').placeholder=libMode==='combat'?'Buscar arma (ex.: revólver, espada)':'Buscar item (ex.: lanterna, corda)';
  libRender();openM('mIt');
  $('#itList').scrollTop=0;
  if(window.matchMedia('(hover:hover)').matches)requestAnimationFrame(()=>$('#itQ').focus({preventScroll:true}));
}
function libAdd(it){
  if(it.w){
    const w=it.w;
    D.atk.push({id:uid(),n:str(it.n,120),sk:wpSkill(D,w.sk),dano:str(w.dano,120),al:str(w.al,120),nat:str(w.nat,120),mun:str(w.mun,120),mal:str(w.mal,120)});
    save();renderSkills();renderAtk();
    toast('Arma adicionada',it.n+' está na aba Combate.');
  }else{
    const pr=libEra==='mod'?it.pm:it.p20,ex=D.inv.find(x=>x.n===it.n);
    if(ex)ex.q=Math.min(9999,(+ex.q||0)+1);
    else D.inv.push({id:uid(),n:str(it.n,120),q:1,d:pr?'Preço: '+pr:''});
    save();renderInv();
    toast('Item adicionado',it.n+(ex?' (agora '+ex.q+')':'')+' está em Posses.');
  }
}
$('#itLibC').onclick=()=>openLib('combat');
$('#itLibI').onclick=()=>openLib('inv');
$('#itQ').addEventListener('input',e=>{libQ=e.target.value;libLimit=50;$('#itSW').classList.toggle('has',!!libQ);libRender()});
$('#itX').addEventListener('click',()=>{libQ='';libLimit=50;const q=$('#itQ');q.value='';$('#itSW').classList.remove('has');libRender();q.focus({preventScroll:true})});
$('#itCat').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;libCat=b.dataset.c;libLimit=50;libRender();$('#itList').scrollTop=0});
$('#itEra').addEventListener('click',e=>{const b=e.target.closest('[data-e]');if(!b)return;libEra=b.dataset.e;libLimit=50;libRender()});
$('#itList').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.dataset.act==='more'){libLimit+=50;libRender();return}
  if(b.dataset.act==='add'){const it=ITEM_BY[b.dataset.k];if(it){libAdd(it);libRender()}}
});

/* primeira vez: abre o assistente */
if(!D.made)openWiz(false);

})();



(function(){var g=document.getElementById('dxG');if(!g)return;function on(k){try{return localStorage.getItem(k)!=='0'}catch(e){return true}}
 g.querySelectorAll('[data-dx]').forEach(function(b){b.setAttribute('aria-pressed',String(on(b.dataset.dx)))});
 g.addEventListener('click',function(e){var b=e.target.closest('[data-dx]');if(!b)return;var v=b.getAttribute('aria-pressed')!=='true';try{localStorage.setItem(b.dataset.dx,v?'1':'0')}catch(x){}b.setAttribute('aria-pressed',String(v))})})();
(function(){var K='op-ficha-tema',R=document.documentElement,mt=document.querySelector('meta[name=theme-color]'),g=document.getElementById('temaG');if(!g)return;
 function mark(t){g.querySelectorAll('[data-tema]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.tema===t))})}
 function set(t){if(t)R.dataset.theme=t;else delete R.dataset.theme;
  try{if(t)localStorage.setItem(K,t);else localStorage.removeItem(K);var u=JSON.parse(localStorage.getItem('op-ficha-ui')||'{}');delete u.acc;delete u.gold;localStorage.setItem('op-ficha-ui',JSON.stringify(u))}catch(e){}
  R.style.removeProperty('--teal');R.style.removeProperty('--brass');mark(t||'');if(mt)mt.content=getComputedStyle(R).getPropertyValue('--felt').trim()||'#0a1411'}
 g.addEventListener('click',function(e){var b=e.target.closest('[data-tema]');if(b)set(b.dataset.tema)});mark(R.dataset.theme||'')})();

document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-back]');if(a){e.preventDefault();parent.postMessage({coc:'back'},'*')}});