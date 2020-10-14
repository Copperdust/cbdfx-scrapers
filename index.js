const ObjectsToCsv = require('objects-to-csv');
const readlineSync = require('readline-sync');
const fs = require('fs');

// Get config to use
const scrapeConfigs = fs.readdirSync('./models/').map(str => str.replace(/\.js$/, ''));
const scrapeConfig = scrapeConfigs[readlineSync.keyInSelect(scrapeConfigs, 'What are we scraping?')] + '.js';

// Init conifg
const config = require('./models/' + scrapeConfig);

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

var items = [];

(async function main() {
  await asyncForEach(config.urlsToRecurse, async url => {
    await config.inspectPageForItems(config.baseUrl + url, items);
  });
  const csv = new ObjectsToCsv(items);
  await csv.toDisk('./output/' + config.slug.toLowerCase() + '.csv');
  console.log("All done!");
})();