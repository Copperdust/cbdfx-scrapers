const axios = require('axios');

class BaseScrapeClass {
  axiosRequest(url) {
    const axiosConfig = {
      url: url,
      responseType: this.responseType,
      method: "get",
    }
    return axios(axiosConfig);
  }
}

module.exports = BaseScrapeClass;