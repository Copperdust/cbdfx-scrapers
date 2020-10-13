const jsdom = require('jsdom');
const { JSDOM } = jsdom;

class projectcbd {
  slug = 'projectcbd';

  responseType = 'document';

  baseUrl = 'https://www.projectcbd.org';

  urlsToRecurse = [
    '/find-cbd/dispensaries/all'
  ]

  constructor() {
  }

  getDocument(response) {
    let { document } = (new JSDOM(response.data)).window;
    return document;
  }

  parseSingleItem = (document, element, hasChild = false) => {
    let item = {
      title: (element.querySelector('.views-field-title').textContent || '').trim(),
      phone: (element.querySelector('.views-field-phone').textContent || '').trim(),
      street: (element.querySelector('.views-field-street').textContent || '').trim(),
      city: (element.querySelector('.views-field-city').textContent || '').trim(),
      province: (element.querySelector('.views-field-province').textContent || '').trim(),
      postalCode: (element.querySelector('.views-field-postal-code').textContent || '').trim(),
    }
    return item;
  };

  parseForItems(document, acc) {
    document.querySelectorAll('.views-table tbody tr').forEach(element => {
      acc.push(this.parseSingleItem(document, element));
    });
  }

  async recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    const nextPager = document.querySelector('.pager-next a');
    if (nextPager != null) {
      const nextLink = nextPager.getAttribute('href');
      await inspectPageForItems(this.baseUrl + nextLink, acc, true);
    } else {
      console.log("No longer recursing!");
    }
  }
}

module.exports = new projectcbd();