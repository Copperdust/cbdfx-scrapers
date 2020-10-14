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

  async inspectPageForItems(url, acc, recurseForMoreItems = true) {
    // Make a request for a user with a given ID
    return new Promise((resolve, reject) => {
      this.limiter.removeTokens(1, async () => {
        await this.axiosRequest(url)
          .then(async response => {
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
            resolve();
          })
          .catch(function (error) {
            // Retry (currently forever!!!) but only subpages
            if (!recurseForMoreItems) {
              this.inspectPageForItems(url, acc, recurseForMoreItems);
            }
            // handle error
            reject(error);
          });
      });
    })
      .catch(error => {
        try {
          console.log(url, error.response.statusText);
        } catch (e2) {
          console.log(url, error);
        }
      });
  };
}

module.exports = BaseScrapeClass;