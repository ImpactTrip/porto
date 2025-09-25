import { HeaderController } from './header.js';
import { PilotFormController } from './pilotForm.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = {
    header: new HeaderController(),
    pilotForm: new PilotFormController(),
    opportunities: new OpportunitiesRenderer()
  };
  app.opportunities.render();
  window.app = app; // optional for debugging
});