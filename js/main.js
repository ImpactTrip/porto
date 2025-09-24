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

  const singleDay = document.getElementById('single-day');
  const dateStart = document.getElementById('date-start');
  const dateEnd   = document.getElementById('date-end');
  const dateEndWrap = document.getElementById('date-end-wrap');
  const adults   = document.getElementById('adults');
  const children = document.getElementById('children');
  const agesWrap = document.getElementById('children-ages');

  // Load saved state
  const saved = loadState();
  if(saved){
    if(saved.dateStart) dateStart.value = saved.dateStart;
    if(saved.singleDay !== undefined) singleDay.checked = !!saved.singleDay;
    if(saved.dateEnd)   dateEnd.value = saved.dateEnd;
    if(Number.isFinite(saved.adults))   adults.value = saved.adults;
    if(Number.isFinite(saved.children)) children.value = saved.children;
  }
  toggleDateEnd(singleDay.checked, dateEndWrap, dateEnd);

  // Render ages if children > 0
  renderChildAges(agesWrap, Number(children.value), saved?.childAges || []);

  // Handlers
  singleDay.addEventListener('change', () => {
    toggleDateEnd(singleDay.checked, dateEndWrap, dateEnd);
    persist();
  });

  dateStart.addEventListener('change', persist);
  dateEnd.addEventListener('change', persist);
  adults.addEventListener('change', () => {
    adults.value = Math.max(1, parseInt(adults.value||'1',10));
    persist();
  });

  children.addEventListener('change', () => {
    const n = Math.max(0, parseInt(children.value||'0',10));
    children.value = n;
    renderChildAges(agesWrap, n);
    persist();
  });

  agesWrap.addEventListener('change', (e) => {
    if(e.target.matches('input[data-age-index]')){
      // clamp ages 0-17
      const v = Math.min(17, Math.max(0, parseInt(e.target.value||'0',10)));
      e.target.value = v;
      persist();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Basic validation: if range, ensure end >= start
    if(!singleDay.checked && dateStart.value && dateEnd.value && dateEnd.value < dateStart.value){
      alert('End date must be the same or after start date.');
      return;
    }
    persist();
    // Later: trigger search/filtering here
    console.log('Filters applied:', loadState());
  });

  function persist(){
    const state = {
      location: 'Porto, Portugal', // fixed
      dateStart: dateStart.value || '',
      singleDay: singleDay.checked,
      dateEnd: singleDay.checked ? '' : (dateEnd.value || ''),
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

function renderChildAges(container, count, existing = []){
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
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{ return null; }
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
