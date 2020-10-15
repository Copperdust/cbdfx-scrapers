const axios = require('axios');
const RateLimiter = require('limiter').RateLimiter;

class BaseScrapeClass {
  limiterConfig = {
    amount: 5,
    timespan: 'second'
  }

  constructor() {
    this.limiter = new RateLimiter(this.limiterConfig.amount, this.limiterConfig.timespan);
  }

  axiosRequest(url) {
    const axiosConfig = {
      url: url,
      responseType: this.responseType,
      method: "get",
    }
    return axios(axiosConfig);
  }

  async processSuccessfulRequest(acc, url, response, recurseForMoreItems) {
    // Send message to inform a request was made
    console.log("Did a request to " + url);
    // Parse response
    const document = this.getDocument(response);
    // Accumulate comment
    this.parseForItems(document, acc, url);
    // Check for more pages
    if (recurseForMoreItems) {
      await this.recurseParseForMoreItems(document, acc, url, this.inspectPageForItems.bind(this));
    }
  }

  inspectPageForItems(url, acc, recurseForMoreItems = true) {
    try {
      return new Promise(resolve => {
        this.limiter.removeTokens(1, async () => {
          try {
            const response = await this.axiosRequest.bind(this)(url);
            await this.processSuccessfulRequest(acc, url, response, recurseForMoreItems);
          } catch (error) {
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

  async asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async scrape() {
    var items = [];
    var promises = [];
    this.urlsToRecurse.forEach(async url => {
      promises.push(this.inspectPageForItems(this.baseUrl + url, items));
    });
    await Promise.all(promises);
    return items;
  }
}

module.exports = BaseScrapeClass;