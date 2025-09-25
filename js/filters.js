// js/filters.js
export const FILTERS = {
  languages: new Set(['Any']),
  duration: 'any' // 'any' | '1h' | '2–3h' | 'half' | 'full'
};

function refresh(){ document.dispatchEvent(new CustomEvent('filtersChanged', { detail: { ...FILTERS } })); }

document.addEventListener('DOMContentLoaded', () => {
  const langWrap = document.getElementById('chips-lang');
  if (langWrap){
    langWrap.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-lang]'); if(!btn) return;
      const val = btn.dataset.lang;
      if (val === 'Any'){
        FILTERS.languages = new Set(['Any']);
        langWrap.querySelectorAll('.chip').forEach(c=>c.classList.toggle('is-active', c.dataset.lang==='Any'));
      } else {
        FILTERS.languages.delete('Any');
        const on = btn.classList.toggle('is-active');
        on ? FILTERS.languages.add(val) : FILTERS.languages.delete(val);
        if (FILTERS.languages.size === 0) FILTERS.languages = new Set(['Any']);
        langWrap.querySelector('[data-lang="Any"]').classList.toggle('is-active', FILTERS.languages.has('Any'));
      }
      refresh();
    });
  }

  const durWrap = document.getElementById('chips-duration');
  if (durWrap){
    durWrap.addEventListener('click', e=>{
      const btn = e.target.closest('button[data-duration]'); if(!btn) return;
      FILTERS.duration = btn.dataset.duration;
      durWrap.querySelectorAll('.chip').forEach(c=>c.classList.toggle('is-active', c===btn));
      refresh();
    });
  }
});
