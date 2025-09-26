// js/hotels.js
import { utils } from './utils.js';

let HOTELS = [];

async function loadHotels(){
  try{
    const res = await fetch('data/hotels.json', { cache:'no-store' });
    HOTELS = await res.json();
    render();
  }catch(e){ console.error('hotels load failed', e); }
}

function render(){
  const wrap  = document.getElementById('rail-hotels');
  const dates = document.getElementById('hotels-dates');
  if(!wrap) return;

  const start = document.getElementById('date-start')?.value || '';
  const end   = document.getElementById('date-end')?.value || '';
  dates && (dates.textContent = (start && end) ? `${start} → ${end}` : 'Select dates');

  const adults = document.getElementById('adults')?.value || '1';

  wrap.innerHTML = HOTELS.map(h=>{
    const url = (h.affiliateUrl || '#')
      .replace('{CHECKIN}',  start)
      .replace('{CHECKOUT}', end)
      .replace('{ADULTS}',   adults);
    return `
      <div class="hotel-card">
        <img src="${h.thumb}" alt="" loading="lazy">
        <div class="body">
          <div class="name">${h.name}</div>
          <div class="meta muted">${h.area}</div>
          <div class="price"><strong>${h.currency}${h.pricePerNight}</strong> / night</div>
          <div><a class="book btn btn-primary" href="${url}" target="_blank" rel="noopener">Book</a></div>
        </div>
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadHotels();
  ['date-start','date-end','adults'].forEach(id=>{
    const el = document.getElementById(id);
    el && el.addEventListener('change', render);
  });

  document.addEventListener('filtersChanged', () => render());
});
