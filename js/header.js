import { CONFIG } from './config.js';
import { utils } from './utils.js';

export class HeaderController {
  constructor(){
    this.header = document.querySelector('.site-header');
    if(!this.header) return;
    this.onScroll = utils.throttle(()=> {
      this.header.classList.toggle('is-scrolled', window.scrollY > CONFIG.SCROLL_THRESHOLD);
    }, 100);
    window.addEventListener('scroll', this.onScroll);
    this.onScroll();
  }
  destroy(){ window.removeEventListener('scroll', this.onScroll); }
}