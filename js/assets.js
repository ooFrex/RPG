/* Imagens de fundo (carregadas sob demanda pelo CSS injetado abaixo). */
var ASSET_BASE=APP_CONFIG.ASSET_BASE;
var IMGS={"op": "img/op.jpg", "opw": "img/opw.jpg", "coc": ASSET_BASE+"cocbackgroundwide.webp", "for": "img/for.jpg", "bg": "img/bg.jpg"};
(function(){var done={};
 var R={
  splash:'.spbg{background-image:url(@op)}@media(min-width:900px){.spbg{background-image:url('+ASSET_BASE+'OPbackgroundwide.webp),url(@op)}}@media(orientation:landscape) and (max-height:700px){.spbg{background-image:url('+ASSET_BASE+'OPbackgroundwide.webp),url(@op);background-position:center 42%}}',
  bg:'body::before{content:"";position:fixed;inset:0;z-index:-1;transform:translateZ(0);background:url(@bg) center/cover}#camp{background-image:linear-gradient(color-mix(in oklab,color-mix(in oklab,var(--tint) 24.7%,#000) 55%,transparent),color-mix(in oklab,color-mix(in oklab,var(--tint) 24.7%,#000) 90%,transparent)),url(@bg);background-size:cover;background-position:center}@media(orientation:landscape) and (max-height:700px){body::before{background:linear-gradient(color-mix(in oklab,color-mix(in oklab,var(--tint) 24.7%,#000) 72%,transparent),color-mix(in oklab,color-mix(in oklab,var(--tint) 24.7%,#000) 84%,transparent)),url('+ASSET_BASE+'OPbackgroundwide.webp) center/cover}}',
  camp:'.cm.op .cm-art{background-image:url(@opw)}@media(min-width:900px){.cm.op .cm-art{background-image:url(@op)}}.cm.coc .cm-art{background-image:url(@coc)}.cm.nova .cm-art{background-image:url(@for)}',
  wiz:'#wiz{background-image:linear-gradient(rgba(16,16,16,.9),rgba(16,16,16,.95)),url(@op);background-size:cover;background-position:center}'};
 window.loadImgs=function(k){if(done[k])return;done[k]=1;var st=document.createElement('style');
  st.textContent=R[k].replace(/@(\w+)/g,function(token,n){return Object.prototype.hasOwnProperty.call(IMGS,n)?IMGS[n]:token});document.head.appendChild(st)};
 loadImgs('splash');loadImgs('bg');
})();
