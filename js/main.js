import { HeaderController } from './header.js';
import { PilotFormController } from './pilotForm.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = {
    header: new HeaderController(),
    pilotForm: new PilotFormController(),
  };
  window.app = app;

  // ==============================
  // 1) calcular e manter --footer-gap igual à altura real do footer
  // ==============================
  const root = document.documentElement;
  const footer = document.querySelector('footer');

  const setFooterGap = () => {
    const h = footer ? footer.offsetHeight : 0;
    root.style.setProperty('--footer-gap', `${h}px`);
  };

  setFooterGap();
  window.addEventListener('resize', setFooterGap);
  window.addEventListener('load', setFooterGap);

  if ('ResizeObserver' in window && footer) {
    const ro = new ResizeObserver(setFooterGap);
    ro.observe(footer);
  }

  // ==============================
  // 2) calcular e manter --vw-scrollbar para afastar o aside
  // ==============================
  const setScrollbarGap = () => {
    const w = window.innerWidth - document.documentElement.clientWidth;
    root.style.setProperty('--vw-scrollbar', `${Math.max(0, w)}px`);
  };

  setScrollbarGap();
  window.addEventListener('resize', setScrollbarGap);
  window.addEventListener('orientationchange', setScrollbarGap);
  window.addEventListener('load', setScrollbarGap);
});
