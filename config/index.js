const config = {
  baseUrl: "http://kettlebell-coders-app.s3-website-eu-west-1.amazonaws.com/",
  maxPagesToVisit: 1,
  randomCrawl: true,
  stickToBaseUrl: true, // foo.com/bar will only crawl foot.com/bar/baz
  pageHealth: {
    maxPageLoadTime: 0.900,
    acceptableStatusCodes: [200, 301, 304],
    imageDir: "./images"
  }
};

module.exports = config;
