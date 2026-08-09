// 產生互動預覽（單一自帶檔）：把 index/registry/stats 三頁打包成一個可切換分頁的預覽。
// 用法：node preview/build.mjs  → 產出 preview/index.html
// 特性：內嵌圖示(data URI)、內嵌統計資料、示範用種子資料、移除 Service Worker、頁面間導覽改為分頁切換。
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const iconURI = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'icons/icon-192.png')).toString('base64');
const stats = read('data/pet-stats.json');

const SEED_CHIPS = [
  { id: 'a1', chip: '900073001084453', name: '小白', rec: { breed: '柴犬', gender: '公', status: '登記', neuter: '是', updated: '2026/07/01' } },
  { id: 'a2', chip: '900112233445566', name: '咪咪' }
];
const SEED_REG = {
  importedAt: '2026/08/05', fileName: '寵物清冊.xlsx', owner: '王小明',
  rows: [
    { no: '1', date: '2024/03/12', owner: '王小明', chip: '900073001084453', name: '小白', gender: '公', type: '犬', breed: '柴犬', neuter: '絕育', use: '家庭寵物' },
    { no: '2', date: '2023/11/05', owner: '王小明', chip: '900112233445566', name: '咪咪', gender: '母', type: '貓', breed: '米克斯', neuter: '未絕育', removed: '否' }
  ]
};

const THEME = `
(function(){
  var root=document.documentElement, mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  var KEY='pet_theme', ORDER=['auto','light','dark'];
  var INFO={auto:{i:'🌗',n:'跟隨系統'},light:{i:'☀️',n:'淺色'},dark:{i:'🌙',n:'深色'}};
  var COLOR={light:'#0f766e',dark:'#0f5b54'};
  function pref(){try{var v=localStorage.getItem(KEY);return (v==='light'||v==='dark')?v:(window.__theme||'auto');}catch(e){return window.__theme||'auto';}}
  function sysDark(){return mq?mq.matches:false;}
  function res(p){return (p==='dark'||(p==='auto'&&sysDark()))?'dark':'light';}
  function apply(p){var t=res(p);root.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',COLOR[t]);
    var bs=document.querySelectorAll('[data-theme-toggle]');for(var i=0;i<bs.length;i++){var b=bs[i],ic=b.querySelector('.tt-ico');if(ic)ic.textContent=INFO[p].i;b.setAttribute('aria-label','佈景主題：'+INFO[p].n+'，點擊切換');b.setAttribute('title','佈景主題：'+INFO[p].n);}}
  function setp(p){window.__theme=p;try{if(p==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,p);}catch(e){}apply(p);}
  document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-theme-toggle]'):null;if(!b)return;setp(ORDER[(ORDER.indexOf(pref())+1)%ORDER.length]);});
  if(mq){var f=function(){if(pref()==='auto')apply('auto');};mq.addEventListener?mq.addEventListener('change',f):(mq.addListener&&mq.addListener(f));}
  apply(pref());
})();`;

function seedNavScript() {
  return `<script>
window.__SEED_CHIPS=${JSON.stringify(SEED_CHIPS)};
window.__SEED_REG=${JSON.stringify(SEED_REG)};
window.__STATS_DATA__=${stats};
(function(){
  try{ if(!localStorage.getItem('pet_chips_v1')) localStorage.setItem('pet_chips_v1', JSON.stringify(window.__SEED_CHIPS)); }catch(e){}
  try{ if(!localStorage.getItem('pet_registry_v1')) localStorage.setItem('pet_registry_v1', JSON.stringify(window.__SEED_REG)); }catch(e){}
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]'); if(!a) return;
    var m=(a.getAttribute('href')||'').match(/(index|registry|stats)\\.html/);
    if(m){ e.preventDefault(); try{ parent.postMessage({__petnav:m[1]},'*'); }catch(_){} }
  },true);
})();
<\/script>`;
}

