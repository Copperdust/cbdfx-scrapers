const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const readlineSync = require('readline-sync');
const fs = require('fs');

// Get what we're running
const sitesToScrape = ['Lazarous', 'NuLeaf'];
const siteToScrape = sitesToScrape[readlineSync.keyInSelect(sitesToScrape, 'Which site should we scrape?')];

// Init conifg
const config = require('./models/' + siteToScrape.toLowerCase() + '.js');

const getRecursePagination = page => {
  return config.paginationPattern.replace(/{{index}}/, page);
}

const inspectPageForComments = async (url, acc, recurseForMoreReviews = true) => {
  // Make a request for a user with a given ID
  return axios.get(url, { responseType: config.responseType })
    .then(async function (response) {
      // Send message to inform a request was made
      console.log("Did a request to " + url);
      // Parse response
      const document = config.getDocument(response);
      // Accumulate comment
      config.parseForComments(document, acc);
      // Check for more pages
      if (recurseForMoreReviews) {
        let promises = config.recurseParseForMoreComments(document, acc, url, inspectPageForComments);
        // switch (config.scrapeType) {
        //   case "recurseUntilOutOfPages":
        //     let page = document.querySelector('.page-numbers.current')
        //     if (page != null) {
        //       page = page.textContent;
        //       let promises = [];
        //       do {
        //         // Make rescursive
        //         promises.push(inspectPageForComments(url + getRecursePagination(page), acc, false));
        //         page--;
        //       } while (page >= 1);
        //     }
        //     break;
        //   case "knownPageAmount":
        //     // We know the total amount of reviews from this attr
        //     const totalAmountOfReviews = document.querySelector('#tab-reviews').getAttribute('data-count');
        //     // Creat promises
        //     let promises = [];
        //     for (let index = 1; index * 50 < totalAmountOfReviews; index++) {
        //       promises.push(runRequestsForComments(url + getRecursePagination(page), acc, false));
        //     }
        //     // Await, simply so the initial call to this function doesn't end automatically
        //     break;
        // }
        await Promise.all(promises);
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

var promises = [];
var comments = [];

(async () => {
  await asyncForEach(config.productUrls, async url => {
    await inspectPageForComments(config.baseUrl + url, comments);
  });
  await Promise.all(promises).then(async values => {
    const csv = new ObjectsToCsv(comments);
    await csv.toDisk('./output/' + config.slug.toLowerCase() + '.csv');
    console.log("All done!");
  });
})();