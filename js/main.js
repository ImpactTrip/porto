// main.js

document.addEventListener('DOMContentLoaded', () => {
  // Header shadow
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll); onScroll();

  initPilotForm();
  renderOpportunities(); // your existing renderer
});

const STORAGE_KEY = 'impacttrip.search'; // localStorage key

function initPilotForm(){
  const form = document.getElementById('pilot-form');
  if(!form) return;

  const locationSel = document.getElementById('location');
  const dateStart   = document.getElementById('date-start');
  const dateEnd     = document.getElementById('date-end');
  const adults      = document.getElementById('adults');
  const children    = document.getElementById('children');
  const agesWrap    = document.getElementById('children-ages');

  // load
  const saved = loadState();
  if(saved){
    locationSel.value = saved.location || 'Porto, Portugal';
    if(saved.dateStart) dateStart.value = saved.dateStart;
    if(saved.dateEnd)   dateEnd.value   = saved.dateEnd;
    if(Number.isFinite(saved.adults))   adults.value   = saved.adults;
    if(Number.isFinite(saved.children)) children.value = saved.children;
    renderChildAges(agesWrap, Number(children.value), saved.childAges || []);
  }else{
    renderChildAges(agesWrap, 0, []);
  }

  // handlers
  [locationSel,dateStart,dateEnd,adults,children].forEach(el=>{
    el.addEventListener('change', () => {
      if(el === children){
        const n = Math.max(0, parseInt(children.value||'0',10));
        children.value = n;
        renderChildAges(agesWrap, n);
      }
      persist();
    });
  });

  agesWrap.addEventListener('change', (e) => {
    if(e.target.matches('input[data-age-index]')){
      const v = Math.min(17, Math.max(0, parseInt(e.target.value||'0',10)));
      e.target.value = v;
      persist();
    }
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // if end is empty, treat as one-day = start
       if(dateStart.value && dateEnd.value && dateEnd.value < dateStart.value){
      alert('“To” must be the same day or after “From”.');
      return;
    }
    persist();
    console.log('Filters applied:', loadState());
  });

  function persist(){
    const state = {
      location: locationSel.value || 'Porto, Portugal',
      dateStart: dateStart.value || '',
      dateEnd: dateEnd.value || (dateStart.value || ''),
      adults: Math.max(1, parseInt(adults.value||'1',10)),
      children: Math.max(0, parseInt(children.value||'0',10)),
      childAges: collectChildAges(agesWrap)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}


function toggleDateEnd(isSingle, wrap, input){
  if(isSingle){
    wrap.style.display = 'none';
    input.value = '';
  }else{
    wrap.style.display = '';
  }
}

function renderChildAges(container, count, existing=[]){
  container.innerHTML = '';
  for(let i=0;i<count;i++){
    const age = Number.isFinite(existing[i]) ? existing[i] : '';
    const field = document.createElement('div');
    field.className = 'age-field';
    field.innerHTML = `
      <label class="lbl">Age ${i+1}</label>
      <input type="number" min="0" max="17" data-age-index="${i}" value="${age}">
    `;
    container.appendChild(field);
  }
}
function collectChildAges(container){
  return Array.from(container.querySelectorAll('input[data-age-index]'))
    .map(inp => {
      const v = parseInt(inp.value,10);
      return Number.isFinite(v) ? Math.max(0, Math.min(17, v)) : '';
    });
}
function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
  catch{ return null; }
}

/* ---- Existing opportunities renderer (unchanged) ---- */
async function renderOpportunities() {
  const wrap = document.querySelector('#opportunities');
  if (!wrap) return;
  try {
    const res = await fetch('data/opportunities.json', { cache: 'no-store' });
    if (!res.ok) return;
    const list = await res.json();
    for (const o of list) {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML = `
        <h3>${escapeHtml(o.title)}</h3>
        <p>${escapeHtml(o.summary)}</p>
        <p><strong>Category:</strong> ${escapeHtml(o.category)} ·
           <strong>When:</strong> ${escapeHtml(o.when)} ·
           <strong>Time:</strong> ${escapeHtml(o.duration)}</p>
        <p><a class="btn btn-primary" href="#">I want to help</a></p>
      `;
      wrap.appendChild(el);
    }
  } catch {}
}
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
