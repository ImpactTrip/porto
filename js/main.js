// ================================
// ImpactTrip – main.js (Pilot)
// ================================

// ---- Constants ----
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
  parseIntSafe(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  escapeHtml(str = '') {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      const execute = () => {
        lastExecTime = currentTime;
        func.apply(this, args);
      };
      clearTimeout(timeoutId);
      if (currentTime - lastExecTime > delay) {
        execute();
      } else {
        timeoutId = setTimeout(execute, delay - (currentTime - lastExecTime));
      }
    };
  },

  toISODate(date) {
    // timezone-safe yyyy-mm-dd
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  }
};

// ---- Header controller (shadow on scroll) ----
class HeaderController {
  constructor() {
    this.header = document.querySelector('.site-header');
    if (!this.header) return;

    this.handleScroll = utils.throttle(() => {
      this.header.classList.toggle('is-scrolled', window.scrollY > CONFIG.SCROLL_THRESHOLD);
    }, 100);

    this.init();
  }

  init() {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll(); // initial state
  }

  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}

// ---- Form state manager (localStorage) ----
class FormStateManager {
  constructor() {
    this.state = this.load() || this.getDefaultState();
  }

  getDefaultState() {
    return {
      location: CONFIG.DEFAULT_LOCATION,
      dateStart: '',
      dateEnd: '',
      adults: CONFIG.DEFAULT_ADULTS,
      children: CONFIG.DEFAULT_CHILDREN,
      childAges: []
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.validate(parsed);
    } catch (error) {
      console.warn('Failed to load saved state:', error);
      return null;
    }
  }

  validate(data) {
    if (!data || typeof data !== 'object') return null;
    return {
      location: data.location || CONFIG.DEFAULT_LOCATION,
      dateStart: data.dateStart || '',
      dateEnd: data.dateEnd || '',
      adults: utils.clamp(
        utils.parseIntSafe(data.adults, CONFIG.DEFAULT_ADULTS),
        CONFIG.MIN_ADULTS,
        99
      ),
      children: utils.clamp(
        utils.parseIntSafe(data.children, CONFIG.DEFAULT_CHILDREN),
        CONFIG.MIN_CHILDREN,
        10
      ),
      childAges: Array.isArray(data.childAges) ? data.childAges : []
    };
  }

  save(updates = {}) {
    this.state = { ...this.state, ...updates };
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
    return this.state;
  }

  get() {
    return { ...this.state };
  }
}

// ---- Pilot form controller ----
class PilotFormController {
  constructor() {
    this.form = document.getElementById('pilot-form');
    if (!this.form) return;

    this.elements = {
      location: document.getElementById('location'),
      dateStart: document.getElementById('date-start'),
      dateEnd: document.getElementById('date-end'),
      adults: document.getElementById('adults'),
      children: document.getElementById('children'),
      agesWrap: document.getElementById('children-ages')
    };

    if (!this.validateElements()) {
      console.error('Missing required form elements');
      return;
    }

    this.stateManager = new FormStateManager();
    this.init();
  }

  validateElements() {
    return Object.values(this.elements).every(el => el !== null);
  }

  init() {
    this.loadInitialState();

    // --- dynamic date mins: allow yesterday and beyond ---
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const minISO = utils.toISODate(yesterday);
    this.elements.dateStart.min = minISO;
    this.elements.dateEnd.min = minISO;

    // keep end >= start when start changes
    this.elements.dateStart.addEventListener('change', () => {
      const fromVal = this.elements.dateStart.value;
      if (fromVal) {
        this.elements.dateEnd.min = fromVal;
        if (this.elements.dateEnd.value && this.elements.dateEnd.value < fromVal) {
          this.elements.dateEnd.value = fromVal; // auto-fix
        }
      } else {
        this.elements.dateEnd.min = minISO;
      }
      this.persist();
    });

    this.attachEventListeners();
  }

  loadInitialState() {
    const state = this.stateManager.get();

    this.elements.location.value = state.location;
    this.elements.dateStart.value = state.dateStart;
    this.elements.dateEnd.value = state.dateEnd;
    this.elements.adults.value = state.adults;
    this.elements.children.value = state.children;

    this.renderChildAges(state.children, state.childAges);
  }

