const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const readlineSync = require('readline-sync');
const fs = require('fs');
// Rate Limiter
const RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(5, 'second');

// Get what we're running
const sitesToScrape = ['projectcbd'];
const siteToScrape = sitesToScrape[readlineSync.keyInSelect(sitesToScrape, 'Which site should we scrape?')];

// Init conifg
const config = require('./models/' + siteToScrape.toLowerCase() + '.js');

const inspectPageForLocations = async (url, acc, recurseForMoreReviews = true) => {
  // Make a request for a user with a given ID
  return new Promise((resolve, reject) => {
    limiter.removeTokens(1, async () => {
      await axios.get(url, { responseType: config.responseType })
        .then(async function (response) {
          // Send message to inform a request was made
          console.log("Did a request to " + url);
          // Parse response
          const document = config.getDocument(response);
          // Accumulate Location
          config.parseForLocations(document, acc);
          // Check for more pages
          if (recurseForMoreReviews) {
            await config.recurseParseForMoreLocations(document, acc, url, inspectPageForLocations);
            // Await, simply so the initial call to this function doesn't end automatically
          }
          resolve();
        })
        .catch(function (error) {
          // Retry (currently forever!!!) but only subpages
          if (!recurseForMoreReviews) {
            inspectPageForLocations(url, acc, recurseForMoreReviews);
          }
          // handle error
          console.log(url, error);
          reject();
        });
    });
  })
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

var locations = [];

(async function main() {
  await asyncForEach(config.urlsToRecurse, async url => {
    await inspectPageForLocations(config.baseUrl + url, locations);
  });
  const csv = new ObjectsToCsv(locations);
  await csv.toDisk('./output/' + config.slug.toLowerCase() + '.csv');
  console.log("All done!");
})();