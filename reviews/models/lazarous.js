const { DateTime } = require('luxon');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class Lazarous {
  slug = 'lazarous';

  responseType = 'document';

  baseUrl = 'https://www.lazarusnaturals.com';

  urlsToRecurse = [
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
    '/shop/tinctures/wintermint-tincture-cbd-oil'
  ]

  constructor() {
  }

  getDocument(response) {
    let { document } = (new JSDOM(response.data)).window;
    return document;
  }

  parseTime = string => {
    return DateTime.fromISO(string).toUTC().toFormat('yyyy-MM-dd hh:mm:ss ZZZZ');
  }

  parseSingleItem = (document, element, hasChild = false) => {
    let item = {
      user_type: 'verified_buyer',
      appkey: 'N/A',
      published: 'TRUE',
      review_title: 'Item from Lazarous',
      review_content: element.querySelector('.description').innerHTML,
      review_score: '',
      date: this.parseTime(element.querySelector('.woocommerce-review__published-date').getAttribute('datetime')),
      product_title: document.querySelector('.product_title').textContent,
      display_name: element.querySelector('.woocommerce-review__author').textContent,
      email: '',
      md_customer_country: 'US',
    };
    if (!hasChild) {
      let rating = element.querySelector('.star-rating');
      if (rating != null) item.review_score = element.querySelector('.star-rating').getAttribute('aria-label').replace(/Rated (\d).*?$/, '$1');
    }
    let child = element.querySelector('.children');
    if (child != null) {
      item.children = [];
      child.querySelectorAll('.comment').forEach(childElement => {
        item.children.push(this.parseSingleItem(document, childElement, true));
      });
    }
    return item;
  };

  parseForItems(document, acc) {
    document.querySelectorAll('ol.commentlist .review').forEach(element => {
      acc.push(this.parseSingleItem(document, element));
    });
  }

  getRecursePagination = page => {
    return '/comment-page-{{index}}#comments'.replace(/{{index}}/, page);
  }

  recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    var page = document.querySelector('.page-numbers.current')
    var promises = [];
    if (page != null) {
      page = page.textContent;
      do {
        // Make rescursive
        promises.push(inspectPageForItems(url + this.getRecursePagination(page), acc, false));
        page--;
      } while (page >= 1);
    }
    return Promise.all(promises);
  }
}

module.exports = new Lazarous();