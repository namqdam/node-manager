import { manageFlux } from './flux';

(async function main() {
  const data = process.env.DATA;
  if (!data) {
    console.log('missing base64 encoded DATA');
    return;
  }
  const base64 = Buffer.from(data, 'base64').toString('ascii');
  await manageFlux(base64);
})();
