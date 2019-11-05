const config = {
  baseUrl: "https://www.bbc.co.uk/",
  maxPagesToVisit: 3,
  randomCrawl: true,
  stickToBaseUrl: true, // foo.com/bar will only crawl foot.com/bar/baz
  pageHealth: {
    maxPageLoadTime: 0.900,
    acceptableStatusCodes: [200, 301],
    imageDir: "./images"
  }
};

module.exports = config;
