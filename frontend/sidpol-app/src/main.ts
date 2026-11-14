import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  // eslint-disable-next-line no-console -- único caso: si Angular no arranca, no hay otra forma de avisarlo
  .catch((err) => console.error(err));
