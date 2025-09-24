// ================================
// ImpactTrip – main.js (Monolithic Fallback)
// ================================

// ---- Config ----
const CONFIG = {
  STORAGE_KEY: 'impacttrip.search',
  SCROLL_THRESHOLD: 4,
  DEFAULT_LOCATION: 'Porto, Portugal',
  MIN_ADULTS: 1,
  MIN_CHILDREN: 0,
  MIN_CHILD_AGE: 0,
  MAX_CHILD_AGE: 17,
  DEFAULT_ADULTS: 1,
  DEFAULT_CHILDREN: 0
};

// ---- Utilities ----
const utils = {
  parseIntSafe(value, def = 0) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : def;
  },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  escapeHtml(str = '') {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  },
  throttle(fn, delay) {
    let t, last = 0;
    return function(...args){
      const now = Date.now();
      const run = ()=>{ last = now; fn.apply(this, args); };
      clearTimeout(t);
      if (now - last > delay) run(); else t = setTimeout(run, delay - (now - last));
    };
  },
  toISODate(date){
    // yyyy-mm-dd without TZ shift issues
    return new Date(date.getTime() - date.getTimezoneOffset()*60000)
      .toISOString().slice(0,10);
  }
};

// ---- Header shadow ----
class HeaderController {
  constructor(){
    this.header = document.querySelector('.site-header');
    if(!this.header) return;
    this.onScroll = utils.throttle(()=>{
      this.header.classList.toggle('is-scrolled', window.scrollY > CONFIG.SCROLL_THRESHOLD);
    }, 100);
    window.addEventListener('scroll', this.onScroll);
    this.onScroll();
  }
}

// ---- Form state (localStorage) ----
class FormStateManager {
  constructor(){ this.state = this.load() || this.defaults(); }
  defaults(){
    return { location: CONFIG.DEFAULT_LOCATION, dateStart:'', dateEnd:'', adults:CONFIG.DEFAULT_ADULTS, children:CONFIG.DEFAULT_CHILDREN, childAges:[] };
  }
  load(){
    try{ const raw = localStorage.getItem(CONFIG.STORAGE_KEY); if(!raw) return null; return this.validate(JSON.parse(raw)); }
    catch(e){ console.warn('State load failed', e); return null; }
  }
  validate(data){
    if(!data || typeof data!=='object') return null;
    return {
      location: data.location || CONFIG.DEFAULT_LOCATION,
      dateStart: data.dateStart || '',
      dateEnd:   data.dateEnd   || '',
      adults:    utils.clamp(utils.parseIntSafe(data.adults, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99),
      children:  utils.clamp(utils.parseIntSafe(data.children, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10),
      childAges: Array.isArray(data.childAges) ? data.childAges : []
    };
  }
  save(updates = {}){ this.state = { ...this.state, ...updates }; try{ localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state)); }catch(e){ console.error('State save failed', e); } return this.get(); }
  get(){ return { ...this.state }; }
}

// ---- Pilot form (dates, people, children ages) ----
class PilotFormController {
  constructor(){
    this.form = document.getElementById('pilot-form'); if(!this.form) return;
    this.el = {
      location:  document.getElementById('location'),
      dateStart: document.getElementById('date-start'),
      dateEnd:   document.getElementById('date-end'),
      adults:    document.getElementById('adults'),
      children:  document.getElementById('children'),
      agesWrap:  document.getElementById('children-ages')
    };
    if(!Object.values(this.el).every(Boolean)){ console.error('Missing form elements'); return; }

    this.state = new FormStateManager();
    this.init();
  }

  init(){
    // 1) load saved/default values
    const s = this.state.get();
    this.el.location.value  = s.location;
    this.el.dateStart.value = s.dateStart;
    this.el.dateEnd.value   = s.dateEnd;
    this.el.adults.value    = s.adults;
    this.el.children.value  = s.children;
    this.renderAges(s.children, s.childAges);

    // 2) dynamic min dates: disallow past days (min = today)
    const today = new Date();
    const minISO = utils.toISODate(today);
    this.el.dateStart.min = minISO;
    this.el.dateEnd.min   = minISO;

    // keep end >= start as start changes
    this.el.dateStart.addEventListener('change', ()=>{
      const from = this.el.dateStart.value;
      this.el.dateEnd.min = from || minISO;
      if (from && this.el.dateEnd.value && this.el.dateEnd.value < from) this.el.dateEnd.value = from;
      this.persist();
    });

    // 3) listeners
    ['location','dateStart','dateEnd','adults'].forEach(k=>{
      this.el[k].addEventListener('change', ()=>this.onField(k));
    });

    // IMPORTANT: use 'input' so ages render as you type / click steppers
    this.el.children.addEventListener('input', ()=>this.onChildren());

    this.el.agesWrap.addEventListener('input', e=>{
      if(e.target.matches('input[data-age-index]')) this.onAge(e.target);
    });

    this.form.addEventListener('submit', e=>this.onSubmit(e));
  }

