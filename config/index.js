const config = {
  baseUrl: '',
  maxPagesToVisit: 5,
  randomCrawl: true,
  stickToBaseUrl: false, // foo.com/bar will only crawl foot.com/bar/baz
  pageHealth: {
    maxPageLoadTime: 0.900,
    acceptableStatusCodes: [200, 301, 304, 204],
    imageDir: './images',
  },
};

module.exports = config;
