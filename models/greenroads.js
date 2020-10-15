const { DateTime } = require('luxon');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const BaseScrapeClass = require('../includes/base.js');
const axios = require('axios');

class greenroads extends BaseScrapeClass {
  slug = 'greenroads';

  responseType = 'document';

  baseUrl = 'https://staticw2.yotpo.com/batch/app_key/g223HDWt9gC9Q0VMrSCrpjO7Dp1zVBlUYLWJwQz3/domain_key/337/widget/reviews';

  urlsToRecurse = [0];

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
      product_title: element.querySelector('.product-link').textContent.trim().replace(/^On /, ''),
      product_url: element.querySelector('.product-link-wrapper').getAttribute('href'),
      display_name: (element.querySelector('.yotpo-user-name').textContent || '').trim(),
      email: '',
      md_customer_country: 'US',
      rating: element.querySelector('.yotpo-review-stars .sr-only').getAttribute('data-rating'),
    }
    return item;
  };

  parseForItems(document, acc) {
    document.querySelectorAll('.yotpo-review').forEach(element => {
      acc.push(this.parseSingleItem(document, element));
    });
  }

  recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    var page = Math.ceil(document.querySelector('.total-reviews-search').getAttribute('total-reviews-search') / 5);
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
            var req = new GreenRoadsRequest(page);
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

class GreenRoadsRequest extends greenroads {
  constructor(page) {
    super();

    this.page = page;

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
            "method": "reviews",
            "params": {
              "page": this.page,
            }
          }],
          app_key: "g223HDWt9gC9Q0VMrSCrpjO7Dp1zVBlUYLWJwQz3",
          is_mobile: false,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new greenroads();