function process(file) {
  let html = read(file);
  html = html.replace('<script src="app.js" defer></script>', '');
  // 移除預覽用不到、且在 iframe 內會 404 的資源連結
  html = html.replace(/\n?\s*<link rel="manifest"[^>]*>/g, '');
  html = html.replace(/\n?\s*<link rel="apple-touch-icon"[^>]*>/g, '');
  html = html.replace(/\n?\s*<link rel="icon"[^>]*>/g, '');
  html = html.split('icons/icon-192.png').join(iconURI);
  html = html.replace("fetch('data/pet-stats.json')",
    "Promise.resolve({ json: function(){ return Promise.resolve(window.__STATS_DATA__); } })");
  html = html.replace('<body>', '<body>\n' + seedNavScript());
  html = html.replace('</body>', '<script>' + THEME + '<\/script>\n</body>');
  return html;
}

const pages = { index: process('index.html'), registry: process('registry.html'), stats: process('stats.html') };
const enc = (s) => JSON.stringify(s).replace(/<\//g, '<\\/');

const shell = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>寵物登記查詢 — 互動預覽</title>
<style>
  :root{ color-scheme: light dark; }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{font-family:"PingFang TC","Noto Sans TC",system-ui,sans-serif;background:#eceeef;color:#1f2937;
    display:flex;flex-direction:column;min-height:100vh;}
  @media (prefers-color-scheme: dark){ body{background:#0a0f0e;color:#e8edeb} }
  .bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
    padding:10px 14px;background:linear-gradient(135deg,#0f766e,#0c5c56);color:#fff;
    box-shadow:0 2px 10px rgba(0,0,0,.2)}
  .bar .t{font-weight:700;font-size:.95rem;margin-right:4px}
  .seg{display:inline-flex;background:rgba(255,255,255,.16);border-radius:12px;padding:3px;gap:2px}
  .seg button{border:none;background:transparent;color:rgba(255,255,255,.85);font-size:.86rem;font-weight:600;
    padding:7px 14px;border-radius:9px;cursor:pointer;min-height:34px}
  .seg button[aria-selected="true"]{background:#fff;color:#0c5c56}
  .seg button:focus-visible{outline:2px solid #fff;outline-offset:2px}
  .hint{margin-left:auto;font-size:.72rem;opacity:.9}
  .stage{flex:1;display:flex;justify-content:center;padding:16px 12px 24px}
  .phone{width:100%;max-width:430px;height:calc(100vh - 120px);min-height:560px;
    background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);
    border:1px solid rgba(0,0,0,.08)}
  @media (prefers-color-scheme: dark){ .phone{background:#0d1210;border-color:#233} }
  iframe{width:100%;height:100%;border:0;display:block}
  .note{font-size:.72rem;opacity:.75;text-align:center;padding:0 16px 16px}
</style>
</head>
<body>
  <div class="bar">
    <span class="t">🐾 寵物登記查詢 · 互動預覽</span>
    <div class="seg" role="tablist" aria-label="頁面切換">
      <button role="tab" data-p="index" aria-selected="true">首頁</button>
      <button role="tab" data-p="registry" aria-selected="false">名下清冊</button>
      <button role="tab" data-p="stats" aria-selected="false">全國統計</button>
    </div>
    <span class="hint">頁面右上角 🌗 可切換深/淺色</span>
  </div>
  <div class="stage"><div class="phone"><iframe id="fr" title="預覽"
      sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"></iframe></div></div>
  <div class="note">此為互動預覽（示範資料，非真實個資）。實際站台：opopwowo.github.io/pet-query-app/</div>
<script>
  var PAGES = { index: ${enc(pages.index)}, registry: ${enc(pages.registry)}, stats: ${enc(pages.stats)} };
  var fr = document.getElementById('fr');
  var tabs = [].slice.call(document.querySelectorAll('.seg button'));
  function show(p){
    fr.srcdoc = PAGES[p] || PAGES.index;
    tabs.forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.p===p)); });
  }
  tabs.forEach(function(b){ b.addEventListener('click', function(){ show(b.dataset.p); }); });
  window.addEventListener('message', function(e){ if(e.data && e.data.__petnav) show(e.data.__petnav); });
  show('index');
<\/script>
</body>
</html>`;

fs.writeFileSync(path.join(DIR, 'index.html'), shell);
console.log('wrote preview/index.html', (shell.length / 1024).toFixed(1) + 'KB');
