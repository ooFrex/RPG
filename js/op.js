
(function(){
'use strict';
const {$,$$,wait,rnd,clamp,esc,fmt,cloudError}=Util;

/* ---------- dados do sistema ---------- */
/* ---------- MOLDE DO SISTEMA (as regras do jogo ficam aqui; o personagem fica em D) ---------- */
const SYSTEMS={
  op:{
    id:'op',nome:'Ordem Paranormal',
    /* atributos: k = sigla, n = nome, roda = posição no círculo (0 = topo, sentido horário) */
    atributos:[{k:'AGI',n:'Agilidade',roda:0},{k:'FOR',n:'Força',roda:4},{k:'INT',n:'Intelecto',roda:1},{k:'PRE',n:'Presença',roda:3},{k:'VIG',n:'Vigor',roda:2}],
    atributo:{inicial:1,maxFicha:9,criacao:{pontos:4,max:3}},
    /* perícias: a = atributo ligado, t = 1 se só treinados podem usar, b = valor-base (fórmula, só no d100), s = 1 se pede especialidade */
    pericias:[{n:'Acrobacia',a:'AGI',t:0,b:'0',s:0},{n:'Adestramento',a:'PRE',t:1,b:'0',s:0},{n:'Artes',a:'PRE',t:1,b:'0',s:0},{n:'Atletismo',a:'FOR',t:0,b:'0',s:0},{n:'Atualidades',a:'INT',t:0,b:'0',s:0},{n:'Ciências',a:'INT',t:1,b:'0',s:0},{n:'Crime',a:'AGI',t:1,b:'0',s:0},{n:'Diplomacia',a:'PRE',t:0,b:'0',s:0},{n:'Enganação',a:'PRE',t:0,b:'0',s:0},{n:'Fortitude',a:'VIG',t:0,b:'0',s:0},{n:'Furtividade',a:'AGI',t:0,b:'0',s:0},{n:'Iniciativa',a:'AGI',t:0,b:'0',s:0},{n:'Intimidação',a:'PRE',t:0,b:'0',s:0},{n:'Intuição',a:'PRE',t:0,b:'0',s:0},{n:'Investigação',a:'INT',t:0,b:'0',s:0},{n:'Luta',a:'FOR',t:0,b:'0',s:0},{n:'Medicina',a:'INT',t:1,b:'0',s:0},{n:'Ocultismo',a:'INT',t:1,b:'0',s:0},{n:'Percepção',a:'PRE',t:0,b:'0',s:0},{n:'Pilotagem',a:'AGI',t:1,b:'0',s:0},{n:'Pontaria',a:'AGI',t:0,b:'0',s:0},{n:'Profissão',a:'INT',t:1,b:'0',s:0},{n:'Reflexos',a:'AGI',t:0,b:'0',s:0},{n:'Religião',a:'PRE',t:1,b:'0',s:0},{n:'Sobrevivência',a:'INT',t:0,b:'0',s:0},{n:'Tática',a:'INT',t:1,b:'0',s:0},{n:'Tecnologia',a:'INT',t:1,b:'0',s:0},{n:'Vontade',a:'PRE',t:0,b:'0',s:0}],
    treino:[{n:'Destreinado',b:0},{n:'Treinado',b:5},{n:'Veterano',b:10},{n:'Expert',b:15}],
    /* teste: 'pool' = rola vários dados e pega o melhor (ou o pior se o atributo for 0); 'd100' = 1d100 contra o valor da perícia */
    teste:{tipo:'pool',faces:20},
    /* barras: maxF = máximo (número ou fórmula), iniF = valor com que começa (vazio = cheia) */
    barras:[{k:'vida',n:'Vida',ic:'i-heart',id:'vitV',maxF:'10',iniF:''},{k:'san',n:'Sanidade',ic:'i-brain',id:'vitS',maxF:'10',iniF:''},{k:'esf',n:'Esforço',ic:'i-hand',id:'vitE',maxF:'2',iniF:''}],
    /* contas automáticas: siglas dos atributos, PE, + - * / ( ) e max() min() floor() ceil() round() */
    formulas:{dt:'10 + PE + PRE',carga:'max(2, 5 * FOR)'},
    /* nomes dos campos da ficha (vazio = esconde) e abas usadas */
    rotulos:{ori:'Origem',cls:'Classe',nivel:'Nível',nex:'NEX',pe:'PE/turno',desl:'Deslocamento'},
    classes:['Combatente','Especialista','Ocultista'],
    usa:{rit:true},
    itens:[],recursos:[],
    criacao:[
      {t:'Quem é o personagem',b:[{k:'campo',campo:'pers',rot:'Nome do personagem'},{k:'campo',campo:'jog',rot:'Jogador'},{k:'campo',campo:'ori',rot:'Origem'},{k:'campo',campo:'cls',rot:'Classe'}]},
      {t:'Atributos',b:[{k:'texto',t:'Todos começam em 1. Você tem 4 pontos para distribuir. Dá pra baixar um atributo até 0 para ganhar 1 ponto extra, e nenhum passa de 3.'},{k:'attr_pontos',pontos:4,min:0,max:3,tudo:1}]},
      {t:'Perícias',b:[{k:'pericias_treinar',n:3}]}
    ]
  },
  coc:{
    id:'coc',nome:'Call of Cthulhu',
    atributos:[{k:"FOR",n:"Força",roda:0},{k:"CON",n:"Constituição",roda:1},{k:"TAM",n:"Tamanho",roda:2},{k:"DES",n:"Destreza",roda:3},{k:"APA",n:"Aparência",roda:4},{k:"EDU",n:"Educação",roda:5},{k:"INT",n:"Inteligência",roda:6},{k:"POD",n:"Poder",roda:7}],
    atributo:{inicial:50,maxFicha:200,criacao:{pontos:0,max:0}},
    pericias:[{n:"Antropologia",a:"FOR",t:0,b:"1",s:0},{n:"Arqueologia",a:"FOR",t:0,b:"1",s:0},{n:"Arremessar",a:"FOR",t:0,b:"20",s:0},{n:"Avaliação",a:"FOR",t:0,b:"5",s:0},{n:"Cavalgar",a:"FOR",t:0,b:"5",s:0},{n:"Charme",a:"FOR",t:0,b:"15",s:0},{n:"Chaveiro",a:"FOR",t:0,b:"1",s:0},{n:"Contabilidade",a:"FOR",t:0,b:"5",s:0},{n:"Nível de Crédito",a:"FOR",t:0,b:"0",s:0},{n:"Direito",a:"FOR",t:0,b:"5",s:0},{n:"Dirigir Automóveis",a:"FOR",t:0,b:"20",s:0},{n:"Disfarce",a:"FOR",t:0,b:"5",s:0},{n:"Encontrar",a:"FOR",t:0,b:"25",s:0},{n:"Escalar",a:"FOR",t:0,b:"20",s:0},{n:"Esquivar",a:"FOR",t:0,b:"floor(DES / 2)",s:0},{n:"Furtividade",a:"FOR",t:0,b:"20",s:0},{n:"História",a:"FOR",t:0,b:"5",s:0},{n:"Intimidação",a:"FOR",t:0,b:"15",s:0},{n:"Lábia",a:"FOR",t:0,b:"5",s:0},{n:"Medicina",a:"FOR",t:0,b:"1",s:0},{n:"Mythos de Cthulhu",a:"FOR",t:0,b:"0",s:0},{n:"Mundo Natural",a:"FOR",t:0,b:"10",s:0},{n:"Natação",a:"FOR",t:0,b:"20",s:0},{n:"Navegação",a:"FOR",t:0,b:"10",s:0},{n:"Ocultismo",a:"FOR",t:0,b:"5",s:0},{n:"Operar Maquinário Pesado",a:"FOR",t:0,b:"1",s:0},{n:"Escutar",a:"FOR",t:0,b:"20",s:0},{n:"Persuasão",a:"FOR",t:0,b:"10",s:0},{n:"Prestidigitação",a:"FOR",t:0,b:"10",s:0},{n:"Primeiros Socorros",a:"FOR",t:0,b:"30",s:0},{n:"Psicanálise",a:"FOR",t:0,b:"1",s:0},{n:"Psicologia",a:"FOR",t:0,b:"10",s:0},{n:"Rastrear",a:"FOR",t:0,b:"10",s:0},{n:"Consertos Elétricos",a:"FOR",t:0,b:"10",s:0},{n:"Consertos Mecânicos",a:"FOR",t:0,b:"10",s:0},{n:"Saltar",a:"FOR",t:0,b:"20",s:0},{n:"Usar Bibliotecas",a:"FOR",t:0,b:"20",s:0},{n:"Eletrônica",a:"FOR",t:0,b:"1",s:0},{n:"Usar Computadores",a:"FOR",t:0,b:"5",s:0},{n:"Briga",a:"FOR",t:0,b:"25",s:0},{n:"Lutar",a:"FOR",t:0,b:"20",s:1},{n:"Pistolas",a:"FOR",t:0,b:"20",s:0},{n:"Rifles/Espingardas",a:"FOR",t:0,b:"25",s:0},{n:"Submetralhadoras",a:"FOR",t:0,b:"15",s:0},{n:"Armas de fogo",a:"FOR",t:0,b:"10",s:1},{n:"Arte/Ofício 1",a:"FOR",t:0,b:"5",s:1},{n:"Arte/Ofício 2",a:"FOR",t:0,b:"5",s:1},{n:"Ciência 1",a:"FOR",t:0,b:"1",s:1},{n:"Ciência 2",a:"FOR",t:0,b:"1",s:1},{n:"Ciência 3",a:"FOR",t:0,b:"1",s:1},{n:"Língua Nativa",a:"FOR",t:0,b:"EDU",s:0},{n:"Língua 1",a:"FOR",t:0,b:"1",s:1},{n:"Língua 2",a:"FOR",t:0,b:"1",s:1},{n:"Pilotar",a:"FOR",t:0,b:"1",s:1},{n:"Sobrevivência",a:"FOR",t:0,b:"10",s:1}],
    treino:[{n:'Destreinado',b:0},{n:'Treinado',b:5},{n:'Veterano',b:10},{n:'Expert',b:15}],
    teste:{tipo:'d100',faces:100},
    barras:[{k:'vida',n:'Pontos de Vida',ic:'i-heart',id:'vitV',maxF:'floor((CON + TAM) / 10)',iniF:''},{k:'san',n:'Sanidade',ic:'i-brain',id:'vitS',maxF:'99',iniF:'POD'},{k:'esf',n:'Pontos de Magia',ic:'i-hand',id:'vitE',maxF:'floor(POD / 5)',iniF:''}],
    formulas:{dt:'10 + PE',carga:'20'},
    rotulos:{ori:'Ocupação',cls:'',nivel:'Idade',nex:'',pe:'',desl:'Movimento'},
    usa:{rit:false},recursos:[{k:'r1',n:'Sorte',tipo:'barra',ini:50,max:99}],
    criacao:[
      {t:'Quem é o investigador',b:[{k:'campo',campo:'pers',rot:'Nome do investigador'},{k:'campo',campo:'jog',rot:'Jogador'},{k:'campo',campo:'ori',rot:'Ocupação'},{k:'campo',campo:'nivel',rot:'Idade'}]},
      {t:'Características',b:[{k:'texto',t:'Role 3d6 × 5 para as cinco primeiras e (2d6 + 6) × 5 para as outras três. Se a sua mesa usa outro método, é só digitar os valores.'},{k:'attr_rolar',dados:'3d6',mais:0,mult:5,attrs:['FOR','CON','DES','APA','POD']},{k:'attr_rolar',dados:'2d6',mais:6,mult:5,attrs:['TAM','INT','EDU']}]},
      {t:'Perícias da ocupação',b:[{k:'texto',t:'Gaste os pontos da ocupação nas perícias que a sua ocupação permite.'},{k:'pericias_pontos',f:'EDU * 4',max:90,tudo:1}]},
      {t:'Interesses pessoais',b:[{k:'pericias_pontos',f:'INT * 2',max:90,tudo:1}]}
    ],
    itens:[{"n": "Faca", "g": "Corpo a corpo", "esp": 0, "d": "Lâmina média. Soma o bônus de dano, se tiver. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d4+2", "crit": "", "al": "Toque", "sk": "Briga"}, {"n": "Porrete", "g": "Corpo a corpo", "esp": 0, "d": "Taco, bastão ou cassetete. Soma o bônus de dano, se tiver. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d6", "crit": "", "al": "Toque", "sk": "Briga"}, {"n": "Machado", "g": "Corpo a corpo", "esp": 0, "d": "Machado de lenhador. Soma o bônus de dano, se tiver. Escreva a especialidade (Machado) na perícia Lutar. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d8+2", "crit": "", "al": "Toque", "sk": "Lutar"}, {"n": "Revólver .38", "g": "Armas de fogo", "esp": 0, "d": "Cilindro de 6 balas. Pode falhar com resultado muito alto. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d10", "crit": "", "al": "15 jardas", "sk": "Armas de fogo"}, {"n": "Automática .45", "g": "Armas de fogo", "esp": 0, "d": "Pente de 7 balas. Pode falhar com resultado muito alto. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d10+2", "crit": "", "al": "15 jardas", "sk": "Armas de fogo"}, {"n": "Pistola 9mm", "g": "Armas de fogo", "esp": 0, "d": "Pente de 8 balas. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "1d10", "crit": "", "al": "20 jardas", "sk": "Armas de fogo"}, {"n": "Rifle de ferrolho .30-06", "g": "Armas de fogo", "esp": 0, "d": "Carrega 5 balas. Um tiro por rodada. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "2d6+4", "crit": "", "al": "110 jardas", "sk": "Armas de fogo"}, {"n": "Espingarda calibre 12", "g": "Armas de fogo", "esp": 0, "d": "Cano duplo. Dano cai para 2d6 em alcance médio e 1d6 em longo. Valores de exemplo, confira com o seu livro.", "arma": 1, "dano": "4d6", "crit": "", "al": "10 jardas", "sk": "Armas de fogo"}, {"n": "Lanterna elétrica", "g": "Equipamento", "esp": 0, "d": "Ilumina um cone à frente. As pilhas acabam.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Lampião de querosene", "g": "Equipamento", "esp": 0, "d": "Luz mais ampla, mas se apaga com vento forte.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Corda (15 metros)", "g": "Equipamento", "esp": 0, "d": "Corda resistente para descer, amarrar ou escalar.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Pé de cabra", "g": "Equipamento", "esp": 0, "d": "Útil para arrombar caixas e portas.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Kit de primeiros socorros", "g": "Equipamento", "esp": 0, "d": "Usado junto da perícia Primeiros Socorros.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Câmera fotográfica", "g": "Equipamento", "esp": 0, "d": "Para registrar cenas e evidências.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Binóculos", "g": "Equipamento", "esp": 0, "d": "Enxergar longe com mais nitidez.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}, {"n": "Caderno e lápis", "g": "Equipamento", "esp": 0, "d": "Para anotar pistas, nomes e desenhos.", "arma": 0, "dano": "", "crit": "", "al": "", "sk": ""}]
  }
};
/* modelos de soma de dados: servem de ponto de partida no editor */
SYSTEMS.dnd={
  id:'dnd',nome:'d20 + modificador',
  atributos:[{k:'FOR',n:'Força',roda:0},{k:'DES',n:'Destreza',roda:1},{k:'CON',n:'Constituição',roda:2},{k:'INT',n:'Inteligência',roda:3},{k:'SAB',n:'Sabedoria',roda:4},{k:'CAR',n:'Carisma',roda:5}],
  atributo:{inicial:10,maxFicha:30,criacao:{pontos:0,max:0}},
  pericias:[['Acrobacia','DES'],['Atletismo','FOR'],['Furtividade','DES'],['Intimidação','CAR'],['Intuição','SAB'],['Investigação','INT'],['Medicina','SAB'],['Percepção','SAB'],['Persuasão','CAR'],['Sobrevivência','SAB']].map(([n,a])=>({n,a,t:0,b:'0',s:0})),
  treino:[{n:'Destreinado',b:0},{n:'Treinado',b:5},{n:'Veterano',b:10},{n:'Expert',b:15}],
  teste:{tipo:'soma',faces:20,dados:'1d20',regra:'mod',modF:'floor((V - 10) / 2)',faixas:[]},
  barras:[{k:'vida',n:'Pontos de Vida',ic:'i-heart',id:'vitV',maxF:'10 + floor((CON - 10) / 2)',iniF:''},{k:'san',n:'Sanidade',ic:'i-brain',id:'vitS',maxF:'10',iniF:''},{k:'esf',n:'Energia',ic:'i-hand',id:'vitE',maxF:'3',iniF:''}],
  formulas:{dt:'8 + PE',carga:'max(5, FOR)'},
  rotulos:{ori:'Origem',cls:'Classe',nivel:'Nível',nex:'',pe:'',desl:'Deslocamento'},
  usa:{rit:false},itens:[],recursos:[],
  criacao:[{t:'Quem é o personagem',b:[{k:'campo',campo:'pers',rot:'Nome do personagem'},{k:'campo',campo:'jog',rot:'Jogador'},{k:'campo',campo:'cls',rot:'Classe'}]},
    {t:'Atributos',b:[{k:'texto',t:'Role 3d6 para cada atributo. Se a sua mesa usa outro método, é só digitar os valores.'},{k:'attr_rolar',dados:'3d6',mais:0,mult:1,attrs:['FOR','DES','CON','INT','SAB','CAR']}]},
    {t:'Perícias',b:[{k:'pericias_treinar',n:4,bonus:2}]}]
};
SYSTEMS.pbta={
  id:'pbta',nome:'2d6 + atributo',
  atributos:[{k:'FOR',n:'Força',roda:0},{k:'AGI',n:'Agilidade',roda:1},{k:'MEN',n:'Mente',roda:2},{k:'CAR',n:'Carisma',roda:3},{k:'SOR',n:'Sorte',roda:4}],
  atributo:{inicial:0,maxFicha:3,criacao:{pontos:0,max:0}},
  pericias:[['Agir sob pressão','SOR'],['Ajudar alguém','CAR'],['Enfrentar o perigo','FOR'],['Escapar','AGI'],['Investigar','MEN'],['Persuadir','CAR']].map(([n,a])=>({n,a,t:0,b:'0',s:0})),
  treino:[{n:'Destreinado',b:0},{n:'Treinado',b:5},{n:'Veterano',b:10},{n:'Expert',b:15}],
  teste:{tipo:'soma',faces:6,dados:'2d6',regra:'mod',modF:'V',faixas:[{min:10,t:'Sucesso total'},{min:7,t:'Sucesso parcial'},{min:-999,t:'Falha'}]},
  barras:[{k:'vida',n:'Ferimentos',ic:'i-heart',id:'vitV',maxF:'6',iniF:''},{k:'san',n:'Estresse',ic:'i-brain',id:'vitS',maxF:'5',iniF:''},{k:'esf',n:'Sorte',ic:'i-hand',id:'vitE',maxF:'3',iniF:''}],
  formulas:{dt:'7',carga:'5'},
  rotulos:{ori:'Papel',cls:'',nivel:'',nex:'',pe:'',desl:''},
  usa:{rit:false},itens:[],recursos:[],
  criacao:[{t:'Quem é o personagem',b:[{k:'campo',campo:'pers',rot:'Nome do personagem'},{k:'campo',campo:'jog',rot:'Jogador'},{k:'campo',campo:'ori',rot:'Papel'}]},
    {t:'Atributos',b:[{k:'texto',t:'Distribua 3 pontos. Cada atributo vai de -1 a 3.'},{k:'attr_pontos',pontos:3,min:0,max:3,tudo:1}]}]
};
const OP=SYSTEMS.op;
let SYS,ATTRS,ANAME,SK,TR,FACES,BARS,WORD,PCT,SOMA,SKB,SKS;
const wheelOrder=m=>m.atributos.map((a,i)=>({k:a.k,r:a.roda==null?i:a.roda})).sort((x,y)=>x.r-y.r).map(x=>x.k);
/* troca o molde ativo: tudo que a ficha desenha (atributos, perícias, barras...) passa a vir dele */
function useMold(m){
  SYS=m;DV=m.derivados||[];ATTRS=m.atributos.map(a=>a.k);ANAME=Object.fromEntries(m.atributos.map(a=>[a.k,a.n]));
  SK=m.pericias.map(p=>[p.n,p.a,p.t,p.b,p.s]);TR=m.treino;FACES=m.teste.faces;BARS=m.barras.map(b=>[b.k,b.n,b.ic,b.id]);
  WORD=wheelOrder(m);PCT=m.teste.tipo==='d100';SOMA=m.teste.tipo==='soma';
  SKB=Object.fromEntries(m.pericias.map(p=>[p.n,p.b]));SKS=Object.fromEntries(m.pericias.map(p=>[p.n,p.s]))}
/* posição de cada atributo no círculo: espalhados por igual a partir do topo */
const wheelAngIn=(w,a)=>-90+w.indexOf(a)*360/w.length;
const wheelAng=a=>wheelAngIn(WORD,a);
/* o assistente de criação do OP sempre usa as regras do OP, mesmo se a ficha aberta for de outro sistema */
const OPATTRS=OP.atributos.map(a=>a.k),OPNAME=Object.fromEntries(OP.atributos.map(a=>[a.k,a.n])),OPWORD=wheelOrder(OP);
const wzAng=a=>wheelAngIn(OPWORD,a);
/* calculadora de fórmulas (sem eval): números, siglas, + - * / % ^ ( ) , comparações (> < >= <= == !=) e funções max min floor ceil round abs sqrt se e ou nao */
var DV=[],dvOff=false;
const TOK=/\d+(?:\.\d+)?|[A-Za-zÀ-ÿ_]\w*|>=|<=|==|!=|[-+*\/%^(),<>=]/g;
const FN_ALIAS={piso:'floor',teto:'ceil',arred:'round',raiz:'sqrt',maximo:'max','máximo':'max',minimo:'min','mínimo':'min'};
const FN={max:Math.max,min:Math.min,floor:Math.floor,ceil:Math.ceil,round:Math.round,abs:Math.abs,sqrt:Math.sqrt,
  se:(c,a,b)=>c?a:(b==null?0:b),e:(...a)=>a.every(x=>x)?1:0,ou:(...a)=>a.some(x=>x)?1:0,nao:a=>a?0:1};
const FN_AR={se:[2,3],nao:[1,1],floor:[1,1],ceil:[1,1],round:[1,1],abs:[1,1],sqrt:[1,1],e:[1,99],ou:[1,99],max:[1,99],min:[1,99]};
const fnName=x=>{x=x.toLowerCase();return FN_ALIAS[x]||x};
/* valores próprios (siglas definidas por conta): vêm do editor quando ele está aberto, senão do sistema da ficha */
function dvActive(){if(dvOff)return[];try{if(E&&E.vd)return E.vd}catch(e){}return DV}
function evalF(src,vars,_d){
  src=String(src==null?'':src);_d=_d||0;
  if(/[^\s\w+\-*\/%^(),.<>=!À-ÿ]/.test(src))return null;
  const t=src.match(TOK)||[];if(t.join('').length!==src.replace(/\s+/g,'').length)return null;
  let i=0;
  const bad=()=>{throw new Error('f')};
  function cmp(){let v=expr();while(t[i]==='>'||t[i]==='<'||t[i]==='>='||t[i]==='<='||t[i]==='=='||t[i]==='='||t[i]==='!='){const o=t[i++],r=expr();
    v=(o==='>'?v>r:o==='<'?v<r:o==='>='?v>=r:o==='<='?v<=r:o==='!='?Math.abs(v-r)>=1e-9:Math.abs(v-r)<1e-9)?1:0}return v}
  function expr(){let v=term();while(t[i]==='+'||t[i]==='-'){const o=t[i++],r=term();v=o==='+'?v+r:v-r}return v}
  function term(){let v=unary();while(t[i]==='*'||t[i]==='/'||t[i]==='%'){const o=t[i++],r=unary();v=o==='*'?v*r:(r?(o==='/'?v/r:v%r):0)}return v}
  function unary(){if(t[i]==='-'){i++;return -unary()}if(t[i]==='+'){i++;return unary()}return pw()}
  function pw(){const b=atom();if(t[i]==='^'){i++;return Math.pow(b,unary())}return b}
  function atom(){const x=t[i++];if(x==null)bad();
    if(x==='('){const v=cmp();if(t[i++]!==')')bad();return v}
    if(/^\d/.test(x))return +x;
    if(!/^[A-Za-zÀ-ÿ_]/.test(x))bad();
    if(t[i]==='('){const n=fnName(x),f=FN[n];if(!f)bad();i++;const a=[];if(t[i]!==')'){do{a.push(cmp())}while(t[i]===','&&++i)}if(t[i++]!==')')bad();
      const ar=FN_AR[n];if(a.length<ar[0]||a.length>ar[1])bad();return f(...a)}
    if(Object.prototype.hasOwnProperty.call(vars,x))return +vars[x]||0;
    const dv=_d<8?dvActive().find(d=>String(d.k).trim().toUpperCase()===x):null;
    if(dv){const r=evalF(dv.f,vars,_d+1);if(r==null)bad();return r}
    bad()}
  try{const v=cmp();return i===t.length&&isFinite(v)?v:null}catch(e){return null}}
/* explica em português o que está errado numa conta */
function fErr(src,vars){
  src=String(src==null?'':src);if(!src.trim())return'A conta está vazia.';
  const ch=src.match(/[^\s\w+\-*\/%^(),.<>=!À-ÿ]/);if(ch)return'O caractere "'+ch[0]+'" não pode ser usado numa conta.';
  const t=src.match(TOK)||[];
  if(t.join('').length!==src.replace(/\s+/g,'').length)return'Tem um símbolo solto que não faz sentido (um ! sozinho ou um ponto sem número).';
  let d=0;for(const x of t){if(x==='(')d++;else if(x===')'){d--;if(d<0)return'Tem um ")" sobrando.'}}
  if(d>0)return'Falta fechar '+d+' parêntese'+(d>1?'s':'')+'.';
  const names=new Set(Object.keys(vars||{}).concat(dvActive().map(x=>String(x.k).trim().toUpperCase()).filter(Boolean)));
  for(let j=0;j<t.length;j++){const x=t[j];if(!/^[A-Za-zÀ-ÿ_]/.test(x))continue;
    if(t[j+1]==='('){if(!FN[fnName(x)])return'A função "'+x+'" não existe. Use max, min, floor, ceil, round, abs, sqrt, se, e, ou ou nao.'}
    else if(!names.has(x))return'A sigla "'+x+'" não existe. Dá pra usar: '+[...names].join(', ')+'.'}
  for(let j=0;j<t.length;j++){const x=t[j];if(/^[A-Za-zÀ-ÿ_]/.test(x)&&t[j+1]==='('){const n=fnName(x),ar=FN_AR[n];let dd=0,c=1,k=j+2;
    if(t[k]===')'){c=0}else{for(;k<t.length;k++){if(t[k]==='(')dd++;else if(t[k]===')'){if(dd===0)break;dd--}else if(t[k]===','&&dd===0)c++}}
    if(ar&&(c<ar[0]||c>ar[1]))return'A função "'+x+'" espera '+(ar[0]===ar[1]?ar[0]:ar[1]>9?'pelo menos '+ar[0]:'de '+ar[0]+' a '+ar[1])+' valor'+(ar[1]>1?'es':'')+' e recebeu '+c+'.'}}
  return'Está incompleta ou fora de ordem. Confira se cada operador (+ − * / ...) tem um número ou sigla dos dois lados.'}
const numf=v=>{const n=parseFloat(String(v==null?'':v).replace(',','.'));return Number.isFinite(n)?n:0};
/* CLASSE: 1 para a primeira classe da lista do sistema, 2 para a segunda... e 0 para qualquer outra coisa (vazio, mundano) */
const nrm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const classNum=()=>{const c=nrm(D.cls);return c?(SYS.classes||[]).findIndex(x=>nrm(x)===c)+1:0};
const fvars=()=>Object.assign({PE:numf(D.pe),NIVEL:numf(D.nivel),NEX:numf(D.nex),CLASSE:classNum()},D.attr);
const calc=(f)=>{const v=evalF(f,fvars());return v==null?0:v};
const calcWith=(f,at,pe)=>{const v=evalF(f,Object.assign({PE:+pe||0,NIVEL:1,NEX:1,CLASSE:1},at));return v==null?0:v};
/* a conta muda quando os atributos mudam? (usado pra saber se a barra acompanha os atributos) */
const dependsOn=(f,keys)=>{const a={PE:1},b={PE:5};keys.forEach(k=>{a[k]=1;b[k]=7});return evalF(f,a)!==evalF(f,b)};
const attrIni=()=>Object.fromEntries(ATTRS.map(a=>[a,SYS.atributo.inicial]));
const barsIni=(at0)=>{const at=at0||attrIni();return Object.fromEntries(SYS.barras.map(b=>{
  const mx=Math.max(0,Math.round(calcWith(b.maxF,at,0))),cu=b.iniF?Math.max(0,Math.min(mx,Math.round(calcWith(b.iniF,at,0)))):mx;return[b.k,[cu,mx]]}))};
useMold(OP);

/* ---------- sistema próprio: validação do molde (vem de arquivo importado ou da nuvem, então nada é confiado) ---------- */
const MAX_ATTR=8,MAX_PER=80,MAX_ITEM=200,MAX_REC=12,MAX_DV=10;
const REC_TIPOS=['contador','barra','marca'];
const cleanTxt=(v,n)=>String(v==null?'':v).replace(/[<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
const cleanF=(v,n)=>String(v==null?'':v).replace(/[&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,n||120);
const cleanDesc=(v,n)=>String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,n);
const ni=(v,a,b,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):d};
/* soma de dados: dados (NdM), regra ('mod' soma o modificador, 'abaixo' tira o valor ou menos), conta do modificador e faixas de resultado */
function somaTeste(rt){
  rt=rt&&typeof rt==='object'?rt:{};
  const d=cleanTxt(rt.dados,12).replace(/\s/g,'').toLowerCase(),mm=/^(\d{1,2})d(\d{1,3})$/.exec(d),ok=mm&&+mm[1]>=1&&+mm[2]>=2,mf=cleanF(rt.modF,120);
  return{tipo:'soma',dados:ok?d:'1d20',faces:ok?+mm[2]:20,regra:rt.regra==='abaixo'?'abaixo':'mod',modF:mf&&evalF(mf,{V:10})!==null?mf:'V',
    faixas:(Array.isArray(rt.faixas)?rt.faixas:[]).slice(0,6).map(x=>({min:ni(x&&x.min,-999,999,0),t:cleanTxt(x&&x.t,40)})).filter(x=>x.t).sort((a,b)=>b.min-a.min)}}
const ROT_KEYS=['ori','cls','nivel','nex','pe','desl'];
const FLOW_FIELDS=['pers','jog','ori','cls','nivel','nex','pe','desl'];
const FLOW_KINDS=['texto','campo','attr_pontos','attr_rolar','lista','pericias_treinar','pericias_pontos','se','definir','dar'];
const FLOW_OPS=['>=','<=','>','<','=','!='];
const MAX_STEP=12,MAX_BLK=12,MAX_OPT=40;
/* passo a passo de criação: tudo que vem de fora é limpo aqui (atributos e perícias precisam existir no sistema) */
function cleanFlow(fl,ak,sn,vars0){
  const vars=Object.assign({NIVEL:1,NEX:1},vars0),flag=v=>v===0||v===false?0:1;
  const okF=f=>{f=cleanF(f,120);return f&&evalF(f,vars)!==null?f:null};
  const one=(b,nested)=>{
    if(!b||typeof b!=='object'||!FLOW_KINDS.includes(b.k)||(nested&&b.k==='se'))return null;const k=b.k;
    if(k==='texto')return{k,t:cleanDesc(b.t,400)};
    if(k==='campo')return{k,campo:FLOW_FIELDS.includes(b.campo)?b.campo:'pers',rot:cleanTxt(b.rot,40)};
    if(k==='attr_pontos'){const min=ni(b.min,0,999,0);return{k,pontos:ni(b.pontos,0,999,4),min,max:Math.max(min,ni(b.max,0,999,3)),tudo:flag(b.tudo)}}
    if(k==='attr_rolar'){const d=cleanTxt(b.dados,12).replace(/\s/g,'').toLowerCase(),mm=/^(\d{1,2})d(\d{1,3})$/.exec(d);
      return{k,dados:mm&&+mm[1]>=1&&+mm[2]>=2?d:'3d6',mais:ni(b.mais,-999,999,0),mult:ni(b.mult,1,100,5),attrs:[...new Set((Array.isArray(b.attrs)?b.attrs:[]).filter(x=>ak.has(x)))]}}
    if(k==='lista'){
      const ops=(Array.isArray(b.opcoes)?b.opcoes:[]).slice(0,MAX_OPT).map(o=>o&&typeof o==='object'?{n:cleanTxt(o.n,40),sk:sn.has(o.sk)?o.sk:'',pts:ni(o.pts,0,999,0)}:null).filter(o=>o&&o.n);
      return{k,rot:cleanTxt(b.rot,40)||'Escolha',campo:FLOW_FIELDS.includes(b.campo)?b.campo:'',opcoes:ops,obrig:flag(b.obrig)}}
    if(k==='pericias_treinar')return{k,n:ni(b.n,0,80,3),bonus:ni(b.bonus,-99,99,2)};
    if(k==='pericias_pontos')return{k,f:okF(b.f)||'0',max:ni(b.max,1,999,75),tudo:flag(b.tudo)};
    if(k==='definir')return{k,alvo:ak.has(b.alvo)?b.alvo:'',f:okF(b.f)||'0'};
    if(k==='dar')return{k,sk:sn.has(b.sk)?b.sk:'',n:ni(b.n,-999,999,5)};
    if(k==='se')return{k,e1:okF(b.e1)||'0',op:FLOW_OPS.includes(b.op)?b.op:'>=',e2:okF(b.e2)||'0',b:(Array.isArray(b.b)?b.b:[]).slice(0,MAX_BLK).map(x=>one(x,true)).filter(Boolean)};
    return null};
  const out=[];
  (Array.isArray(fl)?fl:[]).slice(0,MAX_STEP).forEach(st=>{
    if(!st||typeof st!=='object')return;
    out.push({t:cleanTxt(st.t,40)||'Etapa',b:(Array.isArray(st.b)?st.b:[]).slice(0,MAX_BLK).map(b=>one(b,false)).filter(Boolean)})});
  return out}
/* o molde é limpo sem olhar para valores próprios de fora: ele traz os seus */
function cleanMold(r){dvOff=true;try{return cleanMold0(r)}finally{dvOff=false}}
function cleanMold0(r){
  if(!r||typeof r!=='object')return null;
  const seen=new Set(),at=[];
  (Array.isArray(r.atributos)?r.atributos:[]).slice(0,MAX_ATTR).forEach(a=>{
    if(!a||typeof a!=='object')return;
    const k=String(a.k==null?'':a.k).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
    if(!k||k==='PE'||seen.has(k))return;seen.add(k);at.push({k,n:cleanTxt(a.n,24)||k,roda:at.length})});
  if(!at.length)return null;
  const tipo=r.teste&&(r.teste.tipo==='d100'||r.teste.tipo==='soma')?r.teste.tipo:'pool',ra=r.atributo&&typeof r.atributo==='object'?r.atributo:{};
  const maxFicha=ni(ra.maxFicha,1,999,tipo==='d100'?200:tipo==='soma'?30:9),inicial=Math.min(maxFicha,ni(ra.inicial,tipo==='soma'?-99:0,999,tipo==='d100'?50:tipo==='soma'?10:1));
  const vars={PE:1,NIVEL:1,NEX:1,CLASSE:1};at.forEach(a=>{vars[a.k]=1});
  /* valores próprios: cada um é uma sigla definida por uma conta; pode usar atributos e outros valores (a ordem se ajeita sozinha) */
  const dvc=[],dvs=[],dvk=new Set();
  (Array.isArray(r.derivados)?r.derivados:[]).slice(0,MAX_DV).forEach((x,ix)=>{
    if(!x||typeof x!=='object')return;
    const k=String(x.k==null?'':x.k).toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,12),f=cleanF(x.f,120);
    if(!k||!/^[A-Z_]/.test(k)||k==='PE'||k==='NIVEL'||k==='NEX'||k==='CLASSE'||seen.has(k)||dvk.has(k)||!f)return;
    dvk.add(k);dvc.push({k,n:cleanTxt(x.n,24)||k,f,ix})});
  for(let pass=0;pass<=MAX_DV&&dvc.length;pass++){let moved=false;
    for(let j=0;j<dvc.length;j++){const x=dvc[j],val=evalF(x.f,vars);if(val!=null){vars[x.k]=val;dvs.push(x);dvc.splice(j,1);j--;moved=true}}
    if(!moved)break}
  dvs.sort((a,b)=>a.ix-b.ix);
  const fm=(f,d)=>{f=cleanF(f,120);return f&&evalF(f,vars)!==null?f:d};
  const sn=new Set(),pe=[];
  (Array.isArray(r.pericias)?r.pericias:[]).slice(0,MAX_PER).forEach(p=>{
    if(!p||typeof p!=='object')return;
    const n=cleanTxt(p.n,40);if(!n||sn.has(n.toLowerCase()))return;sn.add(n.toLowerCase());
    pe.push({n,a:seen.has(p.a)?p.a:at[0].k,t:p.t?1:0,b:tipo==='d100'?fm(p.b,'0'):'0',s:p.s?1:0})});
  const pnames=new Set(pe.map(p=>p.n)),ik=new Set(),itens=[];
  (Array.isArray(r.itens)?r.itens:[]).slice(0,MAX_ITEM).forEach(it=>{
    if(!it||typeof it!=='object')return;
    const n=cleanTxt(it.n,40);if(!n)return;const g=cleanTxt(it.g,24)||'Itens',key=(g+'|'+n).toLowerCase();if(ik.has(key))return;ik.add(key);
    const arma=it.arma?1:0;
    itens.push({n,g,esp:Math.max(0,Math.min(99,Math.round((+it.esp||0)*2)/2)),d:cleanDesc(it.d,400),arma,dano:arma?cleanTxt(it.dano,24):'',crit:arma?cleanTxt(it.crit,12):'',al:arma?cleanTxt(it.al,24):'',sk:arma&&pnames.has(it.sk)?it.sk:''})});
  const rk=new Set(),recursos=[];
  (Array.isArray(r.recursos)?r.recursos:[]).slice(0,MAX_REC).forEach(x=>{
    if(!x||typeof x!=='object')return;const n=cleanTxt(x.n,24);if(!n)return;
    const tp=REC_TIPOS.includes(x.tipo)?x.tipo:'contador';let k=/^r\d{1,3}$/.test(String(x.k))?String(x.k):'';
    if(!k||rk.has(k)){let j=1;while(rk.has('r'+j))j++;k='r'+j}rk.add(k);
    const max=tp==='marca'?1:ni(x.max,1,999,10);recursos.push({k,n,tipo:tp,max,ini:Math.min(max,ni(x.ini,0,999,0))})});
  const fr=r.formulas&&typeof r.formulas==='object'?r.formulas:{};
  const br=Array.isArray(r.barras)?r.barras:[];
  const barras=OP.barras.map((b0,i)=>{const rb=br[i]&&typeof br[i]==='object'?br[i]:{};
    return{k:b0.k,ic:b0.ic,id:b0.id,n:cleanTxt(rb.n,24)||b0.n,maxF:fm(rb.maxF,b0.maxF),iniF:rb.iniF?fm(rb.iniF,''):''}});
  const ro=r.rotulos&&typeof r.rotulos==='object'?r.rotulos:{},rotulos={};
  ROT_KEYS.forEach(k=>{rotulos[k]=ro[k]==null?OP.rotulos[k]:cleanTxt(ro[k],24)});
  return{id:'custom',nome:cleanTxt(r.nome,40)||'Meu sistema',atributos:at,atributo:{inicial,maxFicha,criacao:OP.atributo.criacao},pericias:pe,treino:OP.treino,
    teste:tipo==='d100'?{tipo:'d100',faces:100}:tipo==='soma'?somaTeste(r.teste):OP.teste,barras,formulas:{dt:fm(fr.dt,'10 + PE'),carga:fm(fr.carga,'5')},derivados:dvs.map(x=>({k:x.k,n:x.n,f:x.f})),classes:(Array.isArray(r.classes)?r.classes:[]).slice(0,8).map(x=>cleanTxt(x,24)).filter(Boolean),rotulos,usa:{rit:r.usa&&typeof r.usa==='object'?!!r.usa.rit:true},itens,recursos,criacao:cleanFlow(r.criacao,seen,pnames,vars)}}
/* o que é guardado na ficha: só a parte editável (null = é o OP de fábrica) */
const moldTeste=t=>t.tipo==='soma'?{tipo:'soma',dados:t.dados,regra:t.regra,modF:t.modF,faixas:t.faixas.map(x=>({min:x.min,t:x.t}))}:{tipo:t.tipo};
const moldObj=m=>({nome:m.nome,teste:moldTeste(m.teste),atributo:{inicial:m.atributo.inicial,maxFicha:m.atributo.maxFicha},
  atributos:m.atributos.map(a=>({k:a.k,n:a.n})),pericias:m.pericias.map(p=>({n:p.n,a:p.a,t:p.t,b:p.b,s:p.s})),
  barras:m.barras.map(b=>({n:b.n,maxF:b.maxF,iniF:b.iniF})),formulas:{dt:m.formulas.dt,carga:m.formulas.carga},derivados:(m.derivados||[]).map(x=>({k:x.k,n:x.n,f:x.f})),classes:(m.classes||[]).slice(),rotulos:Object.assign({},m.rotulos),usa:{rit:m.usa.rit},itens:m.itens.map(i=>({n:i.n,g:i.g,esp:i.esp,d:i.d,arma:i.arma,dano:i.dano,crit:i.crit,al:i.al,sk:i.sk})),criacao:m.criacao.map(s=>({t:s.t,b:s.b})),recursos:(m.recursos||[]).map(x=>({k:x.k,n:x.n,tipo:x.tipo,ini:x.ini,max:x.max}))});
const moldData=()=>SYS===OP?null:moldObj(SYS);
const moldFor=s=>{const c=s&&s.mold?cleanMold(s.mold):null;return c||OP};
const ELEM={sangue:'Sangue',morte:'Morte',conhecimento:'Conhecimento',energia:'Energia',medo:'Medo'};
const CIRC=['I','II','III','IV'],PEC=[1,3,6,10];
const GH=ASSET_BASE,EIC={sangue:GH+'OPsangue.webp',morte:GH+'OPmorte.webp',energia:GH+'OPenergia.webp',conhecimento:GH+'OPconhecimento.webp',medo:GH+'OPmedo.webp'};
const KEY='op-ficha-v1';
const HMT=KEY+'-ultima-edicao',HMB=KEY+'-ultimo-backup';
function tGet(k){try{return +localStorage.getItem(k)||0}catch(e){return 0}}
function tSet(k){try{localStorage.setItem(k,String(Date.now()))}catch(e){}}
function ago(t){if(!t)return'';const now=Date.now(),s=Math.max(0,(now-t)/1000);if(s<60)return'agora';const mi=Math.floor(s/60);if(mi<60)return'há '+mi+' min';const h=Math.floor(mi/60);if(h<24)return'há '+h+' h';
  const sd=x=>{const d=new Date(x);d.setHours(0,0,0,0);return d.getTime()},dd=Math.round((sd(now)-sd(t))/864e5);
  if(dd<=1)return'ontem';if(dd<30)return'há '+dd+' dias';const mo=Math.floor(dd/30);if(mo<12)return mo===1?'há 1 mês':'há '+mo+' meses';const y=Math.floor(dd/365);return y<=1?'há 1 ano':'há '+y+' anos'}
const SUPABASE_URL=APP_CONFIG.SUPABASE_URL;
const SUPABASE_KEY=APP_CONFIG.SUPABASE_KEY;
const CLOUD_TABLE=APP_CONFIG.CLOUD_TABLE;
const cloudClient=Cloud.client;
let cloudUser=null,activeCloudId=null,cloudSaveT=null,cloudSyncBusy=false,cloudSyncAgain=false,cloudApplying=false;
let cloudRev=null,cloudConflict=false;
let remoteCatalogItems=[],remoteCatalogError='',remoteCatalogLoading=false;
let editableCatalogError='',editableCatalogLoading=false;

/* cache dos catálogos em IndexedDB (não disputa espaço com a ficha no localStorage) */
const CATDB={
  db(){return new Promise((ok,no)=>{if(!window.indexedDB)return no(new Error('sem IndexedDB'));const r=indexedDB.open('op-ficha-cache',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);r.onblocked=()=>no(new Error('bloqueado'))})},
  async get(k){const db=await this.db();try{return await new Promise((ok,no)=>{const q=db.transaction('kv','readonly').objectStore('kv').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})}finally{db.close()}},
  async set(k,v){const db=await this.db();try{await new Promise((ok,no)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})}finally{db.close()}}
};
const CAT_V=1;
let catalogNotice='';
const offlineMsg=t=>'Sem conexão com o Supabase: usando os catálogos salvos neste aparelho'+(t?' (atualizados em '+new Date(t).toLocaleDateString('pt-BR')+')':'')+'.';
function applyCatalogRows(r){
  const rl=(r.rit||[]).map(x=>({e:x.element,c:x.circle-1,n:x.name,ex:x.execution,al:x.ritual_range,alvo:x.target,dur:x.duration,res:x.resistance,nor:x.normal,dis:x.discente,ver:x.true_version,d:x.description,k:x.summary}));
  const lb=(r.abi||[]).map(a=>({t:a.type,g:a.group_name,x:a.nex,n:a.name,c:a.cost,d:a.description,k:a.needs_review}));
  const lg={},lq={};
  (r.grp||[]).forEach(g=>{(lg[g.type]||(lg[g.type]=[])).push(g.name);if(g.requirements)lq[g.name]=g.requirements});
  const og=(r.ori||[]).map(o=>({n:o.name,s:[o.skill_one,o.skill_two].filter(Boolean),chk:o.needs_check,p:{n:o.power_name,c:o.power_cost,t:o.power_description}}));
  const cl=Object.fromEntries((r.cls||[]).map(c=>[c.name,{t:c.description,pv:c.pv,pe:c.pe,san:c.sanity,sk:c.skill_choices||[],txt:c.details}]));
  if(!rl.length||!lb.length||!Object.keys(cl).length)throw new Error('Catálogos vazios');
  RLIB=rl;LIB=lb;LIBG=lg;LIBREQ=lq;ORIG=og;CLS=cl}
function refreshCatalogUI(){
  if(!$('#mRL').hidden)renderRL();
  if(!$('#mLib').hidden)renderLib();
  if(!$('#mIL').hidden){ilBuild();renderIL()}
  if(W&&!$('#wiz').hidden)wzRender(W.step)}
async function loadGameCatalogs(){
  catalogNotice='';editableCatalogLoading=true;remoteCatalogLoading=true;
  let cached=null;
  try{
    const c=await CATDB.get('catalogs');
    if(c&&c.v===CAT_V&&c.rows){applyCatalogRows(c.rows);remoteCatalogItems=c.rows.items||[];cached=c;editableCatalogLoading=false;remoteCatalogLoading=false;refreshCatalogUI()}
  }catch(e){cached=null}
  const cachedItems=cached&&cached.rows.items?cached.rows.items:null;
  try{
    if(!cloudClient){
      if(cached)catalogNotice=offlineMsg(cached.t);
      else{editableCatalogError='Supabase indisponível. Conecte-se à internet para carregar rituais e habilidades.';remoteCatalogError='Supabase indisponível. Conecte-se à internet para carregar itens.'}
      return}
    const [rituals,abilities,groups,origins,classes,items]=await Promise.all([
      cloudClient.from('catalog_rituals').select('element,circle,name,execution,ritual_range,target,duration,resistance,normal,discente,true_version,description,summary').order('element').order('circle').order('name'),
      cloudClient.from('catalog_abilities').select('type,group_name,nex,name,cost,description,needs_review').order('type').order('group_name').order('nex').order('name'),
      cloudClient.from('catalog_ability_groups').select('type,name,requirements').order('type').order('name'),
      cloudClient.from('catalog_origins').select('name,skill_one,skill_two,needs_check,power_name,power_cost,power_description').order('name'),
      cloudClient.from('catalog_classes').select('name,description,pv,pe,sanity,skill_choices,details').order('name'),
      cloudClient.from('catalog_items').select('id,name,category,spaces,description,damage,requirements,price').order('category').order('name')
    ]);
    const failed=[rituals,abilities,groups,origins,classes].find(result=>result.error);
    if(failed)throw failed.error;
    const rows={rit:rituals.data,abi:abilities.data,grp:groups.data,ori:origins.data,cls:classes.data,items:items.error?cachedItems:(items.data||[])};
    applyCatalogRows(rows);
    editableCatalogError='';catalogNotice='';
    if(items.error){
      if(cachedItems){remoteCatalogItems=cachedItems;remoteCatalogError=''}
      else{remoteCatalogItems=[];remoteCatalogError='Falha ao carregar itens do Supabase. Verifique a tabela catalog_items.'}}
    else{remoteCatalogItems=items.data||[];remoteCatalogError=''}
    CATDB.set('catalogs',{v:CAT_V,t:Date.now(),rows}).catch(()=>{});
  }catch(e){
    console.error('Falha ao carregar catálogos Supabase:',e);
    if(cached){editableCatalogError='';remoteCatalogError='';catalogNotice=offlineMsg(cached.t)}
    else{editableCatalogError='Falha ao carregar os catálogos do Supabase. Verifique as tabelas e atualize a página.';remoteCatalogError='Falha ao carregar os itens do Supabase. Verifique a tabela catalog_items.'}
  }finally{editableCatalogLoading=false;remoteCatalogLoading=false}
  refreshCatalogUI();
  if(!$('#splash')){if(editableCatalogError)toast('Catálogos indisponíveis',editableCatalogError);else if(catalogNotice)toast('Modo offline',catalogNotice)}
}

function fresh(){return{jog:'',pers:'',ori:'',cls:'',av:'',attr:attrIni(),sys:SYS===OP?'op':'custom',mold:moldData(),nivel:SYS===OP?'1':'',nex:SYS===OP?'5%':'',pe:SYS===OP?'1':'',desl:SYS===OP?'9m/6q':'',
  bars:barsIni(),sk:SK.map(s=>PCT?{n:s[0],a:s[1],t:s[2],tr:0,ex:0,v:null,sp:''}:SOMA?{n:s[0],a:s[1],t:s[2],tr:0,ex:0,bn:0}:{n:s[0],a:s[1],t:s[2],tr:0,ex:0}),def:SYS===OP?'10':'',prot:'',res:'',
  atk:[],hab:[],rit:[],inv:[],carga:'',dt:'',nid:1,desc:{a:'',p:'',h:'',o:''},created:false,camp:'',cfg:{rm:false},opt:{diff:'reg',dice:0,cd:0,adv:0}}}
function normalize(s){useMold(moldFor(s));const f=fresh(),d=Object.assign(f,s||{});d.mold=moldData();d.sys=SYS===OP?'op':'custom';
  d.attr=Object.fromEntries(ATTRS.map(k=>{const v=s&&s.attr&&s.attr[k];return[k,v==null||v===''?SYS.atributo.inicial:clamp(Math.round(+v)||0,0,SYS.atributo.maxFicha)]}));d.bars=Object.assign(fresh().bars,(s&&s.bars)||{});d.cfg=Object.assign({rm:false},(s&&s.cfg)||{});{const o=(s&&s.opt)||{};d.opt={diff:['reg','hard','ext'].includes(o.diff)?o.diff:'reg',dice:[-1,0,1].includes(+o.dice)?+o.dice:0,cd:clamp(Math.round(+o.cd)||0,0,999),adv:[-1,0,1].includes(+o.adv)?+o.adv:0}}d.desc=Object.assign({a:'',p:'',h:'',o:''},(s&&s.desc)||{});if(s&&s.created===undefined)d.created=true;if(d.created&&!d.camp)d.camp='op';
  const have={};(Array.isArray(d.sk)?d.sk:[]).forEach(x=>{if(x&&x.n)have[x.n]=x});
  d.sk=SK.map(x=>{const h=have[x[0]];if(!h)return PCT?{n:x[0],a:x[1],t:x[2],tr:0,ex:0,v:null,sp:''}:SOMA?{n:x[0],a:x[1],t:x[2],tr:0,ex:0,bn:0}:{n:x[0],a:x[1],t:x[2],tr:0,ex:0};if(!ATTRS.includes(h.a))h.a=x[1];if(SOMA)h.bn=clamp(Math.round(+h.bn)||0,-99,99);if(PCT){h.v=h.v==null||h.v===''?null:clamp(Math.round(+h.v)||0,0,999);h.sp=cleanTxt(h.sp,30)}return h});
  ['atk','hab','rit','inv'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});
  d.nid=Math.max(+d.nid||1,1+Math.max(0,...['atk','hab','rit','inv'].flatMap(k=>d[k].map(x=>+x.id||0))));
  return d}
const BKP=KEY+'-corrompido';
let loadIssue='',loadRaw=null;
const stashKeys=()=>{const ks=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf(BKP+'-')===0)ks.push(k)}}catch(e){}return ks.sort()};
function stash(raw){try{const ks=stashKeys();while(ks.length>=3)localStorage.removeItem(ks.shift());localStorage.setItem(BKP+'-'+Date.now(),raw);return true}catch(e){return false}}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY)}catch(e){loadIssue='bloqueado';return fresh()}
  if(raw==null)return fresh();
  try{const j=JSON.parse(raw);if(j&&typeof j==='object')return normalize(j)}catch(e){}
  loadRaw=raw;loadIssue=stash(raw)?'corrompido':'perdido';return fresh()}
let D=load(),saveT=null,saveBad=false,swMute=0,swAct=null;
try{rmApply()}catch(e){}
function swShow(t,m,label,fn){$('#swT').textContent=t;$('#swMsg').textContent=m;const b=$('#swBtn');b.hidden=!label;b.textContent=label||'';swAct=fn||null;$('#saveWarn').hidden=false}
function writeNow(){
  clearTimeout(saveT);saveT=null;
  try{localStorage.setItem(KEY,JSON.stringify(D));tSet(HMT);if(saveBad){saveBad=false;$('#saveWarn').hidden=true}}
  catch(e){saveBad=true;
    if(Date.now()>swMute)swShow('Não consegui salvar a ficha',/quota/i.test((e&&e.name||'')+' '+(e&&e.message||''))?'O armazenamento do navegador está cheio. Exporte um backup agora e libere espaço (retratos pesados e rascunhos antigos ocupam bastante).':'O navegador bloqueou o salvamento neste aparelho (aba anônima ou armazenamento desligado?). Exporte um backup para não perder o que fez.','Exportar backup',()=>$('#ioExp').click())}}
function save(){clearTimeout(saveT);saveT=setTimeout(writeNow,250);if(cloudUser&&activeCloudId&&!cloudApplying&&!cloudConflict){clearTimeout(cloudSaveT);Cloud.ui.pending();cloudSaveT=setTimeout(()=>syncCloud(false),1200)}}
addEventListener('pagehide',()=>{if(saveT!==null)writeNow()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&saveT!==null)writeNow()});
function dl(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function showLoadIssue(){
  if(loadIssue==='bloqueado')swShow('Armazenamento bloqueado','O navegador não deixa esta página guardar dados (aba anônima ou armazenamento desligado). A ficha só vale enquanto a aba estiver aberta; exporte um backup antes de sair.');
  else if(loadIssue==='corrompido')swShow('A ficha salva estava ilegível','Guardei uma cópia do que havia antes de abrir uma ficha em branco. Dá pra baixar agora ou depois, em Backup.','Baixar cópia',()=>dl('ficha-recuperada.txt',loadRaw||''));
  else if(loadIssue==='perdido')swShow('A ficha salva estava ilegível','Abri uma ficha em branco e não consegui guardar a cópia do que havia (armazenamento cheio). Baixe agora para não perder.','Baixar cópia',()=>dl('ficha-recuperada.txt',loadRaw||''))}
function bkRefresh(){$('#ioBk').hidden=!stashKeys().length}
$('#swBtn').onclick=()=>{if(swAct)swAct()};
$('#swX').onclick=()=>{swMute=Date.now()+5*60*1000;$('#saveWarn').hidden=true};
$('#ioBkGet').onclick=()=>{const ks=stashKeys(),k=ks[ks.length-1];if(!k)return bkRefresh();let raw=null;try{raw=localStorage.getItem(k)}catch(e){}if(raw!=null)dl('ficha-recuperada-'+k.split('-').pop()+'.txt',raw)};
let bkArm=0;$('#ioBkDel').onclick=e=>{const b=e.currentTarget;
  if(!bkArm){b.textContent='Tem certeza? Toque de novo';bkArm=setTimeout(()=>{bkArm=0;b.textContent='Descartar'},4000);return}
  clearTimeout(bkArm);bkArm=0;b.textContent='Descartar';stashKeys().forEach(k=>{try{localStorage.removeItem(k)}catch(err){}});bkRefresh()};
bkRefresh();
/* ---------- vários agentes neste aparelho ---------- */
const SLX='op-ficha-slots',SLK='op-ficha-slot-';
let slLast=null;
const slIdx=()=>{try{const j=JSON.parse(localStorage.getItem(SLX));if(j&&Array.isArray(j.list))return{v:1,list:j.list.filter(x=>x&&typeof x.id==='string')}}catch(e){}return{v:1,list:[]}};
const slSave=ix=>{try{localStorage.setItem(SLX,JSON.stringify(ix));return true}catch(e){return false}};
const slNoRoom=()=>confirm('Não há espaço para guardar a ficha atual neste aparelho. Continuar vai substituí-la. Exporte um backup antes se quiser guardá-la. Continuar mesmo assim?');
function slPush(){
  slLast=null;if(!D.created)return true;
  const ix=slIdx(),id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  try{localStorage.setItem(SLK+id,JSON.stringify(D))}catch(e){return slNoRoom()}
  ix.list.push({id,t:Date.now()});
  if(!slSave(ix)){try{localStorage.removeItem(SLK+id)}catch(e){}return slNoRoom()}
  slLast=id;return true}
function slInfo(j){return{n:String(j.pers||'').trim()||'Agente sem nome',s:[j.cls,j.ori].map(x=>String(x||'').trim()).filter(Boolean).join(' · ')||'Sem classe',av:typeof j.av==='string'&&j.av.indexOf('data:image/')===0?j.av:''}}
const slAv=i=>`<span class="sl-av" aria-hidden="true">${i.av?`<img alt="" src="${esc(i.av)}">`:esc(i.n.charAt(0).toUpperCase())}</span>`;
function slRender(){
  const ix=slIdx().list.slice().sort((a,b)=>b.t-a.t);let n=0,h='';
  const st=()=>` style="--i:${n++}"`;
  if(D.created){const c=slInfo(D);
    h+=`<li class="sl-i cur"${st()}><span class="sl-tag">Em uso</span>${slAv(c)}<span class="sl-t"><b>${esc(c.n)}</b><em>${esc(c.s)}</em></span><span class="sl-act"><button class="btn pri sm" type="button" data-sl="cur">Continuar</button></span></li>`}
  ix.forEach(x=>{let j=null;try{j=JSON.parse(localStorage.getItem(SLK+x.id))}catch(e){}
    if(!j||typeof j!=='object'){h+=`<li class="sl-i"${st()}><span class="sl-t"><b>Ficha ilegível</b><em>Não dá para abrir esta cópia.</em></span><span class="sl-act"><button class="btn sm" type="button" data-sl="del" data-id="${esc(x.id)}">Excluir</button></span></li>`;return}
    const i=slInfo(j);
    h+=`<li class="sl-i"${st()}>${slAv(i)}<span class="sl-t"><b>${esc(i.n)}</b><em>${esc(i.s)}</em><em>guardado em ${esc(new Date(x.t).toLocaleDateString('pt-BR'))}</em></span><span class="sl-act"><button class="btn sm pri" type="button" data-sl="open" data-id="${esc(x.id)}">Abrir</button><button class="btn sm" type="button" data-sl="del" data-id="${esc(x.id)}">Excluir</button></span></li>`});
  cocIdx().list.slice().sort((a,b)=>b.t-a.t).forEach(x=>{let av='';try{const j=JSON.parse(localStorage.getItem('coc-slot-v1:'+x.id));if(j&&j.who&&typeof j.who.av==='string'&&j.who.av.indexOf('data:image/')===0)av=j.who.av}catch(e){}
    h+=`<li class="sl-i"${st()}>${slAv({n:x.nome,av})}<span class="sl-t"><b>${esc(x.nome)}</b><em>Call of Cthulhu${x.ocup?' · '+esc(x.ocup):''}</em><em>salvo em ${esc(new Date(x.t).toLocaleDateString('pt-BR'))}</em></span><span class="sl-act"><button class="btn sm pri" type="button" data-sl="coc" data-id="${esc(x.id)}">Abrir</button><button class="btn sm" type="button" data-sl="cocdel" data-id="${esc(x.id)}">Excluir</button></span></li>`});
  h+=`<li class="sl-i sl-new"${st()}><button class="sl-nb" type="button" data-sl="new"><span aria-hidden="true">+</span><b>Novo agente</b></button></li>`;
  $('#slList').innerHTML=h}
function slOpen(id){
  let raw=null,j=null;try{raw=localStorage.getItem(SLK+id);j=JSON.parse(raw)}catch(e){}
  if(!j||typeof j!=='object'||!j.attr){$('#slMsg').textContent='Não consegui ler esta ficha.';return}
  if(!slPush())return;
  try{localStorage.setItem(KEY,raw)}catch(e){
    if(slLast){const ix=slIdx();ix.list=ix.list.filter(x=>x.id!==slLast);slSave(ix);try{localStorage.removeItem(SLK+slLast)}catch(x){}}
    $('#slMsg').textContent='Sem espaço para trocar de ficha. Exporte um backup e libere espaço.';return}
  const ix=slIdx();ix.list=ix.list.filter(x=>x.id!==id);slSave(ix);try{localStorage.removeItem(SLK+id)}catch(e){}
  clearTimeout(saveT);saveT=null;clearTimeout(cloudSaveT);activeCloudId=null;cloudConflict=false;
  const cfg=D.cfg;D=normalize(j);D.cfg=cfg;D.created=true;
  renderAll();cloudSaveLabel();writeNow();closeM('mSl');go('char',1);toast('Agente aberto',slInfo(D).n)}
$('#slList').addEventListener('click',e=>{const b=e.target.closest('[data-sl]');if(!b)return;const id=b.dataset.id;
  if(b.dataset.sl==='cur'){closeM('mSl');return}
  if(b.dataset.sl==='new'){$('#slNew').click();return}
  if(b.dataset.sl==='open'){slOpen(id);return}
  if(b.dataset.sl==='coc'){closeM('mSl');openCoc(id);return}
  if(b.dataset.sl==='cocdel'){if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Toque de novo para excluir';setTimeout(()=>{if(b.isConnected){b.classList.remove('arm');b.textContent='Excluir'}},4000);return}
    cocDelete(id,()=>{slRender();$('#slMsg').textContent='Investigador excluído deste aparelho.'});return}
  if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Toque de novo para excluir';setTimeout(()=>{if(b.isConnected){b.classList.remove('arm');b.textContent='Excluir'}},4000);return}
  const ix=slIdx();ix.list=ix.list.filter(x=>x.id!==id);slSave(ix);try{localStorage.removeItem(SLK+id)}catch(err){}
  slRender();$('#slMsg').textContent='Ficha excluída deste aparelho.'});
$('#slNew').onclick=()=>{closeM('mSl');newFlow(null)};
$('#mSl .k-rail').addEventListener('click',e=>{const b=e.target.closest('[data-rail]');if(!b)return;const a=b.dataset.rail;
  if(a==='acct'){if(scrMode!=='cfg')setScreen('cfg',true);const t=$('#cft-conta');if(t)t.click();return}
  if(a==='sl'||a==='sys'||a==='help'||a==='cfg'){if(a!==scrMode)setScreen(a,true);return}
  if(a==='new'){closeM('mSl');newFlow(null);return}
  closeM('mSl');
  openHome()});
$('#mSl').addEventListener('click',e=>{const b=e.target.closest('[data-sc]');if(!b)return;const a=b.dataset.sc;
  closeM('mSl');
  if(a==='new')newFlow(b.dataset.sys||null);
  else{fromMenu=true;if(a==='edit')sysOpen();else if(a==='lib')sysOpen('geral')}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||$('#mSl').hidden||!$('#rov').hidden||document.querySelector('.modal:not([hidden])')||!$('#sysEd').hidden||!$('#cw').hidden)return;e.preventDefault();e.stopImmediatePropagation();closeM('mSl');if(!$('#mSl').classList.contains('solo'))openHome()});
/* ===== PATCH NOTES =====
   Para registrar uma novidade, acrescente um item no começo da lista abaixo, assim:
   {v:'1.1', d:'17/10/2026', t:['O que mudou', 'Outra coisa que mudou']}  */
const PATCH_NOTES=[];
function pnRender(){const el=$('#pnList');el.innerHTML=PATCH_NOTES.length?PATCH_NOTES.map((n,i)=>`<details${i?'':' open'}><summary><b>${esc(n.v||'')}</b>${n.d?` <small>${esc(n.d)}</small>`:''}</summary><ul>${(n.t||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`).join(''):'<p class="hm-note">Nenhuma novidade registrada ainda.</p>'}
const SCR={sl:['ARQUIVO','Meus Personagens','Fichas guardadas neste aparelho. A aberta salva sozinha; ao abrir outra, a atual fica guardada aqui.'],
  sys:['REGRAS','Sistemas','Os sistemas que você tem. Toque em um para ver como ele funciona e criar uma ficha com ele.'],
  help:['GUIA RÁPIDO','Ajuda','Como a ficha funciona, em poucas linhas.'],
  cfg:['AJUSTES','Configurações','Conta, aparência, backup e novidades desta versão.']};
let scrMode='sl';
function scSysFill(){syGrid();syDet(false);syCur()}
/* ===== catálogo de sistemas ===== */
let syOpen=null,syDel=null;
function syList(){const l=libRead();return[{id:'op',n:'Ordem Paranormal',tag:'Sistema base',d:CAMPS[0].d,m:OP,img:'op'},{id:'coc',n:'Call of Cthulhu',tag:'Sistema base',d:'Horror cósmico e investigação. Tem uma ficha própria e completa, em tela cheia, com criação guiada do investigador.',res:'d100 · 8 características · 55 perícias · ficha própria',m:SYSTEMS.coc,img:'coc'}]
  .concat(l.map(en=>({id:en.id,n:en.nome,tag:'Meu sistema',d:`Sistema próprio, versão ${en.v}, salvo em ${new Date(en.t).toLocaleDateString('pt-BR')}.`,m:cleanMold(en.mold),img:'for',en})))}
const syHue=id=>[...id].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360;
function syResumo(m){if(!m)return'Não foi possível ler';const t=m.teste||{};return(t.tipo==='d100'?'d100':t.tipo==='soma'?(t.dados||'soma'):'d'+(t.faces||20))+' · '+(m.atributos||[]).length+' atributos · '+(m.pericias||[]).length+' perícias'}
function syGrid(){const L=syList();
  $('#syGrid').innerHTML=L.map(x=>{const logo=x.id==='op'?`<span class="sy-logo"><img src="${GH}Logoordemparanormal_HIGH.webp" alt="${esc(x.n)}"></span>`:x.id==='coc'?`<span class="sy-logo"><img src="${COCLOGO}" alt="${esc(x.n)}"></span>`:`<b class="sy-name">${esc(x.n)}</b>`;
    const bg=x.img==='op'?heroBg('op'):`url(${IMGS[x.img]})`;
    return`<li><button class="sy-c" type="button" data-sy="${esc(x.id)}" aria-pressed="${syOpen===x.id}" aria-controls="syDet"><span class="sy-art" style="background-image:${bg};--hue:${x.en?syHue(x.id):0}deg"></span><span class="sy-in">${logo}<small>${esc(x.tag)} · ${esc(x.res||syResumo(x.m))}</small></span></button></li>`}).join('')
  +`<li><button class="sy-c" type="button" data-sy="__new" aria-pressed="${syOpen==='__new'}" aria-controls="syDet"><span class="sy-art" style="background-image:url(${IMGS.for});--hue:200deg"></span><span class="sy-in"><b class="sy-name">+ Novo sistema</b><small>Parta do OP, do CoC ou do zero</small></span></button></li>`}
function syCount(id){let n=0;const hit=j=>{if(!j)return;if(id==='op')n+=j.sys==='op'?1:0;else n+=j.sid===id?1:0};
  if(D.created)hit(D);slIdx().list.forEach(x=>{try{hit(JSON.parse(localStorage.getItem(SLK+x.id)))}catch(e){}});return n}
const COC_FACTS=[['Teste','Percentil (d100): rola e tenta ficar abaixo do valor, com resultado Regular, Difícil ou Extremo'],['Características','Força, Constituição, Tamanho, Destreza, Aparência, Educação, Inteligência e Poder'],['Perícias','55, com especializações e perícias novas'],['Barras','Pontos de Vida, Sanidade, Pontos de Magia e Sorte'],['Abas da ficha','Perícias, Combate, Antecedentes, Magias e Posses'],['Passo a passo de criação','Investigador → Atributos → Ocupação → Perícias da ocupação → Interesses pessoais → Antecedentes → Finanças e equipamento → Revisão'],['Extras','Teste de Sanidade, fase de desenvolvimento, dados com histórico, época 1920 ou moderna e biblioteca de itens'],['Onde fica','Dentro deste mesmo arquivo, em tela cheia. Cada investigador é guardado separado e aparece em Meus agentes']];
function syFacts(x){if(x.id==='coc')return COC_FACTS.concat([['Fichas neste aparelho',String(cocIdx().list.length)]]);const m=x.m,t=m.teste||{},at=(m.atributos||[]).map(a=>a.n),bars=(m.barras||[]).map(b=>b.n).concat((m.recursos||[]).map(r=>r.n));
  const rot=Object.values(m.rotulos||{}).filter(Boolean),fm=Object.entries(m.formulas||{}).map(([k,v])=>`${k==='dt'?'Dificuldade':k==='carga'?'Carga':k}: ${v}`);
  let it=0;try{it=x.id==='op'?opItems().length:(m.itens||[]).length}catch(e){}
  const r=[['Teste',t.tipo==='d100'?'Percentil (d100): rola e tenta ficar abaixo do valor':t.tipo==='soma'?`Soma de dados (${t.dados||'1d'+(t.faces||20)}) mais o modificador`:`Reserva de d${t.faces||20}, um dado por ponto do atributo`],
    ['Atributos',at.join(', ')+` (${at.length})`],['Perícias',String((m.pericias||[]).length)],['Barras e recursos',bars.join(', ')||'Nenhuma'],['Campos da ficha',rot.join(', ')||'Só o básico'],
    ['Contas',fm.join(' · ')||'Nenhuma'],['Passo a passo de criação',(m.criacao||[]).length?m.criacao.map(c=>c.t).join(' → '):'Sem passo a passo, a ficha abre em branco']];
  if(it)r.push(['Itens de exemplo',String(it)]);if(m.usa&&m.usa.rit)r.push(['Rituais','Sim']);
  if(x.id!=='coc')r.push(['Fichas neste aparelho',String(syCount(x.id))]);return r}
function syDet(anim){const el=$('#syDet'),hint=$('#syHint'),x=syOpen&&syList().find(y=>y.id===syOpen);
  $$('[data-sy]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sy===syOpen)));
  if(syOpen==='__new'){hint.hidden=true;el.innerHTML='<small class="sc-lb">NOVO SISTEMA</small><h3 id="syDT">Por onde começar?</h3><p class="hm-note">O sistema vai para a sua biblioteca, sem criar ficha. Depois você cria quantas fichas quiser com ele.</p><div class="rowb"><button class="btn pri" type="button" data-sya="base" data-id="op">Partir do Ordem Paranormal</button><button class="btn pri" type="button" data-sya="base" data-id="coc">Partir do Call of Cthulhu</button><button class="btn" type="button" data-sya="base" data-id="zero">Começar do zero</button></div>';
    const was=el.hidden;el.hidden=false;if(anim&&was&&!rm())el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});return}
  if(!x||!x.m){el.hidden=true;hint.hidden=false;return}
  hint.hidden=true;const id=esc(x.id),own=!!x.en;
  const act=own?(syDel===x.id?`<p class="smu">Excluir da biblioteca? As fichas já criadas continuam com a cópia delas.</p><button class="btn dng" type="button" data-sya="delok" data-id="${id}">Confirmar exclusão</button><button class="btn" type="button" data-sya="delno">Cancelar</button>`
      :`<button class="btn pri" type="button" data-sya="new" data-id="${id}">Criar ficha</button><button class="btn" type="button" data-sya="edit" data-id="${id}">Editar</button><button class="btn" type="button" data-sya="exp" data-id="${id}">Exportar</button><button class="btn" type="button" data-sya="del" data-id="${id}">Excluir</button>`)
    :`<button class="btn pri" type="button" data-sc="new" data-sys="${id}">Criar ficha</button><button class="btn" type="button" data-sya="base" data-id="${id}">${x.id==='coc'?'Criar sistema próprio (parte de uma versão simplificada)':'Criar sistema próprio a partir deste'}</button>`;
  el.innerHTML=`<small class="sc-lb">${esc(x.tag.toUpperCase())}</small><h3 id="syDT">${esc(x.n)}</h3><p class="hm-note">${esc(x.d)}</p><dl class="sy-dl">${syFacts(x).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><div class="rowb">${act}</div>`;
  const was=el.hidden;el.hidden=false;if(anim&&was&&!rm())el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'})}
function syCur(){const box=$('#syCur');box.hidden=!D.created;if(D.created)$('#syCurT').textContent=`${slInfo(D).n} usa o sistema ${SYS.nome||'Ordem Paranormal'}.`}
$('#sc-sys').addEventListener('click',e=>{
  const c=e.target.closest('[data-sy]');if(c){syOpen=syOpen===c.dataset.sy?null:c.dataset.sy;syDel=null;syDet(true);return}
  const b=e.target.closest('[data-sya]');if(!b)return;const a=b.dataset.sya,id=b.dataset.id,en=libRead().find(x=>x.id===id);
  if(a==='new'){if(en){closeM('mSl');startFromLib(en)}}
  else if(a==='base')sysOpenLib(null,id);else if(a==='edit')sysOpenLib(id);
  else if(a==='exp'){if(en){libDownload(en.nome,JSON.stringify({rpgSistema:1,nome:en.nome,mold:en.mold}));toast('Sistema exportado',en.nome)}}
  else if(a==='del'){syDel=id;syDet(false)}else if(a==='delno'){syDel=null;syDet(false)}
  else if(a==='delok'){libWrite(libRead().filter(x=>x.id!==id));syOpen=null;syDel=null;syGrid();syDet(false);toast('Sistema excluído','Saiu da biblioteca deste aparelho.')}});
/* ===== ficha de Call of Cthulhu, dentro deste arquivo (tela cheia isolada) ===== */
function cocSync(){const f=$('#cocFrame'),d=f.contentDocument&&f.contentDocument.documentElement;if(!d)return;const t=document.documentElement.dataset.theme;if(t)d.dataset.theme=t;else delete d.dataset.theme;
  const u=uiLoad();[['--teal',u.acc],['--brass',u.gold]].forEach(([v,c])=>{if(/^#[0-9a-f]{6}$/i.test(c))d.style.setProperty(v,c);else d.style.removeProperty(v)})}
function cocIdx(){try{const x=JSON.parse(localStorage.getItem('coc-idx-v1'));if(x&&Array.isArray(x.list))return x}catch(e){}
  /* investigador salvo antes da lista existir: vira o primeiro item */
  try{const raw=localStorage.getItem('coc-ficha-v1'),j=raw&&JSON.parse(raw);if(j&&typeof j==='object'&&(j.made||(j.who&&j.who.nome))){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6),x={v:1,cur:id,list:[{id,nome:(j.who&&j.who.nome)||'Investigador sem nome',ocup:(j.who&&j.who.ocup)||'',t:Date.now()}]};
    localStorage.setItem('coc-slot-v1:'+id,raw);localStorage.setItem('coc-idx-v1',JSON.stringify(x));return x}}catch(e){}
  return{v:1,list:[],cur:null}}
function cocFlush(){try{const w=$('#cocFrame').contentWindow;if(w&&typeof w.cocFlush==='function')w.cocFlush()}catch(e){}}
/* descarrega a ficha de CoC antes de mexer no armazenamento: o salvamento de saída dela roda ainda com os dados antigos */
function cocUnload(cb){const f=$('#cocFrame');if(!f.getAttribute('src')||f.getAttribute('src')==='about:blank'){cb();return}cocFlush();f.onload=()=>{f.onload=null;cb()};f.src='about:blank'}
function cocSwitch(id){try{const x=cocIdx();
    if(id==='new'){x.cur=Date.now().toString(36)+Math.random().toString(36).slice(2,6);localStorage.removeItem('coc-ficha-v1')}
    else{const raw=localStorage.getItem('coc-slot-v1:'+id);if(!raw)return false;localStorage.setItem('coc-ficha-v1',raw);x.cur=id}
    localStorage.removeItem('coc-wiz-v1');localStorage.setItem('coc-idx-v1',JSON.stringify(x));return true}catch(e){return false}}
function cocDelete(id,done){cocUnload(()=>{try{const x=cocIdx();x.list=x.list.filter(e=>e.id!==id);
    if(x.cur===id){x.cur=null;localStorage.removeItem('coc-ficha-v1');localStorage.removeItem('coc-wiz-v1')}
    localStorage.removeItem('coc-slot-v1:'+id);localStorage.setItem('coc-idx-v1',JSON.stringify(x))}catch(e){}
  if(done)done()})}
function openCoc(id){cocUnload(()=>{const v=$('#cocView'),f=$('#cocFrame');
  if(id!=null&&!cocSwitch(id)){toast('Call of Cthulhu','Não consegui abrir esse investigador.');return}
  f.src='coc.html';v.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>{try{f.contentWindow.focus()}catch(e){}},80)})}
function closeCoc(){const v=$('#cocView');if(v.hidden)return;cocFlush();v.hidden=true;document.body.style.overflow='';openHome()}
window.addEventListener('message',e=>{if(e.source===$('#cocFrame').contentWindow&&e.data&&e.data.coc==='back')closeCoc()});
function setScreen(m,anim){if(!SCR[m])m='sl';scrMode=m;const c=SCR[m];
  $('#scK').textContent=c[0];$('#slT').textContent=c[1];$('#scSub').textContent=c[2];
  ['sl','sys','help','cfg'].forEach(k=>{$('#sc-'+k).hidden=k!==m});$('#slNew').hidden=m!=='sl';
  $$('#mSl .k-ri').forEach(b=>{const on=b.dataset.rail===m;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  $('#slMsg').textContent='';
  if(m==='sl')slRender();else if(m==='sys')scSysFill();else if(m==='cfg')cfgOpen();
  $('#mSl').scrollTop=0;
  if(anim&&!rm())$('#sc-'+m).animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'})}
var soloCfg=false;
function openSl(m){$('#mSl').classList.toggle('solo',soloCfg&&m==='cfg');soloCfg=false;setScreen(m||'sl');const el=$('#mSl');el.scrollTop=0;document.body.style.overflow='hidden';openM('mSl');kIn(el)}
const uid=()=>D.nid++;
const sysRM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const rm=()=>sysRM||D.cfg.rm;
const rmApply=()=>document.documentElement.classList.toggle('rm',!!rm());try{rmApply()}catch(e){}

/* ---------- efeitos ---------- */
function shake(el){if(rm()||!el)return;el.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:300})}
function edge(color){if(rm())return;const h=$('#hit');h.style.setProperty('--hc',color);h.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:520})}
let tq=Promise.resolve();
function toast(t,m){tq=tq.then(async()=>{const el=$('#toast');$('#tt').textContent=t;$('#tm').textContent=m||'';
  if(rm()){el.style.transform='translate(-50%,0)';await wait(2200);el.style.transform='';return}
  await el.animate([{transform:'translate(-50%,-170%)'},{transform:'translate(-50%,6px)',offset:.7},{transform:'translate(-50%,0)'}],{duration:380,easing:'ease-out',fill:'forwards'}).finished;
  await wait(2200);await el.animate([{transform:'translate(-50%,0)'},{transform:'translate(-50%,-170%)'}],{duration:260,easing:'ease-in',fill:'forwards'}).finished})}
function embers(r){const cols=['#ee8f22','#c1343a','#e0b04a','#ffd28a'];
  for(let i=0;i<10;i++){const p=document.createElement('i');p.className='xe';
    p.style.cssText='left:'+(r.left+Math.random()*r.width)+'px;top:'+(r.bottom-8)+'px;background:'+cols[rnd(0,3)];document.body.appendChild(p);
    p.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate('+rnd(-22,22)+'px,'+(-rnd(30,100))+'px) scale(0)',opacity:0}],{duration:550+Math.random()*450,delay:Math.random()*200,fill:'backwards',easing:'ease-out'}).finished.then(()=>p.remove())}}
function burn(el,cb){if(rm()||!el.animate){cb();return}embers(el.getBoundingClientRect());
  el.animate([{filter:'none',clipPath:'inset(0 0 0 0)',opacity:1},{filter:'sepia(1) saturate(4) brightness(1.3)',clipPath:'inset(0 0 40% 0)',opacity:1,offset:.5},{filter:'brightness(.25) blur(1.5px)',clipPath:'inset(0 0 100% 0)',opacity:0}],{duration:680,easing:'ease-in',fill:'forwards'}).finished.then(cb)}

/* ---------- barras ---------- */
function buildBars(){
  $('#vits').innerHTML=BARS.map(([k,n,ic,id])=>`<div class="vit" id="${id}" data-k="${k}"><div class="plate"><svg viewBox="0 0 62 58" aria-hidden="true"><use href="#${ic}"/></svg></div><div class="vbar"><div class="vin"><u class="trail"></u><i class="fill"></i><button class="chev x5" type="button" data-d="-5" aria-label="Diminuir ${n} em 5">«</button><button class="chev" type="button" data-d="-1" aria-label="Diminuir ${n}">‹</button><div class="vc"><span class="vl">${n}</span><span class="vv"><input class="cur" inputmode="numeric" aria-label="${n} atual"><em>/</em><input class="max" inputmode="numeric" aria-label="${n} máximo"></span></div><button class="chev" type="button" data-d="1" aria-label="Aumentar ${n}">›</button><button class="chev x5" type="button" data-d="5" aria-label="Aumentar ${n} em 5">»</button></div></div></div>`).join('')}
function paintBar(k,old){
  const el=$('.vit[data-k='+k+']'),b=D.bars[k],p=b[1]?b[0]/b[1]*100:0,f=$('.fill',el),u=$('.trail',el),bar=$('.vbar',el);
  f.style.width=p+'%';
  const cur=$('.cur',el),mx=$('.max',el);if(document.activeElement!==cur)cur.value=b[0];if(document.activeElement!==mx)mx.value=b[1];
  el.classList.toggle('low',k==='vida'&&p<=25&&b[1]>0);
  if(old!=null&&b[0]<old&&!rm()){
    const W=bar.clientWidth,cw=W?Math.min(100,parseFloat(getComputedStyle(u).width)/W*100)||0:0,st=Math.max(old/(b[1]||1)*100,cw);
    if(u._a)u._a.cancel();u.style.width=st+'%';
    const a=u.animate([{width:st+'%'},{width:st+'%',offset:.35},{width:p+'%'}],{duration:850,easing:'ease-out'});u._a=a;
    a.onfinish=()=>{u.style.width=p+'%';if(u._a===a)u._a=null};
    shake(bar);if(k==='vida')edge('rgba(193,52,58,.45)');else if(k==='san')edge('rgba(148,64,207,.4)');
  }else{if(u._a){u._a.cancel();u._a=null}u.style.width=p+'%'}
}
function setBar(k,v){const b=D.bars[k],old=b[0];b[0]=clamp(Math.round(+v)||0,0,b[1]);paintBar(k,old);save()}
function spend(n,label){n=+n||0;if(!n){toast(label,'Sem custo de PE.');return true}
  const b=D.bars.esf;if(b[0]<n){toast('PE insuficiente',label+' custa '+n+' PE e você tem '+b[0]+'.');shake($('#vitE'));return false}
  setBar('esf',b[0]-n);toast(label,'−'+n+' PE (restam '+D.bars.esf[0]+').');return true}
let hold=null,held=false;
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.chev');if(!b)return;held=false;const k=b.closest('.vit').dataset.k,d=+b.dataset.d;
  hold=setTimeout(function rep(){held=true;setBar(k,D.bars[k][0]+d);hold=setTimeout(rep,90)},420)});
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>{clearTimeout(hold)}));
$('#vits').addEventListener('click',e=>{const b=e.target.closest('.chev');if(!b)return;if(held){held=false;return}const k=b.closest('.vit').dataset.k;setBar(k,D.bars[k][0]+ +b.dataset.d)});
$('#vits').addEventListener('change',e=>{const el=e.target.closest('.vit');if(!el)return;const k=el.dataset.k,b=D.bars[k];
  if(e.target.classList.contains('cur'))setBar(k,e.target.value);
  else if(e.target.classList.contains('max')){const old=b[0];b[1]=Math.max(0,Math.round(+e.target.value)||0);b[0]=Math.min(b[0],b[1]);paintBar(k,old);save()}});

/* ---------- rolagem ---------- */
const rov=$('#rov');let busy=false,okRes=null,okReady=false,lastFn=null;const hist=[];
function closeRoll(v){if(okReady){okReady=false;if(okRes)okRes(v)}}
$('#rOk').onclick=()=>closeRoll();$('#rAgain').onclick=()=>closeRoll('again');
rov.addEventListener('click',e=>{if(e.target===rov)closeRoll()});
let curFx=null;
function killFx(){if(curFx){try{curFx.destroy()}catch(e){}curFx=null}}
const nextFrame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
$('#rd').addEventListener('click',()=>{if(curFx&&curFx.rolling)curFx.skip();else if(okReady&&rov.classList.contains('r3d'))closeRoll()});
function poolRoll(title,av,bonus,parts,threat){
  const worst=av<=0,n=worst?2:av,dice=Array.from({length:n},()=>rnd(1,FACES));let pick=0;
  dice.forEach((v,i)=>{if(worst?v<dice[pick]:v>dice[pick])pick=i});
  const ch=dice[pick],total=ch+bonus,crit=!!threat&&ch>=threat,flag=ch===FACES?'c':ch===1?'f':'';
  const info=[`<b>${n}d${FACES}</b> (${worst?'pior':'melhor'} resultado): ${dice.join(', ')} → <b>${ch}</b>`];
  if(bonus||parts.length)info.push(`Bônus <b>${fmt(bonus)}</b>${parts.length?' ('+parts.join(', ')+')':''}`);
  const badge=crit?'CRÍTICO (ameaça '+threat+'+)':flag==='c'?'20 NATURAL':flag==='f'?'1 NATURAL':'';
  return{kind:'pool',title,dice,pick,total,cls:(crit||flag==='c')?'c':flag==='f'?'f':'',badge,badgeF:flag==='f'&&!crit,info,sum:n+'d'+FACES+' '+ch+' '+fmt(bonus)}}
function parseF(str){const s=String(str||'').replace(/\s+/g,'').replace(/[−–]/g,'-');
  if(!/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/i.test(s))return null;
  const re=/([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/gi,t=[];let m;
  while((m=re.exec(s))){if(m[3]){t.push({sg:m[1]==='-'?-1:1,n:Math.min(+m[2]||1,200),s:Math.max(1,+m[3])})}else t.push({sg:m[4]==='-'?-1:1,k:+m[5]})}
  return t.length?t:null}
function sumRoll(title,f){const t=parseF(f);if(!t){toast('Fórmula inválida','Use algo como 3d8+3.');return null}
  let total=0;const flat=[],parts=[];
  t.forEach(x=>{if(x.s){const res=Array.from({length:x.n},()=>rnd(1,x.s)),sm=res.reduce((a,b)=>a+b,0);total+=x.sg*sm;res.forEach(v=>flat.push({v,s:x.s}));parts.push((x.sg<0?'− ':'')+x.n+'d'+x.s+' ['+res.join(', ')+']')}else{total+=x.sg*x.k;parts.push((x.sg<0?'−':'+')+x.k)}});
  const shown=flat.slice(0,24);
  return{kind:'sum',title,flat:shown,more:flat.length-shown.length,total,cls:'',info:[parts.join(' ')],sum:String(f).toUpperCase()+' = '+total}}
function setV(e,v){if(e.tagName==='svg'||e.namespaceURI.indexOf('svg')>-1){const t=$('text',e);t.textContent=v;t.setAttribute('font-size',String(v).length>=3?15:22)}else e.textContent=v}
async function present(r){
  const d=$('#rd'),s=$('#rs'),i=$('#ri');
  [rov,s].forEach(e=>e.getAnimations().forEach(a=>a.cancel()));
  killFx();
  $('#rt').textContent=r.title;s.className='rs';s.textContent='';s.style.opacity=0;i.innerHTML='';i.style.visibility='';$('#rOk').hidden=true;$('#rAgain').hidden=true;
  const fast=rm(),pool=r.kind==='pool',vals=pool?r.dice:r.flat.map(x=>x.v),sides=pool?r.dice.map(()=>20):r.flat.map(x=>x.s);
  const items3=r.d3||vals.map((v,k)=>({s:pool?FACES:sides[k],v}));
  let use3=!fast&&dice3dOn()&&!!window.DiceFx&&DiceFx.can(items3)&&(pool||!r.more||!!r.d3);
  const info=(r.badge?`<div class="bd${r.badgeF?' f':''}">${r.badge}</div>`:'')+r.info.map(x=>'<div>'+x+'</div>').join('');
  d.innerHTML='';rov.classList.toggle('r3d',use3);
  /* no modo 3D o texto do resultado já ocupa seu lugar (escondido): a mesa é medida com ele e os dados nunca passam por baixo */
  if(use3){s.textContent=r.total;i.innerHTML=info;i.style.visibility='hidden'}
  rov.hidden=false;if(!fast)rov.animate([{opacity:0},{opacity:1}],{duration:140});
  let fx=null;
  if(use3){
    await nextFrame();
    try{fx=DiceFx.mount(d,items3);curFx=fx;await fx.roll()}
    catch(e){console.warn('Dados 3D indisponíveis, usando os simples:',e);killFx();fx=null;use3=false;rov.classList.remove('r3d');d.innerHTML='';s.textContent='';i.innerHTML='';i.style.visibility=''}
  }
  let els=[];
  if(!use3){
    if(pool)d.innerHTML=r.dice.map(()=>`<svg class="pd d20${r.dice.length>3?' sm':''}" viewBox="0 0 100 100"><use href="#d20"/><text x="50" y="44" text-anchor="middle" dominant-baseline="central" font-size="22">20</text></svg>`).join('');
    else d.innerHTML=r.flat.map(()=>'<span class="chip">0</span>').join('')+(r.more?'<span class="more">+'+r.more+'</span>':'');
    els=$$('.pd,.chip',d);
    if(!fast){const iv=setInterval(()=>els.forEach((e,k)=>setV(e,rnd(1,sides[k]))),90);
      await Promise.all(els.map((e,k)=>e.animate([{transform:'translateY(0) rotate(0) scale(.8)'},{transform:'translateY(-24px) rotate(300deg) scale(1.08)',offset:.45},{transform:'translateY(0) rotate(720deg) scale(1)'}],{duration:800+k*50,easing:'cubic-bezier(.25,.7,.3,1)'}).finished));clearInterval(iv)}
    els.forEach((e,k)=>setV(e,vals[k]));
    if(pool)els.forEach((e,k)=>e.classList.add(k===r.pick?'pick':'dim'));
  }else{const keep=pool?[r.pick]:r.pick3;if(keep)fx.pick(keep)}
  s.textContent=r.total;if(r.cls)s.classList.add(r.cls);s.style.opacity=1;
  if(use3)i.style.visibility='';else i.innerHTML=info;
  if(!fast)s.animate([{opacity:0,transform:'rotate(-3deg) scale(1.9)'},{opacity:1,transform:'rotate(-3deg) scale(1)'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
  if(r.badgeF){shake($('.rbox',rov));edge('rgba(193,52,58,.45)')}
  hist.unshift({t:r.title,s:r.sum,v:r.total});hist.length=Math.min(hist.length,15);
  await wait(fast?0:240);
  return new Promise(res=>{okRes=res;okReady=true;$('#rOk').hidden=false;$('#rAgain').hidden=false;try{$('#rOk').focus({preventScroll:true})}catch(x){}})}
async function show(fn){if(busy)return;let r=fn();if(!r)return;busy=true;lastFn=fn;
  while(r){const a=await present(r);if(a==='again'){r=lastFn();if(!r)break}else break}
  if(!rm())await rov.animate([{opacity:1},{opacity:0}],{duration:150}).finished;rov.hidden=true;killFx();rov.classList.remove('r3d');busy=false}

/* testes */
const skBonus=s=>TR[s.tr].b+(+s.ex||0);

/* ---------- teste d100 (sistemas percentuais) ---------- */
const DIFF={reg:['Regular',1],hard:['Difícil',2],ext:['Extremo',5]};
const skLabel=s=>s.n+(s.sp?' ('+s.sp+')':'');
const skBase=s=>Math.max(0,Math.floor(calc(SKB[s.n]==null?'0':SKB[s.n])));
const skVal=s=>s.v==null?skBase(s):s.v;
const pad2=n=>String(n).padStart(2,'0');
function pctRoll(title,value){
  value=Math.max(0,Math.round(+value||0));
  const dd=D.opt.dice,units=rnd(0,9),tens=Array.from({length:Math.abs(dd)+1},()=>rnd(0,9)*10);
  const cand=tens.map(t=>{const x=t+units;return x===0?100:x});let pick=0;
  cand.forEach((x,i)=>{if(dd>0?x<cand[pick]:dd<0?x>cand[pick]:false)pick=i});
  const total=cand[pick],half=Math.floor(value/2),fifth=Math.floor(value/5);
  const fumble=value<50?total>=96:total===100;
  let lv='fail';
  if(fumble)lv='fumble';else if(total===1)lv='crit';else if(total<=fifth)lv='ext';else if(total<=half)lv='hard';else if(total<=value)lv='ok';
  const nm={crit:'SUCESSO CRÍTICO',ext:'SUCESSO EXTREMO',hard:'SUCESSO DIFÍCIL',ok:'SUCESSO',fail:'FALHA',fumble:'FALHA CRÍTICA'}[lv];
  const df=DIFF[D.opt.diff],need=Math.floor(value/df[1]),passed=!fumble&&(total===1||total<=need);
  const info=['<b>d100</b>: dezenas '+tens.map(pad2).join(', ')+' · unidade '+units+' → <b>'+total+'</b>'+(dd>0?' (dado de bônus: fica a menor dezena)':dd<0?' (dado de penalidade: fica a maior dezena)':''),
    'Valor <b>'+value+'</b> · difícil até <b>'+half+'</b> · extremo até <b>'+fifth+'</b>',
    'Dificuldade '+df[0]+': <b>'+(passed?'passou':'não passou')+'</b> (precisa de '+need+' ou menos)'];
  return{kind:'sum',title,flat:tens.map(t=>({v:pad2(t),s:10})).concat([{v:units,s:10}]),d3:tens.map(t=>({t:'d100',v:t})).concat([{t:'d9',v:units}]),pick3:[pick,tens.length],more:0,total,cls:lv==='crit'||lv==='ext'?'c':lv==='fumble'?'f':'',badge:nm,badgeF:lv==='fumble',info,sum:'d100 '+total+' / '+value}}
/* ---------- soma de dados (d20 + modificador, 2d6 + atributo, 3d6 abaixo...) ---------- */
const fmtS=n=>(n>=0?'+':'')+n;
const modOf=v=>{const r=evalF(SYS.teste.modF,{V:+v||0});return Math.round(r==null?+v||0:r)};
const somaTotal=s=>modOf(D.attr[s.a])+(+s.bn||0);
function somaRoll(title,total){
  const T=SYS.teste,mm=/^(\d+)d(\d+)$/.exec(T.dados),n=+mm[1],sd=+mm[2],adv=T.regra==='mod'?D.opt.adv:0;
  const roll=()=>Array.from({length:n},()=>rnd(1,sd)),sum=a=>a.reduce((x,y)=>x+y,0);
  let a=roll();const all=[a];
  if(adv){const b=roll();all.push(b);if(adv>0?sum(b)>sum(a):sum(b)<sum(a))a=b}
  const sa=sum(a),info=[];
  info.push('<b>'+T.dados+'</b>: '+a.join(' + ')+(n>1?' = '+sa:'')+(adv?' <small>('+(adv>0?'vantagem':'desvantagem')+': rolou '+all.map(sum).join(' e ')+')</small>':''));
  let value,badge='',cls='';
  if(T.regra==='abaixo'){
    value=sa;const ok=sa<=total;badge=ok?'SUCESSO':'FALHA';
    info.push('Valor <b>'+total+'</b>: tirou <b>'+sa+'</b> → '+(ok?'sobrou <b>'+(total-sa)+'</b>':'passou <b>'+(sa-total)+'</b>'))}
  else{
    value=sa+total;info.push('Modificador <b>'+fmtS(total)+'</b> → <b>'+value+'</b>');
    const band=T.faixas.find(x=>value>=x.min);if(band)badge=band.t.toUpperCase();
    const cd=+D.opt.cd||0;
    if(cd>0){const ok=value>=cd;info.push('Dificuldade <b>'+cd+'</b>: <b>'+(ok?'passou':'não passou')+'</b> (margem '+fmtS(value-cd)+')');if(!band)badge=ok?'SUCESSO':'FALHA'}
    if(n===1){if(sa===sd){cls='c';info.push('Resultado natural máximo.')}else if(sa===1){cls='f';info.push('Resultado natural 1.')}}}
  return{kind:'sum',title,flat:a.map(v=>({v,s:sd})),more:0,total:value,cls,badge,badgeF:false,info,sum:T.dados+' '+value}}
function skRowS(s,i){const t=somaTotal(s),ab=SYS.teste.regra==='abaixo';
  return`<li class="sk som" data-i="${i}"><span class="skn2"><button class="skn" type="button" data-roll>${esc(s.n)}</button></span><select class="sas" data-a aria-label="Atributo de ${esc(s.n)}">${ATTRS.map(a=>`<option${a===s.a?' selected':''}>${esc(a)}</option>`).join('')}</select><input class="spv" type="number" inputmode="numeric" min="-99" max="99" data-bn value="${s.bn||0}" aria-label="Bônus de ${esc(s.n)}"><span class="sph">${ab?t:fmtS(t)}</span><button class="tot" type="button" data-roll aria-label="Rolar ${esc(s.n)}">${esc(SYS.teste.dados)}</button></li>`}
function updateRowS(li,s){const t=somaTotal(s);$('.sph',li).textContent=SYS.teste.regra==='abaixo'?t:fmtS(t)}
function somaChange(e,li,s){
  if(e.target.matches('[data-a]')){s.a=e.target.value;save();updateRowS(li,s)}
  else if(e.target.matches('[data-bn]')){s.bn=clamp(Math.round(+e.target.value)||0,-99,99);e.target.value=s.bn;save();updateRowS(li,s);if(skF==='t')renderSkills()}}
function skRowP(s,i){const base=skBase(s),val=skVal(s),slot=!!SKS[s.n];
  return`<li class="sk pct" data-i="${i}"><span class="skn2"><button class="skn" type="button" data-roll>${esc(s.n)}</button>${slot?`<input class="spe" data-sp value="${esc(s.sp||'')}" placeholder="especialidade" maxlength="30" aria-label="Especialidade de ${esc(s.n)}">`:''}</span><span class="spb">${base}%</span><input class="spv${s.v==null?' base':''}" type="number" inputmode="numeric" min="0" max="999" data-v value="${val}" aria-label="Valor de ${esc(skLabel(s))}"><span class="sph">${Math.floor(val/2)} · ${Math.floor(val/5)}</span><button class="tot" type="button" data-roll aria-label="Rolar ${esc(skLabel(s))}">d100</button></li>`}
function updateRowP(li,s){const v=skVal(s),inp=$('[data-v]',li);if(document.activeElement!==inp)inp.value=v;inp.classList.toggle('base',s.v==null);$('.spb',li).textContent=skBase(s)+'%';$('.sph',li).textContent=Math.floor(v/2)+' · '+Math.floor(v/5)}
function pctChange(e,li,s){
  if(e.target.matches('[data-v]')){const v=e.target.value.trim();s.v=v===''?null:clamp(Math.round(+v)||0,0,999);e.target.value=skVal(s);save();updateRowP(li,s);if(skF==='t')renderSkills()}
  else if(e.target.matches('[data-sp]')){s.sp=cleanTxt(e.target.value,30);e.target.value=s.sp;save()}}
function paintDock(){const dk=$('#skdock');if(!dk)return;
  $$('[data-df]',dk).forEach(b=>b.setAttribute('aria-pressed',b.dataset.df===D.opt.diff));$$('[data-dd]',dk).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.dd===D.opt.dice));
  $$('[data-ad]',dk).forEach(b=>b.setAttribute('aria-pressed',+b.dataset.ad===D.opt.adv));const cd=$('[data-cd]',dk);if(cd&&document.activeElement!==cd)cd.value=D.opt.cd||''}
/* barras que acompanham os atributos (ex.: Vida = (CON + TAM) / 10) */
function syncBars(){let ch=false;
  SYS.barras.forEach(b=>{if(!dependsOn(b.maxF,ATTRS.concat(['NIVEL','NEX','CLASSE'])))return;const mx=Math.max(0,Math.round(calc(b.maxF))),bar=D.bars[b.k];
    if(bar&&bar[1]!==mx){bar[1]=mx;if(bar[0]>mx)bar[0]=mx;ch=true}});
  if(ch){save();BARS.forEach(([k])=>paintBar(k,null))}}
/* aplica o que o molde muda na tela: nomes dos campos, abas, cabeçalho das perícias e o painel de dificuldade */
function applyMoldUI(){
  const R=SYS.rotulos;
  [['ori','f-ori'],['nivel','f-nivel'],['nex','f-nex'],['pe','f-pe'],['desl','f-desl']].forEach(([k,id])=>{
    const inp=$('#'+id),l=inp.closest('label'),sp=$('span',l),t=R[k]||'';l.hidden=!t;if(!t)return;
    if(sp.classList.contains('sr')){sp.textContent=t;inp.placeholder=t}
    else{sp.textContent=t.toUpperCase();inp.setAttribute('aria-label',(SYS===OP&&k==='pe')?'PE por turno':t)}});
  const sel=$('#f-cls'),ls=sel.closest('label');let ti=$('#f-cls-t');
  if(SYS===OP){ls.hidden=false;sel.hidden=false;if(ti)ti.hidden=true}
  else{const t=R.cls||'';ls.hidden=!t;sel.hidden=true;
    if(!ti){ti=document.createElement('input');ti.id='f-cls-t';ti.maxLength=40;ti.addEventListener('input',()=>{D.cls=ti.value;save();dtRefresh();syncBars()});ls.appendChild(ti)}
    ti.hidden=false;ti.placeholder=t;ti.value=D.cls||'';$('.sr',ls).textContent=t}
  const showRit=!!SYS.usa.rit;$$('[data-p=rit]').forEach(b=>b.hidden=!showRit);
  if(!showRit&&(curM==='rit'||curR==='rit')){if(curR==='rit')curR='combat';if(curM==='rit')curM='char';go(curM)}
  const th=$('.skth');
  th.innerHTML=PCT?'<span>Perícia</span><span>Base</span><span>Valor</span><span>½ · ⅕</span><span>Rolar</span>':SOMA?'<span>Perícia</span><span>Atr</span><span>Bônus</span><span>Total</span><span>Rolar</span>':'<span>Perícia</span><span>Treino</span><span>Dados</span><span>Extra</span><span>Total</span>';
  th.classList.toggle('pct',PCT);th.classList.toggle('som',SOMA);
  $('.skf button[data-f=t]').textContent=PCT?'Só alteradas':SOMA?'Só com bônus':'Apenas treinadas';
  const want=PCT?'pct':(SOMA&&SYS.teste.regra==='mod')?'som':'';let dk=$('#skdock');
  if(dk&&dk.dataset.k!==want){dk.remove();dk=null}
  if(want&&!dk){dk=document.createElement('div');dk.id='skdock';dk.className='skdock';dk.dataset.k=want;
    dk.innerHTML=want==='pct'?'<div class="skf" role="group" aria-label="Dificuldade"><button type="button" data-df="reg">Regular</button><button type="button" data-df="hard">Difícil</button><button type="button" data-df="ext">Extremo</button></div><div class="skf" role="group" aria-label="Dado extra"><button type="button" data-dd="-1">Penalidade</button><button type="button" data-dd="0">Normal</button><button type="button" data-dd="1">Bônus</button></div>'
      :'<label class="skcd"><span>CD</span><input type="number" inputmode="numeric" min="0" max="999" data-cd placeholder="0" aria-label="Dificuldade (CD). Deixe vazio para não comparar"></label><div class="skf" role="group" aria-label="Dados"><button type="button" data-ad="-1">Desvantagem</button><button type="button" data-ad="0">Normal</button><button type="button" data-ad="1">Vantagem</button></div>';
    dk.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.df)D.opt.diff=b.dataset.df;else if(b.dataset.dd!=null)D.opt.dice=+b.dataset.dd;else if(b.dataset.ad!=null)D.opt.adv=+b.dataset.ad;else return;save();paintDock()});
    dk.addEventListener('input',e=>{if(e.target.matches('[data-cd]')){D.opt.cd=clamp(Math.round(+e.target.value)||0,0,999);save()}});
    $('.skh2').after(dk)}
  if(dk)paintDock();
  renderRecs();
  $('#cfFlowRow').hidden=!(SYS!==OP&&SYS.criacao&&SYS.criacao.length)}

/* ---------- recursos personalizados (contadores, barras e caixas de marcar) ---------- */
const recVal=r=>{const v=D.rec&&D.rec[r.k];return v==null?r.ini:clamp(Math.round(+v)||0,0,r.max)};
function recHTML(r){
  const v=recVal(r),n=esc(r.n);
  if(r.tipo==='marca')return`<label class="rec rec-mk" data-k="${r.k}"><input type="checkbox" data-rec="tog"${v?' checked':''}><span class="rec-n">${n}</span></label>`;
  const bar=r.tipo==='barra'?`<span class="rec-track" aria-hidden="true"><i style="width:${Math.round(v/r.max*100)}%"></i></span>`:'';
  return`<div class="rec${r.tipo==='barra'?' rec-bar':''}" data-k="${r.k}"><span class="rec-n">${n}</span>${bar}<span class="rec-ct"><button class="rec-b" type="button" data-rec="dec" aria-label="Diminuir ${n}"${v<=0?' disabled':''}>−</button><input class="rec-in" type="number" inputmode="numeric" min="0" max="${r.max}" data-rec="set" value="${v}" aria-label="${n}"><span class="rec-m">/ ${r.max}</span><button class="rec-b" type="button" data-rec="inc" aria-label="Aumentar ${n}"${v>=r.max?' disabled':''}>+</button></span></div>`}
function renderRecs(){
  let box=$('#recs');const rs=SYS.recursos||[];
  if(!rs.length){if(box)box.remove();return}
  if(!box){box=document.createElement('section');box.id='recs';box.className='recs';box.setAttribute('aria-label','Recursos');
    box.addEventListener('click',e=>{const b=e.target.closest('[data-rec]'),it=b&&b.closest('[data-k]');if(!b||!it)return;
      const r=SYS.recursos.find(x=>x.k===it.dataset.k);if(!r)return;let v=recVal(r);const a=b.dataset.rec;
      if(a==='inc')v=Math.min(r.max,v+1);else if(a==='dec')v=Math.max(0,v-1);else if(a==='tog')v=b.checked?1:0;else return;
      (D.rec||(D.rec={}))[r.k]=v;save();renderRecs()});
    box.addEventListener('change',e=>{const b=e.target.closest('[data-rec=set]'),it=b&&b.closest('[data-k]');if(!b||!it)return;
      const r=SYS.recursos.find(x=>x.k===it.dataset.k);if(!r)return;(D.rec||(D.rec={}))[r.k]=clamp(Math.round(+b.value)||0,0,r.max);save();renderRecs()});
    $('#vits').after(box)}
  box.innerHTML=rs.map(recHTML).join('')}
function testAttr(a){const el=$('.hex[data-a='+a+']');if(el&&!rm())el.classList.add('pulse'),setTimeout(()=>el.classList.remove('pulse'),520);
  show(()=>PCT?pctRoll('Teste de '+ANAME[a],D.attr[a]):SOMA?somaRoll('Teste de '+ANAME[a],modOf(D.attr[a])):poolRoll('Teste de '+ANAME[a],D.attr[a],0,[]))}
function testSkill(i){const s=D.sk[i];if(PCT)return show(()=>pctRoll(skLabel(s),skVal(s)));if(SOMA)return show(()=>somaRoll(skLabel(s),somaTotal(s)));show(()=>{const p=[];if(s.tr)p.push(TR[s.tr].n+' '+fmt(TR[s.tr].b));if(+s.ex)p.push('Extra '+fmt(+s.ex));return poolRoll(s.n+' ('+s.a+')',D.attr[s.a],skBonus(s),p)})}

/* ---------- hexágonos ---------- */
function buildWheel(){
  const nA=ATTRS.length,chord=nA>1?2*31*Math.sin(Math.PI/nA):62,hw=Math.min(31,Math.round(chord*86)/100),wh=$('#wheel');wh.style.setProperty('--hw',hw);wh.style.setProperty('--k',(hw/31).toFixed(3));
  $$('.hex').forEach(h=>h.remove());
  $('#wheel').insertAdjacentHTML('beforeend',ATTRS.map(a=>{const g=wheelAng(a)*Math.PI/180,x=50+31*Math.cos(g),y=50+31*Math.sin(g);
    return`<div class="hex" role="button" tabindex="0" data-a="${a}" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)}" aria-label="Testar ${ANAME[a]}"><span class="hn">${D.attr[a]}</span><input class="hin" type="number" min="0" max="${SYS.atributo.maxFicha}" value="${D.attr[a]}" aria-label="Valor de ${ANAME[a]}"><span class="hk">${ANAME[a]}</span><span class="ha">${a}</span></div>`}).join(''))}
$('#wheel').addEventListener('click',e=>{if(document.body.classList.contains('edit'))return;const h=e.target.closest('.hex');if(h)testAttr(h.dataset.a)});
$('#wheel').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('hex')&&!document.body.classList.contains('edit')){e.preventDefault();testAttr(e.target.dataset.a)}});
$('#wheel').addEventListener('change',e=>{const h=e.target.closest('.hex');if(!h||!e.target.classList.contains('hin'))return;
  D.attr[h.dataset.a]=clamp(Math.round(+e.target.value)||0,0,SYS.atributo.maxFicha);$('.hn',h).textContent=D.attr[h.dataset.a];e.target.value=D.attr[h.dataset.a];save();syncBars();renderSkills();dtRefresh();cargaRefresh()});

/* ---------- perícias ---------- */
let skF='all';
const trIco=n=>n===0?'<svg class="t0" viewBox="0 0 24 24"><path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/></svg>':n===1?'<svg class="t1" viewBox="0 0 24 24"><path d="M12 2.5l9.5 7L18 21H6L2.5 9.5z"/></svg>':n===2?'<svg class="t2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" stroke-width="2" stroke-linecap="round"/></svg>':'<svg class="t3" viewBox="0 0 24 24"><path d="M12 2l9 6v8l-9 6-9-6V8z"/></svg>';
const dtxt=a=>D.attr[a]>0?D.attr[a]+'d'+FACES:'2d'+FACES+'↓';
function skRow(s,i){return`<li class="sk${s.tr?' tr'+s.tr:''}" data-i="${i}"><button class="skn" type="button" data-roll>${esc(s.n)}${s.t?'<b title="Só pode ser usada por quem é treinado">T</b>':''}</button><button class="trb" type="button" data-tr aria-label="Treino de ${esc(s.n)}: ${TR[s.tr].n}. Toque para mudar" title="${TR[s.tr].n}">${trIco(s.tr)}</button><label class="sa"><select data-a aria-label="Atributo de ${esc(s.n)}">${ATTRS.map(a=>`<option${a===s.a?' selected':''}>${a}</option>`).join('')}</select><small>${dtxt(s.a)}</small></label><input class="ex" type="number" inputmode="numeric" data-ex value="${+s.ex||0}" aria-label="Extra de ${esc(s.n)}"><button class="tot" type="button" data-roll aria-label="Rolar ${esc(s.n)}">${fmt(skBonus(s))}</button></li>`}
function renderSkills(){const q=$('#skq').value.trim().toLowerCase();
  $('#sklist').innerHTML=D.sk.map((s,i)=>({s,i})).filter(({s})=>(skF==='all'||(PCT?(s.v!=null&&s.v>skBase(s)):SOMA?(+s.bn||0)!==0:s.tr>0))&&skLabel(s).toLowerCase().includes(q)).map(({s,i})=>PCT?skRowP(s,i):SOMA?skRowS(s,i):skRow(s,i)).join('')||'<li class="empty">Nenhuma perícia encontrada.</li>'}
function rowUpdate(li){const s=D.sk[+li.dataset.i];li.className='sk'+(s.tr?' tr'+s.tr:'');$('.tot',li).textContent=fmt(skBonus(s));$('.sa small',li).textContent=dtxt(s.a);
  const b=$('.trb',li);b.innerHTML=trIco(s.tr);b.title=TR[s.tr].n}
$('#sklist').addEventListener('click',e=>{const li=e.target.closest('.sk');if(!li)return;const i=+li.dataset.i,s=D.sk[i];
  if(e.target.closest('[data-roll]'))testSkill(i);
  else if(e.target.closest('[data-tr]')){s.tr=(s.tr+1)%4;save();rowUpdate(li);if(skF==='t'&&!s.tr)renderSkills()}});
$('#sklist').addEventListener('change',e=>{const li=e.target.closest('.sk');if(!li)return;const s=D.sk[+li.dataset.i];
  if(PCT){pctChange(e,li,s);return}
  if(SOMA){somaChange(e,li,s);return}
  if(e.target.matches('[data-a]'))s.a=e.target.value;
  if(e.target.matches('[data-ex]'))s.ex=Math.round(+e.target.value)||0;
  save();rowUpdate(li)});
$('#skq').addEventListener('input',renderSkills);
$$('.skf button').forEach(b=>b.addEventListener('click',()=>{skF=b.dataset.f;$$('.skf button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderSkills()}));

/* ---------- listas genéricas ---------- */
function bindList(ul,key,onInput){
  ul.addEventListener('input',e=>{const li=e.target.closest('[data-id]'),f=e.target.dataset.f;if(!li||!f)return;const o=D[key].find(x=>x.id===+li.dataset.id);if(!o)return;
    o[f]=e.target.type==='number'?e.target.value:e.target.value;save();if(onInput)onInput(o,f,li)})}
function removeIn(key,li,render){const id=+li.dataset.id;burn(li,()=>{D[key]=D[key].filter(x=>x.id!==id);save();render()})}
const fld=(l,f,v,extra)=>`<label class="fl"><span>${l}</span><input data-f="${f}" value="${esc(v)}" ${extra||''}></label>`;

/* combate */
function atkHTML(k){return`<li class="cc" data-id="${k.id}"><div class="g2" style="grid-template-columns:1fr 1fr 70px">${fld('Arma / ataque','n',k.n)}<label class="fl"><span>Perícia</span><select data-f="sk">${D.sk.map(s=>`<option${s.n===k.sk?' selected':''}>${esc(s.n)}</option>`).join('')}</select></label>${fld('Bônus','b',k.b,'type="number" inputmode="numeric"')}</div>
<div class="g3">${fld('Dano','dano',k.dano,'placeholder="1d8+2"')}${fld('Crítico','crit',k.crit,'placeholder="19"')}${fld('Alcance','al',k.al)}</div>
<div class="rowb"><button class="btn pri sm" type="button" data-act="atk">Atacar</button><button class="btn sm" type="button" data-act="dmg">Dano</button><button class="btn dng sm" type="button" data-act="rm"><svg class="ic" viewBox="0 0 11 12" aria-hidden="true"><use href="#i-trash"/></svg>Remover</button></div></li>`}
function renderAtk(){$('#atkList').innerHTML=D.atk.map(atkHTML).join('')||'<li class="empty">Nenhum ataque. Adicione sua arma ou ataque desarmado.</li>'}
$('#atkAdd').onclick=()=>{D.atk.push({id:uid(),n:'',sk:(D.sk.find(s=>s.n==='Luta')||D.sk[0]||{n:''}).n,b:0,dano:'1d6',crit:'20',al:''});save();renderAtk();const l=$('#atkList').lastElementChild;if(l&&!rm())l.animate([{opacity:0,transform:'translateX(-16px)'},{opacity:1,transform:'none'}],{duration:260});if(l)$('input',l).focus()};
bindList($('#atkList'),'atk');
$('#atkList').addEventListener('click',e=>{const b=e.target.closest('[data-act]'),li=e.target.closest('[data-id]');if(!b||!li)return;const k=D.atk.find(x=>x.id===+li.dataset.id);
  if(b.dataset.act==='rm')return removeIn('atk',li,renderAtk);
  if(b.dataset.act==='dmg')return show(()=>sumRoll('Dano — '+(k.n||'Ataque'),k.dano));
  const s=D.sk.find(x=>x.n===k.sk)||D.sk[0]||{n:'',a:ATTRS[0],tr:0,ex:0};
  if(PCT)return show(()=>pctRoll('Ataque — '+(k.n||'Sem nome')+' ('+skLabel(s)+')',skVal(s)+(+k.b||0)));
  if(SOMA)return show(()=>somaRoll('Ataque — '+(k.n||'Sem nome')+' ('+skLabel(s)+')',somaTotal(s)+(+k.b||0)));
  show(()=>{const p=[];if(s.tr)p.push(TR[s.tr].n+' '+fmt(TR[s.tr].b));if(+s.ex)p.push('Extra '+fmt(+s.ex));if(+k.b)p.push('Arma '+fmt(+k.b));
    const th=parseInt(k.crit,10);return poolRoll('Ataque — '+(k.n||'Sem nome')+' ('+s.n+')',D.attr[s.a],skBonus(s)+(+k.b||0),p,th>1&&th<=20?th:0)})});
[['c-def','def'],['c-prot','prot'],['c-res','res']].forEach(([id,k])=>$('#'+id).addEventListener('input',e=>{D[k]=e.target.value;save()}));

/* habilidades */
function habHTML(h){return`<li class="cc" data-id="${h.id}"><div class="g2" style="grid-template-columns:1fr 110px">${fld('Habilidade','n',h.n)}${fld('Custo','custo',h.custo,'placeholder="2 PE"')}</div><label class="fl"><span>Descrição</span><textarea data-f="d">${esc(h.d)}</textarea></label>
<div class="rowb"><button class="btn pri sm" type="button" data-act="use">Usar</button><button class="btn dng sm" type="button" data-act="rm"><svg class="ic" viewBox="0 0 11 12" aria-hidden="true"><use href="#i-trash"/></svg>Remover</button></div></li>`}
function renderHab(){$('#habList').innerHTML=D.hab.map(habHTML).join('')||'<li class="empty">Nenhuma habilidade ainda.</li>'}
$('#habAdd').onclick=()=>{D.hab.push({id:uid(),n:'',custo:'',d:''});save();renderHab();const l=$('#habList').lastElementChild;if(l&&!rm())l.animate([{opacity:0,transform:'translateX(-16px)'},{opacity:1,transform:'none'}],{duration:260});if(l)$('input',l).focus()};
bindList($('#habList'),'hab');
$('#habList').addEventListener('click',e=>{const b=e.target.closest('[data-act]'),li=e.target.closest('[data-id]');if(!b||!li)return;const h=D.hab.find(x=>x.id===+li.dataset.id);
  if(b.dataset.act==='rm')return removeIn('hab',li,renderHab);
  const m=/(\d+)\s*PE/i.exec(h.custo||'');spend(m?+m[1]:0,h.n||'Habilidade')});

/* rituais */
const fl={e:null,c:null};
function ritHTML(r){const f=(l,v,k)=>`<button class="dch" type="button" data-roll="${k}"${v?'':' disabled'}><b>${esc(v||'—')}</b><small>${l}</small></button>`;
  return`<li class="rit e-${r.e}${r.open?' open':''}" data-id="${r.id}"><div class="rh" data-tog><div class="sig"><img src="${EIC[r.e]}" alt="" draggable="false"></div><div class="rm"><div class="rn"><span class="rc">${CIRC[r.c]}</span><span class="rname">${esc(r.n||'Sem nome')}</span></div><div class="dc">${f('Normal',r.nor,'nor')}${r.dis?f('Discente',r.dis,'dis'):''}${r.ver?f('Verdadeiro',r.ver,'ver'):''}</div></div><button class="rchev" type="button" data-tog aria-label="Abrir ou fechar detalhes"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button></div>
<div class="rbody"><div class="rin"><div class="rg">${fld('Nome','n',r.n)}<div class="g2" style="grid-template-columns:70px 1fr"><label class="fl"><span>Círculo</span><select data-f="c">${CIRC.map((c,i)=>`<option value="${i}"${i===+r.c?' selected':''}>${c}</option>`).join('')}</select></label><label class="fl"><span>Elemento</span><select data-f="e">${Object.keys(ELEM).map(k=>`<option value="${k}"${k===r.e?' selected':''}>${ELEM[k]}</option>`).join('')}</select></label></div>
${fld('Normal','nor',r.nor)}${fld('Discente','dis',r.dis)}${fld('Verdadeiro','ver',r.ver)}${fld('Custo (PE)','pe',r.pe,'type="number" inputmode="numeric"')}${fld('Execução','ex',r.ex)}${fld('Alcance','al',r.al)}${fld('Alvo','alvo',r.alvo)}${fld('Duração','dur',r.dur)}<div class="w2">${fld('Resistência','res',r.res)}</div><label class="fl w2"><span>Descrição</span><textarea data-f="d">${esc(r.d)}</textarea></label>
<div class="rowb w2"><button class="btn pri sm" type="button" data-act="cast">Conjurar</button><button class="btn dng sm" type="button" data-act="rm"><svg class="ic" viewBox="0 0 11 12" aria-hidden="true"><use href="#i-trash"/></svg>Remover</button></div></div></div></div></li>`}
function renderRit(){const q=$('#rq').value.trim().toLowerCase();
  const l=D.rit.filter(r=>(!fl.e||r.e===fl.e)&&(fl.c==null||+r.c===fl.c)&&(r.n||'').toLowerCase().includes(q));
  $('#ritList').innerHTML=l.map(ritHTML).join('')||'<li class="empty">'+(D.rit.length?'Nenhum ritual com esses filtros.':'Nenhum ritual. Use Adicionar ritual ou Criar ritual.')+'</li>'}
function buildFilters(){$('#flt').innerHTML=Object.keys(ELEM).map(k=>`<button class="fe" type="button" data-e="${k}" aria-pressed="false" aria-label="Filtrar ${ELEM[k]}" title="${ELEM[k]}" style="--bgc:var(--${k})"><img src="${EIC[k]}" alt="" draggable="false"></button>`).join('')+'<span class="fsp"></span>'+CIRC.map((c,i)=>`<button class="fc" type="button" data-c="${i}" aria-pressed="false" aria-label="Filtrar círculo ${c}">${c}</button>`).join('')}
$('#flt').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.e){fl.e=fl.e===b.dataset.e?null:b.dataset.e}else{const c=+b.dataset.c;fl.c=fl.c===c?null:c}
  $$('#flt .fe').forEach(x=>x.setAttribute('aria-pressed',x.dataset.e===fl.e));$$('#flt .fc').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.c===fl.c));renderRit()});
$('#rq').addEventListener('input',renderRit);
function newRit(o){const r=Object.assign({id:uid(),n:'',c:0,e:'sangue',nor:'',dis:'',ver:'',ex:'',al:'',alvo:'',dur:'',res:'',pe:PEC[(o&&o.c)||0],d:'',open:true},o||{});D.rit.unshift(r);save();return r}
$('#ritAdd').onclick=()=>{const r=newRit();fl.e=fl.c=null;$('#rq').value='';$$('#flt button').forEach(x=>x.setAttribute('aria-pressed','false'));renderRit();const li=$('#ritList').firstElementChild;if(li){if(!rm())li.animate([{opacity:0,transform:'translateY(-10px)'},{opacity:1,transform:'none'}],{duration:260});const n=$('input',li);if(n)n.focus()}};
bindList($('#ritList'),'rit',(r,f,li)=>{if(f==='n')$('.rname',li).textContent=r.n||'Sem nome'});
$('#ritList').addEventListener('change',e=>{const li=e.target.closest('[data-id]'),f=e.target.dataset.f;if(!li||!f)return;const r=D.rit.find(x=>x.id===+li.dataset.id);if(!r)return;
  if(f==='c'){r.c=+e.target.value;if(!r.pe||PEC.indexOf(+r.pe)>-1)r.pe=PEC[r.c]}
  if(f==='e'||f==='c'||f==='nor'||f==='dis'||f==='ver'){save();const open=r.open;renderRit();const nl=$('.rit[data-id="'+r.id+'"]');if(nl&&open)nl.classList.add('open')}});
$('#ritList').addEventListener('click',e=>{const li=e.target.closest('.rit');if(!li)return;const r=D.rit.find(x=>x.id===+li.dataset.id);if(!r)return;
  const rb=e.target.closest('[data-roll]');if(rb&&!rb.disabled){const k=rb.dataset.roll,nm={nor:'Normal',dis:'Discente',ver:'Verdadeiro'}[k];return show(()=>sumRoll((r.n||'Ritual')+' — '+nm,r[k]))}
  const ab=e.target.closest('[data-act]');if(ab){if(ab.dataset.act==='rm')return removeIn('rit',li,renderRit);if(ab.dataset.act==='cast')return spend(r.pe,r.n||'Ritual')}
  if(e.target.closest('[data-tog]')){r.open=!r.open;li.classList.toggle('open',r.open);save()}});
/* criar ritual (modal) */
$('#ritNew').onclick=()=>{['n','nor','dis','ver','ex','al','alvo','dur','res','d'].forEach(k=>$('#nr-'+k).value='');$('#nr-c').value='0';$('#nr-e').value='sangue';openM('mRit');$('#nr-n').focus()};
$('#nrOk').onclick=()=>{const v=k=>$('#nr-'+k).value.trim();if(!v('n')){toast('Dê um nome ao ritual','O nome é obrigatório.');return}
  newRit({n:v('n'),c:+$('#nr-c').value,e:$('#nr-e').value,nor:v('nor'),dis:v('dis'),ver:v('ver'),ex:v('ex'),al:v('al'),alvo:v('alvo'),dur:v('dur'),res:v('res'),d:v('d'),open:false,pe:PEC[+$('#nr-c').value]});
  closeM('mRit');fl.e=fl.c=null;$('#rq').value='';$$('#flt button').forEach(x=>x.setAttribute('aria-pressed','false'));renderRit();
  const li=$('#ritList').firstElementChild;if(li&&!rm())li.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:260})};

/* biblioteca de rituais */
let RLIB=[];

const rlKey=r=>r.e+'|'+r.c+'|'+r.n;
const rlSt={e:null,c:null};
function rlBuild(){$('#rlFlt').innerHTML=Object.keys(ELEM).map(k=>`<button class="fe" type="button" data-e="${k}" aria-pressed="false" aria-label="Filtrar ${ELEM[k]}" title="${ELEM[k]}" style="--bgc:var(--${k})"><img src="${EIC[k]}" alt="" draggable="false"></button>`).join('')+'<span class="fsp"></span>'+CIRC.map((c,i)=>`<button class="fc" type="button" data-c="${i}" aria-pressed="false" aria-label="Filtrar círculo ${c}">${c}</button>`).join('')}
function renderRL(){
  $$('#rlFlt .fe').forEach(x=>x.setAttribute('aria-pressed',x.dataset.e===rlSt.e));$$('#rlFlt .fc').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.c===rlSt.c));
  if(editableCatalogLoading){$('#rlN').textContent='Carregando rituais do Supabase…';$('#rlList').innerHTML='<li class="empty">Aguarde um instante.</li>';return}
  if(editableCatalogError&&!RLIB.length){$('#rlN').textContent=editableCatalogError;$('#rlList').innerHTML='<li class="empty">A biblioteca de rituais está indisponível.</li>';return}
  const q=$('#rlQ').value.trim().toLowerCase(),have=new Set(D.rit.map(r=>r.lib).filter(Boolean));
  const items=RLIB.filter(r=>(!rlSt.e||r.e===rlSt.e)&&(rlSt.c==null||r.c===rlSt.c)&&(!q||(r.n+' '+r.d).toLowerCase().indexOf(q)>-1));
  $('#rlN').textContent=items.length+' rituais'+(RLIB.some(r=>r.k)?' · os marcados como "resumo" só têm a descrição curta da lista do PDF.':'.');
  $('#rlList').innerHTML=items.map(r=>{const key=rlKey(r),has=have.has(key);
    return`<li class="oc rlc e-${r.e}${r.k?' resumo':''}${has?' sel':''}"><div class="oc-h"><div class="rlt"><span class="rli"><img src="${EIC[r.e]}" alt="" loading="lazy"></span><h3>${esc(r.n)}</h3></div><button class="wz-btn sm" type="button" data-rl="${esc(key)}"${has?' disabled':''}>${has?'Adicionado ✓':'Adicionar'}</button></div><div class="chps"><span class="chp">${CIRC[r.c]} círculo</span><span class="chp">${ELEM[r.e]}</span><span class="chp">${PEC[r.c]} PE</span>${r.ex?`<span class="chp cr">${esc(r.ex)}</span>`:''}${r.al?`<span class="chp cr">${esc(r.al)}</span>`:''}${r.k?'<span class="chp cr" title="Só a descrição curta da lista do PDF">resumo</span>':''}</div><p>${esc(r.d)}</p></li>`}).join('')||'<li class="empty">Nada encontrado.</li>'}
$('#ritLib').onclick=()=>{if(!$('#rlFlt').children.length)rlBuild();renderRL();openM('mRL')};
$('#rlFlt').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.e){rlSt.e=rlSt.e===b.dataset.e?null:b.dataset.e}else{const c=+b.dataset.c;rlSt.c=rlSt.c===c?null:c}renderRL()});
$('#rlQ').addEventListener('input',renderRL);
$('#rlList').addEventListener('click',e=>{const b=e.target.closest('[data-rl]');if(!b||b.disabled)return;const r=RLIB.find(x=>rlKey(x)===b.dataset.rl);if(!r)return;
  newRit({n:r.n,c:r.c,e:r.e,nor:r.nor||'',dis:r.dis||'',ver:r.ver||'',ex:r.ex||'',al:r.al||'',alvo:r.alvo||'',dur:r.dur||'',res:r.res||'',pe:PEC[r.c],d:r.d+(r.k?'\n(Resumo da lista do PDF: confira os detalhes no livro.)':''),open:false,lib:rlKey(r)});
  fl.e=fl.c=null;$('#rq').value='';$$('#flt button').forEach(x=>x.setAttribute('aria-pressed','false'));renderRit();renderRL();toast('Ritual adicionado',r.n)});
/* DT */
const dtAuto=()=>calc(SYS.formulas.dt);
function dtRefresh(){const inp=$('#dt'),ov=D.dt!==''&&D.dt!=null;if(document.activeElement!==inp)inp.value=ov?D.dt:dtAuto();$('#dtReset').hidden=!ov;inp.title=SYS===OP?'Automático: 10 + PE/turno + PRE':'Automático: '+SYS.formulas.dt;dvRefresh()}
/* valores próprios do sistema, mostrados abaixo do nível/NEX */
function dvRefresh(){const box=$('#dvBox');if(!box)return;const L=SYS.derivados||[];box.hidden=!L.length;
  box.innerHTML=L.map(x=>`<div class="dvc" title="${esc(x.f)}"><b>${esc(String(Math.round(calc(x.f)*100)/100))}</b><small>${esc(x.n)}</small></div>`).join('')}
$('#dt').addEventListener('input',e=>{D.dt=e.target.value===''?'':e.target.value;save();$('#dtReset').hidden=D.dt===''});
$('#dtReset').onclick=()=>{D.dt='';save();dtRefresh()};


/* biblioteca de itens */
const ILIB=[
/* ===== ARMAS SIMPLES (cat. 0) ===== */
{t:'arma',g:'Corpo a corpo',cat:0,n:'Faca',dano:'1d4',crit:'19',al:'Curto',tp:'C',esp:1,sk:'Luta',d:'Arma leve de corte. Pode ser arremessada (alcance curto).'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Martelo',dano:'1d6',crit:'20/x2',al:'—',tp:'C',esp:1,sk:'Luta',d:'Arma leve de impacto.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Punhal',dano:'1d4',crit:'20/x3',al:'—',tp:'P',esp:1,sk:'Luta',d:'Arma leve de perfuração.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Bastão',dano:'1d6',crit:'20/x2',al:'—',tp:'I',esp:1,sk:'Luta',d:'Arma de uma mão (1d6) ou duas mãos (1d8).'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Machete',dano:'1d6',crit:'19/x2',al:'—',tp:'C',esp:1,sk:'Luta',d:'Arma de uma mão, corte.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Lança',dano:'1d6',crit:'20/x2',al:'Curto',tp:'P',esp:1,sk:'Luta',d:'Arma de uma mão, perfuração. Pode ser arremessada (alcance curto).'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Cajado',dano:'1d6',crit:'20/x2',al:'—',tp:'I',esp:2,sk:'Luta',d:'Arma de duas mãos, impacto. Dano 1d6/1d6 (ataque duplo).'},
{t:'arma',g:'Disparo',cat:0,n:'Arco',dano:'1d6',crit:'20/x3',al:'Médio',tp:'P',esp:2,mun:'Flechas',sk:'Pontaria',d:'Arma de disparo de duas mãos. Usa flechas.'},
{t:'arma',g:'Disparo',cat:0,n:'Besta',dano:'1d8',crit:'19/x2',al:'Médio',tp:'P',esp:2,mun:'Flechas',sk:'Pontaria',d:'Arma de disparo de duas mãos. Usa flechas.'},
{t:'arma',g:'Disparo',cat:0,n:'Estilingue',dano:'1d4',crit:'20/x2',al:'Curto',tp:'I',esp:1,mun:'Pedrinhas / bolinhas',sk:'Pontaria',d:'Arma de disparo de duas mãos. Ao contrário de outras armas de disparo, permite aplicar seu valor de Força às rolagens de dano. Pode usar pedrinhas como munição (um pacote de bolinhas dura uma missão inteira, é categoria 0 e ocupa o mesmo espaço do estilingue). Também pode lançar granadas, arremessando-as em alcance longo.'},
{t:'arma',g:'Fogo',cat:0,n:'Pistola',dano:'1d12',crit:'18/x2',al:'Curto',tp:'B',esp:1,mun:'12 balas curtas',sk:'Pontaria',d:'Arma de fogo leve. Capacidade: 12 balas curtas.'},
{t:'arma',g:'Fogo',cat:0,n:'Revólver',dano:'2d6',crit:'19/x3',al:'Curto',tp:'B',esp:1,mun:'6 balas curtas',sk:'Pontaria',d:'Arma de fogo de uma mão. Capacidade: 6 balas curtas.'},
{t:'arma',g:'Fogo',cat:1,n:'Revólver Compacto',dano:'2d4',crit:'19/x3',al:'Curto',tp:'P',esp:1,mun:'5 balas curtas',sk:'Pontaria',d:'Arma de baixo calibre, projetada para ser facilmente escondida no corpo. Se treinado em Crime, você consegue carregar uma dessas armas sem que ela ocupe um espaço. Capacidade: 5 balas.'},
{t:'arma',g:'Fogo',cat:0,n:'Fuzil de Caça',dano:'2d8',crit:'19/x3',al:'Médio',tp:'B',esp:2,mun:'4 balas longas',sk:'Pontaria',d:'Arma de fogo de duas mãos. Capacidade: 4 balas longas.'},
/* ===== ARMAS TÁTICAS (cat. I) ===== */
{t:'arma',g:'Corpo a corpo',cat:1,n:'Machadinha',dano:'1d6',crit:'20/x3',al:'Curto',tp:'C',esp:1,sk:'Luta',d:'Arma leve de corte. Pode ser arremessada (alcance curto).'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Nunchaku',dano:'1d8',crit:'20/x2',al:'—',tp:'I',esp:1,sk:'Luta',d:'Arma leve de impacto.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Corrente',dano:'1d8',crit:'20/x2',al:'—',tp:'I',esp:1,sk:'Luta',d:'Arma de uma mão, impacto.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Faca Tática',dano:'1d6',crit:'19/x2',al:'Curto',tp:'C',esp:1,sk:'Luta',d:'Faca balanceada para contra-ataques rápidos e bloqueios. Arma ágil e pode ser arremessada. Na ação especial contra-ataque, fornece +2 no teste de ataque; na ação especial bloqueio, você pode gastar 2 PE e sacrificar a faca para aumentar a RD do bloqueio em +20.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Espada',dano:'1d8',crit:'19/x2',al:'—',tp:'C',esp:1,sk:'Luta',d:'Arma de uma mão (1d8) ou duas mãos (1d10).'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Florete',dano:'1d6',crit:'18/x2',al:'—',tp:'P',esp:1,sk:'Luta',d:'Arma ágil de perfuração.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Machado',dano:'1d8',crit:'20/x3',al:'—',tp:'C',esp:1,sk:'Luta',d:'Arma de uma mão, corte.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Maça',dano:'1d8',crit:'20/x2',al:'—',tp:'I',esp:1,sk:'Luta',d:'Arma de uma mão, impacto.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Picareta',dano:'1d6',crit:'20/x4',al:'—',tp:'P',esp:1,sk:'Luta',d:'Essencialmente uma ferramenta de mineração e demolição; pode ser empregada em combate na falta de armas apropriadas.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Acha',dano:'1d12',crit:'20/x3',al:'—',tp:'C',esp:2,sk:'Luta',d:'Arma de duas mãos, corte.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Gadanho',dano:'2d4',crit:'20/x4',al:'—',tp:'C',esp:2,sk:'Luta',d:'Arma de duas mãos, corte.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Katana',dano:'1d10',crit:'19/x2',al:'—',tp:'C',esp:2,sk:'Luta',d:'Arma de duas mãos, corte.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Marreta',dano:'3d4',crit:'20/x2',al:'—',tp:'I',esp:2,sk:'Luta',d:'Arma de duas mãos, impacto.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Montante',dano:'2d6',crit:'19/x2',al:'—',tp:'C',esp:2,sk:'Luta',d:'Arma de duas mãos, corte.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Motosserra',dano:'3d6',crit:'20/x2',al:'—',tp:'C',esp:2,sk:'Luta',d:'Arma de duas mãos, corte.'},
{t:'arma',g:'Arremesso',cat:1,n:'Shuriken',dano:'1d4',crit:'20/x2',al:'Curto',tp:'P',esp:0.5,sk:'Pontaria',d:'Pequenos projéteis metálicos em forma de estrelas ou dardos. Se veterano em Pontaria, uma vez por rodada, ao atacar com uma shuriken, pode gastar 1 PE para fazer um ataque adicional de shuriken contra o mesmo alvo. Um "pacote" basta para duas cenas (ou 10 shurikens, se usar a contagem de munição).'},
{t:'arma',g:'Disparo',cat:1,n:'Arco Composto',dano:'1d10',crit:'20/x3',al:'Médio',tp:'P',esp:2,mun:'Flechas',sk:'Pontaria',d:'Arma de disparo de duas mãos. Usa flechas.'},
{t:'arma',g:'Disparo',cat:1,n:'Balestra',dano:'1d12',crit:'19/x2',al:'Médio',tp:'P',esp:2,mun:'Flechas',sk:'Pontaria',d:'Arma de disparo de duas mãos. Usa flechas.'},
{t:'arma',g:'Fogo',cat:1,n:'Submetralhadora',dano:'2d6',crit:'19/x3',al:'Curto',tp:'B',esp:1,mun:'30 balas curtas',sk:'Pontaria',d:'Arma de fogo automática. Capacidade: 30 balas curtas.'},
{t:'arma',g:'Fogo',cat:1,n:'Pistola Pesada',dano:'2d8',crit:'18/x2',al:'Curto',tp:'B',esp:1,mun:'10 balas curtas',sk:'Pontaria',d:'Versão de calibre superior da tradicional pistola. Potência e recuo impõem penalidade de −1 dado em testes de ataque; empunhá-la com as duas mãos anula essa penalidade. Capacidade: 10 balas.'},
{t:'arma',g:'Fogo',cat:1,n:'Espingarda',dano:'4d6',crit:'20/x3',al:'Curto',tp:'B',esp:2,mun:'4 cartuchos',sk:'Pontaria',d:'Arma de fogo de duas mãos. Capacidade: 4 cartuchos.'},
{t:'arma',g:'Fogo',cat:1,n:'Fuzil de Assalto',dano:'2d10',crit:'19/x3',al:'Médio',tp:'B',esp:2,mun:'30 balas longas',sk:'Pontaria',d:'Arma de fogo automática. Capacidade: 30 balas longas.'},
{t:'arma',g:'Fogo',cat:1,n:'Espingarda de Cano Serrado',dano:'4d6',crit:'20/x2',al:'Curto',tp:'B',esp:2,mun:'2 cartuchos',sk:'Pontaria',d:'Arma de fogo de duas mãos. Capacidade: 2 cartuchos.'},
{t:'arma',g:'Fogo',cat:1,n:'Fuzil de Precisão',dano:'2d10',crit:'19/x3',al:'Longo',tp:'B',esp:2,mun:'1 bala longa',sk:'Pontaria',d:'Arma de fogo de precisão. Capacidade: 1 bala longa.'},
/* ===== ARMAS PESADAS (cat. II) ===== */
{t:'arma',g:'Pesada',cat:2,n:'Bazuca',dano:'10d8',crit:'20/x2',al:'Médio',tp:'I',esp:2,sk:'Pontaria',d:'Arma pesada de duas mãos. Dispara foguetes.'},
{t:'arma',g:'Pesada',cat:2,n:'Lança-chamas',dano:'6d6',crit:'20/x2',al:'Curto',tp:'Fogo',esp:2,mun:'Combustível',sk:'Pontaria',d:'Arma pesada de duas mãos. Usa combustível.'},
{t:'arma',g:'Pesada',cat:2,n:'Metralhadora',dano:'2d12',crit:'19/x3',al:'Médio',tp:'B',esp:2,mun:'50 balas longas',sk:'Pontaria',d:'Arma pesada de duas mãos. Capacidade: 50 balas longas.'},
/* ===== MUNIÇÕES ===== */
{t:'mun',g:'Munição',cat:0,n:'Flechas',esp:1,d:'Munição para arcos e bestas.'},
{t:'mun',g:'Munição',cat:0,n:'Balas Curtas',esp:1,d:'Munição para pistolas, revólveres e submetralhadoras.'},
{t:'mun',g:'Munição',cat:1,n:'Balas Longas',esp:1,d:'Munição para fuzis e metralhadoras.'},
{t:'mun',g:'Munição',cat:1,n:'Cartuchos',esp:1,d:'Munição para espingardas.'},
{t:'mun',g:'Munição',cat:1,n:'Combustível',esp:1,d:'Munição para lança-chamas.'},
{t:'mun',g:'Munição',cat:2,n:'Foguete',esp:1,d:'Munição para bazucas.'},
/* ===== NOVAS ARMAS (Sobrevivendo ao Horror) ===== */
{t:'arma',g:'Disparo',cat:0,n:'Pregador Pneumático',dano:'1d4',crit:'20/x4',al:'Curto',tp:'P',esp:1,mun:'300 pregos',sk:'Pontaria',d:'Ferramenta usada como arma em situação extrema; um aparelho semelhante a uma pistola que dispara pregos sob pressão. Conta como arma de fogo para seus poderes que afetam armas desse tipo. Um pregador armazena 300 pregos em rolo, suficiente para uma missão inteira.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Baioneta',dano:'1d4',crit:'19/x2',al:'—',tp:'P',esp:1,sk:'Luta',d:'Lâmina projetada para ser fixada em um fuzil ou arma similar. Você pode gastar uma ação de movimento para fixar a baioneta em uma arma de fogo de duas mãos. Fixada, a baioneta se torna uma arma de duas mãos ágil e seu dano aumenta para 1d6, mas você ainda pode atacar com a arma de disparo; a arma sofre −1 dado em ataques à distância.'},
{t:'arma',g:'Corpo a corpo',cat:0,n:'Gancho de Carne',dano:'1d4',crit:'20/x4',al:'—',tp:'P',esp:1,sk:'Luta',d:'Usado para pendurar carne em frigoríficos, este gancho metálico pode servir como arma. Também pode ser amarrado a um pedaço de corda ou corrente; isso aumenta seu alcance em 4,5m e o transforma em um item de espaço 2.'},
{t:'arma',g:'Corpo a corpo',cat:1,n:'Bastão Policial',dano:'1d6',crit:'20/x2',al:'Curto',tp:'I',esp:1,sk:'Luta',d:'Bastão com uma guarda lateral, arma branca de uso padrão da maioria das forças policiais. Além de desferir golpes contundentes, pode ser usada para aparar ataques; quando usa a ação especial esquiva com um bastão policial, o bônus que você recebe na Defesa aumenta em +1. Arma ágil.'},
{t:'arma',g:'Fogo',cat:2,n:'Espingarda de Cano Duplo',dano:'4d6',crit:'20/x3',al:'Curto',tp:'B',esp:2,mun:'2 cartuchos',sk:'Pontaria',d:'Versão usada para caça, com dois canos paralelos, cada um com um gatilho e capacidade para um cartucho. Ao contrário de outras armas de disparo, você precisa gastar uma ação de movimento para recarregá-la após disparar seus dois cartuchos. Ao atacar com ela, você pode disparar os dois canos no mesmo alvo; se fizer isso, sofre −1 dado no teste de ataque, mas o dano da arma passa a ser 6d6. Capacidade: 2 balas.'},
/* ===== ACESSÓRIOS ===== */
{t:'item',g:'Acessório',cat:0,n:'Amuleto Sagrado',esp:1,d:'Utensílio especial na forma de shimenawa, rosário, fio de contas, contas de oração ou qualquer outro objeto que reforce sua fé e ajude a blindá-lo das desgraças do dia a dia. Ocupa o espaço de um item vestido e fornece +2 em Religião e Vontade.'},
{t:'item',g:'Acessório',cat:0,n:'Celular',esp:1,d:'Utensílio especial. Serve para tirar fotos, gravar áudios e vídeos, acessar a internet e ligar para outras pessoas. Com acesso à internet, fornece +2 em testes de perícia que envolvam adquirir informações. Possui uma lanterna fraca que ilumina em um cone de 4,5m.'},
{t:'item',g:'Acessório',cat:0,n:'Chave de Fenda Universal',esp:1,d:'Ferramenta considerada um milagre da engenharia humana. Fornece +2 em testes de perícia para criar ou reparar objetos, desde painéis de cozinha até motores de avião. Também fornece o bônus se usada como item de apoio em situações especiais, como lidar com cabos para hackear um servidor.'},
{t:'item',g:'Acessório',cat:0,n:'Chaves',esp:1,d:'Molhos de chaves (de casa, veículo, cadeados etc.). Usar o barulho de um molho de chaves para distrair alguém (jogando-as como chaves, por exemplo) fornece +2 em testes de Furtividade feitos na mesma rodada.'},
{t:'item',g:'Acessório',cat:1,n:'Documentos Falsos',esp:1,d:'Conjunto de documentos (identidade funcional, carteira de habilitação, cartões de crédito etc.) em nome de uma identidade falsa. Você recebe +2 em testes de Diplomacia, Enganação e Intimidação para se passar pela pessoa representada pelos documentos.'},
{t:'item',g:'Acessório',cat:1,n:'Manual Operacional',esp:1,d:'Livro com lições práticas sobre um assunto. Existe um manual operacional para cada perícia; gastar uma ação de interlúdio lendo um manual permite usar essa perícia como se fosse treinado nela até o próximo interlúdio. Um manual operacional aprimorado também fornece +5 na perícia. Só se pode receber o benefício de um manual operacional por vez.'},
{t:'item',g:'Acessório',cat:0,n:'Notebook',esp:2,d:'Utensílio especial. Como um celular, com acesso à internet fornece +2 em testes de perícia que envolvam adquirir informações. Pode ser usado para entretenimento: ao relaxar em cenas de interlúdio, você recupera 1 ponto adicional de Sanidade. A luz do monitor ilumina em um cone de 4,5m. Tablets são uma variação de notebook.'},
{t:'item',g:'Acessório',cat:1,n:'Bateria Potente (modificação)',esp:0,d:'Modificação para objetos elétricos: aumenta eficiência e duração. Em lanternas, celulares e notebooks, dobra a duração da bateria e o alcance da luz projetada. Em um taser, dobra seus usos, aumenta o dano para 1d8 e a DT para resistir a ele em +5. Pode afetar outros objetos, a critério do mestre.'},
/* ===== EXPLOSIVOS ===== */
{t:'item',g:'Explosivo',cat:1,n:'Dinamite',esp:1,d:'Artefato explosivo à base de nitroglicerina, ajeitado em um bastão com 20cm. Com a ação padrão você acende o pavio e arremessa-a em um ponto em alcance médio. Afeta um raio de 6m: seres e objetos soltos sofrem 4d6 de dano de impacto e 4d6 de dano de fogo e ficam em chamas (Reflexos DT Agi reduz à metade e evita a condição).'},
{t:'item',g:'Explosivo',cat:1,n:'Explosivo Plástico',esp:1,d:'Massa adesiva do tamanho de uma esponja, com pinos de ignição e detonador remoto. Preparar os pinos e grudar na superfície leva duas rodadas; depois você detona com uma ação livre (alcance longo), causando ao menos 1 ponto de dano de fogo ou eletricidade nele. Detonado, causa 16d6 de impacto em todos em raio de 3m (Reflexos DT Int reduz à metade). Se usado por especialista em explosivos (treinado em Crime ou Profissão adequada, a critério do mestre), causa o dobro de dano em objetos e estruturas e ignora sua RD.'},
{t:'item',g:'Explosivo',cat:0,n:'Galão Vermelho',esp:2,d:'Galões marcados com símbolo de chama, com substâncias inflamáveis. Ao sofrer dano de fogo ou balístico, explode numa esfera de 6m de raio: seres sofrem 12d6 de dano de fogo e ficam em chamas (Reflexos DT 25 reduz à metade e evita a condição). A área fica em chamas (1d6 de dano de fogo por rodada em seres e objetos) até ser apagada ou a cena acabar.'},
{t:'item',g:'Explosivo',cat:1,n:'Granada de Gás Sonífero',esp:1,d:'Libera uma fumaça branca em raio de 6m a partir do ponto de impacto. Seres que começam seus turnos na área ficam inconscientes e caídos ou, se em atividade física intensa (como combate), ficam exaustos por 1 rodada e depois fatigados (em ambos os casos, Fortitude DT Agi reduz para fatigado por 1d4 rodadas). O gás permanece na área por 2 rodadas.'},
{t:'item',g:'Explosivo',cat:1,n:'Granada de PEM',esp:1,d:'Emite um poderoso pulso eletromagnético que desativa todos os equipamentos elétricos em raio de 18m até o fim da cena. Criaturas de Energia na área sofrem 6d6 de dano de impacto e ficam atordoadas por 1 rodada (apenas uma vez por cena, Fortitude DT Agi reduz à metade e evita a condição).'},
/* ===== ITENS OPERACIONAIS ===== */
{t:'item',g:'Operacional',cat:0,n:'Alarme de Movimento',esp:1,d:'Objeto de fácil aquisição, controlado por dispositivo móvel ou aplicativo de celular. Com uma ação completa, posicione e ative o alarme; sempre que houver movimento significativo em um cone de 30m na direção apontada, ele sinaliza o dispositivo de controle. É acionado por seres Pequenos ou maiores. A sinalização pode ser discreta (só no dispositivo) ou barulhenta (alarme sonoro alto e agudo).'},
{t:'item',g:'Operacional',cat:2,n:'Alimento Energético',esp:1,d:'Alimentos e suplementos de alta tecnologia capazes de recuperar as energias mentais de um agente. Com uma ação padrão para consumir, você recupera 1d4 PE.'},
{t:'item',g:'Operacional',cat:1,n:'Aplicador de Medicamentos',esp:1,d:'Adaptação portátil de bombas injetoras hospitalares, presa ao redor do braço ou perna, para aplicar uma substância como cicatrizante ou medicamento, com uma ação de movimento. Tem espaço para três doses de substâncias (já contabilizadas no espaço do item). Carregar uma dose leva uma ação padrão.'},
{t:'item',g:'Operacional',cat:1,n:'Braçadeira Reforçada',esp:1,d:'Semelhante às proteções usadas em artes marciais, ajuda a absorver o impacto ao bloquear golpes com o braço. Aumenta em +2 a RD que você recebe por usar um bloqueio.'},
{t:'item',g:'Operacional',cat:1,n:'Cão Adestrado',esp:0,d:'Cachorro corajoso e grande que pode ser um aliado de um personagem treinado em Adestramento (regras de aliados em OPRPG, p. 171). Bônus: +2 em Investigação e Percepção. Ladrar e Morder: gaste 1 PE para o cão assumir postura defensiva ao seu redor; você recebe +2 na Defesa por 1 rodada.'},
{t:'item',g:'Operacional',cat:1,n:'Coldre Saque Rápido',esp:1,d:'Coldre projetado para que a arma possa ser sacada ou armazenada com um movimento mínimo. Uma vez por rodada, você pode sacar ou guardar uma arma de fogo leve com uma ação livre.'},
{t:'item',g:'Operacional',cat:1,n:'Equipamento de Escuta',esp:1,d:'Conjunto com um receptor (alcance de 90m) e três minúsculos transmissores que captam conversas e outros sons em raio de 9m. Instalar um transmissor demora alguns minutos e exige um teste de Crime contra DT 20 (falha indica que a escuta não irá transmitir). O resultado também é a DT para outras pessoas encontrarem o transmissor. Instalar discretamente exige uma ação completa e um teste de Furtividade oposto à Percepção dos presentes, e aumenta a DT do teste de Crime em +5.'},
{t:'item',g:'Operacional',cat:0,n:'Estrepes (saco)',esp:1,d:'Peça de metal com quatro pontas afiadas, de modo que uma ponta sempre fique para cima. Cobrir um quadrado de 1,5m de lado exige uma ação padrão. Um ser que pise na área sofre 1d4 de dano de perfuração e fica lento por um dia. Numa perseguição, você pode aplicar os estrepes como parte da sua ação, mas sofre −1 dado no teste; um perseguidor que pise sofre −1 dado em testes de perseguição até o fim da cena. Em combate ou perseguição, passar num teste de Reflexos (DT Agi) evita os estrepes. Não afetam seres capazes de resistir a todo o seu dano.'},
{t:'item',g:'Operacional',cat:1,n:'Faixa de Pregos',esp:2,d:'Aparato compacto: trilha de hastes metálicas sanfonadas com pregos em toda a extensão. Usada principalmente para parar veículos, pode ser usada contra outros oponentes. Funciona como estrepes, exceto que ocupa uma linha de 9m. Veículos com pneus de borracha que passem pela faixa têm os pneus automaticamente perfurados, o que reduz seu deslocamento pela metade.'},
{t:'item',g:'Operacional',cat:0,n:'Isqueiro',esp:0.5,d:'Com uma ação de movimento, produz uma pequena chama. Além de incendiar objetos inflamáveis, emite luz em raio de 3m.'},
/* ===== MEDICAMENTOS ===== */
{t:'item',g:'Medicamento',cat:1,n:'Antibiótico',esp:0.5,d:'Fortalece a imunidade contra vírus e bactérias. Fornece +5 no próximo teste de Fortitude contra efeitos de uma doença feito até o fim do dia. Ação padrão para aplicar em você ou em um ser adjacente.'},
{t:'item',g:'Medicamento',cat:1,n:'Antídoto',esp:0.5,d:'Ajuda o corpo a lidar com venenos. Fornece +5 no próximo teste de Fortitude contra efeitos de um veneno até o fim do dia. Um antídoto feito para um veneno específico, em vez disso, remove completamente o veneno. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Antiemético',esp:0.5,d:'Remove a condição enjoado e fornece +5 em testes para evitar essa condição até o fim da cena. A critério do mestre, pode funcionar contra outras condições causadas por náuseas e vômitos. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Anti-histamínico',esp:0.5,d:'Reduz reações alérgicas perigosas. Fornece +5 no próximo teste contra efeitos de uma alergia feito até o fim do dia. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Anti-inflamatório',esp:0.5,d:'Reduz reações inflamatórias, diminuindo dor e inchaço. Fornece 1d8+2 PV temporários. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Antitérmico',esp:0.5,d:'Reduz reações febris perigosas e alivia dores de cabeça, permitindo um novo teste contra uma condição mental que o usuário esteja sofrendo. Só funciona uma vez por cena. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Broncodilatador',esp:0.5,d:'Auxilia na respiração. Fornece +5 em testes para evitar as condições asfixiado ou fatigado feitos até o fim do dia. Ação padrão para aplicar.'},
{t:'item',g:'Medicamento',cat:1,n:'Coagulante',esp:0.5,d:'Aumenta a capacidade de coagulação, fornecendo +5 em testes para se estabilizar da condição sangrando feitos até o fim do dia. Se usado em conjunto com um teste de Medicina para remover a condição morrendo, também fornece +5 nesse teste. Ação padrão para aplicar.'},
/* ===== EQUIPAMENTOS ===== */
{t:'item',g:'Equipamento',cat:1,n:'Óculos de Visão Noturna',esp:1,d:'Alimentados por uma bateria, permitem enxergar no escuro como se o personagem tivesse visão no escuro. Entretanto, o usuário recebe −1 dado em testes de resistência contra a condição ofuscado e efeitos baseados em luz (como uma granada de atordoamento).'},
{t:'item',g:'Equipamento',cat:0,n:'Óculos Escuros',esp:1,d:'Um personagem vestindo óculos escuros não pode ser ofuscado.'},
{t:'item',g:'Equipamento',cat:0,n:'Pá',esp:2,d:'Pesada ferramenta que fornece +5 em testes de Força para cavar buracos e mover detritos. Pode ser usada em combate como um bastão.'},
{t:'item',g:'Equipamento',cat:1,n:'Paraquedas',esp:2,d:'Anula o dano de queda. Personagens com grau de treinamento veterano em Acrobacia, Pilotagem, Reflexos, Tática ou uma Profissão específica sabem usá-lo. Caso contrário, ou em quedas muito curtas, usar o paraquedas requer um teste de Reflexos (DT 20). Se falhar, o paraquedas não funciona adequadamente, reduzindo o dano da queda apenas à metade.'},
{t:'item',g:'Equipamento',cat:1,n:'Traje de Mergulho',esp:2,d:'Roupa impermeável que cobre quase o corpo inteiro, usada para garantir a segurança do mergulhador debaixo d\'água. Vem acompanhado de tanque e máscara que garantem 1 hora de oxigênio. Fornece +5 em testes de resistência contra efeitos ambientais e resistência a dano químico 5. Ocupa o espaço de uma vestimenta; vesti-lo ou despi-lo é uma ação completa.'},
{t:'item',g:'Equipamento',cat:2,n:'Traje Espacial',esp:5,d:'Roupa impermeável que cobre o corpo inteiro, usada para garantir a segurança do astronauta no vácuo do espaço. Possui suprimento de água e oxigênio de oito horas, e protege contra os raios cósmicos e de minúsculas rochas errantes no espaço. Fornece +10 em testes de resistência contra efeitos ambientais e resistência a dano químico 20. Ocupa o espaço de uma vestimenta; vesti-lo ou despi-lo demora duas rodadas.'},
/* ===== ITENS PARANORMAIS ===== */
{t:'item',g:'Paranormal',cat:1,n:'Catalisador: Ampliador',esp:0.5,d:'Catalisador ritualístico (um para cada elemento; só pode usar um catalisador por ritual; consumido ao ser usado). Aumenta o alcance do ritual em um passo (apenas de curto para médio, de médio para longo ou de longo para extremo) ou dobra a área de efeito. Ex.: uma Dissonância Acústica ampliada tem alcance longo ou área de 12m de raio.'},
{t:'item',g:'Paranormal',cat:1,n:'Catalisador: Perturbador',esp:0.5,d:'Catalisador ritualístico (um para cada elemento; consumido ao ser usado). A DT para resistir ao ritual aumenta em +2.'},
{t:'item',g:'Paranormal',cat:1,n:'Catalisador: Potencializador',esp:0.5,d:'Catalisador ritualístico (um para cada elemento; consumido ao ser usado). O dano do ritual aumenta em um dado do mesmo tipo.'},
{t:'item',g:'Paranormal',cat:1,n:'Catalisador: Prolongador',esp:0.5,d:'Catalisador ritualístico (um para cada elemento; consumido ao ser usado). A duração do ritual dobra. Não funciona para rituais instantâneos ou sustentados.'},
{t:'item',g:'Paranormal',cat:2,n:'Ligação Direta Infernal',esp:1,d:'Amontoado de fios de cobre contaminados com Sangue e Energia. Com uma ação completa você usa os fios para ligar um veículo automaticamente. Isso faz os fios invadirem os controles do veículo animando-o de forma paranormal: o veículo recebe resistência a dano 20 (cumulativa com qualquer RD que já possua) e imunidade a Sangue, e você recebe +5 em testes de Pilotagem para conduzi-lo. Entretanto, nesse estado o veículo tentará causar o máximo de confusão possível; as consequências de qualquer falha nos testes de Pilotagem são amplificadas a critério do mestre. Remover a ligação direta infernal de um veículo é uma ação completa.'},
{t:'item',g:'Paranormal',cat:2,n:'Medidor de Condição Vertebral',esp:1,d:'Coluna vertebral sustentada por Lodo de Morte e revestida com cabos e fios de Energia. Para usar, deve ser conectado à coluna vertebral do usuário, em um procedimento que exige uma ação completa e causa profunda dor e agonia, deixando o usuário atordoado por uma rodada. O medidor conta como uma vestimenta que fornece +2 em Fortitude. Além disso, uma vez conectado, ele se ilumina em cores que vão do vermelho (na base) ao verde (no topo), indicando a saúde do usuário (verde é a melhor condição). Além disso, se o usuário estiver sob um efeito paranormal, o item emitirá pulsos de luz lilás. As informações fornecidas pelo item concedem +5 em testes de Medicina feitos para auxiliar o usuário.'},
{t:'item',g:'Paranormal',cat:2,n:'Pé de Morto',esp:1,d:'Botas macabras costuradas com a pele de cadáveres amaldiçoados pela Morte. A bota mantém os passos do usuário leves e quase inaudíveis, como se ele fosse um fantasma. Você recebe +5 em Furtividade e, em cenas de furtividade, qualquer ação chamativa que envolva apenas se mover (como correr ou saltar) aumenta a visibilidade em apenas +1.'},
{t:'item',g:'Paranormal',cat:2,n:'Pen Drive Selado',esp:0.5,d:'Dispositivo gravado com sigilos dourados de Conhecimento. Graças à proteção desses sigilos, o pen drive não pode ser invadido ou afetado por rituais, seres e efeitos de Energia. Isso mantém seus arquivos protegidos e permite que ele seja usado para invadir outros dispositivos sem ser contaminado pela entidade. Existem outros modelos de dispositivos selados, como HDs externos e celulares.'},
{t:'item',g:'Paranormal',cat:1,n:'Valete da Salvação',esp:0.5,d:'Carta de baralho (valete de ouros pintada de dourado e coberta com sigilos de Conhecimento) que serve para salvá-lo de uma situação complicada. Para usá-la, gaste uma ação padrão para atirá-la ao ar: ela voa em alcance médio, apontando para a melhor rota de fuga dentro desse alcance, e deixa de existir. Se gasta em uma cena de perseguição, você é bem-sucedido em uma ação de cortar caminho.'},
{t:'item',g:'Paranormal',n:'Lente de Revelação (modificação)',esp:0,d:'Modificação para câmeras de aura paranormal. Permite ver seres invisíveis e incorpóreos e ignorar a camuflagem deles. Além disso, você pode gastar uma ação padrão e 1 PE para fotografar uma criatura em alcance curto: até o fim da cena, ela perde camuflagem e invisibilidade e se torna corpórea (Von DT Pre evita).'},
];
const ILG=['Corpo a corpo','Disparo','Arremesso','Fogo','Pesada','Munição','Acessório','Explosivo','Operacional','Medicamento','Equipamento','Paranormal'],ICN=['0','I','II'];
const ilSt={g:null,c:null},ilKey=i=>i.t==='db'?'db|'+i.dbId:i.g+'|'+i.n;
function ilRemoteItems(){return remoteCatalogItems.map(i=>({t:'db',g:i.category,cat:null,n:i.name,esp:i.spaces,d:[i.description,i.damage&&'Dano: '+i.damage,i.requirements&&'Requisitos: '+i.requirements,i.price&&'Preço: '+i.price].filter(Boolean).join('\n'),dbId:i.id}))}
const ilFromMold=i=>({t:i.arma?'arma':'item',g:i.g,cat:null,n:i.n,esp:i.esp,d:i.d,dano:i.dano,crit:i.crit,al:i.al||'—',tp:'',sk:i.sk,custom:1});
function ilAll(){
  if(SYS!==OP)return SYS.itens.map(ilFromMold);
  const remote=ilRemoteItems(),keys=new Set(remote.map(i=>i.n.trim().toLocaleLowerCase('pt-BR')+'|'+i.g.trim().toLocaleLowerCase('pt-BR')));
  return ILIB.filter(i=>!keys.has(i.n.trim().toLocaleLowerCase('pt-BR')+'|'+i.g.trim().toLocaleLowerCase('pt-BR'))).concat(remote)
}
function ilBuild(){
  const groups=SYS!==OP?[...new Set(SYS.itens.map(i=>i.g))]:[...new Set(ILG.concat(ilRemoteItems().map(i=>i.g)).filter(Boolean))];
  $('#ilG').innerHTML=groups.map(g=>`<button type="button" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join('');
  $('#ilC').classList.toggle('off',SYS!==OP);
  $('#ilC').innerHTML=ICN.map((c,i)=>`<button type="button" data-c="${i}" aria-pressed="false">Categoria ${c}</button>`).join('')}
const icat=i=>i.cat==null?'—':ICN[i.cat],iesp=n=>String(n).replace('.',',');
function ilDesc(i){if(i.custom){const x=i.t==='arma'?['Dano '+i.dano,i.crit&&'Crítico '+i.crit,i.al&&i.al!=='—'&&'Alcance '+i.al].filter(Boolean):[];return x.join(' · ')+(x.length&&i.d?'\n':'')+i.d}
  if(i.t==='db')return i.d;if(i.t!=='arma')return i.d;const x=[`Cat. ${icat(i)}`,`Dano ${i.dano}`,`Crítico ${i.crit}`,`Alcance ${i.al}`,`Tipo ${i.tp}`];if(i.mun)x.push('Munição: '+i.mun);return x.join(' · ')+'\n'+i.d}
window.downloadBuiltinItemsCsv=(download=true)=>{
  const columns=['name','category','spaces','description','damage','requirements','price'];
  const quote=value=>'"'+String(value==null?'':value).replace(/"/g,'""')+'"';
  const rows=ILIB.map(i=>[
    i.n,
    i.g,
    i.esp,
    (i.cat==null?'':'Categoria: '+icat(i)+'\n')+ilDesc(i),
    i.dano||'',
    i.req||i.requisitos||'',
    i.preco||i.price||''
  ]);
  const csv='\uFEFF'+[columns,...rows].map(row=>row.map(quote).join(',')).join('\r\n');
  if(!download)return csv;
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
  a.href=url;a.download='catalog_items.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  return rows.length;
};
function renderIL(){
  $$('#ilG button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.g===ilSt.g));$$('#ilC button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.c===ilSt.c));
  const q=$('#ilQ').value.trim().toLowerCase();
  const all=ilAll(),l=all.filter(i=>(!ilSt.g||i.g===ilSt.g)&&(ilSt.c==null||i.cat===ilSt.c)&&(!q||(i.n+' '+i.g+' '+i.d).toLowerCase().includes(q)));
  $('#ilN').textContent=l.length+' itens.'+(remoteCatalogLoading?' Carregando catálogo Supabase…':remoteCatalogError?' '+remoteCatalogError:remoteCatalogItems.length?' Inclui '+remoteCatalogItems.length+' item(ns) do Supabase.':'');
  if(SYS!==OP)$('#ilN').textContent=l.length?l.length+(l.length===1?' item':' itens')+' neste sistema.':'Este sistema ainda não tem itens. Crie na tela Editar sistema, na seção Itens.';
  $('#ilList').innerHTML=l.map(i=>{const k=esc(ilKey(i));
    return`<li class="oc ilc t-${i.t==='db'?'item':i.t}"><div class="oc-h"><h3>${esc(i.n)}</h3><div class="ila"><button class="wz-btn sm" type="button" data-il="${k}" data-do="inv">Adicionar à mochila</button>${i.t==='arma'?`<button class="wz-btn sm ghost" type="button" data-il="${k}" data-do="atk">Criar ataque</button>`:''}</div></div><div class="chps"><span class="chp">${esc(i.g)}</span>${i.t==='db'?`<span class="chp">Catálogo Supabase</span>`:i.custom?'':`<span class="chp">Cat. ${icat(i)}</span>`}<span class="chp">${iesp(i.esp)} esp.</span>${i.t==='arma'?`<span class="chp cr">${esc(i.dano)}</span>${i.crit?`<span class="chp cr">crít. ${esc(i.crit)}</span>`:''}`:''}</div><p>${esc(ilDesc(i))}</p></li>`}).join('')||'<li class="empty">Nada encontrado.</li>'}
$('#invLib').onclick=()=>{if(SYS!==OP){ilSt.g=null;ilSt.c=null}ilBuild();renderIL();openM('mIL');if(SYS===OP&&(remoteCatalogError||!remoteCatalogItems.length)&&!remoteCatalogLoading){remoteCatalogLoading=true;renderIL();void loadGameCatalogs()}};
$('#ilG').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;ilSt.g=ilSt.g===b.dataset.g?null:b.dataset.g;renderIL()});
$('#ilC').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const c=+b.dataset.c;ilSt.c=ilSt.c===c?null:c;renderIL()});
$('#ilQ').addEventListener('input',renderIL);
$('#ilList').addEventListener('click',e=>{const b=e.target.closest('[data-il]');if(!b)return;const i=ilAll().find(x=>ilKey(x)===b.dataset.il);if(!i)return;b.classList.remove('done');void b.offsetWidth;b.classList.add('done');
  if(b.dataset.do==='atk'){D.atk.push({id:uid(),n:i.n,sk:i.sk,b:0,dano:i.dano,crit:i.crit,al:i.al==='—'?'':i.al,lib:ilKey(i)});save();renderAtk();toast('Ataque criado',i.n+' · '+i.dano);return}
  const have=D.inv.find(x=>x.lib===ilKey(i));
  if(have){have.q=(+have.q||0)+1;save();renderInv();toast('Quantidade +1',i.n+' ×'+have.q);return}
  D.inv.push({id:uid(),n:i.n,esp:+i.esp||0,q:1,d:ilDesc(i),lib:ilKey(i),...(i.t==='db'?{catalogId:i.dbId}: {})});save();renderInv();toast('Item adicionado',i.n)});


/* inventário */
function invHTML(i){return`<li class="cc" data-id="${i.id}"><div class="g2" style="grid-template-columns:1fr 64px 64px">${fld('Item','n',i.n)}${fld('Espaços','esp',i.esp,'type="number" inputmode="numeric" step="0.5" min="0"')}${fld('Qtd.','q',i.q,'type="number" inputmode="numeric" min="0"')}</div><label class="fl"><span>Descrição</span><textarea data-f="d" style="min-height:48px">${esc(i.d)}</textarea></label><div class="rowb"><button class="btn dng sm" type="button" data-act="rm"><svg class="ic" viewBox="0 0 11 12" aria-hidden="true"><use href="#i-trash"/></svg>Largar item</button></div></li>`}
function renderInv(){$('#invList').innerHTML=D.inv.map(invHTML).join('')||'<li class="empty">Mochila vazia.</li>';cargaRefresh()}
let overWarned=false;
function cargaRefresh(){const used=D.inv.reduce((a,i)=>a+(+i.esp||0)*(+i.q||0),0),max=D.carga!==''&&D.carga!=null?+D.carga:calc(SYS.formulas.carga);
  $('#cgTxt').textContent=(Math.round(used*10)/10)+' / '+max+' espaços';$('#cgBar').classList.toggle('over',used>max);$('#cgBar i').style.width=clamp(max?used/max*100:100,0,100)+'%';
  if(document.activeElement!==$('#cgMax'))$('#cgMax').value=D.carga!==''&&D.carga!=null?D.carga:max;
  if(used>max&&!overWarned){overWarned=true;toast('Sobrecarregado','Você passou do limite de carga.')}if(used<=max)overWarned=false}
$('#invAdd').onclick=()=>{D.inv.push({id:uid(),n:'',esp:1,q:1,d:''});save();renderInv();const l=$('#invList').lastElementChild;if(l&&!rm())l.animate([{opacity:0,transform:'translateX(-16px)'},{opacity:1,transform:'none'}],{duration:260});if(l)$('input',l).focus()};
bindList($('#invList'),'inv',()=>cargaRefresh());
$('#invList').addEventListener('click',e=>{const b=e.target.closest('[data-act]'),li=e.target.closest('[data-id]');if(b&&li&&b.dataset.act==='rm')removeIn('inv',li,renderInv)});
$('#cgMax').addEventListener('input',e=>{D.carga=e.target.value;save();cargaRefresh()});

/* ---------- abas ---------- */
const MP=['char','skills','combat','abil','rit','inv','desc'],RP=['combat','abil','rit','inv','desc'];let curM='char',curR='combat';
function go(id,dir){curM=id;if(RP.indexOf(id)>-1)curR=id;
  $$('.pane').forEach(p=>{const n=p.id.slice(2);p.classList.toggle('m-on',n===curM);if(RP.indexOf(n)>-1)p.classList.toggle('r-on',n===curR)});
  $$('#mtabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.p===curM));$$('#rtabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.p===curR));
  const b=$('#mtabs button[data-p='+curM+']');if(b&&b.scrollIntoView)requestAnimationFrame(()=>b.scrollIntoView({inline:'center',block:'nearest',behavior:rm()?'auto':'smooth'}));
  const p=$('#p-'+id);if(p&&!rm()&&p.animate){if(dir&&mobile())p.animate([{opacity:0,transform:'translateX('+(dir*46)+'px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.22,.8,.3,1)'});else p.animate([{opacity:0},{opacity:1}],{duration:140})}}
$('#mtabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.p===curM)return;go(b.dataset.p,MP.indexOf(b.dataset.p)>MP.indexOf(curM)?1:-1)});
$('#rtabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.p===curR)return;go(b.dataset.p,RP.indexOf(b.dataset.p)>RP.indexOf(curR)?1:-1)});
const mqDesk=matchMedia('(min-width:1000px)');function mobile(){return !mqDesk.matches}
let swp=null;
const hScroll=el=>{for(;el&&el!==document.body;el=el.parentElement){const cs=getComputedStyle(el);if((cs.overflowX==='auto'||cs.overflowX==='scroll')&&el.scrollWidth>el.clientWidth+2)return true}return false};
const swClear=el=>{el.style.transform='';el.style.opacity='';el.style.willChange=''};
$('#app').addEventListener('touchstart',e=>{swp=null;if(e.touches.length!==1||!mobile()||!rov.hidden||document.querySelector('.modal:not([hidden])'))return;
  const t=e.touches[0],tg=e.target;if(t.clientX<20||t.clientX>innerWidth-20)return;
  if(tg.closest('input,select,textarea,.hex,.vit,.mtabs,.modal,#camp,#wiz,[data-noswipe]')||hScroll(tg))return;
  const el=$('#p-'+curM);if(!el)return;swp={x:t.clientX,y:t.clientY,t:Date.now(),lock:false,el,dx:0}},{passive:true});
$('#app').addEventListener('touchmove',e=>{if(!swp)return;const t=e.touches[0],dx=t.clientX-swp.x,dy=t.clientY-swp.y;
  if(!swp.lock){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){swp=null;return}
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.2){swp.lock=true;swp.el.style.willChange='transform,opacity'}else return}
  swp.dx=dx;const n=MP.indexOf(curM)+(dx<0?1:-1),edge=n<0||n>=MP.length,k=edge?.16:.55;
  swp.el.style.transform='translateX('+(dx*k)+'px)';swp.el.style.opacity=String(1-Math.min(Math.abs(dx)/340,.5)*(edge?.35:1))},{passive:true});
const swEnd=()=>{if(!swp)return;const s0=swp;swp=null;if(!s0.lock)return;
  const el=s0.el,dx=s0.dx,dt=Math.max(1,Date.now()-s0.t),v=Math.abs(dx)/dt,n=MP.indexOf(curM)+(dx<0?1:-1),edge=n<0||n>=MP.length;
  const cur={transform:el.style.transform||'none',opacity:el.style.opacity||'1'};
  const commit=!edge&&(Math.abs(dx)>innerWidth*.2||(v>.45&&Math.abs(dx)>28)),dir=dx<0?1:-1;
  if(commit){if(navigator.vibrate&&vibOn())try{navigator.vibrate(6)}catch(_){}
    if(rm()||!el.animate){swClear(el);go(MP[n],dir);return}
    const a=el.animate([cur,{transform:'translateX('+(-dir*70)+'px)',opacity:0}],{duration:130,easing:'ease-in',fill:'forwards'});
    a.finished.then(()=>{a.cancel();swClear(el);go(MP[n],dir)}).catch(()=>{swClear(el)});return}
  if(rm()||!el.animate){swClear(el);return}
  const a=el.animate([cur,{transform:'none',opacity:1}],{duration:320,easing:'cubic-bezier(.2,1.1,.3,1)',fill:'forwards'});
  a.finished.then(()=>{a.cancel();swClear(el)}).catch(()=>{swClear(el)})};
$('#app').addEventListener('touchend',swEnd,{passive:true});$('#app').addEventListener('touchcancel',swEnd,{passive:true});

/* ---------- modais ---------- */
function openM(id){$('#'+id).hidden=false}
function closeM(id){$('#'+id).hidden=true}
$$('.modal').forEach(m=>{m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-close]'))m.hidden=true})});
const LY=(()=>{
const SEL='.modal,#home,#camp,#wiz,#mSl,#rov,#cw,#sysEd,#sedAsk,#cocView',FOC='a[href],button,input,select,textarea,summary,[tabindex]',KEEP='[aria-live],[role=alert],[role=status],.toast,.sw',stack=[];let kept=[];
const vis=el=>!el.hidden&&!(el.parentElement&&el.parentElement.closest('[hidden]'));
const items=r=>Array.from(r.querySelectorAll(FOC)).filter(x=>!x.disabled&&x.tabIndex>=0&&!x.closest('[hidden],[inert]')&&x.getClientRects().length);
function sync(){kept.forEach(e=>{e.inert=false});kept=[];if(!stack.length)return;let n=stack[stack.length-1].el;
  while(n&&n!==document.body&&n.parentNode){Array.from(n.parentNode.children).forEach(c=>{if(c!==n&&!c.inert&&!/^(SCRIPT|STYLE|LINK)$/.test(c.tagName)&&!c.matches(KEEP)){c.inert=true;kept.push(c)}});n=n.parentNode}}
function open(el){if(stack.some(x=>x.el===el))return;stack.push({el,from:document.activeElement});sync();
  const box=el.querySelector('[role=dialog],[role=alertdialog]')||el,f=items(el),first=f.find(x=>!x.matches('[data-close]'))||f[0];
  if(matchMedia('(hover:hover)').matches&&first)first.focus({preventScroll:true});else{box.tabIndex=-1;box.focus({preventScroll:true})}}
function close(el){const i=stack.findIndex(x=>x.el===el);if(i<0)return;const r=stack.splice(i,1)[0];sync();const a=document.activeElement;
  if((!a||a===document.body||el.contains(a))&&r.from&&document.contains(r.from)&&!r.from.closest('[hidden],[inert]')){try{r.from.focus({preventScroll:true})}catch(e){}}}
function scan(){document.querySelectorAll(SEL).forEach(e=>{if(vis(e))open(e)});stack.slice().forEach(x=>{if(!vis(x.el))close(x.el)})}
new MutationObserver(scan).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});scan();
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!stack.length)return;const top=stack[stack.length-1].el;if(top.id==='home')return;
  const f=items(top);if(!f.length){e.preventDefault();return}const i=f.indexOf(document.activeElement);
  if(i<0||(e.shiftKey&&i===0)||(!e.shiftKey&&i===f.length-1)){e.preventDefault();f[e.shiftKey?f.length-1:0].focus()}},true);
return{top:()=>stack.length?stack[stack.length-1].el:null}})();
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!rov.hidden){closeRoll();return}const t=LY.top();if(t&&t.classList.contains('modal')){e.preventDefault();e.stopImmediatePropagation();t.hidden=true}});
(()=>{const K='op-ficha-tema',root=document.documentElement,mt=document.querySelector('meta[name=theme-color]');
 function set(t,keep){if(t)root.dataset.theme=t;else delete root.dataset.theme;if(!keep){try{t?localStorage.setItem(K,t):localStorage.removeItem(K)}catch(e){}}
  $$('[data-tema]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tema===t)));if(mt)mt.content=getComputedStyle(root).getPropertyValue('--bg').trim()||'#0c0b10'}
 set(root.dataset.theme||'',true);$('#temaG').addEventListener('click',e=>{const b=e.target.closest('[data-tema]');if(b)set(b.dataset.tema)})})();
(()=>{const KU='op-ficha-ui',save=u=>{try{localStorage.setItem(KU,JSON.stringify(u))}catch(e){}},$i=x=>document.getElementById(x);
 function sync(){const u=uiLoad(),cs=getComputedStyle(document.documentElement),hex=v=>{const t=cs.getPropertyValue(v).trim();return/^#[0-9a-f]{6}$/i.test(t)?t:'#000000'},fs=Math.round((u.fs||1)*100);
  $i('cfAcc').value=hex('--pur');$i('cfGold').value=hex('--gold');$i('cfFs').value=fs;$i('cfFsO').textContent=fs+'%';
  $i('cfHc').checked=!!u.hc;$i('cfCar').checked=carOn();$i('cfVib').checked=vibOn();$i('cfD3').checked=dice3dOn();$i('cfSnd').checked=localStorage.getItem('op-ficha-snd')!=='0';$i('cfRm').checked=!!D.cfg.rm}
 const upd=(k,v)=>{const u=uiLoad();if(v==null||v===false)delete u[k];else u[k]=v;save(u);uiApply(u)},flag=(k,on)=>{try{localStorage.setItem(k,on?'1':'0')}catch(e){}};
 $i('cfAcc').oninput=e=>upd('acc',e.target.value);$i('cfGold').oninput=e=>upd('gold',e.target.value);
 $i('cfFs').oninput=e=>{const v=+e.target.value;$i('cfFsO').textContent=v+'%';upd('fs',v===100?null:v/100)};
 $i('cfHc').onchange=e=>upd('hc',e.target.checked);
 $i('cfCar').onchange=e=>{flag('op-ficha-car',e.target.checked);window.dispatchEvent(new Event('ficha-car'))};
 $i('cfVib').onchange=e=>flag('op-ficha-vib',e.target.checked);$i('cfD3').onchange=e=>flag('op-ficha-3d',e.target.checked);$i('cfSnd').onchange=e=>flag('op-ficha-snd',e.target.checked);
 $i('cfReset').onclick=()=>{try{localStorage.removeItem(KU);localStorage.removeItem('op-ficha-tema')}catch(e){}uiApply({});document.documentElement.removeAttribute('data-theme');
  $$('[data-tema]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tema==='')));const mt=document.querySelector('meta[name=theme-color]');if(mt)mt.content='#0c0b10';sync()};
 $i('temaG').addEventListener('click',e=>{if(!e.target.closest('[data-tema]'))return;const u=uiLoad();delete u.acc;delete u.gold;save(u);uiApply(u);sync()});
 const tabs=$$('#cfTabs [role=tab]');
 function tab(k){tabs.forEach(t=>{const on=t.dataset.cf===k;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;$i('cfp-'+t.dataset.cf).hidden=!on})}
 tabs.forEach(t=>t.onclick=()=>tab(t.dataset.cf));
 $i('cfTabs').addEventListener('keydown',e=>{const i=tabs.indexOf(document.activeElement);if(i<0||!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key))return;e.preventDefault();
  const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();tab(tabs[n].dataset.cf)});
 window.cfgTab=tab;window.cfgSync=sync;window.cfgOpen=()=>{sync();$i('cfMsg').textContent='';const c=$i('cfClear');c.classList.remove('arm');c.textContent='Apagar esta ficha';pnRender()};window.openCfg=k=>{openSl('cfg');tab(k||'conta')}})();
function renderHist(){$('#hist').innerHTML=hist.length?hist.map(h=>`<li><span>${esc(h.t)}</span><b>${h.v}</b></li>`).join(''):'<li><span>Nenhuma rolagem ainda.</span></li>'}
$('#bDice').onclick=()=>{renderHist();openM('mDice')};
$('#qd').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;closeM('mDice');show(()=>sumRoll(b.textContent,b.dataset.f))});
function rollForm(){const f=$('#dForm').value.trim();if(!f)return;if(!parseF(f)){toast('Fórmula inválida','Use algo como 2d6+3.');return}closeM('mDice');show(()=>sumRoll(f.toUpperCase(),f))}
$('#dGo').onclick=rollForm;$('#dForm').addEventListener('keydown',e=>{if(e.key==='Enter')rollForm()});
$('#bEdit').onclick=()=>{const on=!document.body.classList.contains('edit');document.body.classList.toggle('edit',on);$('#bEdit').setAttribute('aria-pressed',on);if(on)toast('Edição de atributos','Toque nos números dos hexágonos para mudar.')};
$('#bCfg').onclick=()=>{soloCfg=true;openCfg('conta')};
$('#cfRm').onchange=e=>{D.cfg.rm=e.target.checked;save();rmApply()};
$('#cfClear').onclick=e=>{const b=e.currentTarget;if(!b.classList.contains('arm')){b.classList.add('arm');b.textContent='Toque de novo para confirmar';return}
  clearTimeout(cloudSaveT);activeCloudId=null;const cfg=D.cfg;D=fresh();D.cfg=cfg;save();renderAll();closeM('mSl');openCamp()};
$('#bIO').onclick=()=>{$('#ioMsg').textContent='';soloCfg=true;openCfg('abrir')};
$('#ioExp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(D)],{type:'application/json'}));
  a.download='ficha-ordem-paranormal.json';document.body.appendChild(a);a.click();tSet(HMB);setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);$('#ioMsg').textContent='Arquivo exportado.'};
$('#ioImp').onclick=()=>$('#ioFile').click();
$('#ioFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j||typeof j!=='object'||!j.attr)throw 0;if(!slPush())return;clearTimeout(cloudSaveT);activeCloudId=null;cloudConflict=false;cloudSaveLabel();const cfg0=D.cfg;D=normalize(j);D.cfg=D.cfg||cfg0;save();renderAll();closeM('mSl');toast('Ficha importada','Aberta neste aparelho.')}catch(x){$('#ioMsg').textContent='Esse arquivo não parece ser uma ficha válida.'}};r.readAsText(f);e.target.value=''};

/* ---------- PASSO A PASSO DE CRIAÇÃO (montado pelo editor de blocos) ---------- */
let CW=null;
const FLOW_LBL={pers:'Nome do personagem',jog:'Jogador'};
const flowLabel=(M,k)=>FLOW_LBL[k]||(M.rotulos&&M.rotulos[k])||k;
const cwSkBase=(M,n,at)=>Math.max(0,Math.floor(calcWith((M.pericias.find(p=>p.n===n)||{b:'0'}).b,at,0)));
function cwStart(M,o){
  if(!M.criacao||!M.criacao.length)return false;
  CW={M,dry:!!(o&&o.dry),meta:o||{},i:0,exit:0,S:{attr:Object.fromEntries(M.atributos.map(a=>[a.k,M.atributo.inicial])),base:{},roll:{},pick:{},tr:{},pts:{},q:'',f:Object.fromEntries(FLOW_FIELDS.map(k=>[k,'']))}};
  const cw=$('#cw');cw.hidden=false;document.body.style.overflow='hidden';
  if(!rm())cw.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
  cwRender();return true}
function cwClose(){$('#cw').hidden=true;if($('#sysEd').hidden)document.body.style.overflow='';CW=null}
const cwLeft=(b,id)=>{const S=CW.S,base=S.base[id]||(S.base[id]=Object.assign({},S.attr));return b.pontos-CW.M.atributos.reduce((a,x)=>a+(S.attr[x.k]-base[x.k]),0)};
const cwOther=(id,n)=>Object.entries(CW.S.pts).reduce((s,[bid,o])=>bid===id?s:s+(o[n]||0),0);
const cwPts=(b,id)=>{const tot=Math.floor(calcWith(b.f,CW.S.attr,0)),used=Object.values(CW.S.pts[id]||{}).reduce((a,v)=>a+v,0);return{tot,used,left:tot-used}};
const cwD100=()=>CW.M.teste.tipo==='d100';
const cwTipo=()=>CW.M.teste.tipo;
const cwCalc=(f,at)=>{const S=CW.S,v=evalF(f,Object.assign({PE:numf(S.f.pe),NIVEL:numf(S.f.nivel),NEX:numf(S.f.nex)},at||S.attr));return v==null?0:v};
function cwCond(b,at){const x=cwCalc(b.e1,at),y=cwCalc(b.e2,at);return b.op==='>='?x>=y:b.op==='<='?x<=y:b.op==='>'?x>y:b.op==='<'?x<y:b.op==='='?x===y:x!==y}
/* percorre só os blocos visíveis: o que está dentro de um "Se" falso não existe pra pessoa */
function cwEach(arr,prefix,cb,at){arr.forEach((b,j)=>{const id=prefix+j;if(b.k==='se'){if(cwCond(b,at))cwEach(b.b,id+'.',cb,at)}else cb(b,id)})}
const cwBlocks=(arr,prefix)=>arr.map((b,j)=>b.k==='se'?(cwCond(b,CW.S.attr)?cwBlocks(b.b,prefix+j+'.'):''):cwBlock(b,prefix+j)).join('');
function cwIssue(b,id){
  const S=CW.S;
  if(b.k==='attr_pontos'){const l=cwLeft(b,id);return b.tudo&&l>0?'Faltam '+l+(l===1?' ponto':' pontos')+' nos atributos.':''}
  if(b.k==='attr_rolar'){const n=b.attrs.filter(k=>S.roll[id+'.'+k]==null).length;return n?'Role ou digite o valor de todos os atributos (falta'+(n===1?'':'m')+' '+n+').':''}
  if(b.k==='lista')return b.obrig&&b.opcoes.length&&S.pick[id]==null?'Escolha uma opção em "'+b.rot+'".':'';
  if(b.k==='pericias_treinar'&&cwTipo()!=='d100'){const n=(S.tr[id]||[]).length;return n!==b.n?'Escolha '+b.n+(b.n===1?' perícia':' perícias')+' para treinar ('+n+' escolhida'+(n===1?'':'s')+').':''}
  if(b.k==='pericias_pontos'&&cwTipo()!=='pool'){const p=cwPts(b,id);return b.tudo&&p.left>0?'Faltam '+p.left+(p.left===1?' ponto':' pontos')+' nas perícias.':''}
  return''}
function cwBlock(b,id){
  const M=CW.M,S=CW.S,k=b.k,hd=t=>`<h3 class="cw-h">${t}</h3>`;
  if(k==='texto')return`<div class="cw-b cw-tx">${esc(b.t)}</div>`;
  if(k==='campo')return`<div class="cw-b"><label class="fl"><span>${esc(b.rot||flowLabel(M,b.campo))}</span><input class="sin" data-a="f" data-k="${b.campo}" value="${esc(S.f[b.campo])}" maxlength="40"></label></div>`;
  if(k==='attr_pontos'){const left=cwLeft(b,id);
    return`<div class="cw-b" data-id="${id}">${hd('Distribua os pontos dos atributos')}<p class="cw-left${left?'':' ok'}"><b>${left}</b> ${Math.abs(left)===1?'ponto restante':'pontos restantes'} <small>(de ${b.min} a ${b.max} em cada)</small></p>${M.atributos.map(a=>{const v=S.attr[a.k];
      return`<div class="cw-ar"><b>${esc(a.k)}</b><span>${esc(a.n)}</span><button class="sib" type="button" data-a="dec" data-id="${id}" data-k="${a.k}" aria-label="Diminuir ${esc(a.n)}"${v<=b.min?' disabled':''}>−</button><output>${v}</output><button class="sib" type="button" data-a="inc" data-id="${id}" data-k="${a.k}" aria-label="Aumentar ${esc(a.n)}"${v>=b.max||left<=0?' disabled':''}>+</button></div>`}).join('')}</div>`}
  if(k==='attr_rolar'){
    return`<div class="cw-b" data-id="${id}">${hd('Role os atributos <small>'+esc(b.dados)+(b.mais?(b.mais>0?' + ':' − ')+Math.abs(b.mais):'')+(b.mult!==1?' × '+b.mult:'')+'</small>')}<div class="rowb"><button class="btn sm pri" type="button" data-a="rollall" data-id="${id}">Rolar todos</button></div>${b.attrs.map(x=>{const a=M.atributos.find(y=>y.k===x);if(!a)return'';const r=S.roll[id+'.'+x];
      return`<div class="cw-ar"><b>${esc(x)}</b><span>${esc(a.n)}${r?`<small class="cw-rl">${esc(r)}</small>`:''}</span><input class="sin cw-n" type="number" inputmode="numeric" min="0" max="${M.atributo.maxFicha}" data-a="set" data-id="${id}" data-k="${x}" value="${S.attr[x]}" aria-label="Valor de ${esc(a.n)}"><button class="btn sm" type="button" data-a="roll" data-id="${id}" data-k="${x}">Rolar</button></div>`}).join('')}</div>`}
  if(k==='lista')return`<div class="cw-b" data-id="${id}">${hd(esc(b.rot)+(b.obrig?'':' <small>(opcional)</small>'))}<div class="cw-opts">${b.opcoes.map((o,i)=>`<button type="button" class="cw-opt" data-a="pick" data-id="${id}" data-i="${i}" aria-pressed="${S.pick[id]===i}"><b>${esc(o.n)}</b>${o.sk?`<small>${cwTipo()==='pool'?'Treino em ':(o.pts>=0?'+':'')+o.pts+' em '}${esc(o.sk)}</small>`:''}</button>`).join('')||'<p class="smu">Nenhuma opção cadastrada.</p>'}</div></div>`;
  if(k==='pericias_treinar'){
    if(cwTipo()==='d100')return`<div class="cw-b cw-tx">Este bloco não funciona em sistemas d100.</div>`;
    const sel=S.tr[id]||[];
    return`<div class="cw-b" data-id="${id}">${hd('Escolha '+b.n+(b.n===1?' perícia':' perícias')+' para treinar'+(cwTipo()==='soma'?' <small>(bônus de '+(b.bonus>=0?'+':'')+b.bonus+')</small>':''))}<p class="cw-left${sel.length===b.n?' ok':''}"><b>${sel.length}</b> de ${b.n} escolhidas</p><div class="cw-chips">${M.pericias.map(p=>`<button type="button" class="cw-chip" data-a="tr" data-id="${id}" data-n="${esc(p.n)}" aria-pressed="${sel.includes(p.n)}">${esc(p.n)}</button>`).join('')}</div></div>`}
  if(k==='pericias_pontos'){
    if(cwTipo()==='pool')return`<div class="cw-b cw-tx">Este bloco não funciona em sistemas de vários d20.</div>`;
    const p=cwPts(b,id),q=S.q.trim().toLowerCase(),pts=S.pts[id]||{};
    return`<div class="cw-b" data-id="${id}">${hd('Distribua os pontos das perícias')}<p class="cw-left${p.left?'':' ok'}"><b>${p.left}</b> de ${p.tot} pontos restantes <small>(até ${b.max}% em cada)</small></p><input class="sin" type="search" data-a="q" value="${esc(S.q)}" placeholder="Buscar perícia" aria-label="Buscar perícia"><div class="cw-sk">${M.pericias.filter(x=>!q||x.n.toLowerCase().includes(q)).map(x=>{const bs=cwTipo()==='d100'?cwSkBase(M,x.n,S.attr):0,v=pts[x.n]||0,oth=cwOther(id,x.n);
      return`<div class="cw-ar cw-sr"><span>${esc(x.n)}</span><em>${cwTipo()==='d100'?bs+'%':'+'}</em><input class="sin cw-n" type="number" inputmode="numeric" min="0" data-a="pts" data-id="${id}" data-n="${esc(x.n)}" value="${v||''}" placeholder="0" aria-label="Pontos em ${esc(x.n)}"><output>${cwTipo()==='d100'?(bs+oth+v)+'%':'+'+(oth+v)}</output></div>`}).join('')||'<p class="smu">Nada encontrado.</p>'}</div></div>`}
  return''}
function cwRender(keep){
  const {M,i,S}=CW,st=M.criacao[i],last=i===M.criacao.length-1;CW.rend=1;
  $('#cwTitle').textContent=(CW.dry?'Teste · ':'')+M.nome;
  $('#cwSteps').innerHTML=M.criacao.map((s,j)=>`<button type="button" class="cw-st${j===i?' on':''}${j<i?' done':''}" data-a="go" data-j="${j}"${j>i?' disabled':''}><i>${j<i?'✓':j+1}</i><span>${esc(s.t)}</span></button>`).join('');
  const body=$('#cwBody'),y=body.scrollTop,fo=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset:{};
  body.innerHTML=(i===0&&!CW.dry?'<p class="sed-warn">Ao finalizar, esta ficha será substituída pelo novo personagem. Se quiser guardar a atual, faça um backup antes (Configurações → Exportar).</p>':'')+(CW.dry&&i===0?'<p class="sed-warn">Modo de teste: nada do que você fizer aqui é salvo.</p>':'')+
    `<div class="cw-sec"><h2>${esc(st.t)}</h2>${cwBlocks(st.b,i+'.')||'<p class="smu">Nada para fazer nesta etapa.</p>'}</div>`;
  body.scrollTop=keep?y:0;CW.rend=0;
  cwHint();$('#cwBack').disabled=i===0;$('#cwNext').textContent=last?(CW.dry?'Ver resultado':'Finalizar'):'Próximo'}
function cwHint(){
  const st=CW.M.criacao[CW.i],msg=[];cwEach(st.b,CW.i+'.',(b,id)=>{const m=cwIssue(b,id);if(m)msg.push(m)},CW.S.attr);
  $('#cwHint').textContent=msg[0]||'';$('#cwNext').disabled=!!msg.length;return msg}
function cwRoll(b,id,k){
  const mm=/^(\d+)d(\d+)$/.exec(b.dados)||['','3','6'],n=+mm[1],s=+mm[2],r=Array.from({length:n},()=>rnd(1,s)),sum=r.reduce((a,c)=>a+c,0)+(+b.mais||0),val=clamp(Math.round(sum*(+b.mult||1)),0,CW.M.atributo.maxFicha);
  CW.S.attr[k]=val;CW.S.base={};
  CW.S.roll[id+'.'+k]=n+'d'+s+' ['+r.join(', ')+']'+(b.mais?(b.mais>0?' + ':' − ')+Math.abs(b.mais):'')+' = '+sum+(b.mult!==1?' × '+b.mult:'')+' = '+val}
const cwBlk=id=>{const p=id.split('.').map(Number),a=CW.M.criacao[p[0]].b[p[1]];return p.length>2?a.b[p[2]]:a};
function cwResult(){
  const {M,S}=CW,at=Object.assign({},S.attr),f=Object.assign({},S.f),train=new Set(),pts={},tp=M.teste.tipo,ad=(n,v)=>{pts[n]=(pts[n]||0)+v};
  M.criacao.forEach((st,i)=>cwEach(st.b,i+'.',(b,id)=>{
    if(b.k==='lista'&&S.pick[id]!=null){const o=b.opcoes[S.pick[id]];if(o){if(b.campo)f[b.campo]=o.n;if(o.sk){if(tp==='pool')train.add(o.sk);else ad(o.sk,o.pts)}}}
    else if(b.k==='pericias_treinar'&&tp!=='d100'){(S.tr[id]||[]).forEach(n=>{if(tp==='pool')train.add(n);else ad(n,b.bonus)})}
    else if(b.k==='pericias_pontos'&&tp!=='pool')Object.entries(S.pts[id]||{}).forEach(([n,v])=>ad(n,v));
    else if(b.k==='definir'&&b.alvo)at[b.alvo]=clamp(Math.round(cwCalc(b.f,at)),0,M.atributo.maxFicha);
    else if(b.k==='dar'&&b.sk){if(tp==='pool')train.add(b.sk);else ad(b.sk,b.n)}},at));
  return{at,f,train:[...train],pts}}
function cwShowResult(){
  const {M}=CW,r=cwResult(),d=cwTipo()!=='pool',bars=barsFromMold(M,r.at);
  $('#cwSteps').innerHTML='';$('#cwHint').textContent='';
  $('#cwBody').innerHTML=`<div class="cw-sec"><h2>Resultado do teste</h2><p class="smu">É isto que a ficha receberia. Nada foi salvo.</p>
  <div class="cw-b"><h3 class="cw-h">Atributos</h3><div class="cw-chips">${M.atributos.map(a=>`<span class="cw-chip on"><b>${esc(a.k)}</b> ${r.at[a.k]}</span>`).join('')}</div></div>
  <div class="cw-b"><h3 class="cw-h">Barras</h3><div class="cw-chips">${M.barras.map(b=>`<span class="cw-chip on">${esc(b.n)} ${bars[b.k][0]}/${bars[b.k][1]}</span>`).join('')}</div></div>
  <div class="cw-b"><h3 class="cw-h">${cwTipo()==='d100'?'Perícias com pontos':d?'Perícias com bônus':'Perícias treinadas'}</h3><div class="cw-chips">${(d?Object.entries(r.pts).filter(([,v])=>v).map(([n,v])=>`<span class="cw-chip on">${esc(n)} ${cwTipo()==='d100'?(cwSkBase(M,n,r.at)+v)+'%':(v>=0?'+':'')+v}</span>`):r.train.map(n=>`<span class="cw-chip on">${esc(n)}</span>`)).join('')||'<span class="smu">Nenhuma.</span>'}</div></div>
  <div class="cw-b"><h3 class="cw-h">Campos</h3><div class="cw-chips">${FLOW_FIELDS.filter(k=>r.f[k]).map(k=>`<span class="cw-chip on"><b>${esc(flowLabel(M,k))}</b> ${esc(r.f[k])}</span>`).join('')||'<span class="smu">Nenhum.</span>'}</div></div></div>`;
  $('#cwBack').disabled=false;$('#cwNext').textContent='Fechar teste';$('#cwNext').disabled=false;CW.result=true}
/* bares calculadas com os atributos escolhidos (usa o molde dado, não o ativo) */
function barsFromMold(M,at){return Object.fromEntries(M.barras.map(b=>{const mx=Math.max(0,Math.round(calcWith(b.maxF,at,0))),cu=b.iniF?Math.max(0,Math.min(mx,Math.round(calcWith(b.iniF,at,0)))):mx;return[b.k,[cu,mx]]}))}
function cwApply(){
  const {M}=CW,r=cwResult(),meta=CW.meta||{};
  if(!slPush())return;
  clearTimeout(cloudSaveT);activeCloudId=null;const cfg=D.cfg;
  useMold(M);D=fresh();if(meta.sid){D.sid=meta.sid;D.sv=meta.sv}D.cfg=cfg;D.created=true;D.camp='nova';
  ATTRS.forEach(k=>{if(r.at[k]!=null)D.attr[k]=clamp(Math.round(+r.at[k])||0,0,SYS.atributo.maxFicha)});
  FLOW_FIELDS.forEach(k=>{if(r.f[k])D[k]=String(r.f[k]).slice(0,40)});
  D.sk.forEach(s=>{const add=r.pts[s.n]||0;if(PCT){if(add)s.v=Math.min(999,skBase(s)+add)}else if(SOMA){if(add)s.bn=clamp((s.bn||0)+add,-99,99)}else if(r.train.includes(s.n))s.tr=Math.max(s.tr,1)});
  D.bars=barsIni(D.attr);
  cwClose();save();renderAll();go('char',1);toast('Personagem criado','O passo a passo foi aplicado à ficha.')}
function cwNext(){
  if(cwHint().length)return;
  if(CW.result){cwClose();return}
  if(CW.i<CW.M.criacao.length-1){CW.i++;cwRender();return}
  if(CW.dry)cwShowResult();else cwApply()}
$('#cwNext').onclick=cwNext;
$('#cwBack').onclick=()=>{if(!CW)return;if(CW.result){CW.result=false;cwRender();return}if(CW.i>0){CW.i--;cwRender()}};
$('#cwExit').onclick=()=>{if(!CW)return;if(CW.dry||CW.exit){cwClose();return}CW.exit=1;$('#cwExit').textContent='Tem certeza? Toque de novo';setTimeout(()=>{if(CW){CW.exit=0;$('#cwExit').textContent='Sair'}},3500)};
$('#cwSteps').addEventListener('click',e=>{const b=e.target.closest('[data-a=go]');if(!b||!CW||b.disabled)return;CW.i=+b.dataset.j;CW.result=false;cwRender()});
$('#cwBody').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!CW)return;const a=b.dataset.a,S=CW.S;
  if(a==='inc'||a==='dec'){const bl=cwBlk(b.dataset.id),k=b.dataset.k;if(a==='inc'&&S.attr[k]<bl.max&&cwLeft(bl,b.dataset.id)>0)S.attr[k]++;else if(a==='dec'&&S.attr[k]>bl.min)S.attr[k]--;else return}
  else if(a==='roll'){cwRoll(cwBlk(b.dataset.id),b.dataset.id,b.dataset.k)}
  else if(a==='rollall'){const bl=cwBlk(b.dataset.id);bl.attrs.forEach(k=>cwRoll(bl,b.dataset.id,k))}
  else if(a==='pick'){const id=b.dataset.id,i=+b.dataset.i,bl=cwBlk(id);S.pick[id]=S.pick[id]===i&&!bl.obrig?undefined:i}
  else if(a==='tr'){const id=b.dataset.id,bl=cwBlk(id),n=b.dataset.n,sel=S.tr[id]||(S.tr[id]=[]),ix=sel.indexOf(n);if(ix>=0)sel.splice(ix,1);else if(sel.length<bl.n)sel.push(n);else return}
  else return;
  cwRender(true)});
$('#cwBody').addEventListener('input',e=>{const t=e.target,a=t.dataset.a;if(!a||!CW)return;const S=CW.S;
  if(a==='f'){S.f[t.dataset.k]=t.value;return}
  if(a==='q'){S.q=t.value;const pos=t.selectionStart;cwRender(true);const q=$('#cwBody [data-a=q]');if(q){q.focus();try{q.setSelectionRange(pos,pos)}catch(x){}}return}
  if(a==='set'){const k=t.dataset.k;if(t.value==='')return;S.attr[k]=clamp(Math.round(+t.value)||0,0,CW.M.atributo.maxFicha);S.roll[t.dataset.id+'.'+k]='digitado';S.base={};cwHint();return}
  if(a==='pts'){const id=t.dataset.id,bl=cwBlk(id),n=t.dataset.n,bs=cwTipo()==='d100'?cwSkBase(CW.M,n,S.attr):0,o=S.pts[id]||(S.pts[id]={});
    const others=Object.entries(o).reduce((s,[kk,v])=>kk===n?s:s+v,0),room=Math.max(0,cwPts(bl,id).tot-others),oth=cwOther(id,n),cap=Math.max(0,bl.max-bs-oth);
    const v=Math.max(0,Math.min(Math.round(+t.value)||0,cap,room));if(v)o[n]=v;else delete o[n];
    const row=t.closest('.cw-sr');if(String(v)!==t.value&&t.value!=='')t.value=v||'';$('output',row).textContent=cwTipo()==='d100'?(bs+oth+v)+'%':'+'+(oth+v);
    const p=cwPts(bl,id),l=$('.cw-left',t.closest('.cw-b'));l.innerHTML='<b>'+p.left+'</b> de '+p.tot+' pontos restantes <small>(até '+bl.max+'% em cada)</small>';l.classList.toggle('ok',!p.left);cwHint()}});
$('#cwBody').addEventListener('change',e=>{const t=e.target;if(t.dataset.a==='set'&&CW&&!CW.rend)cwRender(true)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&CW&&$('#sedAsk').hidden){e.preventDefault();$('#cwExit').click()}});
$('#cfFlow').onclick=()=>{closeM('mSl');cwStart(SYS)};
$('#nvFlow').onclick=()=>{closeM('mNova');cwStart(SYS)};

/* ---------- EDITOR DE SISTEMA: área própria, em tela cheia ---------- */
const SEC=[['geral','Visão geral'],['attr','Atributos'],['skills','Perícias'],['itens','Itens'],['fluxo','Criação'],['bars','Barras'],['rec','Recursos'],['calc','Contas'],['ficha','Ficha']];
const SECN=Object.fromEntries(SEC);
const ICO={geral:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',attr:'<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/>',skills:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',itens:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',fluxo:'<path d="M5 4h6v3a2 2 0 1 0 4 0V4h4v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H5z"/>',rec:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9v6M12 9v6M15 9v6"/>',bars:'<path d="M3 6h18M3 12h12M3 18h15"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',ficha:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6 16c.6-2.2 5.4-2.2 6 0"/>'};
const sedIc=id=>`<svg class="sed-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[id]}</svg>`;
const BAD=/[<>&"'`\\]/,BAD_MSG='símbolos que não pode ter: < > & " \' ` \\';
let E=null,eid=1;
const opItems=()=>ILIB.map(i=>({n:i.n,g:i.g,esp:i.esp||0,d:(i.t==='arma'?'Cat. '+icat(i)+(i.tp?' · Tipo '+i.tp:'')+(i.mun?' · Munição: '+i.mun:'')+'\n':'')+(i.d||''),arma:i.t==='arma'?1:0,dano:i.dano||'',crit:i.crit||'',al:i.al&&i.al!=='—'?i.al:'',sk:i.sk||''}));
/* ---------- biblioteca de sistemas: guardar, exportar, importar e compartilhar ---------- */
const LIBK='rpg-sistemas-v1';
function libRead(){try{const j=JSON.parse(localStorage.getItem(LIBK)||'{}');return(Array.isArray(j.l)?j.l:[]).filter(x=>x&&typeof x.id==='string'&&x.mold&&typeof x.nome==='string'&&Number.isFinite(+x.v))}catch(e){return[]}}
function libWrite(l){try{localStorage.setItem(LIBK,JSON.stringify({v:1,l}));return true}catch(e){return false}}
const libId=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const b64e=s=>btoa(unescape(encodeURIComponent(s))),b64d=s=>decodeURIComponent(escape(atob(s)));
function libDownload(nome,text){
  const blob=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=(String(nome).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'sistema')+'.sistema.json';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function libImportText(t){
  t=String(t||'').trim();if(!t)return'Cole um código ou escolha um arquivo.';if(t.length>3000000)return'Esse conteúdo é grande demais.';
  let obj;try{if(t.startsWith('RPG1:'))t=b64d(t.slice(5).replace(/\s/g,''));obj=JSON.parse(t)}catch(e){return'Não consegui ler isso. Confira se copiou o código inteiro.'}
  if(!obj||obj.rpgSistema!==1||!obj.mold)return'Isso não parece um sistema desta ficha.';
  const m=cleanMold(obj.mold);if(!m)return'O sistema tem dados que não consegui aproveitar.';
  const l=libRead();l.push({id:libId(),nome:m.nome,v:1,t:Date.now(),mold:moldObj(m)});
  if(!libWrite(l))return'Não consegui salvar: o navegador não deixou usar o armazenamento.';
  if(E)E.imp=false;return'Importado: '+m.nome+' ('+m.atributos.length+' atributos, '+m.pericias.length+' perícias). Ele está na lista abaixo.'}
function startFromLib(en){
  const m=cleanMold(en.mold);if(!m)return;
  if(m.criacao.length){closeM('mNova');cwStart(m,{sid:en.id,sv:en.v});return}
  if(!slPush())return;
  clearTimeout(cloudSaveT);activeCloudId=null;const cfg=D.cfg;useMold(m);D=fresh();D.cfg=cfg;D.created=true;D.camp='nova';D.sid=en.id;D.sv=en.v;save();renderAll();closeM('mNova');go('char',1)}
function renderNvLib(){
  const l=libRead(),box=$('#nvLib');if(!box)return;
  box.innerHTML=l.length?'<p class="smu">Meus sistemas</p>'+l.map(x=>`<div class="rowb"><button class="btn" type="button" data-lib="${esc(x.id)}">Novo personagem: ${esc(x.nome)}</button></div>`).join(''):''}
$('#nvLib').addEventListener('click',e=>{const b=e.target.closest('[data-lib]');if(!b)return;const en=libRead().find(x=>x.id===b.dataset.lib);if(en)startFromLib(en)});
function libMold(){const iss=sysIssues();if(iss.length){E.msg2='Corrija antes: '+iss[0].msg;return null}const m=cleanMold(draftMold());if(!m){E.msg2='Não consegui montar o sistema.';return null}return m}
function libCard(){
  const l=libRead(),en=E.sid?l.find(x=>x.id===E.sid):null;
  const link=E.sid?(en?`<p class="smu">Este sistema vem da biblioteca: <b>${esc(en.nome)}</b>, versão ${en.v}.${!E.lib&&D.sid===E.sid&&D.sv!=null&&en.v>D.sv?` <span class="sed-warn2">Existe uma versão mais nova (${en.v}).</span> <button class="btn sm pri" type="button" data-act="libLoad" data-id="${esc(en.id)}">Carregar a versão nova no editor</button>`:''}</p>`:'<p class="smu">O sistema desta ficha não está mais na biblioteca deste aparelho.</p>'):'';
  const rows=l.map(x=>`<div class="lib-r"><div class="lib-i"><b>${esc(x.nome)}</b><small>versão ${x.v} · ${new Date(x.t).toLocaleDateString('pt-BR')}</small></div><div class="rowb"><button class="btn sm" type="button" data-act="libLoad" data-id="${esc(x.id)}">Carregar no editor</button><button class="btn sm" type="button" data-act="libNew" data-id="${esc(x.id)}">Novo personagem</button><button class="btn sm" type="button" data-act="libExp" data-id="${esc(x.id)}">Exportar</button>${E.ask&&E.ask.del===x.id?`<button class="btn sm dng" type="button" data-act="libDelOk" data-id="${esc(x.id)}">Apagar mesmo</button><button class="btn sm" type="button" data-act="libDelNo">Cancelar</button>`:`<button class="btn sm" type="button" data-act="libDel" data-id="${esc(x.id)}">Apagar</button>`}</div></div>`).join('');
  const imp=E.imp?`<div class="lib-imp"><p class="smu">Cole o código do sistema, ou escolha um arquivo .json.</p><textarea class="sin" id="libTxt" rows="3" placeholder="RPG1:…" aria-label="Código do sistema"></textarea><div class="rowb"><button class="btn sm pri" type="button" data-act="libImport">Importar</button><button class="btn sm" type="button" data-act="libFileBtn">Escolher arquivo…</button><button class="btn sm" type="button" data-act="libImpNo">Cancelar</button></div><input type="file" id="libFile" accept=".json,.txt,application/json,text/plain" hidden></div>`:'';
  const code=E.code?`<div class="lib-imp"><p class="smu">${E.codeOk?'Código copiado. ':''}Copie e mande para quem for usar o sistema:</p><textarea class="sin" id="libOut" rows="3" readonly aria-label="Código para compartilhar">${esc(E.code)}</textarea></div>`:'';
  return`<section class="sed-card"><h3>Biblioteca de sistemas</h3><p class="smu">Guarde este sistema neste aparelho, exporte pra mandar pra outra mesa, ou importe um que alguém mandou. A biblioteca fica só neste navegador.</p>${E.msg2?`<p class="sed-msg" role="status">${esc(E.msg2)}</p>`:''}${link}<div class="rowb"><button class="btn sm pri" type="button" data-act="libSave">Salvar na biblioteca</button><button class="btn sm" type="button" data-act="libExport">Exportar arquivo</button><button class="btn sm" type="button" data-act="libCode">Copiar código</button><button class="btn sm" type="button" data-act="libImpToggle">Importar…</button></div>${imp}${code}${l.length?`<div class="lib-l">${rows}</div>`:'<p class="smu">Nenhum sistema guardado ainda.</p>'}</section>`}
const LIBA=new Set(['libSave','libExport','libCode','libImpToggle','libImpNo','libFileBtn','libImport','libLoad','libNew','libExp','libDel','libDelNo','libDelOk']);
function libAct(a,b){
  const id=b.dataset.id,l=libRead();E.msg2='';
  if(a==='libSave'){const m=libMold();if(!m)return sedRender(true);const obj=moldObj(m),i=E.sid?l.findIndex(x=>x.id===E.sid):-1;let v=1;
    if(i>=0){v=l[i].v+1;l[i]={id:E.sid,nome:m.nome,v,t:Date.now(),mold:obj}}else{E.sid=libId();l.push({id:E.sid,nome:m.nome,v,t:Date.now(),mold:obj})}
    E.msg2=libWrite(l)?'Salvo na biblioteca (versão '+v+').':'Não consegui salvar: o navegador não deixou usar o armazenamento.';if(E.lib&&/^Salvo/.test(E.msg2))E.base=snap()}
  else if(a==='libExport'||a==='libCode'){const m=libMold();if(!m)return sedRender(true);const pack=JSON.stringify({rpgSistema:1,nome:m.nome,mold:moldObj(m)});
    if(a==='libExport'){libDownload(m.nome,pack);E.msg2='Arquivo gerado.'}
    else{E.code='RPG1:'+b64e(pack);E.codeOk=false;try{navigator.clipboard.writeText(E.code).then(()=>{if(E){E.codeOk=true;sedRender(true)}}).catch(()=>{})}catch(x){}}}
  else if(a==='libExp'){const en=l.find(x=>x.id===id);if(en){libDownload(en.nome,JSON.stringify({rpgSistema:1,nome:en.nome,mold:en.mold}));E.msg2='Arquivo gerado: '+en.nome}}
  else if(a==='libImpToggle'){E.imp=!E.imp}
  else if(a==='libImpNo'){E.imp=false}
  else if(a==='libFileBtn'){const f=$('#libFile');if(f)f.click();return}
  else if(a==='libImport'){E.msg2=libImportText(($('#libTxt')||{}).value)}
  else if(a==='libLoad'){const en=l.find(x=>x.id===id),m=en&&cleanMold(en.mold);
    if(!m)E.msg2='Esse sistema não pôde ser lido.';else{const keep={base:E.base,tipo0:E.tipo0,sec:E.sec,lib:E.lib};E=Object.assign(mkDraft(m,!E.lib),keep);E.sid=en.id;E.msg2='Carregado no editor. A ficha só muda quando você salvar.'}}
  else if(a==='libNew'){if(sedDirty())E.msg2='Salve ou descarte as alterações antes de criar um personagem.';else{const en=l.find(x=>x.id===id);if(en){sysClose();closeM('mSl');startFromLib(en);return}}}
  else if(a==='libDel'){E.ask={del:id}}else if(a==='libDelNo'){E.ask=null}
  else if(a==='libDelOk'){libWrite(l.filter(x=>x.id!==id));if(E.sid===id)E.sid=null;E.ask=null;E.msg2='Apagado da biblioteca.'}
  sedRender(true)}
function libFile(t){const f=t.files&&t.files[0];if(!f||!E)return;
  if(f.size>3e6){E.msg2='Esse arquivo é grande demais.';sedRender(true);return}
  const rd=new FileReader();rd.onload=()=>{if(!E)return;E.msg2=libImportText(String(rd.result||''));sedRender(true)};rd.onerror=()=>{if(E){E.msg2='Não consegui ler o arquivo.';sedRender(true)}};rd.readAsText(f)}
const mkItem=x=>({id:eid++,n:x.n,g:x.g,esp:x.esp,d:x.d,arma:x.arma,dano:x.dano,crit:x.crit,al:x.al,sk:x.sk});
/* rascunho: uma cópia do molde que você mexe sem afetar a ficha até salvar */
function mkDraft(m,fromSheet){
  const hasA=k=>fromSheet&&D.attr[k]!=null,curS=n=>fromSheet?D.sk.find(s=>s.n===n):null;
  const at=wheelOrder(m).map(k=>m.atributos.find(a=>a.k===k)).map(a=>({id:eid++,k:a.k,n:a.n,old:hasA(a.k)?a.k:null,shown:a.k}));
  const pe=m.pericias.map(p=>{const c=curS(p.n),ak=c&&c.a?c.a:p.a;return{n:p.n,aid:(at.find(x=>x.k===ak)||at[0]).id,t:c?(c.t?1:0):(p.t?1:0),b:p.b||'0',s:p.s?1:0,old:c?p.n:null}});
  return{nome:m.nome,rc:(m.recursos||[]).map(x=>({id:eid++,k:x.k,old:x.k,n:x.n,tipo:x.tipo,ini:x.ini,max:x.max})),tipo:m.teste.tipo,dados:m.teste.dados||'1d20',regra:m.teste.regra||'mod',modF:m.teste.modF||'V',faixas:(m.teste.faixas||[]).map(x=>({min:x.min,t:x.t})),ini:m.atributo.inicial,max:m.atributo.maxFicha,at,pe,
    it:(m.itens&&m.itens.length?m.itens:(m.id==='op'?opItems():[])).map(mkItem),qi:'',gi:'',undoI:null,fl:(m.criacao||[]).map(flWithIds),fh:[],fr:[],sid:null,imp:false,msg2:'',code:'',codeOk:false,fsel:null,fpre:'',noclick:0,
    bars:m.barras.map(b=>({n:b.n,maxF:b.maxF,iniF:b.iniF||''})),cl:(m.classes||[]).join(', '),vd:(m.derivados||[]).map(x=>({id:eid++,k:x.k,n:x.n,f:x.f})),f:{dt:m.formulas.dt,carga:m.formulas.carga},rot:Object.assign({},m.rotulos),usa:{rit:!!m.usa.rit},
    sec:'geral',q:'',ask:null,undo:null,leave:false,focus:'sedDt',iss:[],base:'',tipo0:SYS.teste.tipo}}
const snap=()=>JSON.stringify([E.nome,E.rc.map(x=>[x.n,x.tipo,x.ini,x.max]),E.tipo,E.dados,E.regra,E.modF,E.faixas,E.ini,E.max,E.at.map(a=>[a.k,a.n]),E.pe.map(p=>[p.n,E.at.findIndex(a=>a.id===p.aid),p.t,p.b,p.s]),E.it.map(x=>[x.n,x.g,x.esp,x.d,x.arma,x.dano,x.crit,x.al,x.sk]),E.fl.map(s=>[s.t,s.b.map(flStrip)]),E.bars,E.f,E.vd.map(x=>[x.k,x.n,x.f]),E.cl,E.rot,E.usa]);
const sedDirty=()=>!!E&&snap()!==E.base;
const kOf=id=>(E.at.find(a=>a.id===id)||E.at[0]).k.trim().toUpperCase();
const draftMold=()=>({nome:E.nome,teste:E.tipo==='soma'?{tipo:'soma',dados:E.dados,regra:E.regra,modF:E.modF,faixas:E.faixas}:{tipo:E.tipo},atributo:{inicial:E.ini,maxFicha:E.max},atributos:E.at.map(a=>({k:a.k,n:a.n})),
  pericias:E.pe.map(p=>({n:p.n,a:kOf(p.aid),t:p.t,b:p.b,s:p.s})),itens:E.it.map(x=>({n:x.n,g:x.g,esp:x.esp,d:x.d,arma:x.arma,dano:x.dano,crit:x.crit,al:x.al,sk:x.sk})),recursos:E.rc.map(x=>({k:x.k,n:x.n,tipo:x.tipo,ini:x.ini,max:x.max})),criacao:E.fl.map(s=>({t:s.t,b:s.b.map(flStrip)})),barras:E.bars,formulas:E.f,derivados:E.vd.map(x=>({k:x.k,n:x.n,f:x.f})),classes:E.cl.split(',').map(x=>x.trim()).filter(Boolean),rotulos:E.rot,usa:E.usa});
const evars=()=>{const v={PE:1,NIVEL:1,NEX:1,CLASSE:1};E.at.forEach(a=>{const k=a.k.trim().toUpperCase();if(k)v[k]=+E.ini||0});return v};
function sysIssues(){
  const out=[],add=(sec,msg)=>out.push({sec,msg}),ks=E.at.map(a=>a.k.trim().toUpperCase());
  if(BAD.test(E.nome))add('geral','O nome do sistema tem '+BAD_MSG+'.');
  E.at.forEach((a,i)=>{const k=ks[i],n=a.n.trim();
    if(!k)add('attr','O atributo '+(i+1)+' está sem sigla.');else if(k==='PE')add('attr','A sigla PE é reservada para o esforço por turno.');
    if(!n)add('attr','O atributo '+(k||(i+1))+' está sem nome.');else if(BAD.test(n))add('attr','O nome "'+n+'" tem '+BAD_MSG+'.')});
  const dup=ks.filter((k,i)=>k&&ks.indexOf(k)!==i);if(dup.length)add('attr','Siglas repetidas: '+[...new Set(dup)].join(', ')+'.');
  const mx=+E.max,ini=+E.ini;
  if(E.max===''||!Number.isInteger(mx)||mx<1||mx>999)add('attr','O valor máximo dos atributos deve ser um número de 1 a 999.');
  if(E.ini===''||!Number.isInteger(ini)||ini<0||ini>999||(Number.isInteger(mx)&&ini>mx))add('attr','O valor inicial dos atributos deve ser um número de 0 até o máximo.');
  if(E.tipo==='soma'){
    const dd=String(E.dados).replace(/\s/g,''),mm=/^(\d{1,2})d(\d{1,3})$/i.exec(dd);
    if(!mm||+mm[1]<1||+mm[2]<2)add('geral','Os dados "'+E.dados+'" não são válidos (use algo como 1d20, 2d6 ou 3d6).');
    if(evalF(E.modF,{V:10})===null)add('geral','A conta do modificador não é válida. Use V para o valor do atributo (ex.: V ou floor((V - 10) / 2)).');
    E.faixas.forEach((x,i)=>{if(x.min===''||!Number.isFinite(+x.min))add('geral','A faixa '+(i+1)+' precisa de um número.');if(!x.t.trim())add('geral','A faixa '+(i+1)+' está sem texto.');else if(BAD.test(x.t))add('geral','O texto da faixa '+(i+1)+' tem '+BAD_MSG+'.')})}
  const vars=evars(),names=new Set();
  E.pe.forEach((p,i)=>{const n=p.n.trim();
    if(!n){add('skills','A perícia '+(i+1)+' está sem nome.');return}
    if(BAD.test(n))add('skills','O nome "'+n+'" tem '+BAD_MSG+'.');
    if(names.has(n.toLowerCase()))add('skills','A perícia "'+n+'" aparece duas vezes.');names.add(n.toLowerCase());
    if(E.tipo==='d100'&&evalF(p.b,vars)===null)add('skills','A base de "'+n+'" não é uma conta válida.')});
  const ik=new Set();
  E.it.forEach((x,i)=>{const n=x.n.trim(),g=x.g.trim()||'Itens';
    if(!n){add('itens','O item '+(i+1)+' está sem nome.');return}
    if(BAD.test(n)||BAD.test(g)||BAD.test(x.dano)||BAD.test(x.crit)||BAD.test(x.al))add('itens','O item "'+n+'" tem '+BAD_MSG+'.');
    const key=(g+'|'+n).toLowerCase();if(ik.has(key))add('itens','O item "'+n+'" aparece duas vezes no grupo "'+g+'".');ik.add(key);
    if(!(+x.esp>=0&&+x.esp<=99))add('itens','Os espaços de "'+n+'" devem ir de 0 a 99.');
    if(x.arma&&(!x.dano.trim()||parseF(x.dano)===null))add('itens','O dano de "'+n+'" precisa ser algo como 1d6+2.')});
  flIssues(add,vars);
  E.rc.forEach((x,i)=>{const n=x.n.trim();
    if(!n){add('rec','O recurso '+(i+1)+' está sem nome.');return}
    if(BAD.test(n))add('rec','O nome "'+n+'" tem '+BAD_MSG+'.');
    const mx=+x.max,ini=+x.ini;
    if(x.tipo!=='marca'&&(x.max===''||!Number.isInteger(mx)||mx<1||mx>999))add('rec','O máximo de "'+n+'" deve ser um número de 1 a 999.');
    if(x.ini===''||!Number.isInteger(ini)||ini<0||(x.tipo==='marca'?ini>1:ini>mx))add('rec','O valor inicial de "'+n+'" deve ir de 0 até o máximo.')});
  E.bars.forEach((b,i)=>{const nm=b.n.trim();
    if(!nm)add('bars','A barra '+(i+1)+' está sem nome.');else if(BAD.test(nm))add('bars','O nome da barra "'+nm+'" tem '+BAD_MSG+'.');
    if(evalF(b.maxF,vars)===null)add('bars','O máximo da barra "'+(nm||i+1)+'" não é uma conta válida.');
    if(b.iniF.trim()&&evalF(b.iniF,vars)===null)add('bars','O valor inicial da barra "'+(nm||i+1)+'" não é uma conta válida.')});
  if(evalF(E.f.dt,vars)===null)add('calc','A conta da DT dos rituais não é válida. '+fErr(E.f.dt,vars));
  if(evalF(E.f.carga,vars)===null)add('calc','A conta da carga máxima não é válida. '+fErr(E.f.carga,vars));
  {const dvSeen=new Set();E.vd.forEach((x,i)=>{const k=x.k.trim().toUpperCase(),nm=x.n.trim()||k||('valor '+(i+1));
    if(!k)add('calc','O valor "'+nm+'" precisa de uma sigla.');
    else if(!/^[A-Z_][A-Z0-9_]*$/.test(k))add('calc','A sigla "'+k+'" precisa começar com letra e usar só letras, números e _.');
    else if(['PE','NIVEL','NEX','CLASSE'].includes(k)||E.at.some(a=>a.k.trim().toUpperCase()===k)||dvSeen.has(k))add('calc','A sigla "'+k+'" já está em uso.');
    dvSeen.add(k);
    if(evalF(x.f,vars)===null)add('calc','A conta do valor "'+nm+'" não é válida. '+fErr(x.f,vars))})}
  if(ROT_KEYS.some(k=>BAD.test(E.rot[k])))add('ficha','Um dos nomes da ficha tem '+BAD_MSG+'.');
  return out}

/* ---------- peças de tela ---------- */
const sf=(label,inner,hint)=>`<label class="fl"><span>${label}</span>${inner}${hint?`<small class="smu">${hint}</small>`:''}</label>`;
const inp=(bind,val,ex)=>`<input class="sin" data-bind="${bind}" value="${esc(val)}" ${ex||''}>`;
function pvWheel(){
  const n=E.at.length,chord=n>1?2*31*Math.sin(Math.PI/n):62,hw=Math.min(31,Math.round(chord*86)/100);
  const hex=E.at.map((a,i)=>{const g=(-90+i*360/n)*Math.PI/180,x=50+31*Math.cos(g),y=50+31*Math.sin(g);
    return`<div class="hex" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)}"><span class="hn">${esc(String(E.ini))}</span><span class="hk">${esc(a.n.trim()||'sem nome')}</span><span class="ha">${esc(a.k.trim().toUpperCase()||'?')}</span></div>`}).join('');
  return`<div class="wheel pv" style="--hw:${hw};--k:${(hw/31).toFixed(3)}"><svg class="wsvg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".4" stroke-dasharray="1.2 1.8"/><circle cx="50" cy="50" r="45.5" fill="none" stroke="rgba(255,255,255,.1)" stroke-width=".3"/><circle cx="50" cy="50" r="20" fill="#e9e5f2"/><text x="50" y="51.8" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="4.6" fill="#15121c" letter-spacing=".2">ATRIBUTOS</text></svg>${hex}</div>`}
const head=(t,d)=>`<div class="sed-h"><h2>${t}</h2><p>${d}</p></div>`;

function somaPanel(){
  const fx=E.faixas.map((x,i)=>`<div class="sfx" data-g="x" data-i="${i}"><span>A partir de</span><input class="sin" type="number" inputmode="numeric" data-f="min" value="${esc(String(x.min))}" aria-label="Faixa ${i+1}: a partir de"><input class="sin" data-f="t" value="${esc(x.t)}" maxlength="40" placeholder="Texto do resultado" aria-label="Faixa ${i+1}: texto"><button class="sib" type="button" data-act="rmX" aria-label="Remover faixa">✕</button></div>`).join('');
  return`<section class="sed-card"><h3>Detalhes da soma de dados</h3>
  <div class="sed-pair">${sf('Dados',inp('dados',E.dados,'maxlength="12" spellcheck="false"'),'Ex.: 1d20, 2d6, 3d6.')}<label class="fl"><span>Regra</span><select class="sin" data-bind="regra" aria-label="Regra do teste"><option value="mod"${E.regra==='mod'?' selected':''}>Somar o modificador</option><option value="abaixo"${E.regra==='abaixo'?' selected':''}>Tirar o valor ou menos</option></select></label></div>
  ${sf('Modificador do atributo',inp('modF',E.modF,'maxlength="60" spellcheck="false"'),'Use V para o valor do atributo. V = o próprio valor (2d6 + atributo). floor((V - 10) / 2) = o modificador do d20.')}
  ${E.regra==='mod'?`<div class="sech"><h3>Faixas de resultado</h3><button class="btn sm" type="button" data-act="addX"${E.faixas.length>=6?' disabled':''}>+ Faixa</button></div><p class="smu">Opcional. Mostra um texto conforme o total (ex.: 10 ou mais = Sucesso total). A ficha usa a primeira faixa que o total alcança, de cima pra baixo.</p>${fx||'<p class="smu">Sem faixas. A ficha mostra só o total, e compara com a CD se você digitar uma.</p>'}`:'<p class="smu">Com esta regra a ficha mostra se você tirou o valor da perícia ou menos, e quanto sobrou.</p>'}</section>`}
function secGeral(){
  const tp=(v,t,d)=>`<button type="button" class="optc" data-act="tipo" data-v="${v}" aria-pressed="${E.tipo===v}"><b>${t}</b><span>${d}</span></button>`;
  const soma=E.tipo==='soma'?somaPanel():'';
  const tw=E.tipo!==E.tipo0?'<p class="sed-warn">Trocar o tipo de teste reinicia os valores dos atributos e das barras desta ficha quando você salvar.</p>':'';
  const tn={op:'Ordem Paranormal',coc:'Call of Cthulhu',dnd:'d20 + modificador',pbta:'2d6 + atributo',blank:'Em branco'};
  const ask=E.ask&&E.ask.tpl?`<div class="sed-ask2"><span>Carregar o modelo <b>${tn[E.ask.tpl]}</b>? Atributos, perícias, barras e contas do editor serão trocados.</span><div class="rowb"><button class="btn pri sm" type="button" data-act="tplok">Carregar</button><button class="btn sm" type="button" data-act="tplno">Cancelar</button></div></div>`:'';
  const iss=E.iss.length?`<ul class="sed-iss">${E.iss.map(x=>`<li><button type="button" class="sed-link" data-act="goto" data-v="${x.sec}">${SECN[x.sec]}</button><span>${esc(x.msg)}</span></li>`).join('')}</ul>`:'<p class="sed-ok">Tudo certo. Dá pra salvar.</p>';
  return head('Visão geral','Dê um nome ao sistema, escolha como os testes funcionam e, se quiser, comece de um modelo pronto.')+
  `<section class="sed-card"><h3>Nome do sistema</h3>${inp('nome',E.nome,'maxlength="40" aria-label="Nome do sistema"')}</section>
  <section class="sed-card"><h3>Como o teste funciona</h3><div class="opt2">${tp('pool','Vários d20','Rola um d20 por ponto do atributo e fica com o maior. Perícias somam bônus de treino. É o jeito do Ordem Paranormal.')}${tp('d100','Um d100','Rola 1d100 e tenta tirar o valor da perícia ou menos, com sucesso difícil, extremo e dados de bônus. É o jeito do Call of Cthulhu.')}${tp('soma','Soma de dados','Rola dados e soma o modificador do atributo (d20 + mod, 2d6 + atributo) ou tenta tirar o valor ou menos (3d6). Dá pra definir faixas de resultado.')}</div>${tw}</section>${soma}
  <section class="sed-card"><h3>Começar de um modelo</h3><p class="smu">Troca tudo que está no editor pelo modelo escolhido. A ficha só muda quando você salvar.</p><div class="rowb"><button class="btn" type="button" data-act="tpl" data-v="op">Ordem Paranormal</button><button class="btn" type="button" data-act="tpl" data-v="coc">Call of Cthulhu</button><button class="btn" type="button" data-act="tpl" data-v="dnd">d20 + modificador</button><button class="btn" type="button" data-act="tpl" data-v="pbta">2d6 + atributo</button><button class="btn" type="button" data-act="tpl" data-v="blank">Em branco</button></div>${ask}</section>
  ${libCard()}
  <section class="sed-card"><h3>Resumo</h3><ul class="sed-sum"><li><b>${E.at.length}</b> atributos</li><li><b>${E.pe.length}</b> perícias</li><li>Teste: <b>${E.tipo==='d100'?'um d100':E.tipo==='soma'?E.dados+' somado':'vários d20'}</b></li></ul>${iss}</section>`}

function secAttr(){
  const n=E.at.length,last=n-1;
  const rows=E.at.map((a,i)=>`<div class="sar" data-g="a" data-i="${i}"><input class="sin" data-f="k" value="${esc(a.k)}" maxlength="5" placeholder="SIG" aria-label="Sigla do atributo ${i+1}"><input class="sin" data-f="n" value="${esc(a.n)}" maxlength="24" placeholder="Nome" aria-label="Nome do atributo ${i+1}"><button class="sib" type="button" data-act="up" aria-label="Subir"${i?'':' disabled'}>↑</button><button class="sib" type="button" data-act="down" aria-label="Descer"${i<last?'':' disabled'}>↓</button><button class="sib" type="button" data-act="rm" aria-label="Remover atributo"${n>1?'':' disabled'}>✕</button></div>`).join('');
  return head('Atributos','Escolha quantos atributos o sistema tem e como eles se chamam. A ordem da lista é a ordem no círculo da ficha.')+
  `<div class="sed-two"><div class="sed-col"><section class="sed-card"><div class="sech"><h3>Lista <small>${n}/${MAX_ATTR}</small></h3><button class="btn sm" type="button" data-act="addA"${n>=MAX_ATTR?' disabled':''}>+ Atributo</button></div><p class="smu">A sigla tem até 5 letras ou números e é usada nas contas (ex.: <b>FOR</b>).</p>${rows}</section>
  <section class="sed-card"><h3>Valores</h3><div class="sed-pair">${sf('Valor inicial',inp('ini',E.ini,'type="number" inputmode="numeric" min="0" max="999"'),E.tipo==='d100'?'No d100 costuma ser 50.':'No d20 costuma ser 1.')}${sf('Valor máximo',inp('max',E.max,'type="number" inputmode="numeric" min="1" max="999"'),'O maior valor que a ficha aceita.')}</div></section></div>
  <section class="sed-card sed-pv"><h3>Prévia</h3><div id="pvBox">${pvWheel()}</div><p class="smu">É assim que o círculo vai aparecer na ficha.</p></section></div>`}

function skillRows(){
  const q=E.q.trim().toLowerCase(),d=E.tipo==='d100',vars=evars();
  const opts=sel=>E.at.map(a=>`<option value="${a.id}"${a.id===sel?' selected':''}>${esc(a.k.trim().toUpperCase()||'?')}</option>`).join('');
  const rows=E.pe.map((p,i)=>({p,i})).filter(({p})=>!q||p.n.toLowerCase().includes(q)).map(({p,i})=>{
    const nm=`<input class="sin" data-f="n" value="${esc(p.n)}" maxlength="40" placeholder="Nome da perícia" aria-label="Nome da perícia ${i+1}">`,rm=`<button class="sib" type="button" data-act="rm" aria-label="Remover perícia">✕</button>`;
    if(d){const ev=evalF(p.b,vars);
      return`<div class="spr d" data-g="p" data-i="${i}">${nm}<label class="sbase"><span>Base</span><input class="sin" data-f="b" value="${esc(p.b)}" maxlength="60" spellcheck="false" aria-label="Base de ${esc(p.n||'perícia')}"><em>${ev==null?'⚠':'= '+Math.floor(ev)}</em></label><label class="ck sck" title="A pessoa escreve uma especialidade (ex.: Lutar (Machado))"><input type="checkbox" data-f="s"${p.s?' checked':''}><span>Pede especialidade</span></label>${rm}</div>`}
    if(E.tipo==='soma')return`<div class="spr som" data-g="p" data-i="${i}">${nm}<select class="sin" data-f="aid" aria-label="Atributo de ${esc(p.n||'perícia')}">${opts(p.aid)}</select>${rm}</div>`;
    return`<div class="spr" data-g="p" data-i="${i}">${nm}<select class="sin" data-f="aid" aria-label="Atributo de ${esc(p.n||'perícia')}">${opts(p.aid)}</select><label class="ck sck" title="Só quem tem treino pode usar"><input type="checkbox" data-f="t"${p.t?' checked':''}><span>Só treinados</span></label>${rm}</div>`}).join('');
  return rows||`<p class="smu">${E.pe.length?'Nada encontrado para essa busca.':'Nenhuma perícia ainda. Use "+ Perícia" ou preencha com as de um modelo.'}</p>`}
function secSkills(){
  const d=E.tipo==='d100';
  return head('Perícias',d?'Cada perícia tem um valor-base, que pode ser um número ou uma conta com os atributos (ex.: <b>floor(DES / 2)</b>).':E.tipo==='soma'?'Cada perícia usa um dos atributos. O bônus de cada personagem é preenchido na ficha.':'Cada perícia usa um dos atributos. Marque "só treinados" nas que exigem treino.')+
  `<section class="sed-card"><div class="sed-tools"><input class="sin" type="search" data-bind="q" value="${esc(E.q)}" placeholder="Buscar perícia" aria-label="Buscar perícia"><div class="rowb"><button class="btn sm" type="button" data-act="addP"${E.pe.length>=MAX_PER?' disabled':''}>+ Perícia</button><button class="btn sm" type="button" data-act="sortP">Ordem A–Z</button></div></div>
  <div class="sed-tools"><span class="smu">Preencher a lista com:</span><div class="rowb"><button class="btn sm" type="button" data-act="fillP" data-v="op">Perícias do OP</button><button class="btn sm" type="button" data-act="fillP" data-v="coc">Perícias do CoC</button><button class="btn sm" type="button" data-act="clearP">Apagar todas</button>${E.undo?'<button class="btn sm pri" type="button" data-act="undoP">Desfazer</button>':''}</div></div>
  ${d?'<p class="smu">As perícias do OP não têm valor-base no d100, então entram com base 0.</p>':''}
  <div class="sech"><h3>Lista <small id="pcnt">${E.pe.length}/${MAX_PER}</small></h3></div><div class="spl" id="spl">${skillRows()}</div></section>`}

function barPrev(i){const b=E.bars[i],v=evars(),mx=evalF(b.maxF,v),ci=b.iniF.trim()?evalF(b.iniF,v):mx;
  return mx==null?'⚠ Máximo: '+esc(fErr(b.maxF,v)):ci==null?'⚠ Começa com: '+esc(fErr(b.iniF,v)):'Com os atributos no valor inicial: começa em <b>'+Math.max(0,Math.min(Math.round(mx),Math.round(ci)))+'</b> de <b>'+Math.max(0,Math.round(mx))+'</b>.'}
function secBars(){
  const cols=['#c1343a','#9440cf','#e0a63a'];
  return head('Barras','São três barras, com as cores fixas (vermelha, roxa e laranja). Você muda o nome e as contas. Se o máximo usa atributos, a barra acompanha eles sozinha.')+fxCard()+
  E.bars.map((b,i)=>`<section class="sed-card"><div class="sech"><h3><i class="sbd" style="background:${cols[i]}"></i>Barra ${i+1}</h3></div><div class="sed-trip">${sf('Nome',inp('bars.'+i+'.n',b.n,'maxlength="24"'))}${sf('Máximo',inp('bars.'+i+'.maxF',b.maxF,'maxlength="120" spellcheck="false" data-fx="1"'),'Número ou conta.')}${sf('Começa com',inp('bars.'+i+'.iniF',b.iniF,'maxlength="120" spellcheck="false" placeholder="cheia" data-fx="1"'),'Vazio = começa cheia.')}</div><p class="smu sed-bp" data-bp="${i}">${barPrev(i)}</p></section>`).join('')}

const fmtN=v=>String(Math.round(v*100)/100);
const tvars=()=>Object.assign(evars(),E.tv||{});
const calcRes=f=>{const v=evalF(f,tvars());return v==null?'⚠ '+fErr(f,tvars()):'= '+fmtN(v)};
/* ---------- contas: atalhos, valores próprios e teste ao vivo ---------- */
const FXFN=[['se(, , )','se( )','se(condição, então, senão): escolhe um valor conforme a condição'],['max(, )','max( )','o maior'],['min(, )','min( )','o menor'],['floor()','floor( )','arredonda pra baixo'],['ceil()','ceil( )','arredonda pra cima'],['round()','round( )','arredonda pro mais próximo'],['abs()','abs( )','tira o sinal negativo'],['sqrt()','sqrt( )','raiz quadrada'],['e(, )','e( )','vale se TODAS as condições forem verdadeiras'],['ou(, )','ou( )','vale se PELO MENOS UMA for verdadeira'],['nao()','nao( )','inverte verdadeiro e falso']];
const FXOP=[[' + ','+'],[' - ','−'],[' * ','×'],[' / ','÷'],[' % ','% resto'],[' ^ ','^ potência'],[' >= ','≥'],[' <= ','≤'],[' > ','>'],[' < ','<'],[' == ','= igual'],[' != ','≠']];
const dvKeysNow=()=>E.vd.map(x=>x.k.trim().toUpperCase()).filter(Boolean);
function fxChips(){
  const ch=(v,t,tt,cls)=>`<button class="chipk${cls?' '+cls:''}" type="button" data-act="ins" data-v="${esc(v)}"${tt?` title="${esc(tt)}"`:''}>${esc(t)}</button>`;
  const keys=['PE','NIVEL','NEX','CLASSE'].concat(E.at.map(a=>a.k.trim().toUpperCase()).filter(Boolean),dvKeysNow());
  return`<div class="fx-g"><small>Siglas</small><div class="chips">${keys.map(k=>ch(k,k)).join('')}</div></div>
  <div class="fx-g"><small>Funções</small><div class="chips">${FXFN.map(f=>ch(f[0],f[1],f[2],'fx-fn')).join('')}</div></div>
  <div class="fx-g"><small>Contas e comparações</small><div class="chips">${FXOP.map(o=>ch(o[0],o[1],'','fx-fn')).join('')}</div></div>`}
const fxCard=()=>`<section class="sed-card"><h3>Atalhos para as contas</h3><p class="smu">Toque num campo de conta e depois num atalho: ele entra onde o cursor estiver.</p>${fxChips()}</section>`;
const dvRes=i=>{const x=E.vd[i];if(!x)return'';const v=evalF(x.f,tvars());return v==null?'⚠':'= '+fmtN(v)};
function dvRow(x,i){
  return`<div class="dv-r" data-g="v" data-i="${i}"><input class="sin" data-f="n" value="${esc(x.n)}" maxlength="24" placeholder="Nome (ex.: Bônus de dano)" aria-label="Nome do valor ${i+1}">
  <input class="sin dv-k" data-f="k" value="${esc(x.k)}" maxlength="12" placeholder="SIGLA" spellcheck="false" aria-label="Sigla do valor ${i+1}">
  <input class="sin dv-f" data-bind="vd.${i}.f" id="sedDv${i}" data-fx="1" value="${esc(x.f)}" maxlength="120" spellcheck="false" placeholder="conta" aria-label="Conta do valor ${i+1}">
  <b class="dv-res" data-dvres="${i}" title="${esc(dvRes(i)==='⚠'?fErr(x.f,tvars()):'')}">${esc(dvRes(i))}</b>
  <button class="sib" type="button" data-act="rmV" aria-label="Remover valor ${i+1}">✕</button></div>`}
/* receita completa do Ordem Paranormal: PV, Sanidade e Esforço por classe e NEX, DT dos rituais e Defesa (valores de memória: conferir com o livro) */
const OPREC={cl:'Combatente, Especialista, Ocultista',dt:'10 + LIM + PRE',bars:['PVB + VIG + PASSOS * (PVN + VIG)','SANB + PASSOS * SANN','PEB + PRE + PASSOS * (PEN + PRE)'],
  vd:[['PASSOS','Passos de NEX','max(0, ceil(NEX / 5) - 1)'],['LIM','Limite de PE por turno','max(1, ceil(NEX / 5))'],['DEF','Defesa','10 + AGI'],
  ['PVB','PV inicial','se(CLASSE == 1, 20, se(CLASSE == 2, 16, se(CLASSE == 3, 12, 8)))'],['PVN','PV por NEX','se(CLASSE == 1, 4, se(CLASSE == 2, 3, se(CLASSE == 3, 2, 0)))'],
  ['PEB','PE inicial','se(CLASSE == 1, 2, se(CLASSE == 2, 3, se(CLASSE == 3, 4, 1)))'],['PEN','PE por NEX','se(CLASSE == 1, 2, se(CLASSE == 2, 3, se(CLASSE == 3, 4, 0)))'],
  ['SANB','Sanidade inicial','se(CLASSE == 1, 12, se(CLASSE == 2, 16, se(CLASSE == 3, 20, 10)))'],['SANN','Sanidade por NEX','se(CLASSE == 1, 3, se(CLASSE == 2, 4, se(CLASSE == 3, 5, 0)))']]};
function dvPre(){
  const A=E.at.map(a=>a.k.trim().toUpperCase()).filter(Boolean),a0=A[0]||'ATR',a1=A[1]||a0;
  return[
    {n:'Modificador',k:'MOD',f:`floor((${a0} - 10) / 2)`,d:`estilo D&D: sobe 1 a cada 2 pontos acima de 10 em ${a0}`},
    {n:'Bônus de proficiência',k:'PROF',f:'2 + floor((NIVEL - 1) / 4)',d:'sobe com o nível'},
    {n:'Bônus de dano',k:'BDANO',f:`se(${a0} + ${a1} >= 90, 3, se(${a0} + ${a1} >= 60, 2, se(${a0} + ${a1} >= 30, 1, 0)))`,d:'por faixas, com um se dentro do outro'},
    {n:'Deslocamento',k:'DESL',f:`min(12, 6 + floor(${a1} / 10))`,d:'com teto de 12'},
    {n:'Metade do maior atributo',k:'METADE',f:`floor(max(${A.join(', ')||a0}) / 2)`,d:'usa o maior de todos os atributos'}]}
function dvKey(b){let k=b,j=2;const used=new Set(E.vd.map(x=>x.k.trim().toUpperCase()).concat(E.at.map(a=>a.k.trim().toUpperCase()),['PE','NIVEL','NEX','CLASSE']));while(used.has(k))k=b+(j++);return k}
function tstRows(){
  const v=tvars(),row=(l,f)=>{const r=evalF(f,v);return`<tr><td>${esc(l)}</td><td><code>${esc(f)}</code></td><td class="${r==null?'bad':''}">${r==null?'⚠':esc(fmtN(r))}</td></tr>`};
  let h='';
  E.bars.forEach((b,i)=>{const nm=b.n.trim()||('Barra '+(i+1));h+=row(nm+' (máximo)',b.maxF);if(b.iniF.trim())h+=row(nm+' (começa com)',b.iniF)});
  if(E.usa.rit)h+=row('DT dos rituais',E.f.dt);
  h+=row('Carga máxima',E.f.carga);
  E.vd.forEach(x=>{h+=row(x.n.trim()||x.k||'Valor',x.f)});
  return h}
function secCalc(){
  const a0=(E.at[0]&&E.at[0].k.trim().toUpperCase())||'ATR',a1=(E.at[1]&&E.at[1].k.trim().toUpperCase())||a0;
  const ex=[[`floor((${a0} + ${a1}) / 10)`,'divide e arredonda pra baixo'],[`max(2, 5 * ${a0})`,'nunca menos que 2'],[`min(99, ${a0} * 5)`,'com teto em 99'],[`se(${a0} >= 60, 10, 5)`,'10 se for 60 ou mais, senão 5'],[`se(e(${a0} >= 50, ${a1} >= 50), 3, 0)`,'3 só se os dois forem 50 ou mais'],[`${a0} % 10`,'o resto da divisão por 10'],[`${a0} ^ 2`,'elevado ao quadrado']];
  const vd=E.vd.map(dvRow).join('');
  const tv=tvars(),tin=Object.keys(tv).map(k=>`<label class="tst-f"><span>${esc(k)}</span><input class="sin" type="number" inputmode="numeric" data-tst="${esc(k)}" value="${esc(String(tv[k]))}" aria-label="Valor de teste de ${esc(k)}"></label>`).join('');
  return head('Contas','Contas automáticas da ficha. Elas usam as siglas dos atributos e se atualizam sozinhas. Aqui você também cria valores próprios e testa tudo ao vivo.')+
  fxCard()+
  `<section class="sed-card"><h3>Classes</h3><p class="smu">Escreva as classes do sistema separadas por vírgula. Na conta, a sigla <b>CLASSE</b> vale 1 para a primeira, 2 para a segunda e assim por diante, e 0 para qualquer outra coisa (campo vazio, mundano). Use o mesmo nome no campo Classe da ficha.</p>${inp('cl',E.cl,'maxlength="120" spellcheck="false" placeholder="Ex.: Combatente, Especialista, Ocultista"')}</section>
  <section class="sed-card"><h3>Receita pronta: Ordem Paranormal</h3><p class="smu">Preenche de uma vez as barras de Vida, Sanidade e Esforço (por classe e NEX), a DT dos rituais, a Defesa e a lista de classes. Precisa dos atributos AGI, PRE e VIG. Só vale no rascunho: nada muda na ficha até você tocar em Salvar. Os números vieram de memória, confira com o seu livro.</p><button class="btn sm" type="button" data-act="preOP">Aplicar contas do Ordem Paranormal</button></section>
  <section class="sed-card"><h3>DT dos rituais</h3>${inp('f.dt',E.f.dt,'id="sedDt" data-fx="1" maxlength="120" spellcheck="false"')}<p class="smu sed-res" data-res="f.dt">${calcRes(E.f.dt)}</p>${E.usa.rit?'':'<p class="smu">A aba de Rituais está desligada neste sistema, então esta conta não aparece.</p>'}</section>
  <section class="sed-card"><h3>Carga máxima (espaços)</h3>${inp('f.carga',E.f.carga,'id="sedCg" data-fx="1" maxlength="120" spellcheck="false"')}<p class="smu sed-res" data-res="f.carga">${calcRes(E.f.carga)}</p></section>
  <section class="sed-card"><div class="sech"><h3>Valores próprios <small>${E.vd.length}/${MAX_DV}</small></h3><button class="btn sm" type="button" data-act="addV"${E.vd.length>=MAX_DV?' disabled':''}>+ Valor</button></div>
  <p class="smu">Crie uma sigla nova a partir de uma conta (ex.: <b>BDANO</b> = bônus de dano). Depois é só usar a sigla em qualquer outra conta, nas barras ou nos blocos de criação, e o valor aparece na ficha. Um valor pode usar os que estão acima dele.</p>
  ${vd||'<p class="smu">Nenhum valor ainda. Comece por uma receita pronta:</p>'}
  <div class="fx-g"><small>Receitas prontas (toque pra adicionar)</small><div class="chips">${dvPre().map((p,j)=>`<button class="chipk fx-ex" type="button" data-act="preV" data-v="${j}" title="${esc(p.d)}"${E.vd.length>=MAX_DV?' disabled':''}>${esc(p.n)}</button>`).join('')}</div></div></section>
  <section class="sed-card"><h3>Testar as contas</h3><p class="smu">Mude os números e veja todas as contas deste sistema se atualizarem. Isto é só um teste: não altera o sistema.</p><div class="tst-in">${tin}</div><div class="tst-w"><table class="tst-t"><tbody id="tstOut">${tstRows()}</tbody></table></div></section>
  <section class="sed-card"><h3>O que dá pra escrever</h3><ul class="sed-help"><li>As quatro contas <b>+ − * /</b>, o resto <b>%</b>, a potência <b>^</b> e parênteses.</li><li>Comparações: <b>&gt;</b> <b>&lt;</b> <b>&gt;=</b> <b>&lt;=</b> <b>==</b> <b>!=</b>. Dão 1 se for verdade e 0 se não for.</li><li><b>se( cond, então, senão )</b> escolhe um valor conforme a condição. Dá pra colocar um se dentro do outro.</li><li><b>e( , )</b>, <b>ou( , )</b> e <b>nao( )</b> combinam condições.</li><li><b>max</b> e <b>min</b> pegam o maior e o menor. <b>floor</b>, <b>ceil</b> e <b>round</b> arredondam. <b>abs</b> tira o sinal e <b>sqrt</b> é a raiz.</li><li>Dividir por zero dá 0, não trava a ficha.</li></ul>
  <div class="fx-g"><small>Exemplos (toque pra inserir no campo selecionado)</small><div class="chips">${ex.map(x=>`<button class="chipk fx-ex" type="button" data-act="ins" data-v="${esc(x[0])}" title="${esc(x[1])}">${esc(x[0])}</button>`).join('')}</div></div></section>`}

function secFicha(){
  const f=(k,l)=>sf(l,inp('rot.'+k,E.rot[k],'maxlength="24"'));
  return head('Ficha','Escolha os nomes dos campos da ficha e quais abas aparecem. Deixe um nome vazio pra esconder o campo.')+
  `<section class="sed-card"><h3>Nomes dos campos</h3><div class="sed-trip">${f('ori','Origem')}${f('cls','Classe')}${f('nivel','Primeiro número')}${f('nex','Segundo número')}${f('pe','Terceiro número')}${f('desl','Quarto número')}</div><p class="smu">Os quatro números ficam numa faixa abaixo do círculo de atributos. No OP são Nível, NEX, PE/turno e Deslocamento.</p></section>
  <section class="sed-card"><h3>Abas</h3><label class="ck"><input type="checkbox" data-bind="usa.rit"${E.usa.rit?' checked':''}><span>Usar a aba de Rituais (círculos, elementos e DT)</span></label></section>`}

function itemRows(){
  const q=E.qi.trim().toLowerCase(),gf=E.gi,names=E.pe.map(p=>p.n.trim()).filter(Boolean),d100=E.tipo==='d100';
  const cell=(f,l,v,ex)=>`<label class="fl"><span>${l}</span><input class="sin" data-f="${f}" value="${esc(v)}" ${ex||''}></label>`;
  const rows=E.it.map((x,i)=>({x,i})).filter(({x})=>(!gf||(x.g.trim()||'Itens')===gf)&&(!q||(x.n+' '+x.g+' '+x.d).toLowerCase().includes(q))).map(({x,i})=>{
    const sk=names.map(n=>`<option value="${esc(n)}"${n===x.sk?' selected':''}>${esc(n)}</option>`).join('');
    const w=x.arma?`<div class="itr-w">${cell('dano','Dano',x.dano,'maxlength="24" placeholder="1d6+2"')}${E.tipo!=='pool'?'':cell('crit','Crítico',x.crit,'maxlength="12" placeholder="19/x2"')}${cell('al','Alcance',x.al,'maxlength="24"')}<label class="fl"><span>Perícia do ataque</span><select class="sin" data-f="sk"><option value="">(nenhuma)</option>${sk}</select></label></div>`:'';
    return`<div class="itr" data-g="i" data-i="${i}"><div class="itr-a"><input class="sin" data-f="n" value="${esc(x.n)}" maxlength="40" placeholder="Nome do item" aria-label="Nome do item ${i+1}"><input class="sin" data-f="g" list="itgl" value="${esc(x.g)}" maxlength="24" placeholder="Grupo" aria-label="Grupo do item ${i+1}"><input class="sin" type="number" data-f="esp" value="${esc(String(x.esp))}" step="0.5" min="0" max="99" aria-label="Espaços do item ${i+1}" title="Espaços"><button class="sib" type="button" data-act="rm" aria-label="Remover item">✕</button></div><textarea class="sin" data-f="d" rows="2" maxlength="400" placeholder="Descrição" aria-label="Descrição do item ${i+1}">${esc(x.d)}</textarea><label class="ck sck"><input type="checkbox" data-f="arma"${x.arma?' checked':''}><span>É uma arma (pode virar ataque)</span></label>${w}</div>`}).join('');
  return rows||`<p class="smu">${E.it.length?'Nada encontrado para essa busca.':'Nenhum item ainda. Use "+ Item" ou preencha com os de um modelo.'}</p>`}
function secItens(){
  const groups=[...new Set(E.it.map(x=>x.g.trim()||'Itens'))].sort((a,b)=>a.localeCompare(b,'pt'));
  const gopts=['<option value="">Todos os grupos</option>'].concat(groups.map(g=>`<option value="${esc(g)}"${E.gi===g?' selected':''}>${esc(g)}</option>`)).join('');
  return head('Itens','Esta é a biblioteca de itens do sistema. Ela abre pelo botão de biblioteca na aba Inventário, e itens marcados como arma também podem virar ataques.')+
  `<section class="sed-card"><div class="sed-tools"><input class="sin" type="search" data-bind="qi" value="${esc(E.qi)}" placeholder="Buscar item" aria-label="Buscar item"><select class="sin sed-gsel" data-bind="gi" aria-label="Filtrar por grupo">${gopts}</select><button class="btn sm" type="button" data-act="addI"${E.it.length>=MAX_ITEM?' disabled':''}>+ Item</button></div>
  <div class="sed-tools"><span class="smu">Preencher a biblioteca com:</span><div class="rowb"><button class="btn sm" type="button" data-act="fillI" data-v="op">Itens do OP</button><button class="btn sm" type="button" data-act="fillI" data-v="coc">Itens do CoC</button><button class="btn sm" type="button" data-act="clearI">Apagar todos</button>${E.undoI?'<button class="btn sm pri" type="button" data-act="undoI">Desfazer</button>':''}</div></div>
  <p class="smu">Os itens do CoC são uma lista inicial de exemplo, escrita por mim. Confira os valores com o seu livro.</p>
  <div class="sech"><h3>Lista <small id="icnt">${E.it.length}/${MAX_ITEM}</small></h3></div><datalist id="itgl">${groups.map(g=>`<option value="${esc(g)}"></option>`).join('')}</datalist><div class="spl" id="itl">${itemRows()}</div></section>`}
const newRecKey=()=>{const used=new Set(E.rc.map(x=>x.k).concat(E.rc.map(x=>x.old).filter(Boolean)));let j=1;while(used.has('r'+j))j++;return'r'+j};
const REC_PRE={sorte:{n:'Sorte',tipo:'barra',ini:50,max:99},estresse:{n:'Estresse',tipo:'barra',ini:0,max:10},municao:{n:'Munição',tipo:'contador',ini:6,max:30},inspiracao:{n:'Inspiração',tipo:'marca',ini:0,max:1}};
function secRec(){
  const n=E.rc.length;
  const rows=E.rc.map((x,i)=>`<div class="srr" data-g="r" data-i="${i}"><input class="sin" data-f="n" value="${esc(x.n)}" maxlength="24" placeholder="Nome do recurso" aria-label="Nome do recurso ${i+1}"><select class="sin" data-f="tipo" aria-label="Tipo do recurso ${i+1}"><option value="contador"${x.tipo==='contador'?' selected':''}>Contador</option><option value="barra"${x.tipo==='barra'?' selected':''}>Barra</option><option value="marca"${x.tipo==='marca'?' selected':''}>Caixa de marcar</option></select><label class="srv"><span>Começa em</span><input class="sin" type="number" inputmode="numeric" data-f="ini" value="${esc(String(x.ini))}" min="0" max="999" aria-label="Valor inicial de ${esc(x.n||'recurso')}"></label>${x.tipo==='marca'?'<span class="srv"></span>':`<label class="srv"><span>Máximo</span><input class="sin" type="number" inputmode="numeric" data-f="max" value="${esc(String(x.max))}" min="1" max="999" aria-label="Máximo de ${esc(x.n||'recurso')}"></label>`}<button class="sib" type="button" data-act="rmR" aria-label="Remover recurso">✕</button></div>`).join('');
  return head('Recursos','Contadores, barras e caixas de marcar extras que aparecem na ficha, abaixo das barras de vida. Servem pra Sorte, Estresse, Munição, Inspiração e o que o seu sistema precisar.')+
  `<section class="sed-card"><div class="sech"><h3>Lista <small>${n}/${MAX_REC}</small></h3><button class="btn sm" type="button" data-act="addR"${n>=MAX_REC?' disabled':''}>+ Recurso</button></div><div class="sed-tools"><span class="smu">Atalhos:</span><div class="rowb">${Object.entries(REC_PRE).map(([k,v])=>`<button class="btn sm" type="button" data-act="preR" data-v="${k}"${n>=MAX_REC?' disabled':''}>${v.n}</button>`).join('')}</div></div>${rows||'<p class="smu">Nenhum recurso ainda.</p>'}<p class="smu">Contador: um número com + e −. Barra: igual, com uma faixa de progresso. Caixa de marcar: ligado ou desligado.</p></section>`}
const SECF={geral:secGeral,attr:secAttr,skills:secSkills,itens:secItens,fluxo:secFluxo,bars:secBars,rec:secRec,calc:secCalc,ficha:secFicha};
function sedRender(keepScroll){
  E.iss=sysIssues();
  const cnt={attr:E.at.length,skills:E.pe.length,itens:E.it.length,fluxo:E.fl.length,rec:E.rc.length};
  $('#sedNav').innerHTML=SEC.map(([id,n])=>{const bad=E.iss.some(x=>x.sec===id),on=E.sec===id;
    return`<button type="button" role="tab" class="sed-tab${on?' on':''}" data-sec="${id}" aria-selected="${on}"${on?'':' tabindex="-1"'}>${sedIc(id)}<span class="sed-tn">${n}</span>${cnt[id]!=null?`<em>${cnt[id]}</em>`:''}${bad?'<i class="sed-bad" title="Tem algo para corrigir"></i>':''}</button>`}).join('');
  const m=$('#sedMain'),y=m.scrollTop;m.classList.toggle('fw',E.sec==='fluxo');E.rend=1;m.innerHTML=SECF[E.sec]();E.rend=0;m.scrollTop=keepScroll?y:0;
  sedStatus()}
function sedStatus(){
  $('#sedName').textContent=E.nome.trim()||'Sem nome';$('#sedDirty').hidden=!sedDirty();
  E.iss=sysIssues();$$('#sedNav .sed-tab').forEach(b=>{const bad=E.iss.some(x=>x.sec===b.dataset.sec);let i=$('.sed-bad',b);if(bad&&!i){i=document.createElement('i');i.className='sed-bad';i.title='Tem algo para corrigir';b.appendChild(i)}else if(!bad&&i)i.remove()});
  const a=$('#sedNav [data-sec=attr] em'),s=$('#sedNav [data-sec=skills] em'),it=$('#sedNav [data-sec=itens] em'),fx=$('#sedNav [data-sec=fluxo] em'),rcc=$('#sedNav [data-sec=rec] em');if(rcc)rcc.textContent=E.rc.length;if(a)a.textContent=E.at.length;if(s)s.textContent=E.pe.length;if(it)it.textContent=E.it.length;if(fx)fx.textContent=E.fl.length}
/* atualiza só o que muda enquanto você digita (sem perder o foco) */
function sedLive(){
  sedStatus();
  if(E.sec==='attr'){const b=$('#pvBox');if(b)b.innerHTML=pvWheel()}
  if(E.sec==='calc'){$$('#sedMain [data-res]').forEach(p=>{p.textContent=calcRes(E.f[p.dataset.res.slice(2)])});
    $$('#sedMain [data-dvres]').forEach(p=>{const i=+p.dataset.dvres,x=E.vd[i];p.textContent=dvRes(i);p.title=x&&p.textContent==='⚠'?fErr(x.f,tvars()):''});
    const to=$('#tstOut');if(to)to.innerHTML=tstRows()}
  if(E.sec==='bars')$$('#sedMain [data-bp]').forEach(p=>{p.innerHTML=barPrev(+p.dataset.bp)})}
function setPath(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++)x=x[k[i]];x[k[k.length-1]]=v}
function sedTpl(v){
  const keep={base:E.base,tipo0:E.tipo0,sec:E.sec,lib:E.lib,sid:E.lib?E.sid:null};
  const m=cleanMold(v==='blank'?{nome:'Meu sistema',atributos:[{k:'ATR1',n:'Atributo 1'},{k:'ATR2',n:'Atributo 2'},{k:'ATR3',n:'Atributo 3'}],pericias:[],formulas:{dt:'10 + PE',carga:'5'}}:Object.assign({},SYSTEMS[v],{nome:E.nome.trim()||'Meu sistema'},v==='op'?{itens:opItems()}:{}));
  E=Object.assign(mkDraft(m,!E.lib),keep)}

/* ---------- ações ---------- */
const FLA=new Set(['fundo','fredo','scol','bdup','ftpl','ftplno','ftplok','ftest','bup','bdn','bdel','sup','sdn','sdel','chip','oadd','odel']);
function sedAct(b){
  const a=b.dataset.act,v=b.dataset.v,row=b.closest('[data-g]'),i=row?+row.dataset.i:-1,g=row&&row.dataset.g;
  if(LIBA.has(a)){libAct(a,b);return}
  if(FLA.has(a)){if(!flAct(a,b))sedRender(true);return}
  if(a==='tipo'){if(E.tipo===v)return;
    const DEF={pool:[1,9],d100:[50,200],soma:[10,30]},old=DEF[E.tipo];E.tipo=v;
    if(+E.ini===old[0]&&+E.max===old[1]){E.ini=DEF[v][0];E.max=DEF[v][1]}else if(v==='d100'&&+E.max<=20){E.ini=50;E.max=200}}
  else if(a==='tpl'){E.ask={tpl:v}}
  else if(a==='tplno'){E.ask=null}
  else if(a==='tplok'){const t=E.ask&&E.ask.tpl;E.ask=null;if(t)sedTpl(t)}
  else if(a==='goto'){E.sec=v;sedRender();return}
  else if(a==='addX'){if(E.faixas.length>=6)return;E.faixas.push({min:E.faixas.length?Math.max(-999,(+E.faixas[E.faixas.length-1].min||0)-3):10,t:''})}
  else if(a==='rmX'){E.faixas.splice(i,1)}
  else if(a==='addR'){if(E.rc.length>=MAX_REC)return;E.rc.push({id:eid++,k:newRecKey(),old:null,n:'',tipo:'contador',ini:0,max:10})}
  else if(a==='preR'){if(E.rc.length>=MAX_REC)return;const p=REC_PRE[v];E.rc.push(Object.assign({id:eid++,k:newRecKey(),old:null},p))}
  else if(a==='rmR'){E.rc.splice(i,1)}
  else if(a==='addV'){if(E.vd.length>=MAX_DV)return;E.vd.push({id:eid++,k:dvKey('VALOR'),n:'',f:'0'})}
  else if(a==='preV'){if(E.vd.length>=MAX_DV)return;const p=dvPre()[+v];if(!p)return;E.vd.push({id:eid++,k:dvKey(p.k),n:p.n,f:p.f})}
  else if(a==='rmV'){E.vd.splice(i,1)}
  else if(a==='preOP'){
    if(!['AGI','PRE','VIG'].every(k=>E.at.some(x=>x.k.trim().toUpperCase()===k))){toast('Receita do Ordem Paranormal','Ela usa os atributos AGI, PRE e VIG. Comece pelo sistema do Ordem Paranormal pra usar esta receita.');return}
    E.cl=OPREC.cl;E.vd=OPREC.vd.map(x=>({id:eid++,k:x[0],n:x[1],f:x[2]}));OPREC.bars.forEach((f,j)=>{E.bars[j].maxF=f});E.f.dt=OPREC.dt}
  else if(a==='addA'){if(E.at.length>=MAX_ATTR)return;let j=E.at.length+1;while(E.at.some(x=>x.k==='ATR'+j))j++;E.at.push({id:eid++,k:'ATR'+j,n:'Atributo '+j,old:null,shown:'ATR'+j})}
  else if(a==='addP'){if(E.pe.length>=MAX_PER)return;E.pe.push({n:'',aid:E.at[0].id,t:0,b:'0',s:0,old:null});E.q=''}
  else if(a==='addI'){if(E.it.length>=MAX_ITEM)return;E.it.unshift({id:eid++,n:'',g:E.gi||'Itens',esp:0,d:'',arma:0,dano:'',crit:'',al:'',sk:''});E.qi=''}
  else if(a==='clearI'){E.undoI=JSON.stringify(E.it);E.it=[];E.gi=''}
  else if(a==='undoI'){try{E.it=JSON.parse(E.undoI)}catch(x){}E.undoI=null}
  else if(a==='fillI'){E.undoI=JSON.stringify(E.it);E.it=(v==='op'?opItems():SYSTEMS.coc.itens).slice(0,MAX_ITEM).map(mkItem);E.gi='';E.qi=''}
  else if(a==='sortP'){E.pe.sort((x,y)=>x.n.localeCompare(y.n,'pt'))}
  else if(a==='clearP'){E.undo=JSON.stringify(E.pe);E.pe=[]}
  else if(a==='undoP'){try{E.pe=JSON.parse(E.undo).map(p=>Object.assign(p,{aid:E.at.some(x=>x.id===p.aid)?p.aid:E.at[0].id}))}catch(x){}E.undo=null}
  else if(a==='fillP'){E.undo=JSON.stringify(E.pe);const m=cleanMold(SYSTEMS[v]);
    E.pe=m.pericias.map(p=>({n:p.n,aid:(E.at.find(x=>x.k.trim().toUpperCase()===p.a)||E.at[0]).id,t:p.t,b:p.b,s:p.s,old:(!E.lib&&D.sk.some(s=>s.n===p.n))?p.n:null})).slice(0,MAX_PER)}
  else if(a==='up'&&i>0)[E.at[i-1],E.at[i]]=[E.at[i],E.at[i-1]];
  else if(a==='down'&&i<E.at.length-1)[E.at[i+1],E.at[i]]=[E.at[i],E.at[i+1]];
  else if(a==='rm'){
    if(g==='a'){if(E.at.length<2)return;const gone=E.at.splice(i,1)[0],gk=gone.k.trim().toUpperCase();E.pe.forEach(p=>{if(p.aid===gone.id)p.aid=E.at[0].id});flWalk(x=>{if(x.attrs)x.attrs=x.attrs.filter(y=>y!==gk);if(x.alvo===gk)x.alvo=''})}
    else if(g==='p')E.pe.splice(i,1);else if(g==='i')E.it.splice(i,1);else return}
  else if(a==='ins'){const el=$('#'+(E.focus||'sedDt'));if(!el)return;const s=el.selectionStart==null?el.value.length:el.selectionStart,e2=el.selectionEnd==null?s:el.selectionEnd;
    el.value=el.value.slice(0,s)+v+el.value.slice(e2);const pi=/^[a-zà-ÿ]+\(/i.test(v)?v.indexOf('(')+1:v.length,c=s+pi;el.focus();try{el.setSelectionRange(c,c)}catch(x){}
    setPath(E,el.dataset.bind,el.value);sedLive();return}
  else return;
  sedRender(true);
  if(a==='addP'){const l=$$('#spl [data-f=n]').pop();if(l){l.focus();l.scrollIntoView({block:'center'})}}
  if(a==='addI'){const l=$('#itl [data-f=n]');if(l)l.focus()}}
function sedEdit(e){
  if(E.rend)return;
  const t=e.target,isIn=e.type==='input';
  if(t.id==='libFile'){if(!isIn)libFile(t);return}
  if(t.id==='libTxt')return;
  if(t.dataset.tst!==undefined){if(!isIn)return;E.tv=E.tv||{};E.tv[t.dataset.tst]=+t.value||0;sedLive();return}
  if(t.dataset.bf!==undefined||t.dataset.of!==undefined||t.dataset.sf!==undefined){flEdit(t,isIn);return}
  if(t.dataset.bind){
    const bind=t.dataset.bind;
    if(bind==='q'){if(!isIn)return;E.q=t.value;$('#spl').innerHTML=skillRows();return}
    if(bind==='qi'){if(!isIn)return;E.qi=t.value;$('#itl').innerHTML=itemRows();return}
    if(bind==='gi'){if(isIn)return;E.gi=t.value;$('#itl').innerHTML=itemRows();return}
    const v=t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?'':+t.value):t.value;
    if(t.type==='checkbox'&&isIn)return;
    setPath(E,bind,v);sedLive();if(t.type==='checkbox'||(bind==='regra'&&!isIn))sedRender(true);return}
  const row=t.closest('[data-g]');if(!row)return;const i=+row.dataset.i,f=t.dataset.f,g=row.dataset.g;
  if(g==='a'){const a=E.at[i];
    if(f==='k'){if(isIn){t.value=t.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);a.k=t.value;sedLive()}
      else{const was=a.shown,now=a.k.trim().toUpperCase();
        if(was&&now&&was!==now){const rx=new RegExp('\\b'+was+'\\b','g');E.f.dt=E.f.dt.replace(rx,now);E.f.carga=E.f.carga.replace(rx,now);E.vd.forEach(x=>{x.f=x.f.replace(rx,now)});
          E.bars.forEach(b=>{b.maxF=b.maxF.replace(rx,now);b.iniF=b.iniF.replace(rx,now)});E.pe.forEach(p=>{p.b=p.b.replace(rx,now)});flWalk(x=>{if(x.attrs)x.attrs=x.attrs.map(y=>y===was?now:y);if(x.alvo===was)x.alvo=now;['f','e1','e2'].forEach(q=>{if(typeof x[q]==='string')x[q]=x[q].replace(rx,now)})})}
        a.shown=now;sedRender(true)}}
    else if(f==='n'&&isIn){a.n=t.value;sedLive()}}
  else if(g==='r'){const x=E.rc[i];if(!x)return;
    if(f==='tipo'){if(!isIn){x.tipo=t.value;if(x.tipo==='marca'){x.max=1;x.ini=Math.min(1,+x.ini||0)}sedRender(true)}return}
    if(!isIn)return;if(f==='n')x.n=t.value;else x[f]=t.value===''?'':+t.value;sedStatus()}
  else if(g==='v'){const x=E.vd[i];if(!x||!isIn)return;
    if(f==='k'){t.value=t.value.toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,12);x.k=t.value}else if(f==='n')x.n=t.value;
    sedLive()}
  else if(g==='x'){const x=E.faixas[i];if(!x||!isIn)return;if(f==='min')x.min=t.value===''?'':+t.value;else x.t=t.value;sedStatus()}
  else if(g==='p'){const p=E.pe[i];
    if(f==='n'&&isIn){const was=p.n;p.n=t.value;if(was){E.it.forEach(x=>{if(x.sk===was)x.sk=p.n});flWalk(x=>{if(x.opcoes)x.opcoes.forEach(o=>{if(o.sk===was)o.sk=p.n});if(x.k==='dar'&&x.sk===was)x.sk=p.n})}sedStatus()}
    else if(f==='b'&&isIn){p.b=t.value;const em=$('em',row);if(em){const r=evalF(p.b,evars());em.textContent=r==null?'⚠':'= '+Math.floor(r)}sedStatus()}
    else if(f==='aid'&&!isIn){p.aid=+t.value;sedStatus()}
    else if(f==='t'&&!isIn){p.t=t.checked?1:0;sedStatus()}
    else if(f==='s'&&!isIn){p.s=t.checked?1:0;sedStatus()}}
  else if(g==='i'){const x=E.it[i];
    if(f==='arma'){if(!isIn){x.arma=t.checked?1:0;sedRender(true)}return}
    if(f==='sk'){if(!isIn){x.sk=t.value;sedStatus()}return}
    if(!isIn)return;
    if(f==='esp')x.esp=t.value===''?0:+t.value;else x[f]=t.value;
    sedStatus()}}

/* ---------- abrir, fechar e salvar ---------- */
function sysOpen(sec){
  E=mkDraft(SYS,true);if(SYS===OP)E.nome='Meu sistema';E.sid=D.sid||null;E.base=snap();if(sec)E.sec=sec;sedLabels(false);
  const ed=$('#sysEd');ed.hidden=false;document.body.style.overflow='hidden';$('#sedAsk').hidden=true;sedRender();
  if(!rm())ed.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
  $('#sedMain').focus({preventScroll:true})}
function sysClose(){const lib=E&&E.lib;$('#sysEd').hidden=true;document.body.style.overflow=$('#mSl').hidden?'':'hidden';E=null;if(lib&&!$('#mSl').hidden&&scrMode==='sys'){syGrid();syDet(false)}}
function sedBack(){if(!E)return;if(sedDirty()){$('#sedAsk').hidden=false;try{$('#sedKeep').focus()}catch(x){}}else sysClose()}
/* ---------- editor de sistema fora de uma ficha: edita a biblioteca, sem tocar em nenhuma ficha ---------- */
function sedLabels(lib){const t=lib?'Voltar aos sistemas':'Voltar à ficha';$('#sedBack span').textContent=t;$('#sedBack').setAttribute('aria-label',t);$('#sedSave').textContent=lib?'Salvar sistema':'Salvar'}
function sysOpenLib(id,base){let m=null,sid=null;
  if(id){const en=libRead().find(x=>x.id===id);m=en&&cleanMold(en.mold);sid=en&&en.id}
  else m=cleanMold(base==='op'?Object.assign({},OP,{nome:'Meu sistema',atributos:OP.atributos.slice().sort((a,b)=>a.roda-b.roda),itens:opItems()}):base==='coc'?Object.assign({},SYSTEMS.coc,{nome:'Meu sistema'}):{nome:'Meu sistema',atributos:[{k:'ATR1',n:'Atributo 1'},{k:'ATR2',n:'Atributo 2'},{k:'ATR3',n:'Atributo 3'}],pericias:[],formulas:{dt:'10 + PE',carga:'5'}});
  if(!m){toast('Sistema','Não consegui ler esse sistema.');return}
  E=mkDraft(m,false);E.lib=true;E.sid=sid;E.tipo0=m.teste.tipo;E.base=id?snap():'';sedLabels(true);
  const ed=$('#sysEd');ed.hidden=false;document.body.style.overflow='hidden';$('#sedAsk').hidden=true;sedRender();
  if(!rm())ed.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
  $('#sedMain').focus({preventScroll:true})}
function sysSaveLib(){
  const warn=t=>{E.sec=(sysIssues()[0]||{sec:'geral'}).sec;sedRender();const m=$('#sedMain');m.insertAdjacentHTML('afterbegin','<p class="sed-warn" role="alert">'+esc(t)+'</p>');m.scrollTop=0};
  const m=libMold();if(!m)return warn(E.msg2||'Não consegui montar o sistema.');
  const l=libRead(),obj=moldObj(m),i=E.sid?l.findIndex(x=>x.id===E.sid):-1;let v=1,id=E.sid;
  if(i>=0){v=l[i].v+1;l[i]={id,nome:m.nome,v,t:Date.now(),mold:obj}}else{id=libId();l.push({id,nome:m.nome,v,t:Date.now(),mold:obj})}
  if(!libWrite(l))return warn('Não consegui salvar: o navegador não deixou usar o armazenamento.');
  syOpen=id;sysClose();toast('Sistema salvo',m.nome+', versão '+v+'.');if($('#mSl').hidden)openSl('sys')}
function sysSave(){
  if(E.lib)return sysSaveLib();
  const iss=sysIssues();
  if(iss.length){E.sec=iss[0].sec;sedRender();const m=$('#sedMain');m.insertAdjacentHTML('afterbegin','<p class="sed-warn" role="alert">Corrija isto antes de salvar: '+esc(iss[0].msg)+'</p>');m.scrollTop=0;return}
  const m=cleanMold(draftMold());
  if(!m||m.atributos.length!==E.at.length||m.pericias.length!==E.pe.length||m.recursos.length!==E.rc.length){E.sec='geral';sedRender();$('#sedMain').insertAdjacentHTML('afterbegin','<p class="sed-warn" role="alert">Não consegui montar o sistema. Confira os campos.</p>');return}
  const oldAttr=D.attr,oldSk=D.sk.slice(),ren={},tipoMudou=m.teste.tipo!==SYS.teste.tipo,escala=tipoMudou||m.atributo.inicial!==SYS.atributo.inicial;
  const newAttr=Object.fromEntries(m.atributos.map((a,i)=>{const o=E.at[i].old;return[a.k,!tipoMudou&&o!=null&&oldAttr[o]!=null?Math.min(oldAttr[o],m.atributo.maxFicha):m.atributo.inicial]}));
  const pct=m.teste.tipo==='d100',som=m.teste.tipo==='soma';
  const newSk=m.pericias.map((p,i)=>{const o=E.pe[i].old,prev=o!=null?oldSk.find(x=>x.n===o):null;if(prev&&prev.n!==p.n)ren[prev.n]=p.n;
    const s={n:p.n,a:p.a,t:p.t,tr:!tipoMudou&&prev?prev.tr:0,ex:!tipoMudou&&prev?prev.ex:0};
    if(pct){s.v=prev&&prev.v!=null?prev.v:null;s.sp=prev&&prev.sp?prev.sp:''}else if(som){s.bn=!tipoMudou&&prev&&prev.bn?prev.bn:0}return s});
  D.atk.forEach(k=>{if(ren[k.sk])k.sk=ren[k.sk]});
  const oldBars=D.bars,oldRec=D.rec||{};
  useMold(m);D.mold=moldData();D.sys='custom';if(E.sid){D.sid=E.sid;const le=libRead().find(x=>x.id===E.sid);if(le)D.sv=le.v}else{delete D.sid;delete D.sv}D.attr=newAttr;D.sk=newSk;
  if(m.recursos.length){const nr={};m.recursos.forEach((r,i)=>{const o=E.rc[i].old;nr[r.k]=o!=null&&oldRec[o]!=null?clamp(Math.round(+oldRec[o])||0,0,r.max):r.ini});D.rec=nr}else delete D.rec;
  D.bars=barsIni();if(!tipoMudou)BARS.forEach(([k])=>{if(oldBars[k])D.bars[k]=oldBars[k].slice()});
  sysClose();save();renderAll();syncBars();
  toast('Sistema salvo','Atributos, perícias e contas atualizados nesta ficha.')}
$('#sedBack').onclick=sedBack;$('#sedSave').onclick=sysSave;
$('#sedKeep').onclick=()=>{$('#sedAsk').hidden=true};$('#sedDrop').onclick=()=>{$('#sedAsk').hidden=true;sysClose()};
$('#sedNav').addEventListener('click',e=>{const b=e.target.closest('[data-sec]');if(!b||!E)return;E.sec=b.dataset.sec;sedRender()});
$('#sedNav').addEventListener('keydown',e=>{if(!E)return;const ids=SEC.map(s=>s[0]),i=ids.indexOf(E.sec);let n=-1;
  if(e.key==='ArrowDown'||e.key==='ArrowRight')n=(i+1)%ids.length;else if(e.key==='ArrowUp'||e.key==='ArrowLeft')n=(i+ids.length-1)%ids.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=ids.length-1;
  if(n<0)return;e.preventDefault();E.sec=ids[n];sedRender();const b=$('#sedNav [data-sec='+ids[n]+']');if(b)b.focus()});
$('#sedMain').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled&&E)sedAct(b)});
$('#sedMain').addEventListener('input',e=>{if(E)sedEdit(e)});$('#sedMain').addEventListener('change',e=>{if(E)sedEdit(e)});
$('#sedMain').addEventListener('focusin',e=>{const t=e.target;if(E&&t&&t.dataset&&t.dataset.fx){if(!t.id)t.id='fx'+Date.now().toString(36)+Math.floor(Math.random()*999);E.focus=t.id}});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||!E||CW)return;e.preventDefault();if(!$('#sedAsk').hidden)$('#sedAsk').hidden=true;else sedBack()});
$('#cfSys').onclick=()=>{closeM('mSl');sysOpen()};
function startCustom(base){
  clearTimeout(cloudSaveT);activeCloudId=null;const cfg=D.cfg;
  const raw=base==='op'?Object.assign({},OP,{nome:'Meu sistema',atributos:OP.atributos.slice().sort((a,b)=>a.roda-b.roda),itens:opItems()}):
    base==='coc'?Object.assign({},SYSTEMS.coc,{nome:'Meu sistema'}):
    {nome:'Meu sistema',atributos:[{k:'ATR1',n:'Atributo 1'},{k:'ATR2',n:'Atributo 2'},{k:'ATR3',n:'Atributo 3'}],pericias:[],formulas:{dt:'10 + PE',carga:'5'}};
  if(!slPush())return;
  useMold(cleanMold(raw));D=fresh();D.cfg=cfg;D.created=true;D.camp='nova';save();renderAll();closeM('mNova');go('char',1);sysOpen()}
$('#nvOp').onclick=()=>{closeM('mNova');sysOpenLib(null,'op')};$('#nvCoc').onclick=()=>{closeM('mNova');sysOpenLib(null,'coc')};$('#nvZero').onclick=()=>{closeM('mNova');sysOpenLib(null,'zero')};

/* ---------- editor de blocos: passo a passo de criação ---------- */
/* cores com contraste mínimo de 4,5:1 com o texto branco */
const FCAT={estrutura:'#B15E00',atributos:'#2B66CF',pericias:'#2A7A33',escolhas:'#7243CF',ficha:'#CC2F4C',logica:'#0F7C75'};
const FK={etapa:['estrutura','Etapa'],texto:['ficha','Mostrar um texto'],campo:['ficha','Perguntar um campo'],attr_pontos:['atributos','Distribuir pontos'],attr_rolar:['atributos','Rolar dados'],pericias_treinar:['pericias','Escolher perícias'],pericias_pontos:['pericias','Pontos nas perícias'],lista:['escolhas','Escolher da lista'],se:['logica','Se … então'],definir:['logica','Definir atributo'],dar:['logica','Dar perícia']};
const PAL=[['Estrutura','estrutura',['etapa']],['Atributos','atributos',['attr_pontos','attr_rolar']],['Perícias','pericias',['pericias_treinar','pericias_pontos']],['Escolhas','escolhas',['lista']],['Ficha','ficha',['texto','campo']],['Lógica','logica',['se','definir','dar']]];
const withIds=b=>{const r=JSON.parse(JSON.stringify(b));r.id=eid++;if(r.b)r.b=r.b.map(withIds);return r};
const flWithIds=s=>({id:eid++,t:s.t,b:s.b.map(withIds)});
const flStrip=b=>{const r=Object.assign({},b);delete r.id;if(r.b)r.b=r.b.map(flStrip);return r};
const flKeys=()=>E.at.map(a=>a.k.trim().toUpperCase()).filter(Boolean);
const fieldName=k=>FLOW_LBL[k]||(E.rot[k]||'')||k;
const flStep=sid=>E.fl.find(s=>s.id===sid);
function flWalk(cb,arr){(arr||E.fl.flatMap(s=>s.b)).forEach(b=>{cb(b);if(b.b)flWalk(cb,b.b)})}
function flFind(bid){
  for(const st of E.fl){
    let j=st.b.findIndex(b=>b.id===bid);if(j>=0)return{st,arr:st.b,j,b:st.b[j],par:null};
    for(const p of st.b){if(p.k==='se'){j=p.b.findIndex(b=>b.id===bid);if(j>=0)return{st,arr:p.b,j,b:p.b[j],par:p}}}}
  return null}
const newStep=()=>({id:eid++,t:'Nova etapa',b:[]});
function flNew(k){
  const keys=flKeys(),sk=E.pe.map(p=>p.n.trim()).filter(Boolean),b={
    texto:()=>({k:'texto',t:'Escreva aqui uma instrução para a pessoa.'}),
    campo:()=>({k:'campo',campo:'pers',rot:'Nome do personagem'}),
    attr_pontos:()=>({k:'attr_pontos',pontos:4,min:0,max:3,tudo:1}),
    attr_rolar:()=>({k:'attr_rolar',dados:'3d6',mais:0,mult:5,attrs:keys.slice()}),
    lista:()=>({k:'lista',rot:'Escolha uma opção',campo:'',opcoes:[{n:'Opção 1',sk:'',pts:0},{n:'Opção 2',sk:'',pts:0}],obrig:1}),
    pericias_treinar:()=>({k:'pericias_treinar',n:3,bonus:2}),
    pericias_pontos:()=>({k:'pericias_pontos',f:(keys[0]||'10')+(keys[0]?' * 4':''),max:75,tudo:1}),
    se:()=>({k:'se',e1:keys[0]||'0',op:'>=',e2:'50',b:[]}),
    definir:()=>({k:'definir',alvo:keys[0]||'',f:(keys[0]||'0')+' + 5'}),
    dar:()=>({k:'dar',sk:sk[0]||'',n:5})}[k]();
  b.id=eid++;if(b.b)b.b=b.b.map(x=>x);return b}
function flSave(){E.fh.push(JSON.stringify(E.fl));if(E.fh.length>40)E.fh.shift();E.fr=[]}
function flUndo(){const s=E.fh.pop();if(!s)return;E.fr.push(JSON.stringify(E.fl));E.fl=JSON.parse(s);sedRender(true)}
function flRedo(){const s=E.fr.pop();if(!s)return;E.fh.push(JSON.stringify(E.fl));E.fl=JSON.parse(s);sedRender(true)}
const OPSYM={'>=':'≥','<=':'≤','>':'>','<':'<','=':'=','!=':'≠'};
/* texto de cada bloco, com os campos no meio da frase (como no Scratch) */
function bkInner(b){
  const num=(f,v,mn,mx)=>`<input class="bk-in bk-n" type="number" inputmode="numeric" data-bf="${f}" value="${esc(String(v))}" min="${mn}" max="${mx}" aria-label="${f}">`;
  const txt=(f,v,len,ph,cls)=>`<input class="bk-in ${cls||''}" data-bf="${f}" value="${esc(v)}" maxlength="${len}" placeholder="${ph}" aria-label="${ph}" spellcheck="false">`;
  const chk=(f,v,l)=>`<label class="bk-ck"><input type="checkbox" data-bf="${f}"${v?' checked':''}>${l}</label>`;
  const campo=(f,v,none)=>`<select class="bk-in" data-bf="${f}" aria-label="Campo da ficha">${none?'<option value="">(nenhum)</option>':''}${FLOW_FIELDS.map(k=>`<option value="${k}"${v===k?' selected':''}>${esc(fieldName(k))}</option>`).join('')}</select>`;
  const keySel=(f,v)=>`<select class="bk-in" data-bf="${f}" aria-label="Atributo"><option value="">(escolha)</option>${flKeys().map(k=>`<option value="${esc(k)}"${v===k?' selected':''}>${esc(k)}</option>`).join('')}</select>`;
  const skSel=(f,v)=>`<select class="bk-in" data-bf="${f}" aria-label="Perícia"><option value="">(escolha)</option>${E.pe.map(p=>p.n.trim()).filter(Boolean).map(n=>`<option value="${esc(n)}"${v===n?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
  switch(b.k){
    case'texto':return`Mostrar o texto <textarea class="bk-in bk-ta" data-bf="t" rows="2" maxlength="400" aria-label="Texto">${esc(b.t)}</textarea>`;
    case'campo':return`Perguntar ${txt('rot',b.rot,40,'rótulo')} e guardar em ${campo('campo',b.campo)}`;
    case'attr_pontos':return`Distribuir ${num('pontos',b.pontos,0,999)} pontos entre os atributos, de ${num('min',b.min,0,999)} até ${num('max',b.max,0,999)} em cada ${chk('tudo',b.tudo,'gastar todos')}`;
    case'attr_rolar':return`Rolar ${txt('dados',b.dados,12,'3d6','bk-w6')} + ${num('mais',b.mais,-999,999)} × ${num('mult',b.mult,1,100)} para ${flKeys().map(k=>`<button type="button" class="bk-chip" data-act="chip" data-k="${esc(k)}" aria-pressed="${b.attrs.includes(k)}">${esc(k)}</button>`).join('')||'<em>(crie atributos primeiro)</em>'}`;
    case'pericias_treinar':return`Escolher ${num('n',b.n,0,80)} perícias para treinar${E.tipo==='soma'?` com bônus de ${num('bonus',b.bonus,-99,99)}`:''}`;
    case'pericias_pontos':return`Distribuir ${txt('f',b.f,60,'EDU * 4','bk-w10')} pontos entre as perícias, até ${num('max',b.max,1,999)}${E.tipo==='d100'?'%':''} em cada ${chk('tudo',b.tudo,'gastar todos')}`;
    case'lista':return`Escolher ${txt('rot',b.rot,40,'rótulo')} e guardar em ${campo('campo',b.campo,true)} ${chk('obrig',b.obrig,'obrigatório')}`;
    case'se':return`Se ${txt('e1',b.e1,60,'conta','bk-w10')} <select class="bk-in" data-bf="op" aria-label="Comparação">${FLOW_OPS.map(o=>`<option value="${o}"${b.op===o?' selected':''}>${OPSYM[o]}</option>`).join('')}</select> ${txt('e2',b.e2,60,'conta','bk-w10')} então`;
    case'definir':return`Definir ${keySel('alvo',b.alvo)} = ${txt('f',b.f,60,'conta','bk-w10')}`;
    case'dar':return E.tipo==='pool'?`Dar treino em ${skSel('sk',b.sk)}`:`Dar ${num('n',b.n,-999,999)} ${E.tipo==='d100'?'pontos':'de bônus'} em ${skSel('sk',b.sk)}`}
  return''}
function bkSub(b){
  if(b.k!=='lista')return'';
  const pe=E.pe.map(p=>p.n.trim()).filter(Boolean),pts=E.tipo!=='pool';
  return`<div class="bk-sub">${b.opcoes.map((o,i)=>`<div class="bk-opt" data-oi="${i}"><span>Opção</span><input class="bk-in" data-of="n" value="${esc(o.n)}" maxlength="40" aria-label="Nome da opção ${i+1}"><span>dá</span><select class="bk-in" data-of="sk" aria-label="Perícia da opção ${i+1}"><option value="">(nenhuma perícia)</option>${pe.map(n=>`<option value="${esc(n)}"${o.sk===n?' selected':''}>${esc(n)}</option>`).join('')}</select>${pts?`<span>${E.tipo==='soma'?'bônus':'+'}</span><input class="bk-in bk-n" type="number" inputmode="numeric" data-of="pts" value="${o.pts}" min="0" max="999" aria-label="Pontos da opção ${i+1}">`:'<span>de treino</span>'}<button type="button" class="bk-x" data-act="odel" aria-label="Remover opção">✕</button></div>`).join('')}<button type="button" class="bk-add" data-act="oadd">+ opção</button></div>`}
const bkCtl=`<span class="bk-ctl"><button type="button" data-act="bdup" aria-label="Duplicar bloco" title="Duplicar">⧉</button><button type="button" data-act="bup" aria-label="Subir bloco">↑</button><button type="button" data-act="bdn" aria-label="Descer bloco">↓</button><button type="button" data-act="bdel" aria-label="Remover bloco">✕</button></span>`;
function bkHTML(b){
  const warn=b.k==='pericias_treinar'&&E.tipo==='d100'?'Não funciona com teste d100.':b.k==='pericias_pontos'&&E.tipo==='pool'?'Não funciona com vários d20.':'';
  const c=FCAT[FK[b.k][0]],head=`<div class="bk-h"><span class="bk-grip" title="Arraste para mover">⠿</span><div class="bk-t">${bkInner(b)}</div>${bkCtl}</div>`;
  if(b.k==='se')return`<div class="bk bk-c" data-bid="${b.id}" data-k="se" style="--c:${c}">${head}<div class="bk-cw"><div class="bk-arm"></div><div class="bk-cbody" data-bid="${b.id}">${b.b.map(bkHTML).join('')}${b.b.length?'':'<div class="bks-empty">Arraste blocos para dentro do Se</div>'}</div></div><div class="bk-f"></div></div>`;
  return`<div class="bk" data-bid="${b.id}" data-k="${b.k}" style="--c:${c}">${head}${bkSub(b)}${warn?`<div class="bk-warn">${warn}</div>`:''}</div>`}
function stHTML(s,i){
  const n=s.b.reduce((a,x)=>a+1+(x.b?x.b.length:0),0);
  return`<section class="bks${E.fsel===s.id?' sel':''}${s.c?' col':''}" data-sid="${s.id}" style="--c:${FCAT.estrutura}"><div class="bks-h"><span class="bk-grip" title="Arraste para mover a etapa">⠿</span><button type="button" class="bks-tg" data-act="scol" aria-label="${s.c?'Expandir':'Recolher'} etapa" aria-expanded="${!s.c}">${s.c?'▸':'▾'}</button><span class="bks-n">Etapa ${i+1}</span><input class="bk-in bks-t" data-sf="t" value="${esc(s.t)}" maxlength="40" aria-label="Título da etapa ${i+1}">${s.c?`<span class="bks-cn">${n} ${n===1?'bloco':'blocos'}</span>`:''}<span class="bk-ctl"><button type="button" data-act="sup" aria-label="Subir etapa"${i?'':' disabled'}>↑</button><button type="button" data-act="sdn" aria-label="Descer etapa"${i<E.fl.length-1?'':' disabled'}>↓</button><button type="button" data-act="sdel" aria-label="Remover etapa">✕</button></span></div><div class="bks-arm"></div><div class="bks-body" data-sid="${s.id}">${s.b.map(bkHTML).join('')}${s.b.length?'':'<div class="bks-empty">Arraste blocos para cá</div>'}</div><div class="bks-f"></div></section>`}
const palHTML=()=>PAL.map(([n,c,ks])=>`<div class="pal-c" style="--c:${FCAT[c]}"><h4>${n}</h4>${ks.map(k=>`<div class="bk pal" data-new="${k}" style="--c:${FCAT[c]}" tabindex="0" role="button" aria-label="Adicionar bloco: ${FK[k][1]}"><span class="bk-grip">⠿</span>${FK[k][1]}</div>`).join('')}</div>`).join('');
const wsHTML=()=>E.fl.length?E.fl.map(stHTML).join(''):'<div class="bks-none">Nenhuma etapa ainda. Arraste <b>Etapa</b> da paleta, ou escolha um modelo de fluxo.</div>';
function secFluxo(){
  const tn={op:'Ordem Paranormal',coc:'Call of Cthulhu',blank:'Vazio'};
  const ask=E.ask&&E.ask.fl?`<div class="sed-ask2"><span>Trocar o fluxo atual pelo modelo <b>${tn[E.ask.fl]}</b>? Dá pra desfazer logo depois.</span><div class="rowb"><button class="btn pri sm" type="button" data-act="ftplok">Trocar</button><button class="btn sm" type="button" data-act="ftplno">Cancelar</button></div></div>`:'';
  return head('Criação','Monte o passo a passo da criação de personagem com blocos. Arraste da paleta para dentro de uma etapa, ou toque no bloco pra adicionar na etapa marcada. Blocos de Lógica deixam o fluxo mudar conforme as escolhas.')+
  `<div class="sed-tools fl-tools"><div class="rowb"><button class="btn sm" type="button" data-act="fundo"${E.fh.length?'':' disabled'}>Desfazer</button><button class="btn sm" type="button" data-act="fredo"${E.fr.length?'':' disabled'}>Refazer</button><button class="btn sm pri" type="button" data-act="ftest"${E.fl.length?'':' disabled'}>Testar o passo a passo</button></div><div class="rowb"><span class="smu">Modelo de fluxo:</span><button class="btn sm" type="button" data-act="ftpl" data-v="op">OP</button><button class="btn sm" type="button" data-act="ftpl" data-v="coc">CoC</button><button class="btn sm" type="button" data-act="ftpl" data-v="blank">Vazio</button></div></div>${ask}
  <div class="blk-wrap"><aside class="blk-pal" id="bpal" aria-label="Paleta de blocos">${palHTML()}</aside><div class="blk-ws" id="bws">${wsHTML()}</div></div>`}
function flIssues(add,vars0){
  const vars=Object.assign({NIVEL:1,NEX:1},vars0),keys=new Set(flKeys()),skn=new Set(E.pe.map(p=>p.n.trim()));
  const check=(arr,w)=>arr.forEach(b=>{
    if(b.k==='attr_pontos'&&(!(+b.pontos>=0)||!(+b.min>=0)||!(+b.max>=+b.min)||b.pontos===''||b.min===''||b.max===''))add('fluxo',w+'confira os números de "Distribuir pontos" (o máximo não pode ser menor que o mínimo).');
    if(b.k==='attr_rolar'){const d=String(b.dados).replace(/\s/g,''),m=/^(\d{1,2})d(\d{1,3})$/i.exec(d);
      if(!m||+m[1]<1||+m[2]<2)add('fluxo',w+'os dados "'+b.dados+'" não são válidos (use algo como 3d6).');
      if(!b.attrs.length)add('fluxo',w+'"Rolar dados" precisa de pelo menos um atributo marcado.');
      if(b.mult===''||!(+b.mult>=1))add('fluxo',w+'o multiplicador deve ser 1 ou mais.')}
    if(b.k==='lista'){if(BAD.test(b.rot))add('fluxo',w+'o nome "'+b.rot+'" tem '+BAD_MSG+'.');
      if(!b.opcoes.length)add('fluxo',w+'a lista "'+b.rot+'" não tem opções.');
      if(b.opcoes.some(o=>!o.n.trim()))add('fluxo',w+'tem opção sem nome na lista "'+b.rot+'".');
      if(b.opcoes.some(o=>BAD.test(o.n)))add('fluxo',w+'uma opção de "'+b.rot+'" tem '+BAD_MSG+'.')}
    if(b.k==='campo'&&BAD.test(b.rot))add('fluxo',w+'o rótulo "'+b.rot+'" tem '+BAD_MSG+'.');
    if(b.k==='pericias_pontos'){if(E.tipo==='pool')add('fluxo',w+'"Pontos nas perícias" não funciona com vários d20.');if(evalF(b.f,vars)===null)add('fluxo',w+'a conta "'+b.f+'" não é válida.');if(b.max===''||!(+b.max>=1))add('fluxo',w+'o máximo por perícia deve ser 1 ou mais.')}
    if(b.k==='pericias_treinar'){if(E.tipo==='d100')add('fluxo',w+'"Escolher perícias" não funciona com teste d100.');if(b.n===''||!(+b.n>=0))add('fluxo',w+'a quantidade de perícias é inválida.')}
    if(b.k==='se'){if(evalF(b.e1,vars)===null)add('fluxo',w+'a conta "'+b.e1+'" do Se não é válida.');if(evalF(b.e2,vars)===null)add('fluxo',w+'a conta "'+b.e2+'" do Se não é válida.');if(!b.b.length)add('fluxo',w+'tem um "Se" sem nada dentro.');check(b.b,w)}
    if(b.k==='definir'){if(!b.alvo||!keys.has(b.alvo))add('fluxo',w+'"Definir atributo" precisa de um atributo escolhido.');if(evalF(b.f,vars)===null)add('fluxo',w+'a conta "'+b.f+'" do Definir não é válida.')}
    if(b.k==='dar'){if(!b.sk||!skn.has(b.sk))add('fluxo',w+'"Dar perícia" precisa de uma perícia escolhida.');if(E.tipo!=='pool'&&(b.n===''||!Number.isFinite(+b.n)))add('fluxo',w+'o valor de "Dar perícia" é inválido.')}});
  E.fl.forEach((s,i)=>{const sn=s.t.trim()||'Etapa '+(i+1),w='Na etapa "'+sn+'": ';
    if(!s.t.trim())add('fluxo','A etapa '+(i+1)+' está sem título.');else if(BAD.test(s.t))add('fluxo','O título da etapa "'+sn+'" tem '+BAD_MSG+'.');
    if(!s.b.length)add('fluxo','A etapa "'+sn+'" está vazia.');
    check(s.b,w)})}

/* ---------- arrastar e soltar (mouse e toque) ---------- */
let DR=null;
function drStart(e){
  if(!E||E.sec!=='fluxo'||(e.pointerType==='mouse'&&e.button>0))return;
  const grip=e.target.closest('.bk-grip'),pal=e.target.closest('.bk.pal');
  if(!grip&&!pal)return;
  if(pal&&!grip&&e.pointerType!=='mouse')return;
  let kind,src;
  if(pal){kind='new';src=pal}else if(grip.closest('.bks-h')){kind='step';src=grip.closest('.bks')}else{kind='blk';src=grip.closest('.bk')}
  DR={kind,src,nk:pal?pal.dataset.new:null,x0:e.clientX,y0:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,ghost:null,ph:null,del:false,overWs:false};
  window.addEventListener('pointermove',drMove);window.addEventListener('pointerup',drEnd);window.addEventListener('pointercancel',drCancel);
  if(grip||e.pointerType==='mouse')e.preventDefault()}
function drBegin(){
  const r=DR.src.getBoundingClientRect();DR.ox=DR.x0-r.left;DR.oy=DR.y0-r.top;
  let g;
  if(DR.kind==='step'){g=document.createElement('div');g.className='bks';g.style.setProperty('--c',FCAT.estrutura);g.appendChild(DR.src.querySelector('.bks-h').cloneNode(true))}
  else if(DR.kind==='blk'&&DR.src.dataset.k==='se'){g=document.createElement('div');g.className='bk';g.style.setProperty('--c',FCAT.logica);g.appendChild(DR.src.querySelector('.bk-h').cloneNode(true))}
  else g=DR.src.cloneNode(true);
  g.classList.add('bk-ghost');g.style.width=Math.min(r.width,520)+'px';g.removeAttribute('data-bid');g.removeAttribute('data-sid');
  document.body.appendChild(g);DR.ghost=g;
  if(DR.kind!=='new')DR.src.classList.add('dragging');
  document.body.classList.add('dragging-blk');
  DR.timer=setInterval(()=>{if(!DR)return;const m=$('#sedMain'),r2=m.getBoundingClientRect();let dy=0;
    if(DR.ly<r2.top+70)dy=-12;else if(DR.ly>r2.bottom-70)dy=12;if(dy){m.scrollTop+=dy;drTarget(DR.lx,DR.ly)}},30)}
function drMove(e){
  if(!DR)return;DR.lx=e.clientX;DR.ly=e.clientY;
  if(!DR.moved){if(Math.hypot(e.clientX-DR.x0,e.clientY-DR.y0)<6)return;DR.moved=true;drBegin()}
  DR.ghost.style.transform='translate('+(e.clientX-DR.ox)+'px,'+(e.clientY-DR.oy)+'px) rotate(1.2deg)';
  drTarget(e.clientX,e.clientY)}
function drTarget(x,y){
  const ws=$('#bws'),pal=$('#bpal');if(!ws||!pal||!DR)return;
  const el=document.elementFromPoint(x,y),overPal=!!(el&&el.closest('#bpal'));
  DR.del=overPal&&DR.kind!=='new';pal.classList.toggle('del',DR.del);DR.overWs=!!(el&&el.closest('#bws'));
  if(DR.ph){DR.ph.remove();DR.ph=null}
  if(overPal||!DR.overWs&&!(el&&el.closest('.sed-main')))return;
  const mk=c=>{const d=document.createElement('div');d.className=c;return d};
  if(DR.kind==='step'||(DR.kind==='new'&&DR.nk==='etapa')){
    const steps=[...ws.children].filter(c=>c.classList.contains('bks')&&!c.classList.contains('dragging'));
    let before=null;for(const s of steps){const r=s.getBoundingClientRect();if(y<r.top+r.height/2){before=s;break}}
    DR.ph=mk('bks-ph');ws.insertBefore(DR.ph,before);return}
  const isSe=DR.nk==='se'||(DR.kind==='blk'&&DR.src.dataset.k==='se');
  let body=null;
  if(!isSe){const cb=el&&el.closest('.bk-cbody');if(cb&&!cb.closest('.dragging'))body=cb}
  if(!body)body=el&&el.closest('.bks-body');
  if(!body){const st=el&&el.closest('.bks');if(st)body=st.querySelector(':scope > .bks-body')}
  if(!body&&DR.overWs){const all=ws.querySelectorAll(':scope > .bks > .bks-body');if(all.length)body=all[all.length-1]}
  if(!body)return;
  const kids=[...body.children].filter(c=>c.classList.contains('bk')&&!c.classList.contains('dragging'));
  let before=null;for(const k of kids){const r=k.getBoundingClientRect();if(y<r.top+r.height/2){before=k;break}}
  DR.ph=mk('bk-ph');body.insertBefore(DR.ph,before)}
function drCleanup(){
  if(!DR)return;clearInterval(DR.timer);
  if(DR.ghost)DR.ghost.remove();if(DR.ph)DR.ph.remove();DR.src.classList.remove('dragging');
  document.body.classList.remove('dragging-blk');const p=$('#bpal');if(p)p.classList.remove('del');
  window.removeEventListener('pointermove',drMove);window.removeEventListener('pointerup',drEnd);window.removeEventListener('pointercancel',drCancel);DR=null}
function drCancel(){drCleanup()}
function drEnd(){
  const d=DR;if(!d)return;
  let tgt=null;
  if(d.moved&&d.ph&&d.ph.parentElement){
    if(d.ph.classList.contains('bks-ph')){const l=[...$('#bws').children].filter(c=>(c.classList.contains('bks')&&!c.classList.contains('dragging'))||c===d.ph);tgt={step:true,idx:l.indexOf(d.ph)}}
    else{const body=d.ph.parentElement,l=[...body.children].filter(c=>(c.classList.contains('bk')&&!c.classList.contains('dragging'))||c===d.ph);
      tgt=body.classList.contains('bk-cbody')?{cont:'b',id:+body.dataset.bid,idx:l.indexOf(d.ph)}:{cont:'s',id:+body.dataset.sid,idx:l.indexOf(d.ph)}}}
  const del=d.del,over=d.overWs;drCleanup();
  if(!d.moved)return;
  E.noclick=1;setTimeout(()=>{if(E)E.noclick=0},60);
  flDrop(d,tgt,del,over)}
const flCont=t=>t.cont==='s'?(flStep(t.id)||{}).b:((flFind(t.id)||{}).b||{}).b;
function flDrop(d,tgt,del,over){
  flSave();let ok=true;
  if(d.kind==='step'){const sid=+d.src.dataset.sid,i=E.fl.findIndex(s=>s.id===sid);
    if(del){E.fl.splice(i,1)}else if(tgt&&tgt.step){const [s]=E.fl.splice(i,1);E.fl.splice(tgt.idx,0,s)}else ok=false}
  else if(d.kind==='blk'){const f=flFind(+d.src.dataset.bid);if(!f){ok=false}
    else if(del){f.arr.splice(f.j,1)}
    else if(tgt&&!tgt.step){f.arr.splice(f.j,1);const arr=flCont(tgt);if(arr)arr.splice(tgt.idx,0,f.b);else{f.arr.splice(f.j,0,f.b);ok=false}}
    else ok=false}
  else{
    if(d.nk==='etapa'){if(tgt&&tgt.step){const s=newStep();E.fl.splice(tgt.idx,0,s);E.fsel=s.id}else if(over){const s=newStep();E.fl.push(s);E.fsel=s.id}else ok=false}
    else if(tgt&&!tgt.step){const arr=flCont(tgt);if(arr){arr.splice(tgt.idx,0,flNew(d.nk));if(tgt.cont==='s')E.fsel=tgt.id}else ok=false}
    else if(over&&!E.fl.length){const s=newStep();s.b.push(flNew(d.nk));E.fl.push(s);E.fsel=s.id}
    else ok=false}
  if(!ok){E.fh.pop();return}
  sedRender(true)}
function flAddTap(nk){
  flSave();
  if(nk==='etapa'){const s=newStep();E.fl.push(s);E.fsel=s.id}
  else{let st=flStep(E.fsel)||E.fl[E.fl.length-1];if(!st){st=newStep();E.fl.push(st)}st.b.push(flNew(nk));E.fsel=st.id}
  sedRender(true);const l=$$('#bws .bks.sel .bk').pop()||$$('#bws .bks').pop();if(l)l.scrollIntoView({block:'nearest',behavior:'smooth'})}
/* ações dos botões */
function flAct(a,b){
  const bk=b.closest('.bk'),st=b.closest('.bks'),bid=bk?+bk.dataset.bid:0,sid=st?+st.dataset.sid:0;
  if(a==='fundo'){flUndo();return true}
  if(a==='fredo'){flRedo();return true}
  if(a==='scol'){const s=flStep(sid);if(s)s.c=!s.c;return false}
  if(a==='ftpl'){E.ask={fl:b.dataset.v};return false}
  if(a==='ftplno'){E.ask=null;return false}
  if(a==='ftplok'){const v=E.ask&&E.ask.fl;E.ask=null;if(!v)return false;flSave();
    const keys=new Set(flKeys()),sn=new Set(E.pe.map(p=>p.n.trim())),vars=evars();
    E.fl=v==='blank'?[]:cleanFlow(SYSTEMS[v].criacao,keys,sn,vars).map(flWithIds);E.fsel=null;return false}
  if(a==='ftest'){const iss=sysIssues();if(iss.length){E.sec=iss[0].sec;sedRender();$('#sedMain').insertAdjacentHTML('afterbegin','<p class="sed-warn" role="alert">Corrija isto antes de testar: '+esc(iss[0].msg)+'</p>');return true}
    const m=cleanMold(draftMold());if(m&&m.criacao.length)cwStart(m,{dry:true});return true}
  flSave();
  if(a==='bup'||a==='bdn'){const f=flFind(bid);if(!f)return false;const i=E.fl.indexOf(f.st);
    if(a==='bup'){
      if(f.j>0){[f.arr[f.j-1],f.arr[f.j]]=[f.arr[f.j],f.arr[f.j-1]]}
      else if(f.par){const pf=flFind(f.par.id);f.arr.splice(f.j,1);pf.arr.splice(pf.j,0,f.b)}
      else if(i>0){f.arr.splice(f.j,1);E.fl[i-1].b.push(f.b)}else{E.fh.pop();return true}}
    else{
      if(f.j<f.arr.length-1){[f.arr[f.j+1],f.arr[f.j]]=[f.arr[f.j],f.arr[f.j+1]]}
      else if(f.par){const pf=flFind(f.par.id);f.arr.splice(f.j,1);pf.arr.splice(pf.j+1,0,f.b)}
      else if(i<E.fl.length-1){f.arr.splice(f.j,1);E.fl[i+1].b.unshift(f.b)}else{E.fh.pop();return false}}
    return false}
  if(a==='bdup'){const f=flFind(bid);if(f&&f.arr.length<MAX_BLK)f.arr.splice(f.j+1,0,withIds(flStrip(f.b)));else E.fh.pop();return false}
  if(a==='bdel'){const f=flFind(bid);if(f)f.arr.splice(f.j,1);return false}
  if(a==='sup'||a==='sdn'||a==='sdel'){const i=E.fl.findIndex(s=>s.id===sid);if(i<0)return false;
    if(a==='sdel')E.fl.splice(i,1);else{const j=a==='sup'?i-1:i+1;if(j<0||j>=E.fl.length){E.fh.pop();return false}[E.fl[j],E.fl[i]]=[E.fl[i],E.fl[j]]}return false}
  if(a==='chip'){const f=flFind(bid);if(!f)return false;const k=b.dataset.k,ix=f.b.attrs.indexOf(k);if(ix>=0)f.b.attrs.splice(ix,1);else f.b.attrs.push(k);return false}
  if(a==='oadd'){const f=flFind(bid);if(f&&f.b.opcoes.length<MAX_OPT)f.b.opcoes.push({n:'Opção '+(f.b.opcoes.length+1),sk:'',pts:0});return false}
  if(a==='odel'){const f=flFind(bid),o=b.closest('.bk-opt');if(f&&o)f.b.opcoes.splice(+o.dataset.oi,1);return false}
  E.fh.pop();return false}
function flEdit(t,isIn){
  const bk=t.closest('.bk'),st=t.closest('.bks');
  if(t.dataset.sf!==undefined){if(!isIn)return;const s=flStep(+st.dataset.sid);if(s){s.t=t.value;sedStatus()}return}
  const f=bk&&flFind(+bk.dataset.bid);if(!f)return;const b=f.b;
  if(t.dataset.of!==undefined){const o=b.opcoes[+t.closest('.bk-opt').dataset.oi],key=t.dataset.of;if(!o)return;
    if(key==='n'){if(isIn){o.n=t.value;sedStatus()}}else if(key==='sk'){if(!isIn){o.sk=t.value;sedStatus()}}else if(key==='pts'){if(isIn){o.pts=t.value===''?0:+t.value;sedStatus()}}return}
  const key=t.dataset.bf;
  if(t.type==='checkbox'){if(!isIn){b[key]=t.checked?1:0;sedStatus()}return}
  if(t.tagName==='SELECT'){if(!isIn){b[key]=t.value;sedStatus()}return}
  if(!isIn)return;b[key]=t.type==='number'?(t.value===''?'':+t.value):t.value;sedStatus()}
$('#sedMain').addEventListener('pointerdown',drStart);
$('#sedMain').addEventListener('click',e=>{const p=e.target.closest('.bk.pal');if(p&&E&&E.sec==='fluxo'){if(E.noclick)return;flAddTap(p.dataset.new);return}
  const s=e.target.closest('.bks');if(s&&E&&E.sec==='fluxo'&&!e.target.closest('[data-act]')){E.fsel=+s.dataset.sid;$$('#bws .bks').forEach(x=>x.classList.toggle('sel',+x.dataset.sid===E.fsel))}});
$('#sedMain').addEventListener('keydown',e=>{const p=e.target.closest&&e.target.closest('.bk.pal');if(p&&E&&(e.key==='Enter'||e.key===' ')){e.preventDefault();flAddTap(p.dataset.new)}});
$('#sedMain').addEventListener('focusin',e=>{if(E&&E.sec==='fluxo'&&e.target.closest&&e.target.closest('.bk,.bks'))E.fpre=JSON.stringify(E.fl)});
$('#sedMain').addEventListener('change',e=>{if(!E||E.sec!=='fluxo'||!E.fpre)return;if(!e.target.closest('.bk,.bks'))return;const now=JSON.stringify(E.fl);
  if(now!==E.fpre){E.fh.push(E.fpre);E.fr=[];E.fpre=now;const u=$('[data-act=fundo]');if(u)u.disabled=false}});
/* ---------- Supabase: conta e fichas na nuvem ---------- */
function cloudSaveLabel(){$('#cloudSave').textContent=activeCloudId?'Salvar alterações da ficha selecionada':'Salvar na nuvem'}
async function loadCloudList(){
  if(!cloudClient||!cloudUser)return;
  $('#cloudMsg').textContent='Carregando fichas…';
  const {data,error}=await cloudClient.from(CLOUD_TABLE).select('id,name,updated_at').eq('campaign','op').order('updated_at',{ascending:false});
  if(error){$('#cloudMsg').textContent='Não foi possível listar as fichas: '+cloudError(error);return}
  $('#cloudList').innerHTML=data.length?data.map(r=>`<li><span>${esc(r.name||'Agente sem nome')}<br><small>${r.updated_at?new Date(r.updated_at).toLocaleString('pt-BR'):''}</small></span><button class="btn sm" type="button" data-cloud-id="${esc(r.id)}">${r.id===activeCloudId?'Selecionada':'Carregar'}</button></li>`).join(''):'<li><span>Nenhuma ficha na nuvem ainda.</span></li>';
  if(data.length)$('#cloudMsg').textContent=activeCloudId?'Ficha selecionada; as próximas alterações serão sincronizadas automaticamente.':'Selecione uma ficha para carregar ou salve a ficha atual como nova.';
  cloudSaveLabel()
}
function paintCloudSession(user){
  cloudUser=user||null;paintRailAcct();
  $('#cloudSignedOut').hidden=!!cloudUser;$('#cloudSignedIn').hidden=!cloudUser;$('#cloudProfile').hidden=!cloudUser;$('#cloudPanel').hidden=!cloudUser;
  if(cloudUser){$('#cloudAccount').textContent='Conectado como '+(cloudUser.email||'usuário Supabase')+(Cloud.accountInfo(cloudUser).google?' · via Google':'');$('#cloudProfileEmail').textContent=cloudUser.email||'';void loadCloudProfile(cloudUser.id);void loadCloudList()}
  else{profileRequestUser=null;$('#cloudAuthMsg').textContent=cloudClient?'Entre com o Google ou receba um link de acesso por e-mail (abra-o neste mesmo navegador).':'Não foi possível carregar o cliente Supabase. Confira sua conexão.';$('#cloudList').innerHTML='';$('#cloudMsg').textContent='';$('#cloudProfileMsg').textContent='';$('#cloudAvatarPreview').hidden=true;$('#cloudAvatarFallback').hidden=false;$('#cloudDisplayName').value='';cloudProfileAvatarPath=null;cloudSaveLabel()}
}
let cloudProfileAvatarPath=null,profileRequestUser=null;
async function loadCloudProfile(userId){
  if(!cloudClient||!userId)return;
  profileRequestUser=userId;$('#cloudProfileMsg').textContent='Carregando perfil…';
  try{
    const {data,error}=await cloudClient.from('user_profiles').select('display_name,avatar_path').eq('user_id',userId).maybeSingle();
    if(error)throw error;
    if(profileRequestUser!==userId||cloudUser?.id!==userId)return;
    cloudProfileAvatarPath=data?.avatar_path||null;
    const gi=Cloud.accountInfo(cloudUser);
    $('#cloudDisplayName').value=data?.display_name||gi.name||cloudUser.email?.split('@')[0]||'';
    $('#cloudAccount').textContent='Conectado como '+($('#cloudDisplayName').value||cloudUser.email||'usuário Supabase')+(gi.google?' · via Google':'');
    if(cloudProfileAvatarPath){
      const {data:signed,error:signedError}=await cloudClient.storage.from('account-avatars').createSignedUrl(cloudProfileAvatarPath,3600);
      if(signedError)throw signedError;
      if(profileRequestUser!==userId)return;
      $('#cloudAvatarPreview').src=signed.signedUrl;$('#cloudAvatarPreview').hidden=false;$('#cloudAvatarFallback').hidden=true;paintRailAcct();
    }else if(gi.avatar){const pv=$('#cloudAvatarPreview');pv.referrerPolicy='no-referrer';pv.onerror=()=>{pv.hidden=true;$('#cloudAvatarFallback').hidden=false;paintRailAcct()};pv.src=gi.avatar;pv.hidden=false;$('#cloudAvatarFallback').hidden=true}
    else{$('#cloudAvatarPreview').hidden=true;$('#cloudAvatarFallback').hidden=false}
    paintRailAcct();$('#cloudProfileMsg').textContent=(!data&&gi.google?'Nome e foto vieram da sua conta Google. ':'')+'Nome e foto ficam salvos no perfil desta conta.';
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível carregar o perfil. Execute o SQL atualizado e tente novamente.';console.error('Falha ao carregar perfil:',error)}
}
async function saveCloudProfile(){
  if(!cloudClient||!cloudUser)return;
  const userId=cloudUser.id,button=$('#cloudProfileSave'),displayName=$('#cloudDisplayName').value.trim();
  if(!displayName){$('#cloudProfileMsg').textContent='Digite um nome para o perfil.';return}
  button.disabled=true;$('#cloudProfileMsg').textContent='Salvando perfil…';
  try{
    const {error}=await cloudClient.from('user_profiles').upsert({user_id:userId,display_name:displayName,avatar_path:cloudProfileAvatarPath,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw error;
    $('#cloudAccount').textContent=displayName+' · '+(cloudUser.email||'conta Supabase')+(Cloud.accountInfo(cloudUser).google?' · via Google':'');
    $('#cloudProfileMsg').textContent='Perfil salvo na sua conta.';
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível salvar o perfil: '+cloudError(error);console.error('Falha ao salvar perfil:',error)}
  finally{button.disabled=false}
}
async function setAccountAvatar(file){
  if(!cloudClient||!cloudUser||!file)return;
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){ $('#cloudProfileMsg').textContent='Escolha uma imagem JPG, PNG ou WebP.';return }
  if(file.size>8*1024*1024){$('#cloudProfileMsg').textContent='A imagem deve ter menos de 8 MB.';return}
  const button=$('#cloudAvatarPick');button.disabled=true;$('#cloudProfileMsg').textContent='Preparando foto…';
  try{
    const blob=await imageFileToSquareJpeg(file,512,.82);
    const path=cloudUser.id+'/avatar.jpg';
    const {error:uploadError}=await cloudClient.storage.from('account-avatars').upload(path,blob,{contentType:'image/jpeg',upsert:true,cacheControl:'3600'});
    if(uploadError)throw uploadError;
    cloudProfileAvatarPath=path;
    const {data:signed,error:signedError}=await cloudClient.storage.from('account-avatars').createSignedUrl(path,3600);
    if(signedError)throw signedError;
    $('#cloudAvatarPreview').src=signed.signedUrl;$('#cloudAvatarPreview').hidden=false;$('#cloudAvatarFallback').hidden=true;paintRailAcct();
    await saveCloudProfile();
  }catch(error){$('#cloudProfileMsg').textContent='Não foi possível enviar a foto: '+cloudError(error);console.error('Falha no avatar da conta:',error)}
  finally{button.disabled=false}
}
async function initCloud(){
  if(!cloudClient){$('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='O serviço Supabase não carregou. Verifique a conexão com a internet.';return}
  const authErr=Cloud.takeAuthError(),back=Cloud.takeReturnTarget();
  const {data,error}=await cloudClient.auth.getSession();
  if(error)$('#cloudAuthMsg').textContent='Erro ao verificar a sessão: '+cloudError(error);
  paintCloudSession(data&&data.session?data.session.user:null);paintAv();
  if(authErr){$('#cloudAuthMsg').textContent=authErr;toast('Login com Google',authErr)}
  else if(back==='coc'&&data&&data.session)setTimeout(()=>openCoc(),0);
  cloudClient.auth.onAuthStateChange((event,session)=>{
    const next=session&&session.user?session.user:null;
    if((next&&next.id)!==(cloudUser&&cloudUser.id)){clearTimeout(cloudSaveT);activeCloudId=null}
    paintCloudSession(next);paintAv()
  })
}
async function syncCloud(manual,newCopy){
  if(!cloudClient||!cloudUser){if(manual)$('#cloudMsg').textContent='Entre na sua conta antes de salvar na nuvem.';return}
  if(!manual&&cloudConflict)return;
  if(cloudSyncBusy){cloudSyncAgain=true;return}
  cloudSyncBusy=true;
  if(manual)$('#cloudMsg').textContent='Salvando…';
  try{
    const payload={campaign:'op',name:(D.pers||D.jog||'Agente sem nome').trim()||'Agente sem nome',sheet:JSON.parse(JSON.stringify(D)),updated_at:new Date().toISOString()};
    const r=await Cloud.saveSheet({client:cloudClient,table:CLOUD_TABLE,campaign:'op',userId:cloudUser.id,id:newCopy?null:activeCloudId,rev:cloudRev,force:!!(manual&&cloudConflict),payload});
    const id=r.id,rev=r.rev;
    activeCloudId=id;cloudRev=rev||null;cloudConflict=false;cloudSaveLabel();
    Cloud.ui.ok();$('#cloudMsg').textContent='Salvo na nuvem'+(manual?' com sucesso.':' automaticamente.')+' A cópia local também foi mantida.';
    if(manual)await loadCloudList()
  }catch(err){
    if(err&&err.conflict){
      cloudConflict=true;Cloud.ui.conflict();cloudSyncAgain=false;clearTimeout(cloudSaveT);
      $('#cloudMsg').textContent='A ficha na nuvem foi alterada em outro lugar (ou apagada). A sincronização automática pausou. “Salvar como nova” mantém as duas versões; “Salvar alterações” sobrescreve a da nuvem com esta.';
      swShow('Ficha alterada em outro lugar','A versão na nuvem mudou desde que você a abriu (outro aparelho ou aba?). Pausei a sincronização para não sobrescrever. Salve como cópia para manter as duas versões.','Salvar como cópia',()=>{$('#saveWarn').hidden=true;syncCloud(true,true)})
    }else{Cloud.ui.fail(err);$('#cloudMsg').textContent='Sincronização falhou; a ficha local está preservada. '+cloudError(err)}
  }
  finally{cloudSyncBusy=false;if(cloudSyncAgain){cloudSyncAgain=false;clearTimeout(cloudSaveT);Cloud.ui.pending();cloudSaveT=setTimeout(()=>syncCloud(false),350)}}
}
$('#cloudLogin').onclick=async()=>{
  const email=$('#cloudEmail').value.trim();
  if(!email||!$('#cloudEmail').checkValidity()){$('#cloudAuthMsg').textContent='Informe um endereço de e-mail válido.';return}
  if(location.protocol==='file:'){$('#cloudAuthMsg').textContent='Para entrar, abra a ficha por um servidor local (por exemplo, Live Server) ou depois de publicá-la em HTTPS. O protocolo file:// não permite o retorno seguro do login.';return}
  $('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='Enviando link de acesso…';
  try{
    const {error}=await cloudClient.auth.signInWithOtp({email,options:{emailRedirectTo:location.href,shouldCreateUser:true}});
    $('#cloudAuthMsg').textContent=error?'Não foi possível enviar o link: '+cloudError(error):'Link enviado para '+email+'. Abra-o neste mesmo navegador; confira também a pasta de spam.';
  }catch(error){$('#cloudAuthMsg').textContent='Falha ao enviar o link. Confira sua conexão e tente novamente.';console.error('Falha ao iniciar login:',error)}
  finally{$('#cloudLogin').disabled=false}
};
$('#cloudGoogle').onclick=async()=>{
  const b=$('#cloudGoogle');b.disabled=true;$('#cloudLogin').disabled=true;$('#cloudAuthMsg').textContent='Abrindo o login do Google…';
  try{await Cloud.signInGoogle()}
  catch(error){$('#cloudAuthMsg').textContent='Não foi possível entrar com o Google: '+cloudError(error);console.error('Falha no login Google:',error)}
  finally{b.disabled=false;$('#cloudLogin').disabled=false}
};
$('#cloudProfileSave').onclick=saveCloudProfile;
$('#cloudAvatarPick').onclick=()=>$('#cloudAvatarFile').click();
$('#cloudAvatarFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)void setAccountAvatar(file);e.target.value=''});
$('#cloudLogout').onclick=async()=>{const {error}=await cloudClient.auth.signOut();if(error)$('#cloudMsg').textContent='Não foi possível sair: '+cloudError(error)};
$('#cloudSave').onclick=()=>syncCloud(true,false);
$('#cloudSaveNew').onclick=()=>syncCloud(true,true);
$('#cloudRefresh').onclick=loadCloudList;
$('#cloudList').addEventListener('click',async e=>{
  const b=e.target.closest('[data-cloud-id]');if(!b||!cloudClient||!cloudUser)return;
  if(!confirm('Carregar esta ficha? A ficha aberta neste aparelho fica guardada em Meus agentes.'))return;
  b.disabled=true;$('#cloudMsg').textContent='Carregando ficha…';
  const {data,error}=await cloudClient.from(CLOUD_TABLE).select('id,name,sheet,updated_at').eq('id',b.dataset.cloudId).eq('campaign','op').single();
  if(error){$('#cloudMsg').textContent='Não foi possível carregar a ficha: '+cloudError(error);b.disabled=false;return}
  if(!data.sheet||typeof data.sheet!=='object'||!data.sheet.attr){$('#cloudMsg').textContent='Os dados desta ficha parecem inválidos.';b.disabled=false;return}
  if(!slPush()){b.disabled=false;$('#cloudMsg').textContent='Carregamento cancelado.';return}
  clearTimeout(cloudSaveT);activeCloudId=data.id;cloudRev=data.updated_at||null;cloudConflict=false;cloudApplying=true;D=normalize(data.sheet);D.created=true;D.camp=D.camp||'op';save();cloudApplying=false;renderAll();
  if(!$('#camp').hidden)closeCamp();$('#cloudMsg').textContent='Ficha “'+(data.name||'Agente sem nome')+'” carregada. As próximas alterações serão sincronizadas automaticamente.';cloudSaveLabel();loadCloudList()
});

/* ---------- identidade e retrato ---------- */
[['f-jog','jog'],['f-pers','pers'],['f-ori','ori'],['f-cls','cls'],['f-nivel','nivel'],['f-nex','nex'],['f-pe','pe'],['f-desl','desl']].forEach(([id,k])=>{const el=$('#'+id);el.addEventListener('input',()=>{D[k]=el.value;save();if(k==='pe'||k==='nivel'||k==='nex'||k==='cls'){dtRefresh();if(k!=='pe')syncBars()}});el.addEventListener('change',()=>{D[k]=el.value;save()})});
function imageFileToSquareJpeg(file,size,quality){return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{try{const side=Math.min(img.naturalWidth,img.naturalHeight),canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,size,size);canvas.toBlob(blob=>{URL.revokeObjectURL(url);blob?resolve(blob):reject(new Error('Não foi possível processar a imagem.'))},'image/jpeg',quality)}catch(error){URL.revokeObjectURL(url);reject(error)}};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('O arquivo não é uma imagem válida.'))};img.src=url;
})}
function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})}
$('#avatar').onclick=()=>$('#avFile').click();
$('#avFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
  const blob=await imageFileToSquareJpeg(f,256,.82),prev=D.av;
  if(cloudClient&&cloudUser){
    const path=cloudUser.id+'/char-'+Date.now()+'.jpg';
    const {error}=await cloudClient.storage.from('account-avatars').upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000'});
    if(error)throw error;
    D.av='sb:'+path;
    if(prev&&prev.startsWith('sb:')&&prev.slice(3).startsWith(cloudUser.id+'/'))cloudClient.storage.from('account-avatars').remove([prev.slice(3)]).catch(()=>{})
  }else D.av=await blobToDataUrl(blob);
  save();paintAv()}catch(error){toast('Foto não atualizada',error.message||'Tente de novo.')}finally{e.target.value=''}};
const avCache=new Map();let avTok=0;
async function avUrl(path){const c=avCache.get(path);if(c&&c.exp>Date.now())return c.url;const {data,error}=await cloudClient.storage.from('account-avatars').createSignedUrl(path,3600);if(error)throw error;avCache.set(path,{url:data.signedUrl,exp:Date.now()+3300000});return data.signedUrl}
function paintAv(){const i=$('#avimg'),v=D.av,hide=()=>{i.hidden=true;i.removeAttribute('src')};
  if(!v){hide();return}
  if(v.startsWith('sb:')){if(!cloudClient||!cloudUser){hide();return}
    const t=++avTok;avUrl(v.slice(3)).then(u=>{if(t===avTok&&D.av===v){i.src=u;i.hidden=false}}).catch(hide)}
  else{i.src=v;i.hidden=false}}

/* ---------- biblioteca de habilidades (classe, subclasse, elemento) ---------- */
/* Fonte: prints do documento "Habilidades de Classe, Subclasse e Poderes Paranormais". Resumos em palavras próprias. */
const L=(t,g,rows)=>rows.map(r=>({t,g,x:r[0],n:r[1],c:r[2]||'',d:r[3],k:!!r[4]}));
let LIBG={},LIBREQ={},LIB=[];
let libT='Classe',libG='Combatente';
const nexNum=()=>{const n=parseInt(D.nex,10);return isNaN(n)?99:n};
const libKey=a=>a.t+'|'+a.g+'|'+a.n;
function renderLib(){
  $$('#libT button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===libT));
  const groups=LIBG[libT]||[];
  if(!groups.includes(libG))libG=groups[0]||'';
  $('#libG').innerHTML=groups.map(g=>`<option${g===libG?' selected':''}>${esc(g)}</option>`).join('');
  if(editableCatalogLoading){$('#libN').textContent='Carregando habilidades do Supabase…';$('#libList').innerHTML='<li class="empty">Aguarde um instante.</li>';return}
  if(editableCatalogError&&!LIB.length){$('#libN').textContent=editableCatalogError;$('#libList').innerHTML='<li class="empty">A biblioteca de habilidades está indisponível.</li>';return}
  const q=$('#libQ').value.trim().toLowerCase(),only=$('#libOnly').checked,nx=nexNum(),have=new Set(D.hab.map(h=>h.lib).filter(Boolean));
  const items=LIB.filter(a=>a.t===libT&&a.g===libG&&(!q||(a.n+' '+a.d).toLowerCase().indexOf(q)>-1)&&(!only||a.x<=nx));
  $('#libN').textContent='Seu NEX: '+nx+'%. '+(LIBREQ[libG]||'');
  $('#libList').innerHTML=items.map(a=>{const key=libKey(a),has=have.has(key),lock=a.x>nx;
    return`<li class="oc${lock?' lock':''}${has?' sel':''}"><div class="oc-h"><h3>${esc(a.n)}</h3><button class="wz-btn sm" type="button" data-lib="${esc(key)}"${has||lock?' disabled':''}>${has?'Adicionada ✓':lock?'Libera em '+a.x+'%':'Adicionar'}</button></div><div class="chps"><span class="chp">NEX ${a.x}%</span>${a.c?`<span class="chp">${esc(a.c)}</span>`:''}${a.k?'<span class="chp" title="Texto pequeno no print: confira com o documento">conferir</span>':''}</div><p>${esc(a.d)}</p></li>`}).join('')||'<li class="empty">Nada encontrado.</li>'}
$('#habLib').onclick=()=>{renderLib();openM('mLib')};
$('#libT').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;libT=b.dataset.t;libG=LIBG[libT][0];renderLib()});
$('#libG').onchange=e=>{libG=e.target.value;renderLib()};
$('#libQ').addEventListener('input',renderLib);$('#libOnly').onchange=renderLib;
$('#libList').addEventListener('click',e=>{const b=e.target.closest('[data-lib]');if(!b||b.disabled)return;const a=LIB.find(x=>libKey(x)===b.dataset.lib);if(!a)return;
  D.hab.push({id:uid(),n:a.n,custo:a.c,d:a.d+(a.k?' (conferir com o documento)':''),lib:libKey(a)});save();renderHab();renderLib();toast('Habilidade adicionada',a.n)});

/* ---------- escolha da campanha (cada campanha futura entra nesta lista) ---------- */
const COCLOGO=GH+'Coclogo_HIGH.webp';
const CAMPS=[
 {id:'op',n:'Ordem Paranormal',d:'Agentes da Ordem enfrentam o Outro Lado: investigação, ação e horror paranormal.',ready:true},
 {id:'coc',n:'Call of Cthulhu',d:'Horror cósmico e investigação nos anos 1920.',ready:true},
 {id:'nova',n:'Sistema próprio',d:'Monte o seu sistema: escolha atributos, perícias, barras e contas. Parta do OP, do CoC ou do zero.',ready:true}];
function campHTML(){const opl=GH+'Logoordemparanormal_HIGH.webp';
  return CAMPS.map(c=>{const logo=c.id==='op'?`<span class="cm-logo"><img src="${opl}" alt="${c.n}"></span>`:c.id==='coc'?`<span class="cm-logo"><img src="${COCLOGO}" alt="${c.n}"></span>`:`<span class="cm-name">${esc(c.n)}</span>`;
    return`<li class="cm ${c.id}${c.ready?'':' off'}" data-id="${c.id}"><button class="cm-b" type="button" data-camp="${c.id}"${c.ready?'':' aria-disabled="true"'}><span class="cm-art"></span><span class="cm-in">${logo}<span class="cm-d">${esc(c.d)}</span><span class="cm-go">${c.ready?'Criar agente':'Em breve'}</span></span></button></li>`}).join('')}
function openCamp(){loadImgs('camp');const el=$('#camp');$('#cmList').innerHTML=campHTML();$('#campCancel').hidden=false;el.hidden=false;document.body.style.overflow='hidden';
  if(!rm()){el.animate([{opacity:0},{opacity:1}],{duration:260});$$('.cm',el).forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:380,delay:90+i*90,fill:'backwards',easing:'cubic-bezier(.2,.7,.2,1)'}))}}
async function closeCamp(){const el=$('#camp');if(!rm())await el.animate([{opacity:1},{opacity:0}],{duration:220}).finished;el.hidden=true;document.body.style.overflow=''}
async function pickCamp(id){const c=CAMPS.find(x=>x.id===id);if(!c)return;
  if(!c.ready){toast(c.n,'Essa campanha ainda não está disponível.');return}
  const li=$('.cm[data-id='+id+']');if(li&&!rm())await li.animate([{transform:'scale(1)'},{transform:'scale(1.03)',offset:.5},{transform:'scale(.99)'}],{duration:240}).finished;
  if(!$('#camp').hidden)await closeCamp();if(id==='op')await openWiz();else if(id==='coc')openCoc('new');else if(id==='nova'){$('#nvFlowRow').hidden=!(SYS!==OP&&SYS.criacao&&SYS.criacao.length);renderNvLib();openM('mNova')}}
$('#cmList').addEventListener('click',e=>{const b=e.target.closest('[data-camp]');if(b)pickCamp(b.dataset.camp)});
$('#campCancel').onclick=async()=>{const back=fromMenu||!D.created;fromMenu=false;await closeCamp();if(back)openHome()};
/* ---------- assistente de criação: Atributos > Origem > Classe > Toques Finais ---------- */
/* Origens: perícias e poderes conforme a lista do CRIS; os resumos dos poderes estão em palavras próprias. */
let ORIG=[];
let CLS={};
let W=null,wzMax=0;
const wzNewState=()=>({step:0,attr:Object.fromEntries(OPATTRS.map(a=>[a,OP.atributo.inicial])),ori:-1,amn:['',''],cls:'',pick:[0,0],q:'',d:{pers:'',jog:'',a:'',p:'',h:'',o:''}});
function wzLeft(){let left=OP.atributo.criacao.pontos;OPATTRS.forEach(a=>{left-=(W.attr[a]-OP.atributo.inicial)});return left}
function wzZero(except){return OPATTRS.some(a=>a!==except&&W.attr[a]===0)}
function wzStats(){const c=CLS[W.cls];if(!c)return null;const o=W.ori>=0?ORIG[W.ori].n:'';
  let pv=c.pv+W.attr.VIG,pe=c.pe+W.attr.PRE,san=c.san,lim=1;
  if(o==='Cultista Arrependido')san=Math.floor(san/2);if(o==='Desgarrado')pv+=1;if(o==='Vítima')san+=1;if(o==='Universitário'){pe+=1;lim=2}
  return{pv,pe,san,lim}}
function wzHint(){const h=[];
  if(W.step===0){const l=wzLeft();if(l>0)h.push('Você ainda tem '+l+' ponto'+(l>1?'s':'')+' para distribuir.');else if(l<0)h.push('Pontos demais: reduza algum atributo.')}
  if(W.step===1&&W.ori<0)h.push('Você ainda não escolheu uma origem.');
  if(W.step===2&&!W.cls)h.push('Escolha uma classe ou comece como Mundano.');
  return h.join(' ')}
function wzStepsHTML(){return['Atributos','Origem','Classe','Toques Finais'].map((n,i)=>`<button class="wz-s${i===W.step?' on':''}" type="button" data-step="${i}"${i===W.step?' aria-current="step"':''}>${n}</button>`).join('<i class="wz-l"></i>')}
function wzHexes(){
  return OPATTRS.map(a=>{const g=wzAng(a)*Math.PI/180,x=50+31*Math.cos(g),y=50+31*Math.sin(g),v=W.attr[a],left=wzLeft();
    const decDis=v<=0||(v===1&&wzZero(a)),incDis=v>=OP.atributo.criacao.max||left<=0;
    return`<div class="hex" data-a="${a}" style="--x:${x.toFixed(2)};--y:${y.toFixed(2)}"><span class="hn">${v}</span><span class="hk">${OPNAME[a]}</span><span class="ha">${a}</span><span class="ctl"><button type="button" data-act="dec" data-a="${a}" aria-label="Diminuir ${OPNAME[a]}"${decDis?' disabled':''}>−</button><button type="button" data-act="inc" data-a="${a}" aria-label="Aumentar ${OPNAME[a]}"${incDis?' disabled':''}>+</button></span></div>`}).join('')}
function wzBody(){
  if(W.step===0){const l=wzLeft();
    return`<div class="wz-a"><div class="wz-txt"><p>Todo atributo começa em 1 e você tem 4 pontos para distribuir como quiser. Também pode reduzir um atributo a 0 para ganhar 1 ponto extra. Na criação, nenhum atributo passa de 3.</p><p class="wz-pts">Pontos para distribuir: <b id="wzLeft">${l}</b></p></div><div class="wheel wz" id="wzWheel">${$('#wheel .wsvg').outerHTML}${wzHexes()}</div></div>`}
  if(W.step===1)return`<p class="wz-h">A origem é o que seu personagem fazia antes da Ordem. Cada uma dá duas perícias treinadas e um poder, que entram na ficha automaticamente.</p><p class="wz-n">Perícias opcionais você marca depois, na lista de perícias.</p><input class="wz-q" id="wzQ" type="search" placeholder="Buscar origem ou perícia" aria-label="Buscar origem" value="${esc(W.q)}"><ul class="olist" id="olist">${ORIG.map((o,i)=>wzOrigHTML(o,i)).join('')}</ul>`;
  if(W.step===2)return`<p class="wz-h">A classe é o treinamento que você recebeu na Ordem e define o seu papel no grupo.</p><p class="wz-n">Como alternativa, você pode não escolher classe e começar como uma pessoa comum: <button class="wz-btn sm${W.cls==='Mundano'?' ok':''}" type="button" data-act="cls" data-c="Mundano">${W.cls==='Mundano'?'Mundano ✓':'Mundano'}</button></p><div class="clist">${Object.keys(CLS).map(wzClsHTML).join('')}</div><p class="wz-n" style="margin-top:14px">Valores iniciais conferem com NEX 5% e usam os atributos que você definiu. Dá para ajustar tudo na ficha.</p>`;
  const st=wzStats(),o=W.ori>=0?ORIG[W.ori].n:'—';
  return`<div class="wz-f"><p class="wz-h" style="margin:0">Até aqui você definiu a parte mecânica. Agora dê vida ao agente. Nada disso muda regras.</p>
<div class="wz-sum"><div><b>Origem:</b> ${esc(o)} · <b>Classe:</b> ${esc(W.cls||'—')}</div><div><b>Atributos:</b> ${OPATTRS.map(a=>a+' '+W.attr[a]).join(' · ')}</div>${st?`<div><b>PV</b> ${st.pv} · <b>PE</b> ${st.pe} · <b>Sanidade</b> ${st.san}</div>`:''}</div>
<div class="row2"><label>Personagem<input data-d="pers" value="${esc(W.d.pers)}" placeholder="Nome do personagem" maxlength="40"></label><label>Jogador<input data-d="jog" value="${esc(W.d.jog)}" placeholder="Nome do jogador" maxlength="40"></label></div>
<label>Aparência<textarea data-d="a" placeholder="Nome, gênero, idade, descrição física…">${esc(W.d.a)}</textarea></label>
<label>Personalidade<textarea data-d="p" placeholder="Traços marcantes, opiniões, ideais…">${esc(W.d.p)}</textarea></label>
<label>Histórico<textarea data-d="h" placeholder="Infância, relação com a família, contato com o Paranormal, eventos bons e ruins…">${esc(W.d.h)}</textarea></label>
<label>Objetivo<textarea data-d="o" placeholder="Por que ele faz parte da Ordem? Por que luta contra o Outro Lado?">${esc(W.d.o)}</textarea></label></div>`}
function wzOrigHTML(o,i){const sel=W.ori===i,sk=o.s||W.amn.filter(Boolean);
  const amn=!o.s&&sel?`<div class="amn">${[0,1].map(k=>`<select data-amn="${k}" aria-label="Perícia ${k+1}"><option value="">Perícia ${k+1}…</option>${OP.pericias.map(s=>`<option${W.amn[k]===s.n?' selected':''}>${esc(s.n)}</option>`).join('')}</select>`).join('')}</div>`:'';
  return`<li class="oc${sel?' sel':''}" data-i="${i}" data-key="${esc((o.n+' '+(o.s||[]).join(' ')).toLowerCase())}"><div class="oc-h"><h3>${esc(o.n)}</h3><button class="wz-btn sm" type="button" data-act="ori" data-i="${i}">${sel?'Escolhida ✓':'Escolher'}</button></div>
<div class="chps">${o.s?o.s.map(s=>`<span class="chp">${s}</span>`).join(''):'<span class="chp">2 perícias à escolha</span>'}</div>${amn}<p><b class="pw">${esc(o.p.n)}.</b> ${esc(o.p.t)}${o.chk?' <em>(perícias a conferir)</em>':''}</p></li>`}
function wzClsHTML(k){const c=CLS[k],sel=W.cls===k,v=W.attr,pk=c.sk.filter(g=>g.length>1).length?`<div class="pk">${c.sk.map((g,i)=>g.length>1?`<select data-pick="${i}" aria-label="Escolha de perícia">${g.map((n,j)=>`<option value="${j}"${(W.pick[i]||0)===j?' selected':''}>${n}</option>`).join('')}</select>`:'').join('')}</div>`:'';
  return`<div class="cp${sel?' sel':''}" data-c="${k}"><h3>${k}</h3><p>${c.t}</p><p>${c.txt}</p><div class="st">PV ${c.pv+v.VIG} · PE ${c.pe+v.PRE} · SAN ${c.san}</div>${sel?pk:''}<button class="wz-btn" type="button" data-act="cls" data-c="${k}">${sel?'Escolhida ✓':'Escolher'}</button></div>`}
function wzFoot(){const last=W.step===3;
  return`<button class="wz-link" type="button" data-act="skip">Pular criação</button><span class="wz-hint" id="wzHint">${esc(wzHint())}</span><span style="display:flex;gap:8px">${W.step>0?'<button class="wz-btn ghost" type="button" data-act="back">Voltar</button>':'<button class="wz-btn ghost" type="button" data-act="camps">Campanhas</button>'}<button class="wz-btn${last?' ok':''}" type="button" data-act="${last?'fin':'next'}">${last?'Finalizar':'Próximo'}</button></span>`}
function wzRender(dir){const body=$('#wzBody');
  $('#wzSteps').innerHTML=wzStepsHTML();body.innerHTML=wzBody();$('#wzFoot').innerHTML=wzFoot();wzMax=Math.max(wzMax,W.step);
  if(dir&&!rm())body.animate([{opacity:0,transform:'translateX('+(dir*30)+'px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});
  if(W.step===1&&W.q)wzFilter()}
function wzFilter(){const q=W.q.trim().toLowerCase();$$('#olist .oc').forEach(li=>li.hidden=!!q&&li.dataset.key.indexOf(q)<0)}
function wzGo(n,dir){if(n<0||n>3)return;const d=dir||(n>W.step?1:-1);W.step=n;wzRender(d);$('#wiz').scrollTo?$('#wiz').scrollTo({top:0}):0}
async function openWiz(){
  if(editableCatalogLoading)await catalogsReady;
  if(editableCatalogError){toast('Criação indisponível',editableCatalogError);return}
  loadImgs('wiz');W=wzNewState();wzMax=0;const w=$('#wiz');w.hidden=false;document.body.style.overflow='hidden';wzRender(0);if(!rm())w.animate([{opacity:0},{opacity:1}],{duration:250})}
async function closeWiz(){const w=$('#wiz');if(!rm())await w.animate([{opacity:1},{opacity:0}],{duration:220}).finished;w.hidden=true;document.body.style.overflow=''}
function wzApply(){
  if(!slPush())return;
  clearTimeout(cloudSaveT);activeCloudId=null;const cfg=D.cfg;useMold(OP);D=fresh();D.cfg=cfg;D.created=true;D.attr=Object.assign({},W.attr);
  const train=n=>{const s=D.sk.find(x=>x.n===n);if(s&&s.tr<1)s.tr=1};
  const o=W.ori>=0?ORIG[W.ori]:null;
  if(o){(o.s||W.amn).filter(Boolean).forEach(train);D.ori=o.n;D.hab.push({id:uid(),n:o.p.n,custo:o.p.c||'',d:o.p.t})}
  if(W.cls==='Mundano')D.cls='Mundano';
  else if(CLS[W.cls]){D.cls=W.cls;CLS[W.cls].sk.forEach((g,i)=>train(g.length>1?g[W.pick[i]||0]:g[0]));const st=wzStats();D.bars.vida=[st.pv,st.pv];D.bars.san=[st.san,st.san];D.bars.esf=[st.pe,st.pe];D.pe=String(st.lim)}
  D.pers=W.d.pers.trim();D.jog=W.d.jog.trim();D.desc={a:W.d.a,p:W.d.p,h:W.d.h,o:W.d.o};
  D.camp='op';save();renderAll();go('char',1)}
$('#wzBody').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='inc'||a==='dec'){const k=b.dataset.a,v=W.attr[k];
    if(a==='inc'&&v<OP.atributo.criacao.max&&wzLeft()>0)W.attr[k]=v+1;
    else if(a==='dec'){if(v>1)W.attr[k]=v-1;else if(v===1&&!wzZero(k))W.attr[k]=0}
    else return;
    const wh=$('#wzWheel');wh.querySelectorAll('.hex').forEach(h=>h.remove());wh.insertAdjacentHTML('beforeend',wzHexes());$('#wzLeft').textContent=wzLeft();$('#wzHint').textContent=wzHint();
    const hn=$('.hex[data-a='+k+'] .hn',wh);if(!rm())hn.animate([{transform:'scale(1.6)',color:'#a64dff'},{transform:'none'}],{duration:260,easing:'cubic-bezier(.3,1.6,.5,1)'});
    const nb=$('.hex[data-a='+k+'] [data-act='+a+']',wh);if(nb&&!nb.disabled)nb.focus({preventScroll:true})}
  else if(a==='ori'){W.ori=+b.dataset.i;$$('#olist .oc').forEach(li=>{const on=+li.dataset.i===W.ori;li.classList.toggle('sel',on);$('[data-act=ori]',li).textContent=on?'Escolhida ✓':'Escolher'});
    const li=$('#olist .oc[data-i="'+W.ori+'"]');const o=ORIG[W.ori];
    if(!o.s){const old=$('.amn',li);if(!old){const h=document.createElement('div');h.className='amn';h.innerHTML=[0,1].map(k=>`<select data-amn="${k}" aria-label="Perícia ${k+1}"><option value="">Perícia ${k+1}…</option>${OP.pericias.map(s=>`<option${W.amn[k]===s.n?' selected':''}>${esc(s.n)}</option>`).join('')}</select>`).join('');$('.chps',li).after(h)}}
    else $$('#olist .amn').forEach(x=>x.remove());
    if(!rm())li.animate([{transform:'scale(.98)'},{transform:'none'}],{duration:240,easing:'cubic-bezier(.3,1.6,.5,1)'});$('#wzHint').textContent=wzHint()}
  else if(a==='cls'){W.cls=b.dataset.c;wzRender(0);const c=$('.cp.sel');if(c&&!rm())c.animate([{transform:'scale(.98)'},{transform:'none'}],{duration:240,easing:'cubic-bezier(.3,1.6,.5,1)'})}});
$('#wzBody').addEventListener('change',e=>{const t=e.target;
  if(t.dataset.amn!=null)W.amn[+t.dataset.amn]=t.value;
  if(t.dataset.pick!=null)W.pick[+t.dataset.pick]=+t.value});
$('#wzBody').addEventListener('input',e=>{const t=e.target;if(t.id==='wzQ'){W.q=t.value;wzFilter()}else if(t.dataset.d)W.d[t.dataset.d]=t.value});
$('#wzSteps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)wzGo(+b.dataset.step)});
$('#wzFoot').addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='next')wzGo(W.step+1,1);else if(a==='back')wzGo(W.step-1,-1);
  else if(a==='camps'){await closeWiz();openCamp()}
  else if(a==='skip'){if(!D.created||!D.camp){D.created=true;D.camp='op';save()}await closeWiz()}
  else if(a==='fin'){wzApply();await closeWiz();toast('Agente criado','Bom jogo, '+(D.pers||'agente')+'.')}});

[['d-a','a'],['d-p','p'],['d-h','h'],['d-o','o']].forEach(([id,k])=>$('#'+id).addEventListener('input',e=>{D.desc[k]=e.target.value;save()}));
$('#bNew').onclick=()=>openM('mNew');
/* ---------- menu inicial ---------- */
const HMK='op-ficha-menu';
const homeOn=()=>true;
let homeBack=null,fromMenu=false,menuNew=false,menuIO=false,ioCancel=false,menuSys=null;
function homeFill(){
  const has=!!D.created,c=$('#hmCont');c.hidden=!has;$('#hmWelcome').hidden=has;
  hmInfo(has);
  if(!has)return;
  const nome=(D.pers||'').trim()||'Personagem sem nome',R=(SYS&&SYS.rotulos)||{},nex=(D.nex||'').trim();
  const sub=[(D.cls||'').trim(),nex&&R.nex?R.nex+' '+nex:'',(SYS&&SYS.nome)||''].filter(Boolean).join(' · ');
  $('#hmName').textContent=nome;$('#hmSub').textContent=sub;
  const av=$('#hmAv'),im=$('#avimg');av.textContent='';
  if(im&&!im.hidden&&im.getAttribute('src')){const i=document.createElement('img');i.alt='';i.src=im.getAttribute('src');av.appendChild(i)}
  else av.textContent=nome.charAt(0).toUpperCase();
  {const w=$('#hmWhen'),t=tGet(HMT);w.textContent=t?'Editada '+ago(t):'';w.hidden=!t}}
function hmSet(id,txt){const e=$('#'+id);if(!e)return;if(txt){e.textContent=txt;e.classList.add('hm-i')}else{e.textContent=e.dataset.d||'';e.classList.remove('hm-i')}}
function hmInfo(has){
  const n=slIdx().list.length+(has?1:0);
  hmSet('hmSlN',n?(n===1?'1 agente guardado':n+' agentes guardados'):'');
  const parts=[];try{if(cloudUser)parts.push('Nuvem conectada')}catch(e){}
  if(has){const b=tGet(HMB);parts.push(b?'Último backup '+ago(b):'Sem backup ainda')}
  hmSet('hmOpN',parts.join(' · '));
  hmSet('hmSysC',has&&SYS&&SYS.nome?'Ficha atual: '+SYS.nome:'')}
/* começa uma ficha nova; sys = sistema escolhido no pôster (ou null para escolher depois) */
function startNew(){const id=menuSys;menuSys=null;if(id)pickCamp(id);else openCamp()}
function newFlow(sys){fromMenu=true;
  if(D.created){$('#bNew').click();menuNew=true;fromMenu=true;menuSys=sys||null}
  else{menuSys=sys||null;startNew()}}
function openHome(){
  const el=$('#home');if(!el.hidden)return;
  homeFill();
  const lg=$('.hm-logo');lg.onerror=()=>{lg.hidden=true};lg.onload=()=>{lg.hidden=false};lg.src=GH+'Logoordemparanormal_HIGH.webp';
  homeBack=document.activeElement;el.hidden=false;el.scrollTop=0;document.body.style.overflow='hidden';
  kIn(el);if(!rm())el.animate([{opacity:0},{opacity:1}],{duration:240});
  const first=$('#hmCont').hidden?$('#hmWelcome .k-cta'):$('#hmCont');if(matchMedia('(hover:hover)').matches)setTimeout(()=>first.focus({preventScroll:true}),40)}
function closeHome(){
  const el=$('#home');if(el.hidden)return;el.hidden=true;document.body.style.overflow='';
  const b=homeBack;homeBack=null;if(b&&b.focus&&document.contains(b)){try{b.focus({preventScroll:true})}catch(e){}}}
$('#bHome').onclick=openHome;
$('#home').addEventListener('click',e=>{
  const b=e.target.closest('[data-hm]');if(!b)return;const a=b.dataset.hm;
  if(a==='top'){$('#home').scrollTo({top:0,behavior:rm()?'auto':'smooth'});return}
  closeHome();
  if(a==='cont')return;
  fromMenu=true;
  if(a==='new')newFlow(b.dataset.sys||null);
  else if(a==='open')openCfg('abrir')
  else if(a==='edit')sysOpen();
  else if(a==='lib')sysOpen('geral');
  else if(a==='cfg')openCfg('conta');else if(a==='sl'||a==='sys'||a==='help')openSl(a)});
document.addEventListener('keydown',e=>{
  const el=$('#home');if(el.hidden)return;
  if(e.key==='Escape'&&D.created){e.preventDefault();closeHome();return}
  if(e.key==='Tab'){const f=$$('button:not([hidden]),input,summary',el).filter(x=>!x.disabled&&x.offsetParent!==null);
    if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
    else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
$('#nwExp').onclick=()=>$('#ioExp').click();
$('#nwGo').onclick=()=>{if(menuSys)menuNew=false;closeM('mNew');startNew()};
/* ---------- montar tudo ---------- */
function renderAll(){
  [['f-jog','jog'],['f-pers','pers'],['f-ori','ori'],['f-cls','cls'],['f-nivel','nivel'],['f-nex','nex'],['f-pe','pe'],['f-desl','desl'],['c-def','def'],['c-prot','prot'],['c-res','res']].forEach(([id,k])=>$('#'+id).value=D[k]||'');
  [['d-a','a'],['d-p','p'],['d-h','h'],['d-o','o']].forEach(([id,k])=>$('#'+id).value=D.desc[k]||'');
  paintAv();buildBars();applyMoldUI();buildWheel();BARS.forEach(([k])=>paintBar(k,null));renderSkills();renderAtk();renderHab();renderRit();renderInv();dtRefresh()}
$('.splogo').src=GH+'Logoordemparanormal_HIGH.webp';$('.logo').src=GH+'Logoordemparanormal_LOW.webp';
const catalogsReady=loadGameCatalogs();buildBars();buildFilters();renderAll();initCloud();

/* ---------- foco e teclado dos diálogos ---------- */
(function(){
  const SEL='.modal,#rov,#camp,#wiz,#cw,#sysEd,#mSl',stack=[],opener=new Map();
  const FOC='a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const foc=el=>$$(FOC,el).filter(x=>x.offsetParent!==null||x.getClientRects().length>0);
  function shown(el){if(stack.includes(el))return;stack.push(el);opener.set(el,document.activeElement);
    const box=el.querySelector('[role=dialog],[role=alertdialog]')||el;box.tabIndex=-1;
    setTimeout(()=>{if(!el.hidden&&!el.contains(document.activeElement))box.focus({preventScroll:true})},30)}
  function gone(el){const i=stack.indexOf(el);if(i<0)return;stack.splice(i,1);const o=opener.get(el);opener.delete(el);
    if(o&&o.focus&&document.contains(o)){try{o.focus({preventScroll:true})}catch(e){}}}
  const mo=new MutationObserver(ms=>ms.forEach(m=>{const el=m.target;if(el.hidden)gone(el);else shown(el)}));
  $$(SEL).forEach(el=>{mo.observe(el,{attributes:true,attributeFilter:['hidden']});if(!el.hidden)shown(el)});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!stack.length)return;
    const top=stack[stack.length-1];if(top.hidden)return;
    const sw=$('#saveWarn'),f=foc(top).concat(sw.hidden?[]:foc(sw)),a=document.activeElement;
    if(!f.length){e.preventDefault();return}
    if(!top.contains(a)&&!sw.contains(a)){e.preventDefault();f[0].focus();return}
    const isBox=/dialog/.test(a.getAttribute('role')||'')&&top.contains(a);
    if(e.shiftKey&&(a===f[0]||isBox)){e.preventDefault();f[f.length-1].focus()}
    else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus()}});
})();

/* ---------- fundo vivo, partículas e “ficha só ao entrar” ---------- */
(function(){
  try{const u=(innerWidth>=900?`url(${ASSET_BASE}OPbackgroundwide.webp),`:'')+`url(${IMGS.op})`;$$('.hm-bg').forEach(e=>e.style.backgroundImage=u)}catch(e){}
  try{$$('[data-img]').forEach(e=>{const u=IMGS[e.dataset.img];if(u)e.style.backgroundImage=e.matches('.k-art,.k-side')?heroBg(e.dataset.img):`url(${u})`});
    $('#kPrev').onclick=()=>$('#kRow').scrollBy({left:-380,behavior:'smooth'});$('#kNext').onclick=()=>$('#kRow').scrollBy({left:380,behavior:'smooth'})}catch(e){}
  $$('.hm-fx').forEach(f=>{let h='';for(let i=0;i<30;i++){const r=Math.random;h+=`<i style="--s:${(r()*2.8+1.2).toFixed(1)}px;left:${(r()*100).toFixed(1)}%;--d:${(r()*14+10).toFixed(1)}s;--dl:${(-r()*22).toFixed(1)}s;--x:${(r()*80-40).toFixed(0)}px"></i>`}f.innerHTML=h});
  const root=document.documentElement,watch=['#home','#mSl','#camp','#wiz'].map(q=>$(q)).filter(Boolean),mN=$('#mNew');
  $('#bNew').addEventListener('click',()=>{menuNew=false;fromMenu=false;menuSys=null});
  let was=false;
  function upd(){
    if(mN.hidden&&menuNew){menuNew=false;menuSys=null;if(watch.every(e=>e.hidden))openHome()}
    const on=watch.some(e=>!e.hidden)||(!mN.hidden&&menuNew);
    root.classList.toggle('mm',on);
    if(was&&!on&&!$('#app').hidden&&!rm())$('#app').animate([{opacity:0},{opacity:1}],{duration:420,easing:'ease-out'});
    was=on;
    if(!$('#mSl').hidden)document.body.style.overflow='hidden';
    else if(watch.every(e=>e.hidden)&&$('#cw').hidden&&$('#sysEd').hidden)document.body.style.overflow=''}
  const mo=new MutationObserver(upd);[...watch,mN].forEach(e=>mo.observe(e,{attributes:true,attributeFilter:['hidden']}));upd();
})();

function heroBg(k){return k==='op'?`url(${ASSET_BASE}OPbackgroundwide.webp),url(${IMGS.op})`:`url(${IMGS[k]})`}
function kIn(el){el.classList.remove('in');void el.offsetWidth;if(!rm())el.classList.add('in')}
/* ---------- destaque que troca de imagem, inclinação, vibração leve ---------- */
(function(){
  const home=$('#home'),sl=$('#mSl'),keys=['op','coc','for'],arts=$$('.k-art',home),sides=$$('.k-side',home),dots=$$('#kDots button'),hero=$('.k-hero',home);
  let idx=0,timer=null,outT=null;
  const setSide=(el,k)=>{if(IMGS[k])el.style.backgroundImage=heroBg(k)};
  let fin=null,pa=null;
  const EASE='cubic-bezier(.2,.7,.2,1)',DUR=750;
  function show(i,user){const n=(i+3)%3;if(n===idx)return;if(fin)fin();
    const d=((n-idx+3)%3===1)?1:-1,prev=arts[idx],cur=arts[n],anim=!rm();
    arts.forEach(a=>a.classList.remove('out'));
    prev.classList.remove('on');prev.classList.add('out');cur.classList.add('on');
    clearTimeout(outT);outT=setTimeout(()=>{prev.classList.remove('out');if(pa){pa.cancel();pa=null}},DUR+250);
    /* a nova imagem entra pelo lado onde ela estava; a antiga sai para o lado oposto */
    if(anim){cur.animate([{translate:(d>0?'-100%':'100%')+' 0'},{translate:'0 0'}],{duration:DUR,easing:EASE});
      if(pa)pa.cancel();pa=prev.animate([{translate:'0 0'},{translate:(d>0?'100%':'-100%')+' 0'}],{duration:DUR,easing:EASE,fill:'forwards'})}
    idx=n;dots.forEach((dd,k)=>dd.classList.toggle('on',k===idx));
    const L=sides[0],R=sides[1],keyOf=el=>keys[(idx+1+(el===L?0:1))%3];
    if(!anim||!L||!R||hero.clientWidth<=dstW(L)){sides.forEach(sd=>setSide(sd,keyOf(sd)))}
    else{
      /* troca de lugar andando: o lateral de origem vai pro centro, o centro vai pro outro lado, e o que estava lá passa por trás até o lado vazio */
      const src=d>0?L:R,dst=d>0?R:L,toC=d>0?1:-1,W=hero.clientWidth-dst.offsetWidth,tk=hero.clientWidth*.3,o={duration:DUR,easing:EASE,fill:'both'};
      const cl=dst.cloneNode(false);cl.style.zIndex=0;cl.style.pointerEvents='none';hero.appendChild(cl);
      const a1=cl.animate([{transform:'none'},{transform:`translateX(${-toC*W}px)`}],o);
      setSide(dst,keyOf(dst));
      const a2=dst.animate([{transform:`translateX(${-toC*tk}px)`,opacity:0},{transform:'none',opacity:1}],{duration:DUR,easing:EASE,fill:'backwards'});
      const a3=src.animate([{transform:'none',opacity:1},{transform:`translateX(${toC*tk}px)`,opacity:0}],o);
      const me=()=>{fin=null;a1.cancel();a2.cancel();a3.cancel();cl.remove();setSide(src,keyOf(src))};
      fin=me;a1.finished.then(()=>{if(fin===me)me()}).catch(()=>{})}
    if(user)restart()}
  const dstW=el=>el.offsetWidth;
  window.addEventListener('ficha-car',()=>restart());
  sides[0]&&sides[0].addEventListener('click',()=>show(idx+1,true));
  sides[1]&&sides[1].addEventListener('click',()=>show(idx-1,true));
  function restart(){clearInterval(timer);if(rm()||!carOn())return;timer=setInterval(()=>{if(home.hidden||document.hidden)return;show(idx+1)},5500)}
  dots.forEach((d,k)=>d.onclick=()=>show(k,true));
  let x0=null;
  hero.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
  hero.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>40)show(idx+(dx<0?1:-1),true)},{passive:true});
  hero.addEventListener('mousemove',e=>{if(!matchMedia('(hover:hover)').matches)return;const r=hero.getBoundingClientRect();hero.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));hero.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3))});
  hero.addEventListener('mouseleave',()=>{hero.style.setProperty('--px',0);hero.style.setProperty('--py',0)});
  restart();
  [home,sl].forEach(r=>r.addEventListener('click',e=>{if(navigator.vibrate&&vibOn()&&e.target.closest('.k-ri,.hm-c,.k-p,.k-cta,.k-back,.sl-i .btn,.sl-nb')){try{navigator.vibrate(8)}catch(_){}}}));
})();

/* ---------- abertura ---------- */
(async function(){const sp=$('#splash'),app=$('#app');let done=false;
  async function end(){if(done)return;done=true;openHome();
    app.hidden=false;
    if(!rm()){await sp.animate([{opacity:1,transform:'none'},{opacity:0,transform:'scale(1.04)'}],{duration:520,easing:'ease-in',fill:'forwards'}).finished}
    sp.remove();if(editableCatalogError)toast('Catálogos indisponíveis',editableCatalogError);else if(catalogNotice)toast('Modo offline',catalogNotice);if(loadIssue)showLoadIssue()}
  sp.addEventListener('click',end);
  if(rm()){end();return}
  $('.splogo',sp).animate([{opacity:0,filter:'blur(10px)',transform:'scale(.96)'},{opacity:1,filter:'blur(0)',transform:'none'}],{duration:900,easing:'ease-out',fill:'backwards'});
  const bar=$('.spbar i',sp);await bar.animate([{width:'0%'},{width:'100%'}],{duration:1500,easing:'cubic-bezier(.5,.1,.3,1)',fill:'forwards'}).finished;
  end()})();

/* foto (ou inicial) da conta no fim da barra do menu */
function paintRailAcct(){const b=$('#railAcct');if(!b)return;const img=$('#railAcctImg'),pv=$('#cloudAvatarPreview'),ltr=$('#railAcctLtr'),svg=b.querySelector('svg');
  const name=(($('#cloudDisplayName')||{}).value||(cloudUser&&cloudUser.email)||'').trim(),photo=!!(cloudUser&&pv&&!pv.hidden&&pv.getAttribute('src'));
  if(photo){img.onerror=()=>{img.hidden=true;paintRailAcct()};img.src=pv.getAttribute('src');img.hidden=false}else{img.hidden=true;img.removeAttribute('src')}
  const letter=!!(cloudUser&&name&&!photo);ltr.textContent=letter?name[0].toUpperCase():'';ltr.hidden=!letter;svg.style.display=(photo||letter)?'none':'';
  const t=cloudUser?'Conta: '+(name||'conectado'):'Entrar na conta';b.title=t;b.setAttribute('aria-label',t)}
{const dn=$('#cloudDisplayName');if(dn)dn.addEventListener('input',paintRailAcct)}
paintRailAcct();

/* configurações abertas de dentro da ficha: sem barra do menu, voltam direto para a ficha */
$('#soloBack').onclick=()=>closeM('mSl');
})();

