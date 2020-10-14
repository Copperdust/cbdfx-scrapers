const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const BaseScrapeClass = require('../includes/base.js');

class cbdmap extends BaseScrapeClass {
  slug = 'cbdmap';

  responseType = 'document';

  baseUrl = 'https://cbdmap.com';

  urlsToRecurse = [
    '/cbd-stores-near-me/austin/',
    '/cbd-stores-near-me/brooklyn/',
    '/cbd-stores-near-me/chicago/',
    '/cbd-stores-near-me/dallas/',
    '/cbd-stores-near-me/denver/',
    '/cbd-stores-near-me/hollywood/',
    '/cbd-stores-near-me/houston/',
    '/cbd-stores-near-me/kansas-city/',
    '/cbd-stores-near-me/las-vegas/',
    '/cbd-stores-near-me/los-angeles/',
    '/cbd-stores-near-me/nashville/',
    '/cbd-stores-near-me/new-york/',
    '/cbd-stores-near-me/oklahoma-city/',
    '/cbd-stores-near-me/phoenix/',
    '/cbd-stores-near-me/portland/',
    '/cbd-stores-near-me/san-diego/',
    '/cbd-stores-near-me/san-francisco/',
    '/cbd-stores-near-me/santa-monica/',
    '/cbd-stores-near-me/seattle/',
  ]

  constructor() {
    super()
  }

  getDocument(response) {
    let { document } = (new JSDOM(response.data)).window;
    return document;
  }

  parseSingleItem = (document, element, hasChild = false) => {
    let item = {};
    item.address1 = element.address1;
    item.address2 = element.address2;
    item.city = element.city;
    item.country = element.country;
    item.name = element.name;
    item.state = element.state;
    item.state_abbr = element.state_abbr;
    item.zipcode = element.zipcode;
    return item;
  };

  doTheWholeUnicodeConversionThatNeedsToBeCodedManuallyBecauseNoOneHadToDealWithThisBefore(string) {
    string = string.split('\\').map(v => {
      var match = v.match(/u\w{4}/);
      if (match) {
        match = match[0];
        v = eval('"\\' + match + '"') + v.replace(/u\w{4}/, '', v);
      }
      return v;
    }).join('');
    return string;
  }

  parseForItems(document, acc, url) {
    try {
      var json = document.body.textContent.match(/businesses: JSON.parse\('(.*)'\),/)[1];
    } catch (error) {
      console.log("Could not FIND string for businesses for " + url);
      return;
    }
    try {
      var object = JSON.parse(this.doTheWholeUnicodeConversionThatNeedsToBeCodedManuallyBecauseNoOneHadToDealWithThisBefore(json));
    } catch (error) {
      console.log("Could not PARSE string for businesses for " + url, error);
      return;
    }
    object.forEach(el => {
      acc.push(this.parseSingleItem(false, el));
    });
  }

  getRecursePagination = page => {
    return '?page={{index}}&type=all'.replace(/{{index}}/, page);
  }
  
  recurseParseForMoreItems(document, acc, url, inspectPageForItems) {
    var page = document.body.textContent.match(/pagination.*total_pages.: (\d+)/)[1]
    var promises = [];
    do {
      // Make rescursive
      promises.push(inspectPageForItems(url + this.getRecursePagination(page), acc, false));
      page--;
    } while (page > 1);
    return Promise.all(promises);
  }
}

module.exports = new cbdmap();