  attachEventListeners() {
    // Generic fields
    ['location', 'dateStart', 'dateEnd', 'adults'].forEach(key => {
      this.elements[key].addEventListener('change', () => this.handleFieldChange(key));
    });

    // Children changes
    this.elements.children.addEventListener('change', () => this.handleChildrenChange());

    // Ages (delegated)
    this.elements.agesWrap.addEventListener('change', (e) => {
      if (e.target.matches('input[data-age-index]')) {
        this.handleChildAgeChange(e.target);
      }
    });

    // Submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  handleFieldChange(field) {
    const el = this.elements[field];
    let value = el.value;

    if (field === 'adults') {
      const v = utils.clamp(utils.parseIntSafe(value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99);
      el.value = v;
      value = v;
    }

    this.stateManager.save({ [field]: value });
  }

  handleChildrenChange() {
    const n = utils.clamp(
      utils.parseIntSafe(this.elements.children.value, CONFIG.DEFAULT_CHILDREN),
      CONFIG.MIN_CHILDREN,
      10
    );
    this.elements.children.value = n;
    this.renderChildAges(n);
    this.persist();
  }

  handleChildAgeChange(input) {
    const age = utils.clamp(
      utils.parseIntSafe(input.value, CONFIG.MIN_CHILD_AGE),
      CONFIG.MIN_CHILD_AGE,
      CONFIG.MAX_CHILD_AGE
    );
    input.value = age;
    this.persist();
  }

  handleSubmit(e) {
    e.preventDefault();

    const start = this.elements.dateStart.value;
    const end = this.elements.dateEnd.value;

    // Strict UX: both required; ensure end >= start
    if (start && end && end < start) {
      alert('"To" date must be the same day or after "From" date.');
      return;
    }

    const finalState = this.persist();
    console.log('Filters applied:', finalState);

    // Notify other components
    this.form.dispatchEvent(new CustomEvent('filtersApplied', { detail: finalState }));
  }

  persist() {
    return this.stateManager.save({
      location: this.elements.location.value || CONFIG.DEFAULT_LOCATION,
      dateStart: this.elements.dateStart.value || '',
      dateEnd: this.elements.dateEnd.value || '',
      adults: utils.clamp(utils.parseIntSafe(this.elements.adults.value, CONFIG.DEFAULT_ADULTS), CONFIG.MIN_ADULTS, 99),
      children: utils.clamp(utils.parseIntSafe(this.elements.children.value, CONFIG.DEFAULT_CHILDREN), CONFIG.MIN_CHILDREN, 10),
      childAges: this.collectChildAges()
    });
  }

  renderChildAges(count, existing = []) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const age = Number.isFinite(existing[i]) ? existing[i] : '';
      const field = document.createElement('div');
      field.className = 'age-field';

      const label = document.createElement('label');
      label.className = 'lbl';
      label.textContent = `Age ${i + 1}`;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = CONFIG.MIN_CHILD_AGE;
      input.max = CONFIG.MAX_CHILD_AGE;
      input.dataset.ageIndex = i;
      input.value = age;

      field.appendChild(label);
      field.appendChild(input);
      fragment.appendChild(field);
    }
    this.elements.agesWrap.innerHTML = '';
    this.elements.agesWrap.appendChild(fragment);
  }

  collectChildAges() {
    return Array.from(this.elements.agesWrap.querySelectorAll('input[data-age-index]'))
      .map(input => {
        const v = utils.parseIntSafe(input.value, '');
        return v === '' ? '' : utils.clamp(v, CONFIG.MIN_CHILD_AGE, CONFIG.MAX_CHILD_AGE);
      });
  }
}

// ---- Opportunities renderer ----
class OpportunitiesRenderer {
  constructor(containerId = 'opportunities') {
    this.container = document.querySelector(`#${containerId}`);
    if (!this.container) return;
  }

  async render() {
    try {
      const response = await fetch('data/opportunities.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const opportunities = await response.json();
      this.displayOpportunities(opportunities);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      this.displayError();
    }
  }

  displayOpportunities(opportunities) {
    const fragment = document.createDocumentFragment();
    opportunities.forEach(op => fragment.appendChild(this.createOpportunityCard(op)));
    this.container.appendChild(fragment);
  }

  createOpportunityCard(opportunity) {
    const article = document.createElement('article');
    article.className = 'card';

    const title = document.createElement('h3');
    title.innerHTML = utils.escapeHtml(opportunity.title);

    const summary = document.createElement('p');
    summary.innerHTML = utils.escapeHtml(opportunity.summary);

    const details = document.createElement('p');
    details.innerHTML = `
      <strong>Category:</strong> ${utils.escapeHtml(opportunity.category)} ·
      <strong>When:</strong> ${utils.escapeHtml(opportunity.when)} ·
      <strong>Time:</strong> ${utils.escapeHtml(opportunity.duration)}
    `;

    const actionWrapper = document.createElement('p');
    const actionButton = document.createElement('a');
    actionButton.className = 'btn btn-primary';
    actionButton.href = '#';
    actionButton.textContent = 'I want to help';
    actionButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleOpportunityClick(opportunity);
    });

    actionWrapper.appendChild(actionButton);
    article.append(title, summary, details, actionWrapper);
    return article;
  }

  handleOpportunityClick(opportunity) {
    console.log('Opportunity selected:', opportunity);
    document.dispatchEvent(new CustomEvent('opportunitySelected', { detail: opportunity }));
  }

  displayError() {
    this.container.innerHTML = '<p class="error">Failed to load opportunities. Please try again later.</p>';
  }
}

// ---- App bootstrap ----
document.addEventListener('DOMContentLoaded', () => {
  const app = {
    header: new HeaderController(),
    pilotForm: new PilotFormController(),
    opportunities: new OpportunitiesRenderer()
  };

  app.opportunities.render();
  window.app = app; // optional: debug
});
