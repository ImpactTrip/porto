// js/hotels.js
import { utils } from './utils.js';

let HOTELS = [];

const DEMO_IMAGES = [
  'assets/sample/hotels/ribeira.jpg',
  'assets/sample/hotels/aliados.jpg',
  'assets/sample/hotels/foz.jpg',
  'assets/sample/hotels/boavista.jpg',
  'assets/sample/hotels/cedofeita.jpg',
  'assets/sample/hotels/bonfim.jpg'
];

async function loadHotels(){
  try{
    const res = await fetch('data/hotels.json', { cache:'no-store' });
    const base = await res.json();

    // guarantee thumbnails exist in demo
    HOTELS = base.map((h, i) => ({
      ...h,
      thumb: h.thumb || DEMO_IMAGES[i % DEMO_IMAGES.length] || 'assets/sample/placeholder.jpg'
    }));

    render();
  }catch(e){
    console.error('hotels load failed', e);
  }
}

function adCardHTML(i){
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

  // Dates text
  if (dates) dates.textContent = (start && end) ? `${start} → ${end}` : 'Select dates';

  // Interleave an ad after every 2 hotels
  const parts = [];
  HOTELS.forEach((h, i) => {
    parts.push(hotelCardHTML(h, start, end, adults));
    if ((i + 1) % 2 === 0 && i < HOTELS.length - 1) parts.push(adCardHTML(i));
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