  onField(field){
    const el = this.el[field];
    let value = el.value;
    if(field==='adults'){
      value = utils.clamp(utils.parseIntSafe(value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99);
      el.value = value;
    }
    this.state.save({ [field]: value });
  }

  onChildren(){
    const n = utils.clamp(utils.parseIntSafe(this.el.children.value, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10);
    this.el.children.value = n;
    this.renderAges(n);
    this.persist();
  }

  onAge(input){
    const age = utils.clamp(utils.parseIntSafe(input.value, CONFIG.MIN_CHILD_AGE), CONFIG.MIN_CHILD_AGE, CONFIG.MAX_CHILD_AGE);
    input.value = age;
    this.persist();
  }

  onSubmit(e){
    e.preventDefault();
    const start = this.el.dateStart.value, end = this.el.dateEnd.value;
    if(start && end && end < start){ alert('"To" date must be the same day or after "From" date.'); return; }
    const final = this.persist();
    console.log('Filters applied:', final);
    this.form.dispatchEvent(new CustomEvent('filtersApplied', { detail: final }));
  }

  persist(){
    return this.state.save({
      location: this.el.location.value || CONFIG.DEFAULT_LOCATION,
      dateStart: this.el.dateStart.value || '',
      dateEnd:   this.el.dateEnd.value   || '',
      adults:    utils.clamp(utils.parseIntSafe(this.el.adults.value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99),
      children:  utils.clamp(utils.parseIntSafe(this.el.children.value, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10),
      childAges: this.collectAges()
    });
  }

  renderAges(count, existing=[]){
    const frag = document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const age = Number.isFinite(existing[i]) ? existing[i] : '';
      const field = document.createElement('div'); field.className='age-field';
      const label = document.createElement('label'); label.className='lbl'; label.textContent=`Age ${i+1}`;
      const input = document.createElement('input'); input.type='number'; input.min=CONFIG.MIN_CHILD_AGE; input.max=CONFIG.MAX_CHILD_AGE; input.step='1'; input.dataset.ageIndex=i; input.value=age;
      field.append(label,input); frag.append(field);
    }
    this.el.agesWrap.innerHTML=''; this.el.agesWrap.append(frag);
  }

  collectAges(){
    return Array.from(this.el.agesWrap.querySelectorAll('input[data-age-index]')).map(inp=>{
      const v = utils.parseIntSafe(inp.value, ''); return v === '' ? '' : utils.clamp(v, CONFIG.MIN_CHILD_AGE, CONFIG.MAX_CHILD_AGE);
    });
  }
}

// ---- Opportunities (list renderer) ----
class OpportunitiesRenderer {
  constructor(containerId='opportunities'){
    this.container = document.getElementById(containerId);
  }
  async render(){
    if(!this.container) return;
    try{
      const res = await fetch('data/opportunities.json', { cache:'no-store' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      this.draw(list);
    }catch(e){
      console.error('Failed to load opportunities:', e);
      this.container.innerHTML = '<p class="error">Failed to load opportunities. Please try again later.</p>';
    }
  }
  draw(list){
    const frag = document.createDocumentFragment();
    list.forEach(op=>{
      const art = document.createElement('article'); art.className='card';
      art.innerHTML = `
        <h3>${utils.escapeHtml(op.title)}</h3>
        <p>${utils.escapeHtml(op.summary)}</p>
        <p><strong>Category:</strong> ${utils.escapeHtml(op.category)} ·
           <strong>When:</strong> ${utils.escapeHtml(op.when)} ·
           <strong>Time:</strong> ${utils.escapeHtml(op.duration)}</p>
        <p><a class="btn btn-primary" href="#">I want to help</a></p>`;
      art.querySelector('.btn').addEventListener('click', e=>{
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('opportunitySelected', { detail: op }));
      });
      frag.appendChild(art);
    });
    this.container.innerHTML=''; this.container.appendChild(frag);
  }
}

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', ()=>{
  const app = {
    header: new HeaderController(),
    pilotForm: new PilotFormController(),
    opportunities: new OpportunitiesRenderer()
  };
  app.opportunities.render();
  window.app = app; // for quick debugging
});
