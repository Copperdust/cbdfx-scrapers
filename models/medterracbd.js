const { DateTime } = require('luxon');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const BaseScrapeClass = require('../includes/base.js');
const axios = require('axios');
const { pid } = require('process');

class medterracbd extends BaseScrapeClass {
  slug = 'medterracbd';

  responseType = 'document';

  itemsPerPage = 10;

  baseUrl = 'https://staticw2.yotpo.com';

  urlsToRecurse = [
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/OTC-PAIN-CREAM',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/UBS-CAPS',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/TINBS',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/IMMUNEBOOST',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CBGCBD-TIN',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CBD-TIN',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CBD-GEL',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/GUMMIES-KC',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/GUMMIES-ST',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/GUMMIES-SA',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/MWB-3000',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/URB-750',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/EVEWB',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/BESTBUDDIES',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/GM',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CBD-SLEEP',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CBD-RCPC',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/MMHC',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/CREAM-ROLLON',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/PET-BEEF',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/PET-CHK',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/PET-UNFL',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/PETCHW',
    '/batch/1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2/MPCCB',
  ];

  constructor() {
    super()
  }

  getDocument(response) {
    let { document } = (new JSDOM(response.data[0].result)).window;
    return document;
  }

  parseTime = string => {
    return DateTime.fromFormat(string, 'MM/dd/yy').toUTC().toFormat('yyyy-MM-dd hh:mm:ss ZZZZ');
  }

  parseSingleItem = (document, element) => {
    let item = {
      appkey: 'N/A',
      published: 'TRUE',
      review_title: element.querySelector('.content-title').textContent,
      review_content: element.querySelector('.content-review').textContent,
      review_score: '',
      date: this.parseTime(element.querySelector('.yotpo-review-date').textContent),
      product_title: element.querySelector('.product-link-wrapper').getAttribute('aria-label'),
      product_url: element.querySelector('.product-link-wrapper').getAttribute('href'),
      display_name: (element.querySelector('.yotpo-user-name').textContent || '').trim(),
      email: '',
      md_customer_country: 'US',
      rating: element.querySelector('.yotpo-review-stars .sr-only').textContent,
    }
    return item;
  };

  parseForItems(document, acc) {
    document.querySelectorAll('.yotpo-review').forEach(element => {
      acc.push(this.parseSingleItem(document, element));
    });
  }

  recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    var page = Math.ceil(document.querySelector('.total-reviews-search').getAttribute('total-reviews-search') / this.itemsPerPage);
    var promises = [];
    do {
      // Make rescursive
      promises.push(this.inspectPageForItems(url, acc, false, page));
      page--;
    } while (page > 1);
    return Promise.all(promises);
  }

  inspectPageForItems(url, acc, recurseForMoreItems = true, page = 1) {
    try {
      return new Promise(resolve => {
        this.limiter.removeTokens(1, async () => {
          try {
            var req = new MedTerraCBDRequest({
              page: page,
              pid: url.replace(/.*\/(.*?)$/, '$1'),
            });
            const response = await req.axiosRequest(url);
            await this.processSuccessfulRequest(acc, url, response, recurseForMoreItems);
          } catch (error) {
            console.log(error);
            if (!recurseForMoreItems) {
              await this.inspectPageForItems(url, acc, recurseForMoreItems);
            }
          }
          resolve();
        });
      });
    } catch (error) {
      console.log(url, error.response ? error.response.statusText : error);
    }
  }
}

class MedTerraCBDRequest extends medterracbd {
  constructor(config) {
    super();

    Object.assign(this, config);

    console.log("Page:", this.page);
  }

  axiosRequest(url) {
    try {
      return axios({
        url: url,
        method: 'post',
        responseType: this.responseType,
        headers: {
          "accept": "application/json",
        },
        data: {
          methods: [{
            "method": "filtered_reviews",
            "params": {
              "page": this.page,
              "host-widget": "main_widget",
              "is_mobile": false,
              "pid": this.pid
            }
          }],
          app_key: "1sxu3xqIeUuytgufkNbk1HU5VmhFNrXjaUaqU0Q2",
          is_mobile: false,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new medterracbd();