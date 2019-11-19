const config = {
  baseUrl: "https://www.bbc.co.uk/",
  maxPagesToVisit: 1,
  randomCrawl: true,
  stickToBaseUrl: true, // foo.com/bar will only crawl foot.com/bar/baz
  reportDir: "./report",
  pageHealth: {
    maxPageLoadTime: 2.0,
    acceptableStatusCodes: [200, 301, 304, 204],
    imageDir: "./images"
  }
};


process.env.BASEURL = process.env.BASEURL || config.baseUrl;
process.env.MAXPAGESTOVISIT =
  process.env.MAXPAGESTOVISIT || config.maxPagesToVisit;
process.env.RANDOMCRAWL = process.env.RANDOMCRAWL || config.randomCrawl;
process.env.STICKTOBASEURL =
  process.env.STICKTOBASEURL || config.stickToBaseUrl;

config.baseUrl = process.env.BASEURL;
config.maxPagesToVisit = process.env.MAXPAGESTOVISIT;
config.randomCrawl = process.env.RANDOMCRAWL;
config.stickToBaseUrl = process.env.STICKTOBASEURL;

module.exports = config;
