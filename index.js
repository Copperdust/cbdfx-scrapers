const ObjectsToCsv = require('objects-to-csv');
const readlineSync = require('readline-sync');
const fs = require('fs');

// Get config to use
const scrapeConfigs = fs.readdirSync('./models/').map(str => str.replace(/\.js$/, ''));
const scrapeConfig = scrapeConfigs[readlineSync.keyInSelect(scrapeConfigs, 'What are we scraping?')] + '.js';

// Init conifg
const config = require('./models/' + scrapeConfig);

(async function main() {
  const items = await config.scrape();
  const csv = new ObjectsToCsv(items);
  await csv.toDisk('./output/' + config.slug.toLowerCase() + '.csv');
  console.log("All done!");
})();