// js/rails.js
import { FILTERS } from './filters.js';
import { utils } from './utils.js';

let DATA = [];
let BY_ID = new Map();

function passFilters(op){
  // language
  if (FILTERS.language !== 'Any') {
    const langs = op.languages || [];
    if (!langs.includes(FILTERS.language)) return false;
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

function safeImg(src){
  return src && typeof src === 'string' ? src : 'assets/sample/placeholder.jpg';
}

function cardHTML(op){
  const img = safeImg(op.image);
  const tags = (op.tags||[]).map(t=>`<span class="tag">${utils.escapeHtml(t)}</span>`).join('');
  const fee = op.fee ? `<div class="fee">${utils.escapeHtml(op.fee)}</div>` : '';

  return `
    <article class="card-op">
      <img src="${utils.escapeHtml(img)}" alt="" loading="lazy">
      <div class="body">
        <h3>${utils.escapeHtml(op.title)}</h3>
        <div class="meta">${utils.escapeHtml(op.org || '')} · ${utils.escapeHtml(op.duration || '')}</div>
        <div class="tags">${tags}</div>
        ${fee}
        <div class="actions">
          <button class="btn btn-primary" data-op-join="${utils.escapeHtml(op.id)}">I want to help</button>
          <button class="btn-secondary" data-op-learn="${utils.escapeHtml(op.id)}">Learn more</button>
        </div>
      </div>
    </article>`;
}

function renderRails(list){
  const rails = {
    nature:    document.getElementById('rail-nature'),
    social:    document.getElementById('rail-social'),
    culture:   document.getElementById('rail-culture'),
    events:    document.getElementById('rail-events'),
    crowd:     document.getElementById('rail-crowd'),
    animals:   document.getElementById('rail-animals'),
    homeless:  document.getElementById('rail-homeless'),
    seniors:   document.getElementById('rail-seniors'),
    education: document.getElementById('rail-education'),
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
    BY_ID = new Map(DATA.map(o=>[o.id, o]));
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

/* ===========================
   Modal logic
   =========================== */
function openModal(op){
  const modal = document.getElementById('op-modal');
  if (!modal || !op) return;

  // Elements
  const imgEl  = modal.querySelector('#opm-image');
  const tEl    = modal.querySelector('#opm-title');
  const orgEl  = modal.querySelector('#opm-org');
  const feeEl  = modal.querySelector('#opm-fee');
  const dEl    = modal.querySelector('#opm-desc');
  const durEl  = modal.querySelector('#opm-duration');
  const langEl = modal.querySelector('#opm-langs');
  const ageEl  = modal.querySelector('#opm-age');
  const tagsEl = modal.querySelector('#opm-tags');
  const cta    = modal.querySelector('#opm-cta');

  imgEl.src = safeImg(op.image);
  tEl.textContent   = op.title || '';
  orgEl.textContent = op.org || '';
  feeEl.textContent = op.fee || '';
  dEl.textContent   = op.description || op.summary || '';

  durEl.textContent  = op.duration || '—';
  langEl.textContent = (op.languages || []).join(', ') || 'Any';
  ageEl.textContent  = Number.isFinite(op.minAge) ? `${op.minAge}+` : '—';
  tagsEl.textContent = (op.tags||[]).join(', ');

  // CTA — if in future we add deep link, set here
  cta.href = '#';

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');

  // focus trap (basic)
  setTimeout(()=> modal.querySelector('[data-opm-close]')?.focus(), 0);
}

function closeModal(){
  const modal = document.getElementById('op-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
}

// Delegated events for buttons + modal close
function initActions(){
  document.addEventListener('click', (e)=>{
    const learnBtn = e.target.closest('[data-op-learn]');
    if (learnBtn){
      const id = learnBtn.getAttribute('data-op-learn');
      const op = BY_ID.get(id);
      if (op) openModal(op);
    }

    const joinBtn = e.target.closest('[data-op-join]');
    if (joinBtn){
      const id = joinBtn.getAttribute('data-op-join');
      const op = BY_ID.get(id);
      // For now just open modal as well; later can open a registration flow
      if (op) openModal(op);
    }

    if (e.target.matches('[data-opm-close]')) closeModal();
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });

  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeModal();
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initArrows();
  loadData();
  initActions();
  document.addEventListener('filtersChanged', refresh);
});
