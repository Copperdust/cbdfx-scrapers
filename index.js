const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const readlineSync = require('readline-sync');
const fs = require('fs');
const { triggerAsyncId } = require('async_hooks');
// Rate Limiter
const RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(5, 'second');

// Get what we're running
const scrapeTypes = ['Reviews', 'Locations'];
const scrapeType = scrapeTypes[readlineSync.keyInSelect(scrapeTypes, 'What are we scraping?')].toLowerCase();

if (scrapeType === -1) return;

// Get config to use
const scrapeConfigs = fs.readdirSync('./' + scrapeType + '/models/').map(str => str.replace(/\.js$/, ''));
const scrapeConfig = scrapeConfigs[readlineSync.keyInSelect(scrapeConfigs, 'What are we scraping?')] + '.js';

// Init conifg
const config = require('./' + scrapeType + '/models/' + scrapeConfig);

const inspectPageForItems = async (url, acc, recurseForMoreItems = true) => {
  // Make a request for a user with a given ID
  return new Promise((resolve, reject) => {
    limiter.removeTokens(1, async () => {
      await axios.get(url, { responseType: config.responseType })
        .then(async function (response) {
          // Send message to inform a request was made
          console.log("Did a request to " + url);
          // Parse response
          const document = config.getDocument(response);
          // Accumulate comment
          config.parseForItems(document, acc);
          // Check for more pages
          if (recurseForMoreItems) {
            await config.recurseParseForMoreItems(document, acc, url, inspectPageForItems);
          }
          resolve();
        })
        .catch(function (error) {
          // Retry (currently forever!!!) but only subpages
          if (!recurseForMoreItems) {
            inspectPageForItems(url, acc, recurseForMoreItems);
          }
          // handle error
          reject();
        });
    });
  })
  .catch(error => {
    try {
      console.log(url, error.response.statusText);
    } catch (e2) {
      console.log(url, error);
    }
  });
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

var items = [];

(async function main() {
  await asyncForEach(config.urlsToRecurse, async url => {
    await inspectPageForItems(config.baseUrl + url, items);
  });
  const csv = new ObjectsToCsv(items);
  await csv.toDisk('./output/' + config.slug.toLowerCase() + '.csv');
  console.log("All done!");
})();