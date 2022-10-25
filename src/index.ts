require('dotenv').config();

import { manageFlux } from './flux';

(async function main() {
  await manageFlux();
})();
