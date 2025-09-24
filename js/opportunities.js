import { utils } from './utils.js';

export class OpportunitiesRenderer {
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