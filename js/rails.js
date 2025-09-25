// js/rails.js
import { FILTERS } from './filters.js';
import { utils } from './utils.js';

let DATA = [];

function passFilters(op){
  // language
  if (!FILTERS.languages.has('Any')){
    const ok = op.languages?.some(l => FILTERS.languages.has(l));
    if (!ok) return false;
  }
  // duration
  if (FILTERS.duration !== 'any'){
    const d = String(op.duration||'').toLowerCase();
    const want = FILTERS.duration;
    if (want === 'half' && !/half|3–4h|3-4h|3h|4h/.test(d)) return false;
    if (want === 'full' && !/full|6–8h|6-8h|6h|7h|8h/.test(d)) return false;
    if (want === '1h'   && !/1h/.test(d)) return false;
    if (want === '2–3h' && !/(2–3h|2-3h|2h|3h)/.test(d)) return false;
  }
  return true;
}

function cardHTML(op){
  const img = op.image || 'assets/sample/placeholder.jpg';
  const tags = (op.tags||[]).map(t=>`<span class="tag">${utils.escapeHtml(t)}</span>`).join('');
  return `
    <article class="card-op">
      <img src="${img}" alt="">
      <div class="body">
        <h3>${utils.escapeHtml(op.title)}</h3>
        <div class="meta">${utils.escapeHtml(op.org || '')} · ${utils.escapeHtml(op.duration || '')}</div>
        <div class="tags">${tags}</div>
        <p><a class="btn btn-primary" href="#">I want to help</a></p>
      </div>
    </article>`;
}

function renderRails(list){
  const rails = {
    nature:  document.getElementById('rail-nature'),
    social:  document.getElementById('rail-social'),
    culture: document.getElementById('rail-culture'),
    events:  document.getElementById('rail-events'),
    crowd:   document.getElementById('rail-crowd')
  };
  Object.values(rails).forEach(el=>{ if(el) el.innerHTML=''; });
  list.forEach(op=>{
    const el = rails[op.section];
    if (el) el.insertAdjacentHTML('beforeend', cardHTML(op));
  });
}

async function loadData(){
  try{
    const res = await fetch('data/opportunities.json', { cache:'no-store' });
    DATA = await res.json();
    renderRails(DATA.filter(passFilters));
  }catch(e){ console.error('rails load failed', e); }
}

function refresh(){ renderRails(DATA.filter(passFilters)); }

function initArrows(){
  document.querySelectorAll('.rail-next').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.target;
      const rail = document.getElementById(id);
      if (rail) rail.scrollBy({ left: rail.clientWidth * 0.9, behavior:'smooth' });
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initArrows();
  loadData();
  document.addEventListener('filtersChanged', refresh);
});
