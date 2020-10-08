const util = require('util');
const axios = require('axios');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const ObjectsToCsv = require('objects-to-csv');
const { DateTime } = require("luxon");

const baseUrl = 'https://www.lazarusnaturals.com';
const productUrls = [
  '/shop/all_only/baseball_cap',
  '/shop/all_only/calm-balm-bundle',
  '/shop/all_only/cbd-massage-oil',
  '/shop/all_only/cedar-citrus-cbd-balm',
  '/shop/all_only/cycling-frog-beanies',
  '/shop/all_only/cycling-frog-t-shirt',
  '/shop/all_only/family-pack',
  '/shop/all_only/full-spectrum-cbd-lotions-bundle',
  '/shop/all_only/lazarus-naturals-tshirt',
  '/shop/all_only/lazarus-naturals-water-bottle',
  '/shop/all_only/liquid-hand-sanitizer-3-4oz',
  '/shop/all_only/liquid-hand-sanitizer-3-4oz-lemon',
  '/shop/all_only/pacific-pine-full-spectrum-cbd-lotion',
  '/shop/all_only/portland-rose-cbd-balm',
  '/shop/all_only/portland-rose-full-spectrum-cbd-lotion',
  '/shop/all_only/soothing-mint-cbd-balm',
  '/shop/all_only/unscented-cbd-balm',
  '/shop/all_only/unscented-full-spectrum-cbd-lotion',
  '/shop/all_only/unscented-liquid-hand-sanitizer-2-pack',
  '/shop/capsules/cbd-10-mg',
  '/shop/capsules/cbd-100-mg',
  '/shop/capsules/cbd-25mg',
  '/shop/capsules/cbd-50-mg',
  '/shop/capsules/cycling-frog-200mg-full-spectrum-cbd-softgels',
  '/shop/capsules/day-and-night-sample-pack',
  '/shop/capsules/energy-formula-25mg-cbd-capsules',
  '/shop/capsules/relaxation-formula-25mg-cbd-capsules',
  '/shop/featured/bulk-cbg-isolate',
  '/shop/featured/cbd-for-dogs',
  '/shop/featured/lavender-cbd-balm',
  '/shop/featured/new-cbd-dog-treats-mobility',
  '/shop/featured/new-cbd-dog-treats-vitality',
  '/shop/isolate/bulk-cbd-isolate',
  '/shop/isolate/cbd-isolate-terpene-infused',
  '/shop/oils/cbd-coconut-oil-1-fl-oz',
  '/shop/pet-products/sensitive-pet-cbd-oil-tincture',
  '/shop/pet-products/wild-salmon-flavored-calming-pet-cbd-oil-tincture',
  '/shop/rso/cbd-1000-mg',
  '/shop/tinctures/blood-orange-high-potency-tincture',
  '/shop/tinctures/cbd-flavorless-high-potency',
  '/shop/tinctures/cbd-high-potency',
  '/shop/tinctures/cbd-tinctures',
  '/shop/tinctures/cbg-cbd-full-spectrum-tincture',
  '/shop/tinctures/chocolate-mint-high-potency-tincture',
  '/shop/tinctures/flavorless-high-potency-cbg-isolate-tincture',
  '/shop/tinctures/french-vanilla-mocha-tincture-cbd-oil',
  '/shop/tinctures/high-potency-sample-pack-2',
  '/shop/tinctures/standard-potency-sample-pack',
  '/shop/tinctures/thc-free-sample-pack',
  '/shop/tinctures/wintermint-tincture-cbd-oil',
];

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
    if ( rating != null ) comment.review_score = element.querySelector('.star-rating').getAttribute('aria-label').replace(/Rated (\d).*?$/, '$1');
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
      console.log("Did a request to "+url);
      const { document } = (new JSDOM(response.data)).window;
      document.querySelectorAll('ol.commentlist .review').forEach(element => {
        acc.push(parseSingleComment(document, element));
      });
      if ( recursive ) {
        // Check for more pages
        let page = document.querySelector('.page-numbers.current')
        if ( page != null ) {
          page = page.textContent;
          let promises = [];
          do {
            // Make rescursive
            let extraUri = '/comment-page-'+page+'#comments';
            promises.push(inspectPageForComments(url+extraUri, acc, false));
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
  await asyncForEach(productUrls, async url => {
    await inspectPageForComments(baseUrl+url, comments);
  });
  await Promise.all(promises).then(async values => {
    const csv = new ObjectsToCsv(comments);
    await csv.toDisk('./lazarous-comments.csv');
    console.log("All done!");
  });
})();