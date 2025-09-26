// js/hotels.js
import { utils } from './utils.js';

let HOTELS = [];

const DEMO_IMAGES = [
  'assets/sample/hotel_1.jpg',
  'assets/sample/hotel_2.jpg',
  'assets/sample/hotel_3.jpg',
  'assets/sample/hotel_4.jpg',
  'assets/sample/hotel_5.jpg'
];

const REPEAT_TIMES = 3; // <— demo: repete lista para “encher” até ao footer

async function loadHotels(){
  try{
    const res = await fetch('data/hotels.json', { cache:'no-store' });
    const base = await res.json();

    // seed thumbs quando faltam + repete para demo
    const expanded = [];
    for (let r = 0; r < REPEAT_TIMES; r++){
      base.forEach((h, idx) => {
        const copy = { ...h };
        if (!copy.thumb) {
          copy.thumb = DEMO_IMAGES[(idx + r) % DEMO_IMAGES.length] || 'assets/sample/placeholder.jpg';
        }
        expanded.push(copy);
      });
    }
    HOTELS = expanded;

    render();
  }catch(e){
    console.error('hotels load failed', e);
  }
}

function adCardHTML(i){
  // Slot de parceria (podes trocar o texto / link)
  const img = DEMO_IMAGES[i % DEMO_IMAGES.length] || 'assets/sample/placeholder.jpg';
  return `
    <div class="hotel-ad">
      <img src="${img}" alt="" loading="lazy">
      <div class="body">
        <span class="ad-badge">Advertising</span>
        <div class="title">Partner placement</div>
        <div class="muted">Promoted hotel or local apartment partner.</div>
        <div class="cta"><a href="#" target="_blank" rel="noopener">Learn more</a></div>
      </div>
    </div>
  `;
}

function hotelCardHTML(h, start, end, adults){
  const url = (h.affiliateUrl || '#')
    .replace('{CHECKIN}',  start)
    .replace('{CHECKOUT}', end)
    .replace('{ADULTS}',   adults);

  const img = h.thumb || 'assets/sample/placeholder.jpg';

  return `
    <div class="hotel-card">
      <img src="${img}" alt="" loading="lazy">
      <div class="body">
        <div class="name">${utils.escapeHtml(h.name)}</div>
        <div class="meta muted">${utils.escapeHtml(h.area || '')}</div>
        <div class="price"><strong>${utils.escapeHtml(h.currency || '€')}${utils.escapeHtml(h.pricePerNight)}</strong> / night</div>
        <div><a class="book btn btn-primary" href="${url}" target="_blank" rel="noopener">Book</a></div>
      </div>
    </div>
  `;
}

function render(){
  const wrap  = document.getElementById('rail-hotels');
  const dates = document.getElementById('hotels-dates');
  if(!wrap) return;

  const start  = document.getElementById('date-start')?.value || '';
  const end    = document.getElementById('date-end')?.value   || '';
  const adults = document.getElementById('adults')?.value      || '1';

  // Datas por baixo do título (CSS já faz o layout)
  if (dates) dates.textContent = (start && end) ? `${start} → ${end}` : 'Select dates';

  // Intercalar Advertising: a cada 2 hotéis
  const parts = [];
  HOTELS.forEach((h, i) => {
    parts.push(hotelCardHTML(h, start, end, adults));
    if ((i + 1) % 2 === 0) parts.push(adCardHTML(i));
  });

  wrap.innerHTML = parts.join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadHotels();

  ['date-start','date-end','adults'].forEach(id=>{
    const el = document.getElementById(id);
    el && el.addEventListener('change', render);
  });

  document.addEventListener('filtersChanged', render);
});
