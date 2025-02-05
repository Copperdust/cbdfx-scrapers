const { DateTime } = require('luxon');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const BaseScrapeClass = require('../includes/base.js');

class nuleaf extends BaseScrapeClass {
  slug = 'nuleaf';

  responseType = 'json';

  baseUrl = 'https://stamped.io';

  urlsToRecurse = [
    '/api/widget?productId=2000&apiKey=pubkey-0lXD43AO9y57H9P4nmv9Kn9q6aS51q&storeUrl=nuleafnaturals.com&take=50',
    '/api/widget?productId=2016&apiKey=pubkey-0lXD43AO9y57H9P4nmv9Kn9q6aS51q&storeUrl=nuleafnaturals.com&take=50',
  ]

  productIdUrls = [
    {
      2000: "https://nuleafnaturals.com/product/full-spectrum-hemp-cbd-oil-60mg-ml/",
      2016: "https://nuleafnaturals.com/product/full-spectrum-hemp-cbd-pet-oil-60mg-ml/",
    }
  ]

  constructor() {
    super()
  }

  getDocument(response) {
    let { document } = (new JSDOM(response.data.widget)).window;
    return document;
  }

  getProductUrl(id) {
    if (this.productIdUrls[id]) {
      return this.productIdUrls[id];
    }
    return '';
  }

  parseTime = string => {
    return DateTime.fromFormat(string, 'MM/dd/yyyy').toUTC().toFormat('yyyy-MM-dd hh:mm:ss ZZZZ');
  }

  parseSingleItem = (document, element) => {
    let item = {
      appkey: 'N/A',
      published: 'TRUE',
      review_title: element.querySelector('.stamped-review-header-title').textContent,
      review_content: element.querySelector('.stamped-review-content-body').textContent,
      review_score: '',
      date: this.parseTime(element.querySelector('.created').textContent),
      product_title: element.querySelector('.stamped-review-product').textContent,
      product_url: this.getProductUrl(element.getAttribute('data-product-id')),
      display_name: element.querySelector('.author').textContent,
      email: '',
      md_customer_country: 'US',
      rating: element.querySelector('.stamped-review-header-starratings').getAttribute('data-rating'),
    }
    return item;
  };

  parseForItems(document, acc) {
    document.querySelectorAll('.stamped-review').forEach(element => {
      acc.push(this.parseSingleItem(document, element));
    });
  }

  getRecursePagination = page => {
    return '&page={{index}}'.replace(/{{index}}/, page);
  }

  recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    // We know the total amount of reviews from this attr
    const totalAmountOfReviews = document.querySelector('#tab-reviews').getAttribute('data-count');
    // Creat promises
    var promises = [];
    for (let page = 1; page * 50 < totalAmountOfReviews; page++) {
      promises.push(inspectPageForItems(url + this.getRecursePagination(page), acc, false));
    }
    return Promise.all(promises);
  }
}

module.exports = new nuleaf();