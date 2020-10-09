class NuLeaf {
  constructor() {
    this.slug = "nuleaf";
    this.responseType = "json";
    this.reviewSelector = ".stamped-review-body";
    this.scrapeType = "knownPageAmount";
    this.paginationPattern = "&page={{index}}";
    this.baseUrl = "https://stamped.io";
    this.productUrls = [
      "/api/widget?productId=2000&apiKey=pubkey-0lXD43AO9y57H9P4nmv9Kn9q6aS51q&storeUrl=nuleafnaturals.com&take=5"
    ]
  }

  getDocument() {
    return { document } = (new JSDOM(response.data[config.responseNesting])).window;
  }
}

module.exports = NuLeaf;