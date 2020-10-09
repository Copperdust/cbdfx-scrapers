const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const ObjectsToCsv = require('objects-to-csv');
const { DateTime } = require("luxon");
const readlineSync = require('readline-sync');
const fs = require('fs');
// Get what we're running
const sitesToScrape = ['Lazarous', 'NuLeaf'];
const siteToScrape = sitesToScrape[readlineSync.keyInSelect(sitesToScrape, 'Which site should we scrape?')];
// Init conifg
const config = JSON.parse(fs.readFileSync('configs/'+siteToScrape.toLowerCase()+'.json', 'utf8'));

const parseTime = string => {
  return DateTime.fromISO(string).toUTC().toFormat('yyyy-MM-dd hh:mm:ss ZZZZ');
};

const parseSingleComment = (document, element, hasChild = false) => {
  let comment = {
    user_type: 'verified_buyer',
    appkey: 'N/A',
    published: 'TRUE',
    review_title: 'Comment from Lazarous',
    review_content: element.querySelector('.description').innerHTML,
    review_score: '',
    date: parseTime(element.querySelector('.woocommerce-review__published-date').getAttribute('datetime')),
    product_title: document.querySelector('.product_title').textContent,
    display_name: element.querySelector('.woocommerce-review__author').textContent,
    email: '',
    md_customer_country: 'US',
  };
  if (!hasChild) {
    let rating = element.querySelector('.star-rating');
    if (rating != null) comment.review_score = element.querySelector('.star-rating').getAttribute('aria-label').replace(/Rated (\d).*?$/, '$1');
  }
  let child = element.querySelector('.children');
  if (child != null) {
    comment.children = [];
    child.querySelectorAll('.comment').forEach(childElement => {
      comment.children.push(parseSingleComment(document, childElement, true));
    });
  }
  return comment;
};

const inspectPageForComments = async (url, acc, recursive = true) => {
  // Make a request for a user with a given ID
  return axios.get(url, { responseType: 'document' })
    .then(async function (response) {
      console.log("Did a request to " + url);
      const { document } = (new JSDOM(response.data)).window;
      document.querySelectorAll('ol.commentlist .review').forEach(element => {
        acc.push(parseSingleComment(document, element));
      });
      if (recursive) {
        // Check for more pages
        let page = document.querySelector('.page-numbers.current')
        if (page != null) {
          page = page.textContent;
          let promises = [];
          do {
            // Make rescursive
            let extraUri = '/comment-page-' + page + '#comments';
            promises.push(inspectPageForComments(url + extraUri, acc, false));
            page--;
          } while (page >= 1);
          await Promise.all(promises).then(values => {
            // console.log(values);
          });
        }
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
    await csv.toDisk('./lazarous-comments.csv');
    console.log("All done!");
  });
})();