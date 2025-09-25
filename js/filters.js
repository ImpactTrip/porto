/* ============ Pill chips ============ */
.pill-filters{ display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; flex-basis:100%; justify-content:center; margin-top:4px; }
.chips-group{ display:flex; gap:8px; align-items:center; }
.chips-label{ font-size:.78rem; color:var(--muted); }
.chips{ display:flex; gap:6px; flex-wrap:wrap; }
.chip{ border:1px solid var(--border); background:#fff; border-radius:999px; padding:6px 10px; font-size:.85rem; cursor:pointer; }
.chip.is-active{ border-color: var(--brand-green); background: #f7fbef; }
.chips-single .chip.is-active[aria-checked="true"]{}

/* ============ Home layout ============ */
.container-two{ max-width: 1280px; margin: 0 auto; padding: 0 20px; display:grid; grid-template-columns: minmax(0,1fr) 320px; gap: 28px; }
@media (max-width: 1000px){ .container-two{ grid-template-columns: 1fr; } .home-aside{ order:2; } }

.section{ margin: 18px 0; }
.section-head{ display:flex; justify-content:space-between; align-items:center; gap:12px; }
.section-head h2{ margin:0; font-size:1.25rem; }
.rail-next{ border:1px solid var(--border); background:#fff; border-radius:999px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

/* Separator: blue → green */
.section-sep{ height:2px; background:linear-gradient(90deg,#24466F 0%,#83B341 100%); opacity:.6; margin:24px 0; }

/* Horizontal rails */
.rail{ display:grid; grid-auto-flow:column; grid-auto-columns: 280px; gap:16px; overflow-x:auto; padding:6px 0 2px; scroll-snap-type: x proximity; }
.rail > *{ scroll-snap-align: start; }

/* Cards in rails */
.card-op{ border:1px solid var(--border); background:#fff; border-radius:12px; overflow:hidden; box-shadow: var(--shadow-sm); }
.card-op img{ width:100%; height:148px; object-fit:cover; display:block; }
.card-op .body{ padding:12px; display:grid; gap:8px; }
.card-op h3{ margin:0; font-size:1rem; color:var(--brand-blue); }
.card-op .meta{ font-size:.85rem; color:var(--muted); }
.card-op .tags{ display:flex; gap:6px; flex-wrap:wrap; }
.card-op .tags .tag{ font-size:.7rem; }

/* Hotels aside */
.home-aside{ position:sticky; top:88px; align-self:start; border:1px solid var(--border); border-radius:12px; padding:12px; background:#fff; box-shadow: var(--shadow-sm); }
.aside-head{ display:flex; justify-content:space-between; align-items:end; margin-bottom:8px; }
.aside-head h3{ margin:0; font-size:1rem; }
.hotels-rail{ display:grid; gap:10px; max-height:70vh; overflow:auto; padding-right:4px; }
.hotel-card{ border:1px solid var(--border); border-radius:10px; overflow:hidden; background:#fff; display:grid; grid-template-columns: 88px 1fr; gap:10px; }
.hotel-card img{ width:88px; height:88px; object-fit:cover; }
.hotel-card .body{ padding:8px 10px; display:grid; gap:4px; }
.hotel-card .name{ font-weight:600; }
.hotel-card .price{ color:#111; }
.hotel-card .book{ font-size:.85rem; color:#fff; background:var(--brand-green); border:0; border-radius:8px; padding:6px 10px; cursor:pointer; }
